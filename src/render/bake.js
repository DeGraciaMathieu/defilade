/* Couches pré-rendues : le relief, le brouillard et la zone de mouvement ne bougent pas d'une frame à l'autre. */
import { W, H, CELL, COLS, ROWS, T_OPEN, T_WOOD, T_ROAD, T_MARSH, TER, DRONE_R } from '../config.js';
import { ei } from '../rules/grid.js';
import { computeReach } from '../rules/reach.js';
import { S, selUnit, budgetOf } from '../state/state.js';

export const terrainCv = document.createElement('canvas');
terrainCv.width = W; terrainCv.height = H;
const tctx = terrainCv.getContext('2d');

export const fogCv = document.createElement('canvas');
fogCv.width = W; fogCv.height = H;
const fctx = fogCv.getContext('2d');

export const reachCv = document.createElement('canvas');
reachCv.width = W; reachCv.height = H;
const rctx = reachCv.getContext('2d');
export const reach = { on:false };

export function bakeTerrain(){
  for (let cy=0;cy<ROWS;cy++) for (let cx=0;cx<COLS;cx++){
    const b = Math.min(4, Math.floor(S.elev[ei(cx,cy)]/20));
    tctx.fillStyle = ['#1c2417','#222b1b','#293321','#313b26','#3a442c'][b];
    tctx.fillRect(cx*CELL, cy*CELL, CELL+1, CELL+1);
  }
  tctx.strokeStyle = 'rgba(150,168,118,.22)'; tctx.lineWidth = 1;
  tctx.beginPath();
  for (let cy=0;cy<ROWS;cy++) for (let cx=0;cx<COLS;cx++){
    const b = Math.floor(S.elev[ei(cx,cy)]/20);
    if (cx<COLS-1 && Math.floor(S.elev[ei(cx+1,cy)]/20)!==b){
      tctx.moveTo((cx+1)*CELL,cy*CELL); tctx.lineTo((cx+1)*CELL,(cy+1)*CELL); }
    if (cy<ROWS-1 && Math.floor(S.elev[ei(cx,cy+1)]/20)!==b){
      tctx.moveTo(cx*CELL,(cy+1)*CELL); tctx.lineTo((cx+1)*CELL,(cy+1)*CELL); }
  }
  tctx.stroke();
  // marais, rocaille, bois
  for (let cy=0;cy<ROWS;cy++) for (let cx=0;cx<COLS;cx++){
    const t = S.ter[ei(cx,cy)], x = cx*CELL, y = cy*CELL;
    if (t === T_OPEN || t === T_ROAD) continue;
    tctx.globalAlpha = t === T_WOOD ? .8 : .55;
    tctx.fillStyle = TER[t].c;
    tctx.fillRect(x, y, CELL+1, CELL+1);
    tctx.globalAlpha = 1;
    if (t === T_WOOD){
      tctx.fillStyle = 'rgba(122,152,96,.5)';
      for (let k=0;k<3;k++){
        tctx.beginPath();
        tctx.arc(x+3+Math.random()*(CELL-6), y+3+Math.random()*(CELL-6), 2+Math.random()*1.6, 0, 6.29);
        tctx.fill();
      }
    } else if (t === T_MARSH){
      tctx.strokeStyle = 'rgba(126,164,158,.4)'; tctx.lineWidth = 1;
      tctx.beginPath();
      for (let k=0;k<3;k++){
        const yy = y+4+k*6, xx = x+2+Math.random()*5;
        tctx.moveTo(xx, yy); tctx.lineTo(xx+5+Math.random()*6, yy);
      }
      tctx.stroke();
    } else {
      tctx.fillStyle = 'rgba(186,182,158,.4)';
      for (let k=0;k<4;k++)
        tctx.fillRect(x+2+Math.random()*(CELL-5), y+2+Math.random()*(CELL-5), 1.6, 1.6);
    }
  }
  // routes, tracées en dernier et lissées
  for (const pts of S.roads){
    for (const [w, col] of [[7,'rgba(70,60,38,.9)'],[4,'rgba(150,132,88,.75)']]){
      tctx.strokeStyle = col; tctx.lineWidth = w; tctx.lineJoin = 'round'; tctx.lineCap = 'round';
      tctx.beginPath(); tctx.moveTo(pts[0].x, pts[0].y);
      for (let i=1;i<pts.length-1;i++)
        tctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x+pts[i+1].x)/2, (pts[i].y+pts[i+1].y)/2);
      tctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
      tctx.stroke();
    }
  }
  tctx.strokeStyle = 'rgba(228,225,209,.05)'; tctx.lineWidth = 1;
  tctx.beginPath();
  for (let x=0;x<=W;x+=100){ tctx.moveTo(x,0); tctx.lineTo(x,H); }
  for (let y=0;y<=H;y+=100){ tctx.moveTo(0,y); tctx.lineTo(W,y); }
  tctx.stroke();
}

export function bakeFog(){
  fctx.clearRect(0,0,W,H);
  fctx.fillStyle = 'rgba(8,10,7,.62)';
  for (let cy=0;cy<ROWS;cy++){
    let run = -1;
    for (let cx=0;cx<=COLS;cx++){
      const dark = cx < COLS && !S.vis[ei(cx,cy)];
      if (dark && run < 0) run = cx;
      else if (!dark && run >= 0){
        fctx.fillRect(run*CELL, cy*CELL, (cx-run)*CELL+1, CELL+1);
        run = -1;
      }
    }
  }
  if (S.drones.length){
    fctx.globalCompositeOperation = 'destination-out';
    for (const d of S.drones){
      const g = fctx.createRadialGradient(d.x,d.y,DRONE_R*.7,d.x,d.y,DRONE_R);
      g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
      fctx.fillStyle = g;
      fctx.beginPath(); fctx.arc(d.x,d.y,DRONE_R,0,6.29); fctx.fill();
    }
    fctx.globalCompositeOperation = 'source-over';
    fctx.fillStyle = 'rgba(8,10,7,.62)';
  }
}

/* Recalcule aussi le cache de portée UI (S.uiDist/S.uiPrev) utilisé par l'aperçu et le clic. */
export function bakeReach(){
  rctx.clearRect(0,0,W,H);
  reach.on = false;
  const u = selUnit();
  if (S.phase !== 'plan' || S.otype !== 'move' || !u) return;
  ({ dist: S.uiDist, prev: S.uiPrev } = computeReach(S.ter, S.elev, u.x, u.y, budgetOf(u)));
  const b = budgetOf(u);
  for (let cy=0;cy<ROWS;cy++) for (let cx=0;cx<COLS;cx++){
    const d = S.uiDist[ei(cx,cy)];
    if (d > b) continue;
    rctx.fillStyle = 'rgba(95,143,181,' + (.2 - .12*(d/b)).toFixed(3) + ')';
    rctx.fillRect(cx*CELL, cy*CELL, CELL+1, CELL+1);
  }
  reach.on = true;
}
