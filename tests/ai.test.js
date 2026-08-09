import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, AI_KEEP_X } from '../src/config.js';
import { planAI, pickSpot } from '../src/rules/ai.js';
import { createRng } from '../src/rules/rng.js';

/* rng de test : rejoue une séquence imposée, puis répète la dernière valeur */
const seqRng = (vals) => { let i = 0; return () => vals[Math.min(i++, vals.length-1)]; };

const ctx = () => ({
  ter: new Uint8Array(COLS*ROWS),
  elev: new Float32Array(COLS*ROWS),
  vis: new Uint8Array(COLS*ROWS),
  drones: [],
  guns: [],
  enemies: []
});

const battery = (over) => ({ x:800, y:300, alive:true, seen:false, threat:0, ...over });
const plottedGun = (over) => ({ id:'A', x:200, y:300, alive:true,
  ePlot:{ x:210, y:305, err:80, stale:false, age:0 }, ...over });

test('avec un plot frais à portée, la batterie prend notre pièce à partie', () => {
  const g = plottedGun();
  const { orders } = planAI([battery()], [g], null, { ...ctx(), guns:[g] }, seqRng([0, .9]));
  assert.equal(orders[0].type, 'fire');
  assert.deepEqual(orders[0].at, { x:210, y:305 });
});

test('sous forte menace, elle peut préférer décrocher malgré la cible', () => {
  const g = plottedGun();
  const c = { ...ctx(), guns:[g] };
  // 1er tirage : choix de cible ; 2e : décrochage (< .45) ; la suite alimente pickSpot
  const { orders } = planAI([battery({ threat: 3 })], [g], null, c, seqRng([0, .1, .5]));
  assert.equal(orders[0].type, 'move');
  assert.ok(orders[0].to.x >= AI_KEEP_X || orders[0].to.x === 800); // jamais côté joueur
});

test('sans plot, elle peut harceler la zone de déploiement supposée — au plus cinq fois', () => {
  const pZone = { x:250, y:300, r:150, uses:0 };
  const { orders, pZoneUses } = planAI([battery()], [], pZone, ctx(), seqRng([.1, .5, .5]));
  assert.equal(orders[0].type, 'fire');
  assert.equal(orders[0].harass, true);
  assert.ok(Math.hypot(orders[0].at.x-250, orders[0].at.y-300) <= 150);
  assert.equal(pZoneUses, 1);

  const spent = { ...pZone, uses: 5 };
  const r2 = planAI([battery()], [], spent, ctx(), seqRng([.0, .99]));
  assert.notEqual(r2.orders[0].type, 'fire');
  assert.equal(r2.pZoneUses, 5);
});

test('menacée sans cible, elle se replie ; tranquille, elle reste en batterie', () => {
  const threatened = planAI([battery({ threat: 2.2 })], [], null, ctx(), seqRng([.9]));
  assert.equal(threatened.orders[0].type, 'move');
  const calm = planAI([battery()], [], null, ctx(), seqRng([.9]));
  assert.equal(calm.orders[0].type, 'hold');
});

test('une batterie détruite ne reçoit aucun ordre', () => {
  const { orders } = planAI([battery({ alive:false })], [], null, ctx(), createRng(1));
  assert.equal(orders[0], null);
});

test('le point de repli reste côté adverse de la carte', () => {
  const e = battery();
  const c = { ...ctx(), enemies:[e] };
  const spot = pickSpot(e, c, createRng(17));
  assert.ok(spot.x >= AI_KEEP_X);
});
