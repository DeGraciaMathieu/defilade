/* Ligne de vue et observation. */
import { CELL, COLS, ROWS, T_WOOD, DRONE_R, LOS_EYE_H, LOS_TGT_H, LOS_CLEARANCE } from '../config.js';
import { ei } from './grid.js';

export function losClear(ter, elev, ox, oy, tx, ty){
  if (ter[ei(tx,ty)] === T_WOOD) return false;      // ce qui est sous le couvert ne se voit pas
  const hO = elev[ei(ox,oy)]+LOS_EYE_H, hT = elev[ei(tx,ty)]+LOS_TGT_H;
  const n = Math.ceil(Math.hypot(tx-ox, ty-oy));
  if (n < 2) return true;
  for (let i = 1; i < n; i++){
    const t = i/n;
    const cx = Math.round(ox+(tx-ox)*t), cy = Math.round(oy+(ty-oy)*t);
    const k = ei(cx,cy);
    if (ter[k] === T_WOOD) return false;
    if (elev[k] > hO+(hT-hO)*t+LOS_CLEARANCE) return false;
  }
  return true;
}

export function underDrone(drones, x, y){
  for (const d of drones) if (Math.hypot(x-d.x, y-d.y) < DRONE_R) return true;
  return false;
}

export function observed(vis, drones, x, y){
  if (underDrone(drones, x, y)) return true;
  const cx = Math.floor(x/CELL), cy = Math.floor(y/CELL);
  if (cx<0||cy<0||cx>=COLS||cy>=ROWS) return false;
  return !!vis[ei(cx,cy)];
}
