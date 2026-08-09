/* Balistique : départ des coups, guidage terminal, sous-munitions, salves adverses. */
import {
  FLIGHT_BASE, FLIGHT_PER_PX, AIM_NOISE_GUIDED, AIM_NOISE_UNGUIDED,
  GUIDED_SNAP_R, GUIDED_SNAP_NOISE, ICM_SUB_STAGGER,
  E_FLIGHT_BASE, SALVO_SIZE, SALVO_STAGGER, SALVO_SPREAD
} from '../config.js';
import { observed } from './los.js';

/* Un coup non guidé reprend le biais de pointage de la pièce (bx/by) plus le bruit résiduel. */
export function fireShell(g, o, rng){
  const guided = o.ammo === 'gui';
  const ix = guided ? o.aim.x + (rng()-.5)*AIM_NOISE_GUIDED : o.aim.x + g.bx + (rng()-.5)*AIM_NOISE_UNGUIDED;
  const iy = guided ? o.aim.y + (rng()-.5)*AIM_NOISE_GUIDED : o.aim.y + g.by + (rng()-.5)*AIM_NOISE_UNGUIDED;
  const R = Math.hypot(ix-g.x, iy-g.y);
  return { x0:g.x, y0:g.y, tx:ix, ty:iy, t:0, dur:FLIGHT_BASE+R*FLIGHT_PER_PX, side:'us', type:o.ammo, gun:g };
}

/* En fin de vol, l'obus guidé se recale sur l'objectif observé le plus proche du point visé. */
export function guidedSnap(ix, iy, enemies, vis, drones, rng){
  let best = null, bd = GUIDED_SNAP_R;
  for (const e of enemies){
    if (!e.alive || !observed(vis, drones, e.x, e.y)) continue;
    const d = Math.hypot(ix-e.x, iy-e.y);
    if (d < bd){ bd = d; best = e; }
  }
  if (!best) return null;
  return { x: best.x+(rng()-.5)*GUIDED_SNAP_NOISE, y: best.y+(rng()-.5)*GUIDED_SNAP_NOISE };
}

/* L'obus de bombelettes disperse ses sous-munitions, qui détonent en cascade. */
export function icmSubs(ix, iy, A, rng){
  const out = [];
  for (let k = 0; k < A.subs; k++){
    const a = rng()*6.283, r = Math.sqrt(rng())*A.spread;
    out.push({ x:ix+Math.cos(a)*r, y:iy+Math.sin(a)*r, d:k*ICM_SUB_STAGGER, A, side:'us' });
  }
  return out;
}

/* Une batterie adverse tire par salve de trois, étalée dans le temps et dans l'espace. */
export function enemySalvo(e, at, rng){
  const R = Math.hypot(at.x-e.x, at.y-e.y);
  const out = [];
  for (let k = 0; k < SALVO_SIZE; k++){
    const a = rng()*6.283, r = rng()*SALVO_SPREAD;
    out.push({ x0:e.x, y0:e.y, tx:at.x+Math.cos(a)*r, ty:at.y+Math.sin(a)*r,
      t:-k*SALVO_STAGGER, dur:E_FLIGHT_BASE+R*FLIGHT_PER_PX, side:'them', type:'he', src:e });
  }
  return out;
}
