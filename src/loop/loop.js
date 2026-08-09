/* Orchestration : intention → règle → état → rendu. La boucle relie tout ce qui est pur au DOM. */
import {
  CELL, COLS, ROWS, MPP, VIS_R, WOOD_VIS_R, T_WOOD, MOVE_GUN, MOVE_TICKS, MOVE_BIAS,
  AMMO, DRONE_TURNS, THREAT_MAX, SETTLE_TICKS, VIS_RECALC_PERIOD, OBSERVE_NEAR, OBSERVE_GOOD
} from '../config.js';
import { ei, clamp } from '../rules/grid.js';
import { losClear, observed as observedRule } from '../rules/los.js';
import { computeReach, pathTo } from '../rules/reach.js';
import { accumulateSignature, locationPlot, soundPlot } from '../rules/signature.js';
import { fireShell, guidedSnap, icmSubs, enemySalvo } from '../rules/fire.js';
import { resolveImpact } from '../rules/impact.js';
import { blockReason } from '../rules/orders.js';
import { planAI as planAIRule } from '../rules/ai.js';
import { agedPlot, decayedThreat, tickDrones, missionOutcome } from '../rules/turn.js';
import { S, selUnit } from '../state/state.js';
import { bakeFog } from '../render/bake.js';
import { explode, paintDot } from '../render/effects.js';
import { draw } from '../render/draw.js';
import { refresh } from '../render/hud.js';
import { log, sep } from '../render/journal.js';
import { boom, muzzle, beep } from '../audio.js';

const lerp = (a,b,t) => a + (b-a)*t;
const observed = (x,y) => observedRule(S.vis, S.drones, x, y);

/* ---------------- visibilité ---------------- */
export function computeVis(){
  const ox = clamp(Math.floor(S.fo.x/CELL),0,COLS-1), oy = clamp(Math.floor(S.fo.y/CELL),0,ROWS-1);
  const range = S.ter[ei(ox,oy)] === T_WOOD ? WOOD_VIS_R : VIS_R;   // sous couvert, on ne voit rien venir
  for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++)
    S.vis[ei(cx,cy)] = (Math.hypot(cx-ox, cy-oy) <= range && losClear(S.ter,S.elev,ox,oy,cx,cy)) ? 1 : 0;
  bakeFog();
}
export function trackEnemies(){
  for (const e of S.enemies){
    if (!e.alive){ e.seen = false; continue; }
    e.seen = observed(e.x, e.y);
    if (e.seen){ e.lk = { x:e.x, y:e.y, t:S.turn }; e.plot = null; }
  }
}

/* ---------------- IA ---------------- */
export function planAI(){
  const r = planAIRule(S.enemies, S.guns, S.pZone, { ter:S.ter, elev:S.elev, vis:S.vis, drones:S.drones, guns:S.guns, enemies:S.enemies }, S.rng);
  S.eOrders = r.orders;
  if (S.pZone) S.pZone.uses = r.pZoneUses;
}

/* ---------------- exécution du tour ---------------- */
export function execute(){
  if (S.phase !== 'plan' || blockReason(S.guns, S.stock, S.vis, S.drones)) return;
  S.phase = 'resolve'; S.rt = 0; S.settle = 0;
  sep('tour ' + S.turn + ' — résolution');
  let firedAny = false;

  for (const g of S.guns){
    if (!g.alive) continue;
    const o = g.order;
    if (!o || o.type === 'hold'){ if (o) log('Pièce ' + g.id + ' reste muette.', 'dim'); continue; }
    if (o.type === 'move'){
      g.mv = mkMove(o.path || [{x:g.x,y:g.y},{x:o.dest.x,y:o.dest.y}], MOVE_TICKS);
      g.bx = (S.rng()-.5)*MOVE_BIAS; g.by = (S.rng()-.5)*MOVE_BIAS;
      g.lastAim = g.lastImpact = null; g.sig = 0; g.sigPos = null;
      if (g.ePlot) g.ePlot.stale = true;
      log('Pièce ' + g.id + ' décroche — réglage perdu.', 'dim');
      continue;
    }
    const A = AMMO[o.ammo];
    S.stock[o.ammo]--;
    if (o.ammo !== 'gui') g.lastAim = { x:o.aim.x, y:o.aim.y };
    S.shells.push(fireShell(g, o, S.rng));
    firedAny = true;
    ({ sig: g.sig, sigPos: g.sigPos } = accumulateSignature(g.sig, g.sigPos, g.x, g.y, A.sig));
    const plot = locationPlot(g.x, g.y, g.sig, S.rng);
    if (plot) g.ePlot = plot;
  }
  if (firedAny) muzzle(false);

  const o = S.fo.order;
  if (o && o.type === 'move'){
    S.fo.mv = mkMove(o.path || [{x:S.fo.x,y:S.fo.y},{x:o.dest.x,y:o.dest.y}], MOVE_TICKS);
    log('L\'observateur change de poste.', 'dim');
  }

  S.enemies.forEach((e, i) => {
    const eo = S.eOrders[i];
    if (!e.alive || !eo) return;
    if (eo.type === 'move'){
      const { prev } = computeReach(S.ter, S.elev, e.x, e.y, MOVE_GUN);
      e.mv = mkMove(pathTo(e.x, e.y, eo.to.x, eo.to.y, prev), MOVE_TICKS);
      e.threat = 0;
      if (e.seen) log('Mouvement observé : une batterie décroche.', 'blue');
    } else if (eo.type === 'fire'){
      S.shells.push(...enemySalvo(e, eo.at, S.rng));
      e.threat = Math.min(THREAT_MAX, e.threat + 1);
      soundRange(e);
      muzzle(true);
      if (eo.harass) log('Tir de harcèlement sur notre zone de déploiement.', 'warn');
    }
  });
  refresh();
}

function soundRange(e){
  e.plot = soundPlot(e.plot, e.x, e.y, S.rng);
  log('Départ entendu — plot à ' + Math.round(e.plot.err*MPP/10)*10 + ' m près.', 'warn');
}

function impactAt(x, y, A, side){
  if (A.power > 0){
    const seen = observed(x, y);
    explode(x, y, A.power, side === 'them', seen);
    boom(A.power, !seen);
  }
  const r = resolveImpact(x, y, A, side, S.ter, S.guns, S.enemies, S.turn);
  for (const h of r.gunHits){ const g = S.guns[h.i]; g.hp = h.hp; g.alive = h.alive; }
  for (const h of r.enemyHits){ const e = S.enemies[h.i];
    if (h.threat !== undefined) e.threat = h.threat;
    if (h.lk){ e.lk = h.lk; e.spot = h.spot; }
    if (h.killed){ e.alive = false; e.seen = false; }
  }
  for (const ev of r.events) log(ev.msg, ev.cls);
}

function observe(ix, iy, g){
  const seen = observed(ix, iy);
  if (g) g.lastImpact = seen ? { x:ix, y:iy } : null;
  if (!seen){ log('Pièce ' + (g?g.id:'?') + ' : impact hors observation.', 'dim'); return; }
  let best = null, bd = 1e9;
  for (const e of S.enemies){ if (!e.alive) continue;
    const d = Math.hypot(ix-e.x, iy-e.y); if (d < bd){ bd = d; best = e; } }
  if (!best || bd > OBSERVE_NEAR){ log('Pièce ' + (g?g.id:'?') + ' : impact observé, rien à proximité.', 'dim'); return; }
  const ang = Math.atan2(best.y-g.y, best.x-g.x);
  const dx = ix-best.x, dy = iy-best.y;
  const along = (dx*Math.cos(ang) + dy*Math.sin(ang))*MPP;
  const sd = (-dx*Math.sin(ang) + dy*Math.cos(ang))*MPP;
  const r = v => Math.round(Math.abs(v)/10)*10;
  log(g.id + ' : ' + (along<0 ? 'allongez '+r(along) : 'raccourcissez '+r(along)) + ' m, ' +
      (sd<0 ? r(sd)+' à droite' : r(sd)+' à gauche') + ' m.', bd<OBSERVE_GOOD?'ok':'');
}

/* ---------------- fin de tour ---------------- */
function endTurn(){
  S.turn++;
  const dr = tickDrones(S.drones);
  S.drones = dr.drones;
  if (dr.expired){ bakeFog(); for (let i = 0; i < dr.expired; i++) log('Drone en fin d\'autonomie.','dim'); }
  for (const g of S.guns) g.ePlot = agedPlot(g.ePlot);
  for (const e of S.enemies) e.threat = decayedThreat(e.threat);
  computeVis(); trackEnemies();
  const out = missionOutcome(S.guns, S.enemies, S.stock);
  if (out){ S.phase = 'over'; S.banner = out; refresh(); return; }
  for (const g of S.guns) g.order = null;
  S.fo.order = null;
  planAI();
  S.phase = 'plan';
  if (!S.guns[S.sel] || !S.guns[S.sel].alive) S.sel = S.guns.findIndex(g => g.alive);
  sep('tour ' + S.turn + ' — ordres');
  refresh();
}

/* ---------------- boucle temps réel ---------------- */
function mkMove(path, d){
  const seg = []; let total = 0;
  for (let i = 1; i < path.length; i++){
    const l = Math.hypot(path[i].x-path[i-1].x, path[i].y-path[i-1].y);
    seg.push(l); total += l;
  }
  return { path, seg, total, d };
}
function moveUnit(u){
  if (!u.mv) return;
  const m = u.mv, t = clamp(S.rt/m.d, 0, 1), e = t*t*(3-2*t);
  let want = m.total * e, i = 0;
  while (i < m.seg.length && want > m.seg[i]){ want -= m.seg[i]; i++; }
  if (i >= m.seg.length){ const p = m.path[m.path.length-1]; u.x = p.x; u.y = p.y; }
  else {
    const a = m.path[i], b = m.path[i+1], k = m.seg[i] ? want/m.seg[i] : 0;
    u.x = lerp(a.x, b.x, k); u.y = lerp(a.y, b.y, k);
  }
  if (t >= 1) u.mv = null;
}

function step(){
  if (S.freeze > 0){ S.freeze--; return; }

  if (S.phase === 'resolve'){
    S.rt++;
    for (const g of S.guns) if (g.alive) moveUnit(g);
    moveUnit(S.fo);
    for (const e of S.enemies) if (e.alive) moveUnit(e);
    if (S.fo.mv && S.rt % VIS_RECALC_PERIOD === 0) computeVis();

    for (let i = S.shells.length-1; i >= 0; i--){
      const s = S.shells[i];
      if (++s.t < s.dur) continue;
      S.shells.splice(i,1);
      const A = AMMO[s.type];
      let ix = s.tx, iy = s.ty;
      if (s.side === 'us' && s.type === 'gui'){
        const snap = guidedSnap(ix, iy, S.enemies, S.vis, S.drones, S.rng);
        if (snap){ ix = snap.x; iy = snap.y;
          log('Guidage terminal — recalage sur l\'objectif.', 'blue'); }
      }
      if (s.side === 'us' && s.type === 'rec'){
        S.drones.push({ x:ix, y:iy, turns:DRONE_TURNS });
        if (s.gun) s.gun.lastImpact = { x:ix, y:iy };
        computeVis(); trackEnemies(); beep();
        log('Drone en station.', 'blue');
        continue;
      }
      if (s.side === 'us' && s.type === 'icm'){
        S.subs.push(...icmSubs(ix, iy, A, S.rng));
        observe(ix, iy, s.gun);
        continue;
      }
      impactAt(ix, iy, A, s.side);
      if (s.side === 'us') observe(ix, iy, s.gun);
    }

    for (let i = S.subs.length-1; i >= 0; i--)
      if (--S.subs[i].d <= 0){ const b = S.subs.splice(i,1)[0]; impactAt(b.x, b.y, b.A, b.side); }

    const busy = S.shells.length || S.subs.length || S.fo.mv ||
      S.guns.some(g => g.alive && g.mv) || S.enemies.some(e => e.alive && e.mv);
    if (!busy && ++S.settle > SETTLE_TICKS) endTurn();
  }

  for (const e of S.enemies) if (e.spot > 0) e.spot--;
  for (let i = S.parts.length-1; i >= 0; i--){
    const p = S.parts[i];
    if (--p.life <= 0){ if (p.k === 'em') paintDot(p.x, p.y, p.r*1.6, .3); S.parts.splice(i,1); continue; }
    if (p.k === 'du'){ p.vx*=.93; p.vy*=.93; p.r+=.42; }
    else if (p.k === 'st'){ p.vx*=.84; p.vy*=.84; }
    else { p.vx*=.9; p.vy*=.9; }
    p.x += p.vx; p.y += p.vy;
  }
  for (let i = S.rings.length-1; i >= 0; i--){
    const w = S.rings[i]; w.r += (w.max-w.r)*w.sp; w.life -= w.sp<.1?.022:.05;
    if (w.life <= 0) S.rings.splice(i,1);
  }
  for (let i = S.fires.length-1; i >= 0; i--){
    const f = S.fires[i]; f.r += (f.max-f.r)*f.sp; f.life -= f.d;
    if (f.life <= 0) S.fires.splice(i,1);
  }
  for (let i = S.flashes.length-1; i >= 0; i--){
    const f = S.flashes[i]; f.life -= .2; f.r *= 1.1;
    if (f.life <= 0) S.flashes.splice(i,1);
  }
  S.shake *= .86; S.blast *= .8; S.punch *= .84;
}

export function frame(){ S.fnum++; step(); draw(); requestAnimationFrame(frame); }
