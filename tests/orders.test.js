import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, MAXRANGE } from '../src/config.js';
import { blockReason } from '../src/rules/orders.js';

const noVis = () => new Uint8Array(COLS*ROWS);
const gun = (over) => ({ id:'A', x:100, y:300, alive:true, order:null, ...over });

test('un tour sans ordre de tir est toujours exécutable', () => {
  assert.equal(blockReason([gun()], { he: 0 }, noVis(), []), '');
});

test('on ne peut pas tirer plus d\'obus que le stock commun n\'en contient', () => {
  const guns = [
    gun({ id:'A', order:{ type:'fire', ammo:'he', aim:{ x:400, y:300 } } }),
    gun({ id:'B', y:400, order:{ type:'fire', ammo:'he', aim:{ x:400, y:400 } } })
  ];
  assert.equal(blockReason(guns, { he: 1 }, noVis(), []), 'Stock insuffisant : explosif.');
  assert.equal(blockReason(guns, { he: 2 }, noVis(), []), '');
});

test('un objectif au-delà de la portée maximale bloque l\'exécution', () => {
  const g = gun({ order:{ type:'fire', ammo:'he', aim:{ x:100 + MAXRANGE + 1, y:300 } } });
  assert.equal(blockReason([g], { he: 5 }, noVis(), []), 'Pièce A : objectif hors portée.');
});

test('un tir guidé exige un point d\'impact observé', () => {
  const g = gun({ order:{ type:'fire', ammo:'gui', aim:{ x:400, y:300 } } });
  assert.equal(blockReason([g], { gui: 3 }, noVis(), []), 'Pièce A : guidage sans observation.');
  const drone = [{ x:400, y:300 }];
  assert.equal(blockReason([g], { gui: 3 }, noVis(), drone), '');
});

test('une pièce détruite ne consomme ni stock ni légalité', () => {
  const g = gun({ alive:false, order:{ type:'fire', ammo:'he', aim:{ x:5000, y:300 } } });
  assert.equal(blockReason([g], { he: 0 }, noVis(), []), '');
});
