/* Résolution d'un impact : dégâts, menace, révélation. Retourne des effets et des événements, ne mutile rien. */
import { CELL, COLS, ROWS, TER, FRAG_R, FRAG_KILL_R, THREAT_R, THREAT_MAX } from '../config.js';
import { ei, clamp } from './grid.js';

export function resolveImpact(x, y, A, side, ter, guns, enemies, turn){
  const bl = TER[ter[ei(clamp(Math.floor(x/CELL),0,COLS-1), clamp(Math.floor(y/CELL),0,ROWS-1))]].blast;
  const events = [];
  if (side === 'them'){
    const gunHits = [];
    guns.forEach((g, i) => {
      if (!g.alive) return;
      const d = Math.hypot(x-g.x, y-g.y);
      if (d < FRAG_R*bl){
        const hp = g.hp - (d < FRAG_KILL_R*bl ? 2 : 1);
        gunHits.push({ i, hp, alive: hp > 0 });
        events.push(hp > 0 ? { msg:'Éclats sur la pièce ' + g.id + '.', cls:'warn' }
                           : { msg:'PIÈCE ' + g.id + ' DÉTRUITE.', cls:'warn' });
      }
    });
    return { gunHits, enemyHits: [], events };
  }
  const enemyHits = [];
  enemies.forEach((e, i) => {
    if (!e.alive) return;
    const d = Math.hypot(x-e.x, y-e.y);
    const h = { i };
    let touched = false;
    if (d < THREAT_R){ h.threat = Math.min(THREAT_MAX, e.threat + (A.thr === undefined ? 1 : A.thr)); touched = true; }
    if (d < A.reveal){ h.lk = { x:e.x, y:e.y, t:turn }; h.spot = 20; touched = true; }
    if (A.kill && d < A.kill*bl){
      h.killed = true; touched = true;
      events.push({ msg:'OBJECTIF DÉTRUIT — batterie neutralisée.', cls:'hit' });
    }
    if (touched) enemyHits.push(h);
  });
  return { gunHits: [], enemyHits, events };
}
