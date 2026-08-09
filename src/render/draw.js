/* Rendu d'une frame complète : couches, symboles tactiques, projectiles, effets, UI canvas. */
import { W, H, CELL, COLS, ROWS, DRONE_R, MAXRANGE, AMMO } from '../config.js';
import { ei, clamp } from '../rules/grid.js';
import { observed } from '../rules/los.js';
import { pathTo } from '../rules/reach.js';
import { S, selUnit, budgetOf } from '../state/state.js';
import { terrainCv, fogCv, reachCv, reach } from './bake.js';
import { scarCv, SPR } from './effects.js';

export const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const lerp = (a,b,t) => a + (b-a)*t;

export function draw(){
  ctx.save();
  ctx.translate((Math.random()-.5)*S.shake, (Math.random()-.5)*S.shake);
  if (S.punch > .0005){ ctx.translate(W/2,H/2); ctx.scale(1+S.punch,1+S.punch); ctx.translate(-W/2,-H/2); }

  ctx.drawImage(terrainCv, 0, 0);
  ctx.drawImage(scarCv, 0, 0);
  ctx.drawImage(fogCv, 0, 0);
  for (const d of S.drones){
    ctx.strokeStyle='rgba(95,143,181,.45)'; ctx.setLineDash([3,6]);
    ctx.beginPath(); ctx.arc(d.x,d.y,DRONE_R,0,6.29); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='rgba(95,143,181,.9)';
    ctx.beginPath(); ctx.arc(d.x,d.y,3,0,6.29); ctx.fill();
    ctx.font='9px ui-monospace,monospace'; ctx.textAlign='center';
    ctx.fillText('DRONE '+d.turns, d.x, d.y-8); ctx.textAlign='left';
  }

  S.enemies.forEach((e, i) => {
    if (!e.alive) return;
    if (!e.seen && !e.plot && !e.lk){
      ctx.strokeStyle='rgba(200,56,42,.3)'; ctx.setLineDash([5,6]);
      ctx.beginPath(); ctx.arc(e.zx,e.zy,e.zr,0,6.29);
      ctx.fillStyle='rgba(200,56,42,.05)'; ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }
    if (!e.seen && e.plot){
      ctx.strokeStyle='rgba(216,120,60,.55)'; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.arc(e.plot.x,e.plot.y,e.plot.err,0,6.29); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(216,120,60,.75)'; ctx.font='9px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText('PLOT B'+(i+1), e.plot.x, e.plot.y-e.plot.err-5); ctx.textAlign='left';
    }
    if (!e.seen && e.lk){
      ghost(e.lk.x, e.lk.y, '#8a5b4a');
      ctx.fillStyle='rgba(180,110,90,.7)'; ctx.font='9px ui-monospace,monospace'; ctx.textAlign='center';
      ctx.fillText('B'+(i+1)+' VU T-'+Math.max(0,S.turn-e.lk.t), e.lk.x, e.lk.y+20); ctx.textAlign='left';
    }
  });

  // ordres en cours de planification
  if (S.phase === 'plan'){
    const u = selUnit();
    if (u && S.otype === 'fire' && u !== S.fo){
      ctx.strokeStyle='rgba(217,102,43,.18)'; ctx.setLineDash([3,7]);
      ctx.beginPath(); ctx.arc(u.x,u.y,MAXRANGE,0,6.29); ctx.stroke(); ctx.setLineDash([]);
    } else if (u && S.otype === 'move' && reach.on){
      ctx.drawImage(reachCv, 0, 0);
      if (S.mouse.x >= 0){
        const i = ei(clamp(Math.floor(S.mouse.x/CELL),0,COLS-1), clamp(Math.floor(S.mouse.y/CELL),0,ROWS-1));
        if (S.uiDist[i] <= budgetOf(u)) polyline(pathTo(u.x,u.y,S.mouse.x,S.mouse.y,S.uiPrev), 'rgba(95,143,181,.45)');
      }
    }
    for (const u2 of S.guns.concat([S.fo])){
      if (u2.alive === false || !u2.order) continue;
      const o = u2.order;
      if (o.type === 'move'){
        polyline(o.path || [{x:u2.x,y:u2.y},o.dest], '#5f8fb5');
        ghost(o.dest.x, o.dest.y, '#5f8fb5');
      } else if (o.type === 'fire'){
        const A = AMMO[o.ammo];
        const ok = Math.hypot(o.aim.x-u2.x, o.aim.y-u2.y) <= MAXRANGE &&
                   !(o.ammo === 'gui' && !observed(S.vis, S.drones, o.aim.x, o.aim.y));
        const c = ok ? '#d9662b' : '#c8382a';
        ctx.strokeStyle = 'rgba(217,102,43,.22)'; ctx.lineWidth=1; ctx.setLineDash([2,6]);
        ctx.beginPath(); ctx.moveTo(u2.x,u2.y); ctx.lineTo(o.aim.x,o.aim.y); ctx.stroke(); ctx.setLineDash([]);
        const r = o.ammo==='icm' ? A.spread : o.ammo==='rec' ? DRONE_R : Math.max(11, A.kill);
        ctx.strokeStyle = c; ctx.lineWidth = 1.3;
        ctx.setLineDash(o.ammo==='rec'?[3,6]:[]);
        ctx.beginPath(); ctx.arc(o.aim.x,o.aim.y,r,0,6.29); ctx.stroke(); ctx.setLineDash([]);
        cross(o.aim.x, o.aim.y, 13, c);
        ctx.fillStyle = c; ctx.font='9px ui-monospace,monospace'; ctx.textAlign='center';
        ctx.fillText(u2.id + ' · ' + A.name.toUpperCase(), o.aim.x, o.aim.y - r - 6);
        ctx.textAlign='left';
      }
    }
  }

  for (const g of S.guns){
    if (!g.alive || !g.lastAim || !g.lastImpact) continue;
    ctx.strokeStyle='rgba(228,225,209,.32)'; ctx.setLineDash([3,4]); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(g.lastAim.x,g.lastAim.y); ctx.lineTo(g.lastImpact.x,g.lastImpact.y); ctx.stroke();
    ctx.setLineDash([]);
    cross(g.lastAim.x, g.lastAim.y, 5, 'rgba(228,225,209,.4)');
    cross(g.lastImpact.x, g.lastImpact.y, 6, 'rgba(217,102,43,.8)');
  }

  S.enemies.forEach(e => {
    if (!e.alive){ cross(e.x,e.y,9,'#5a5244'); return; }
    if (e.seen || e.spot > 0) unit(e.x, e.y, '#c8382a', 'art', '');
  });
  S.guns.forEach((g, i) => {
    if (!g.alive){ cross(g.x,g.y,9,'#4c5340'); return; }
    unit(g.x, g.y, '#7d9c56', 'art', g.id, S.phase==='plan' && S.sel===i);
  });
  unit(S.fo.x, S.fo.y, '#5f8fb5', 'obs', 'O', S.phase==='plan' && S.sel==='fo');

  for (const s of S.shells){
    if (s.t < 0) continue;
    const t = clamp(s.t/s.dur, 0, 1);
    ctx.fillStyle = s.side==='them' ? 'rgba(224,80,58,.85)'
      : s.type==='rec' ? 'rgba(95,143,181,.9)' : 'rgba(240,232,210,.85)';
    ctx.beginPath(); ctx.arc(lerp(s.x0,s.tx,t), lerp(s.y0,s.ty,t), 2.4, 0, 6.29); ctx.fill();
  }

  for (const p of S.parts){
    const a = p.life/p.max;
    if (p.k === 'du'){
      const fade = Math.min(1,(p.max-p.life)/8);
      ctx.globalAlpha = a*.4*fade;
      ctx.drawImage(SPR.dust[p.tb], p.x-p.r, p.y-p.r, p.r*2, p.r*2);
    } else if (p.k === 'em'){
      ctx.globalAlpha = Math.min(1, a*2);
      ctx.fillStyle = a > .5 ? '#4a4228' : '#241f16';
      ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);
    }
  }
  ctx.globalAlpha = 1;
  for (const w of S.rings){
    if (w.sp > .1) continue;
    ctx.strokeStyle='rgba('+w.c+','+w.life*.3+')';
    ctx.lineWidth=Math.max(1,w.w*w.life);
    ctx.beginPath(); ctx.arc(w.x,w.y,w.r,0,6.29); ctx.stroke();
  }
  ctx.globalCompositeOperation='lighter';
  for (const f of S.fires){
    const l = Math.max(0, f.life);
    ctx.globalAlpha = f.hot ? l*.95 : l*.7;
    ctx.drawImage(f.hot ? SPR.hot : SPR.warm, f.x-f.r, f.y-f.r, f.r*2, f.r*2);
  }
  ctx.globalAlpha = 1;
  ctx.lineCap='round';
  for (const p of S.parts){
    if (p.k !== 'st') continue;
    const a = p.life/p.max;
    ctx.strokeStyle = a > .55 ? '#ffe8b4' : a > .3 ? '#ffb45a' : '#e8722a';
    ctx.globalAlpha = a*.9;
    ctx.lineWidth=Math.max(.4,p.w*a);
    ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*1.7,p.y-p.vy*1.7); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineCap='butt';
  for (const w of S.rings){
    if (w.sp <= .1) continue;
    ctx.strokeStyle='rgba('+w.c+','+w.life*.55+')';
    ctx.lineWidth=Math.max(.6,w.w*w.life);
    ctx.beginPath(); ctx.arc(w.x,w.y,w.r,0,6.29); ctx.stroke();
  }
  for (const f of S.flashes){
    ctx.globalAlpha = Math.max(0, f.life)*.9;
    ctx.drawImage(SPR.flash, f.x-f.r, f.y-f.r, f.r*2, f.r*2);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation='source-over';
  ctx.restore();

  if (S.blast > .004){ ctx.fillStyle='rgba(255,244,220,'+S.blast*.5+')'; ctx.fillRect(0,0,W,H); }

  drawOOB();

  ctx.fillStyle='rgba(228,225,209,.45)'; ctx.font='11px ui-monospace,monospace'; ctx.textAlign='left';
  const u = selUnit();
  const lbl = S.phase === 'plan'
    ? 'ORDRES — ' + (u ? (u === S.fo ? 'observateur' : 'pièce ' + u.id) + ' : ' +
        { fire:'désignez un point d\'impact', move:'désignez une destination', hold:'silence' }[S.otype] : '')
    : S.phase === 'resolve' ? 'RÉSOLUTION SIMULTANÉE' : 'FIN DE MISSION';
  ctx.fillText(lbl, 14, H-14);
  const plotted = S.guns.filter(g => g.alive && g.ePlot && !g.ePlot.stale).map(g => g.id);
  if (plotted.length && S.phase === 'plan'){
    ctx.fillStyle='#e0503a'; ctx.textAlign='right';
    ctx.fillText('PLOTTÉES : ' + plotted.join(' '), W-14, H-14); ctx.textAlign='left';
  }
  if (S.banner){
    ctx.fillStyle='rgba(8,11,7,.85)'; ctx.fillRect(0,H/2-58,W,116);
    ctx.textAlign='center';
    ctx.fillStyle=S.banner.c; ctx.font='700 25px ui-monospace,monospace';
    ctx.fillText(S.banner.t1, W/2, H/2-6);
    ctx.fillStyle='rgba(228,225,209,.6)'; ctx.font='12px ui-monospace,monospace';
    ctx.fillText(S.banner.t2, W/2, H/2+24); ctx.textAlign='left';
  }
}

function oobIcon(x, y, col, label, state, hp){
  // state : 'ok' | 'unseen' | 'dead'
  ctx.save();
  ctx.translate(x, y);
  if (state === 'dead'){
    ctx.strokeStyle = '#4a5140'; ctx.lineWidth = 1.2;
    ctx.strokeRect(0, -8, 30, 16);
    ctx.beginPath(); ctx.moveTo(2,-6); ctx.lineTo(28,6); ctx.moveTo(28,-6); ctx.lineTo(2,6); ctx.stroke();
    ctx.fillStyle = '#4a5140';
  } else {
    ctx.fillStyle = 'rgba(8,10,7,.7)'; ctx.fillRect(0,-8,30,16);
    ctx.strokeStyle = col; ctx.lineWidth = 1.4;
    if (state === 'unseen') ctx.setLineDash([3,3]);
    ctx.strokeRect(0,-8,30,16);
    ctx.setLineDash([]);
    ctx.globalAlpha = state === 'unseen' ? .5 : 1;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(20, 0, 3, 0, 6.29); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.font = '9px ui-monospace,monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = state === 'dead' ? '#4a5140' : col;
  ctx.fillText(label, 5, 3.5);
  if (hp !== null && state !== 'dead'){
    for (let k = 0; k < 2; k++){
      ctx.fillStyle = k < hp ? col : 'rgba(90,98,78,.6)';
      ctx.fillRect(k*6, 11, 4, 3);
    }
  }
  ctx.restore();
}

function drawOOB(){
  const h = 42;
  ctx.fillStyle = 'rgba(8,11,7,.74)'; ctx.fillRect(0, 0, W, h);
  ctx.strokeStyle = 'rgba(57,67,47,.9)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h+.5); ctx.lineTo(W, h+.5); ctx.stroke();
  ctx.font = '9px ui-monospace,monospace';

  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(139,145,121,.9)';
  ctx.fillText('NOTRE GROUPE', 14, 13);
  S.guns.forEach((g, i) => {
    oobIcon(14 + i*40, 26, '#7d9c56', g.id, g.alive ? 'ok' : 'dead', g.alive ? g.hp : null);
  });

  const startX = W - 14 - (S.enemies.length*40 - 10);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(139,145,121,.9)';
  ctx.fillText('BATTERIES ADVERSES', W - 14, 13);
  S.enemies.forEach((e, i) => {
    const known = e.seen || e.spot > 0;
    oobIcon(startX + i*40, 26, '#c8382a', 'B'+(i+1),
      !e.alive ? 'dead' : known ? 'ok' : 'unseen', null);
  });

  const alive = S.enemies.filter(e => e.alive).length;
  const mine = S.guns.filter(g => g.alive).length;
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(139,145,121,.65)';
  ctx.fillText(mine + ' pièce' + (mine>1?'s':'') + ' en batterie  ·  ' +
    alive + ' objectif' + (alive>1?'s':'') + ' restant' + (alive>1?'s':''), W/2, 26);
  ctx.textAlign = 'left';
}

function polyline(pts, c){
  ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.setLineDash([6,4]);
  ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke(); ctx.setLineDash([]);
}
function cross(x,y,s,c){
  ctx.strokeStyle=c; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(x-s,y); ctx.lineTo(x+s,y);
  ctx.moveTo(x,y-s); ctx.lineTo(x,y+s); ctx.stroke();
}
function ghost(x,y,c){
  ctx.strokeStyle=c; ctx.lineWidth=1.2; ctx.setLineDash([3,3]);
  ctx.strokeRect(x-13,y-9,26,18); ctx.setLineDash([]);
}
function unit(x,y,c,kind,label,selected){
  ctx.save(); ctx.translate(x,y);
  if (selected){
    ctx.strokeStyle='rgba(217,102,43,.85)'; ctx.lineWidth=1.2;
    ctx.strokeRect(-18,-14,36,28);
  }
  ctx.fillStyle='rgba(8,10,7,.62)'; ctx.fillRect(-13,-9,26,18);
  ctx.strokeStyle=c; ctx.lineWidth=1.6; ctx.strokeRect(-13,-9,26,18);
  ctx.fillStyle=c;
  if (kind === 'art'){ ctx.beginPath(); ctx.arc(0,0,3.2,0,6.29); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(-6,5); ctx.lineTo(0,-5); ctx.lineTo(6,5); ctx.closePath(); ctx.stroke(); }
  if (label){
    ctx.font='9px ui-monospace,monospace'; ctx.textAlign='center';
    ctx.fillText(label, 0, -13); ctx.textAlign='left';
  }
  ctx.restore();
}
