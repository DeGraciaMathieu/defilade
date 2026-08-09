/* Carte de portée de mouvement : le terrain se paie en points de mouvement, pas en distance à vol d'oiseau. */
import { CELL, COLS, ROWS, TER, DIAG_COST, CLIMB_COST, NO_DEPLOY_ROWS } from '../config.js';
import { ei, clamp } from './grid.js';

export function computeReach(ter, elev, px, py, budget){
  const dist = new Float32Array(COLS*ROWS), prev = new Int32Array(COLS*ROWS);
  dist.fill(Infinity); prev.fill(-1);
  const s = ei(clamp(Math.floor(px/CELL),0,COLS-1), clamp(Math.floor(py/CELL),0,ROWS-1));
  dist[s] = 0;
  const hq = [s], hk = [0];
  const push = (k,v) => {
    let i = hq.length; hq.push(v); hk.push(k);
    while (i > 0){ const p = (i-1)>>1; if (hk[p] <= hk[i]) break;
      let t = hk[p]; hk[p] = hk[i]; hk[i] = t; t = hq[p]; hq[p] = hq[i]; hq[i] = t; i = p; }
  };
  const pop = () => {
    const top = hq[0], lv = hq.pop(), lk = hk.pop();
    if (hq.length){ hq[0] = lv; hk[0] = lk; let i = 0;
      for(;;){ const l = 2*i+1, r = l+1; let m = i;
        if (l < hq.length && hk[l] < hk[m]) m = l;
        if (r < hq.length && hk[r] < hk[m]) m = r;
        if (m === i) break;
        let t = hk[m]; hk[m] = hk[i]; hk[i] = t; t = hq[m]; hq[m] = hq[i]; hq[i] = t; i = m; } }
    return top;
  };
  while (hq.length){
    const c = pop(), cd = dist[c];
    if (cd > budget) continue;
    const cx = c % COLS, cy = (c / COLS) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){
      if (!dx && !dy) continue;
      const nx = cx+dx, ny = cy+dy;
      if (nx < 0 || ny < NO_DEPLOY_ROWS || nx >= COLS || ny >= ROWS) continue;   // sous le bandeau, on ne s'installe pas
      const ni = ei(nx,ny);
      const step = (dx && dy ? DIAG_COST : 1) * (TER[ter[c]].cost + TER[ter[ni]].cost) / 2
                 + Math.max(0, elev[ni] - elev[c]) * CLIMB_COST;
      const nd = cd + step;
      if (nd < dist[ni] && nd <= budget){ dist[ni] = nd; prev[ni] = c; push(nd, ni); }
    }
  }
  return { dist, prev };
}

export function pathTo(px, py, tx, ty, prev){
  let c = ei(clamp(Math.floor(tx/CELL),0,COLS-1), clamp(Math.floor(ty/CELL),0,ROWS-1));
  const cells = [];
  let guard = 0;
  while (c >= 0 && guard++ < 4000){ cells.push(c); c = prev[c]; }
  cells.reverse();
  const pts = [{ x:px, y:py }];
  for (let i = 1; i < cells.length; i++)
    pts.push({ x:(cells[i]%COLS)*CELL + CELL/2, y:((cells[i]/COLS)|0)*CELL + CELL/2 });
  pts.push({ x:tx, y:ty });
  return pts;
}
