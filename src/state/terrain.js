/* Génération de la carte : relief, types de terrain, routes. Le pré-rendu appartient à render/. */
import {
  W, H, CELL, COLS, ROWS, T_OPEN, T_WOOD, T_ROAD, T_MARSH, T_ROCK,
  HILL_COUNT, MARSH_BELOW, MARSH_P, ROCK_ABOVE, ROCK_P, GROVE_COUNT
} from '../config.js';
import { ei, clamp } from '../rules/grid.js';
import { S } from './state.js';

const lerp = (a,b,t) => a + (b-a)*t;

export function genTerrain(rng){
  genElev(rng);
  genTerrainTypes(rng);
}

function genElev(rng){
  const s = rng()*100, hills = [];
  for (let i = 0; i < HILL_COUNT; i++)
    hills.push({ x:rng()*COLS, y:rng()*ROWS, r:4+rng()*9, h:22+rng()*54 });
  for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++){
    let h = 24 + Math.sin(cx*.21+s)*8 + Math.sin(cy*.27+s*1.3)*7 + Math.sin((cx+cy)*.13+s*.6)*6;
    for (const hi of hills){
      const d = Math.hypot(cx-hi.x, cy-hi.y)/hi.r;
      if (d < 1) h += hi.h*(1-d*d);
    }
    S.elev[ei(cx,cy)] = Math.max(0, h);
  }
}

function genTerrainTypes(rng){
  S.ter.fill(T_OPEN);
  // les creux se noient, les sommets se dénudent
  for (let cy=0;cy<ROWS;cy++) for (let cx=0;cx<COLS;cx++){
    const h = S.elev[ei(cx,cy)];
    if (h < MARSH_BELOW && rng() < MARSH_P) S.ter[ei(cx,cy)] = T_MARSH;
    else if (h > ROCK_ABOVE && rng() < ROCK_P) S.ter[ei(cx,cy)] = T_ROCK;
  }
  // bosquets
  for (let b = 0; b < GROVE_COUNT; b++){
    const bx = rng()*COLS, by = rng()*ROWS, br = 2 + rng()*4;
    for (let cy=Math.max(0,(by-br)|0); cy<Math.min(ROWS,by+br+1); cy++)
      for (let cx=Math.max(0,(bx-br)|0); cx<Math.min(COLS,bx+br+1); cx++){
        const d = Math.hypot(cx-bx, cy-by)/br;
        if (d < 1 && rng() < 1-d*d*.8) S.ter[ei(cx,cy)] = T_WOOD;
      }
  }
  // routes : elles écrasent tout, y compris les bois (ce sont des trouées)
  S.roads = [];
  const mk = (horiz) => {
    const pts = [];
    if (horiz){ let y = 90+rng()*(H-180);
      for (let x=-40;x<=W+40;x+=85){ pts.push({x,y}); y = clamp(y+(rng()-.5)*120, 40, H-40); } }
    else { let x = 220+rng()*(W-440);
      for (let y=-40;y<=H+40;y+=85){ pts.push({x,y}); x = clamp(x+(rng()-.5)*120, 70, W-70); } }
    return pts;
  };
  const list = [mk(true), mk(false)];
  if (rng() < .5) list.push(mk(true));
  for (const pts of list){
    S.roads.push(pts);
    for (let i=1;i<pts.length;i++){
      const n = Math.ceil(Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y)/6);
      for (let k=0;k<=n;k++){
        const x = lerp(pts[i-1].x, pts[i].x, k/n), y = lerp(pts[i-1].y, pts[i].y, k/n);
        const cx = Math.floor(x/CELL), cy = Math.floor(y/CELL);
        if (cx>=0&&cy>=0&&cx<COLS&&cy<ROWS) S.ter[ei(cx,cy)] = T_ROAD;
      }
    }
  }
}
