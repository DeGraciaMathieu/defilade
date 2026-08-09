/* Fin de tour : vieillissement des plots, décroissance de la menace, autonomie des drones, issue de la mission. */
import { PLOT_STALE_AGE, THREAT_DECAY } from '../config.js';

/* Un plot périmé vieillit à chaque tour et disparaît au bout de PLOT_STALE_AGE tours. */
export function agedPlot(ePlot){
  if (!ePlot || !ePlot.stale) return ePlot;
  const age = ePlot.age + 1;
  return age >= PLOT_STALE_AGE ? null : { ...ePlot, age };
}

/* La menace retombe d'elle-même quand les impacts cessent. */
export function decayedThreat(threat){
  return Math.max(0, threat - THREAT_DECAY);
}

/* Les drones en station consomment un tour d'autonomie ; les épuisés tombent. */
export function tickDrones(drones){
  const kept = [];
  let expired = 0;
  for (const d of drones){
    const turns = d.turns - 1;
    if (turns <= 0) expired++;
    else kept.push({ ...d, turns });
  }
  return { drones: kept, expired };
}

/* Trois façons de finir : plus de pièces, plus d'objectifs, plus de quoi détruire. */
export function missionOutcome(guns, enemies, stock){
  if (guns.every(g => !g.alive))
    return { t1:'GROUPE DÉTRUIT', t2:'Plus une pièce en batterie — N pour rejouer', c:'#c8382a' };
  if (enemies.every(e => !e.alive))
    return { t1:'MISSION REMPLIE', t2:'Les trois batteries sont neutralisées — N pour rejouer', c:'#d9662b' };
  if (!(stock.he > 0 || stock.icm > 0 || stock.gui > 0))
    return { t1:'À COURT DE MUNITIONS', t2:'Plus rien pour détruire un objectif — N pour rejouer', c:'#c8382a' };
  return null;
}
