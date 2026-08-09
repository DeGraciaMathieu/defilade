/* Effets visuels : cicatrices permanentes, sprites précalculés, explosions, particules. */
import { W, H, MAX_PARTS } from '../config.js';
import { S } from '../state/state.js';

export const scarCv = document.createElement('canvas');
scarCv.width = W; scarCv.height = H;
const sctx = scarCv.getContext('2d');

export function clearScars(){ sctx.clearRect(0,0,W,H); }

/* sprites : un dégradé radial coûte cher, on le calcule une fois pour toutes */
function sprite(size, stops){
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  for (const [p, col] of stops) g.addColorStop(p, col);
  x.fillStyle = g; x.fillRect(0,0,size,size);
  return c;
}
export const SPR = {
  hot:  sprite(128, [[0,'rgba(255,252,238,1)'],[.45,'rgba(255,214,140,.62)'],[1,'rgba(150,44,10,0)']]),
  warm: sprite(128, [[0,'rgba(255,206,120,.92)'],[.4,'rgba(232,124,42,.68)'],[1,'rgba(150,44,10,0)']]),
  flash:sprite(128, [[0,'rgba(255,255,246,1)'],[1,'rgba(255,236,190,0)']]),
  dust: [
    sprite(64, [[0,'rgba(48,45,36,1)'],[.55,'rgba(48,45,36,.6)'],[1,'rgba(48,45,36,0)']]),
    sprite(64, [[0,'rgba(60,56,45,1)'],[.55,'rgba(60,56,45,.6)'],[1,'rgba(60,56,45,0)']]),
    sprite(64, [[0,'rgba(72,68,54,1)'],[.55,'rgba(72,68,54,.6)'],[1,'rgba(72,68,54,0)']])
  ]
};

function trim(){
  const parts = S.parts;
  if (parts.length <= MAX_PARTS) return;
  let over = parts.length - MAX_PARTS;
  for (let i = 0; i < parts.length && over > 0; i++){
    if (parts[i].k === 'du'){ parts.splice(i,1); i--; over--; }
  }
  if (parts.length > MAX_PARTS) parts.splice(0, parts.length - MAX_PARTS);
}

export function paintDot(x,y,r,a){
  sctx.fillStyle = 'rgba(20,17,12,'+a+')';
  sctx.beginPath(); sctx.arc(x,y,r,0,6.29); sctx.fill();
}

export function paintCrater(x,y,r){
  const g0 = sctx.createRadialGradient(x,y,r*.6,x,y,r*2.6);
  g0.addColorStop(0,'rgba(30,26,18,.42)'); g0.addColorStop(.5,'rgba(32,28,19,.2)');
  g0.addColorStop(1,'rgba(32,28,19,0)');
  sctx.fillStyle=g0; sctx.beginPath(); sctx.arc(x,y,r*2.6,0,6.29); sctx.fill();
  for (let i=0,n=r<12?8:22;i<n;i++){
    const a=Math.random()*6.283, d=r*(1.1+Math.random()*1.7);
    paintDot(x+Math.cos(a)*d, y+Math.sin(a)*d, r*(.07+Math.random()*.2), .12+Math.random()*.26);
  }
  sctx.beginPath();
  for (let i=0,n=18;i<=n;i++){
    const a=i/n*6.283, rr=r*(.86+Math.random()*.26);
    const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr;
    i ? sctx.lineTo(px,py) : sctx.moveTo(px,py);
  }
  sctx.closePath();
  const g = sctx.createRadialGradient(x+r*.22,y+r*.22,r*.08,x,y,r*1.05);
  g.addColorStop(0,'rgba(5,5,4,.94)'); g.addColorStop(.6,'rgba(15,14,10,.82)');
  g.addColorStop(1,'rgba(30,27,20,.5)');
  sctx.fillStyle=g; sctx.fill();
  sctx.lineCap='round';
  sctx.strokeStyle='rgba(176,166,124,.34)'; sctx.lineWidth=Math.max(1.2,r*.16);
  sctx.beginPath(); sctx.arc(x,y,r*1.02,Math.PI*.82,Math.PI*1.92); sctx.stroke();
  sctx.strokeStyle='rgba(0,0,0,.34)'; sctx.lineWidth=Math.max(1,r*.13);
  sctx.beginPath(); sctx.arc(x,y,r*1.02,Math.PI*1.92,Math.PI*2.82); sctx.stroke();
}

/* L'impact visuel complet ; `seen` est décidé par la boucle, le son aussi. */
export function explode(x,y,power,enemyFire,seen){
  paintCrater(x,y,15*power+3);
  if (power >= .8) S.freeze = Math.max(S.freeze, seen ? Math.round(4+4*power) : 2);
  S.shake = Math.min(34, S.shake + (seen ? 30*power : 9*power));
  if (!seen && !enemyFire) return;
  S.punch = Math.min(.028, S.punch + .018*power);
  S.blast = Math.min(.42, S.blast + .2*power);
  S.fires.push({x,y,r:5*power,max:27*power,life:1,sp:.5,d:.17,hot:1});
  S.fires.push({x,y,r:9*power,max:52*power,life:1,sp:.3,d:.075,hot:0});
  S.flashes.push({x,y,r:20*power,life:1});
  S.rings.push({x,y,r:10,max:118*power,life:1,sp:.2,w:6,c:'255,238,196'});
  S.rings.push({x,y,r:8,max:210*power,life:1,sp:.075,w:26,c:'128,118,92'});
  for (let i=0;i<20*power;i++){ const a=Math.random()*6.283, sp=3+Math.random()*12;
    S.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:13+Math.random()*18,max:31,w:.8+Math.random()*1.8,k:'st'}); }
  for (let i=0;i<6*power;i++){ const a=Math.random()*6.283, sp=13+Math.random()*17;
    S.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:11+Math.random()*11,max:22,w:2.4,k:'st'}); }
  for (let i=0;i<8*power;i++){ const a=Math.random()*6.283, sp=2+Math.random()*8;
    S.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:26+Math.random()*34,max:60,r:1+Math.random()*2.2,k:'em'}); }
  for (let i=0;i<15*power;i++){ const a=Math.random()*6.283, sp=.8+Math.random()*3.6;
    S.parts.push({x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*12,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:80+Math.random()*90,max:170,r:6+Math.random()*16,k:'du',tb:(Math.random()*3)|0}); }
  trim();
}
