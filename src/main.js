/* Point d'entrée : graine, mise en place d'une mission, câblage des entrées, démarrage de la boucle. */
import { createRng } from './rules/rng.js';
import { S } from './state/state.js';
import { genTerrain } from './state/terrain.js';
import { resetMission } from './state/state.js';
import { bakeTerrain } from './render/bake.js';
import { clearScars } from './render/effects.js';
import { refresh } from './render/hud.js';
import { log, sep, clearJournal } from './render/journal.js';
import { buildAmmo, buildRoster, initInput } from './input/input.js';
import { computeVis, trackEnemies, planAI, execute, frame } from './loop/loop.js';

function reset(seed){
  S.rng = createRng(seed === undefined ? (Math.random()*4294967296)>>>0 : seed>>>0);
  genTerrain(S.rng);
  bakeTerrain();
  resetMission(S.rng);
  clearScars();

  buildRoster();
  computeVis(); trackEnemies(); planAI();
  clearJournal();
  sep('tour 1 — ordres');
  log('Trois pièces contre trois batteries. Stock de munitions commun.', 'dim');
  log('Le terrain compte : les bois masquent la vue, le marais étouffe les éclats.', 'dim');
  log('Dès le premier départ ils vous entendent — grossièrement d\'abord, puis de mieux en mieux.', 'dim');
  S.phase = 'plan'; refresh();
}

buildAmmo();
initInput({ execute, reset });
reset();
frame();
