/* IA des batteries adverses : choix de cible, harcèlement, décrochage, repositionnement. */
import {
  CELL, COLS, ROWS, E_RANGE, MOVE_GUN, T_WOOD, T_MARSH, T_ROAD,
  AI_PICK_BEST_P, AI_STALE_FIRE_P, AI_THREAT_FLINCH, AI_FLINCH_MOVE_P,
  AI_THREAT_MOVE, AI_RESTLESS_P, AI_HARASS_P, PZONE_MAX_USES,
  AI_SAMPLES, AI_MIN_MOVE, AI_KEEP_X, AI_SPACING,
  SCORE_JITTER, SCORE_UNSEEN, SCORE_WOOD, SCORE_MARSH, SCORE_ROAD,
  SCORE_IN_RANGE, SCORE_OUT_RANGE, SCORE_ELEV_W, SCORE_DIST_W, SCORE_SPACING_PEN
} from '../config.js';
import { ei, clamp } from './grid.js';
import { observed } from './los.js';
import { computeReach } from './reach.js';

const elevPx = (elev, x, y) =>
  elev[ei(clamp(Math.floor(x/CELL),0,COLS-1), clamp(Math.floor(y/CELL),0,ROWS-1))];

/* Les plots vivants : ce que l'adversaire croit savoir de nos pièces encore en batterie. */
export function livePlots(guns){
  const out = [];
  for (const g of guns) if (g.alive && g.ePlot) out.push({ g, p: g.ePlot });
  return out;
}

/* Point de repli d'une batterie : couvert, hors de vue, loin de nous, à l'écart de ses voisines. */
export function pickSpot(e, ctx, rng){
  const { ter, elev, vis, drones, guns, enemies } = ctx;
  const { dist } = computeReach(ter, elev, e.x, e.y, MOVE_GUN);
  const cand = [];
  for (let cy=0;cy<ROWS;cy++) for (let cx=0;cx<COLS;cx++){
    const i = ei(cx,cy);
    if (dist[i] > MOVE_GUN || dist[i] < AI_MIN_MOVE) continue;
    if (cx*CELL < AI_KEEP_X) continue;
    cand.push(i);
  }
  if (!cand.length) return { x:e.x, y:e.y };
  const plots = livePlots(guns);
  let best = { x:e.x, y:e.y }, bs = -1e9;
  for (let k = 0; k < AI_SAMPLES; k++){
    const i = cand[(rng()*cand.length)|0];
    const x = (i%COLS)*CELL + CELL/2, y = ((i/COLS)|0)*CELL + CELL/2;
    const t = ter[i];
    let s = rng()*SCORE_JITTER;
    if (!observed(vis, drones, x, y)) s += SCORE_UNSEEN;
    if (t === T_WOOD) s += SCORE_WOOD;          // le couvert vaut mieux qu'un simple masque de crête
    if (t === T_MARSH) s -= SCORE_MARSH;        // on n'installe pas une pièce dans un marécage
    if (t === T_ROAD) s -= SCORE_ROAD;          // trop exposé pour rester
    if (plots.length) s += plots.some(o => Math.hypot(x-o.p.x, y-o.p.y) < E_RANGE) ? SCORE_IN_RANGE : -SCORE_OUT_RANGE;
    s += elevPx(elev, x, y)*SCORE_ELEV_W + dist[i]*SCORE_DIST_W;
    for (const o of enemies) if (o !== e && o.alive && Math.hypot(x-o.x, y-o.y) < AI_SPACING) s -= SCORE_SPACING_PEN;
    if (s > bs){ bs = s; best = { x, y }; }
  }
  return best;
}

/* Ordres du tour pour chaque batterie. Retourne aussi le compteur de harcèlement mis à jour. */
export function planAI(enemies, guns, pZone, ctx, rng){
  const orders = [];
  const plots = livePlots(guns);
  let uses = pZone ? pZone.uses : 0;
  for (const e of enemies){
    if (!e.alive){ orders.push(null); continue; }
    const reach = plots.filter(o => Math.hypot(o.p.x-e.x, o.p.y-e.y) < E_RANGE);
    const fresh = reach.filter(o => !o.p.stale);
    let target = null;
    if (fresh.length){
      fresh.sort((a,b) => a.p.err - b.p.err);
      target = fresh[rng() < AI_PICK_BEST_P ? 0 : Math.floor(rng()*fresh.length)];
    } else if (reach.length && rng() < AI_STALE_FIRE_P){
      target = reach[Math.floor(rng()*reach.length)];   // ils tirent sur une position abandonnée
    }
    let order = null;
    if (target){
      // sous la menace, elle hésite entre décrocher et placer un coup de plus
      if (e.threat >= AI_THREAT_FLINCH && rng() < AI_FLINCH_MOVE_P) order = { type:'move', to: pickSpot(e, ctx, rng) };
      else order = { type:'fire', at: { x: target.p.x, y: target.p.y } };
    } else if (pZone && uses < PZONE_MAX_USES && rng() < AI_HARASS_P * (1 - uses/PZONE_MAX_USES)){
      // aucun plot : tir de harcèlement sur la zone de déploiement supposée
      const a = rng()*6.283, d = Math.sqrt(rng())*pZone.r;
      uses++;
      order = { type:'fire', at: { x: pZone.x + Math.cos(a)*d, y: pZone.y + Math.sin(a)*d }, harass:true };
    } else if (e.threat >= AI_THREAT_MOVE){
      order = { type:'move', to: pickSpot(e, ctx, rng) };
    } else if (rng() < AI_RESTLESS_P){
      order = { type:'move', to: pickSpot(e, ctx, rng) };
    } else {
      order = { type:'hold' };
    }
    orders.push(order);
  }
  return { orders, pZoneUses: uses };
}
