import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, AMMO, SALVO_STAGGER } from '../src/config.js';
import { fireShell, guidedSnap, icmSubs, enemySalvo } from '../src/rules/fire.js';
import { createRng } from '../src/rules/rng.js';

const noVis = () => new Uint8Array(COLS*ROWS);

test('un coup non guidé subit le biais de la pièce plus un bruit borné à ±6 px', () => {
  const g = { x:100, y:300, bx:30, by:-20 };
  const o = { ammo:'he', aim:{ x:500, y:300 } };
  const rng = createRng(3);
  for (let i = 0; i < 20; i++){
    const s = fireShell(g, o, rng);
    assert.ok(Math.abs(s.tx - (500+30)) <= 6);
    assert.ok(Math.abs(s.ty - (300-20)) <= 6);
  }
});

test('un coup guidé ignore le biais de la pièce, bruit borné à ±4 px', () => {
  const g = { x:100, y:300, bx:40, by:40 };
  const o = { ammo:'gui', aim:{ x:500, y:300 } };
  const s = fireShell(g, o, createRng(3));
  assert.ok(Math.abs(s.tx - 500) <= 4);
  assert.ok(Math.abs(s.ty - 300) <= 4);
});

test('plus l\'objectif est loin, plus l\'obus vole longtemps', () => {
  const g = { x:100, y:300, bx:0, by:0 };
  const near = fireShell(g, { ammo:'he', aim:{ x:200, y:300 } }, createRng(1));
  const far = fireShell(g, { ammo:'he', aim:{ x:800, y:300 } }, createRng(1));
  assert.ok(far.dur > near.dur);
});

test('le guidage terminal se recale sur un objectif observé à moins de 150 px', () => {
  const enemies = [{ x:520, y:310, alive:true }];
  const drones = [{ x:520, y:310 }]; // observé par drone
  const snap = guidedSnap(500, 300, enemies, noVis(), drones, createRng(5));
  assert.ok(snap && Math.hypot(snap.x-520, snap.y-310) <= 4);
});

test('pas de recalage sur un objectif non observé', () => {
  const enemies = [{ x:520, y:310, alive:true }];
  assert.equal(guidedSnap(500, 300, enemies, noVis(), [], createRng(5)), null);
});

test('les bombelettes dispersent sept sous-munitions dans le rayon, détonation en cascade', () => {
  const subs = icmSubs(500, 300, AMMO.icm, createRng(9));
  assert.equal(subs.length, AMMO.icm.subs);
  subs.forEach((b, k) => {
    assert.ok(Math.hypot(b.x-500, b.y-300) <= AMMO.icm.spread);
    assert.equal(b.d, k*6);
  });
});

test('une salve adverse compte trois obus étalés dans le temps, à moins de 55 px du but', () => {
  const e = { x:800, y:300 };
  const shells = enemySalvo(e, { x:200, y:300 }, createRng(11));
  assert.equal(shells.length, 3);
  shells.forEach((s, k) => {
    assert.equal(s.t, -k*SALVO_STAGGER);
    assert.ok(Math.hypot(s.tx-200, s.ty-300) <= 55);
    assert.equal(s.side, 'them');
  });
});
