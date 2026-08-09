/* L'état du jeu : un seul objet mutable. Les règles n'y touchent jamais, la boucle l'orchestre. */
import {
  COLS, ROWS, AMMO, ORDER, MOVE_GUN, MOVE_OBS, GUN_HP, MOVE_BIAS,
  GUN_X_MIN, GUN_X_SPAN, GUN_Y_TOP, GUN_Y_STEP, GUN_Y_JITTER, FO_DX,
  PZONE_JX, PZONE_JY, PZONE_R,
  ENEMY_X_MIN, ENEMY_X_SPAN, ENEMY_Y_TOP, ENEMY_Y_STEP, ENEMY_Y_JITTER,
  ZONE_JITTER, ZONE_R_MIN, ZONE_R_SPAN
} from '../config.js';

export const S = {
  /* générateur pseudo-aléatoire courant (fixé par main à chaque mission) */
  rng:null,
  /* phase de jeu */
  phase:'plan', rt:0, settle:0, turn:1, sel:0, otype:'fire', ammo:'reg',
  banner:null, mouse:{ x:-1, y:-1 },
  stock:{},
  /* unités */
  guns:[], enemies:[], eOrders:[], fo:null, pZone:null,
  /* projectiles et effets */
  shells:[], subs:[], parts:[], rings:[], fires:[], flashes:[], drones:[],
  blast:0, punch:0, shake:0, freeze:0,
  fnum:0, boomAt:-99, boomCount:0,
  /* carte */
  ter:new Uint8Array(COLS*ROWS), elev:new Float32Array(COLS*ROWS),
  vis:new Uint8Array(COLS*ROWS), roads:[],
  /* caches de portée de mouvement */
  uiDist:new Float32Array(COLS*ROWS), uiPrev:new Int32Array(COLS*ROWS),
  aiDist:new Float32Array(COLS*ROWS), aiPrev:new Int32Array(COLS*ROWS)
};

export const selUnit = () => S.sel === 'fo' ? S.fo : S.guns[S.sel];
export const budgetOf = (u) => u === S.fo ? MOVE_OBS : MOVE_GUN;

/* Mise en place d'une mission : tout sauf le terrain (déjà généré) et le DOM. */
export function resetMission(rng){
  S.shells=[]; S.subs=[]; S.parts=[]; S.rings=[]; S.fires=[]; S.flashes=[]; S.drones=[];
  S.blast=S.punch=S.shake=S.freeze=0;
  S.banner=null; S.turn=1; S.sel=0; S.otype='fire'; S.ammo='reg';
  S.stock={}; for (const id of ORDER) S.stock[id]=AMMO[id].start;

  S.guns = ['A','B','C'].map((id, i) => ({
    id, x: GUN_X_MIN+rng()*GUN_X_SPAN, y: GUN_Y_TOP+i*GUN_Y_STEP+(rng()-.5)*GUN_Y_JITTER,
    hp:GUN_HP, alive:true, mv:null, sig:0, sigPos:null, ePlot:null,
    bx:(rng()-.5)*MOVE_BIAS, by:(rng()-.5)*MOVE_BIAS,
    lastAim:null, lastImpact:null, order:null
  }));
  S.fo = { id:'O', x: S.guns[1].x+FO_DX, y: S.guns[1].y, mv:null, order:null };

  // ce qu'ils croient savoir de notre déploiement avant le premier coup
  const cy0 = (S.guns[0].y + S.guns[1].y + S.guns[2].y) / 3;
  const cx0 = (S.guns[0].x + S.guns[1].x + S.guns[2].x) / 3;
  S.pZone = { x: cx0 + (rng()-.5)*PZONE_JX, y: cy0 + (rng()-.5)*PZONE_JY, r: PZONE_R, uses: 0 };

  S.enemies = [];
  for (let i = 0; i < 3; i++){
    const ex = ENEMY_X_MIN+rng()*ENEMY_X_SPAN, ey = ENEMY_Y_TOP+i*ENEMY_Y_STEP+(rng()-.5)*ENEMY_Y_JITTER;
    S.enemies.push({ x:ex, y:ey, alive:true, seen:false, spot:0, threat:0, mv:null, plot:null, lk:null,
      zx: ex+(rng()-.5)*ZONE_JITTER, zy: ey+(rng()-.5)*ZONE_JITTER, zr: ZONE_R_MIN+rng()*ZONE_R_SPAN });
  }
}
