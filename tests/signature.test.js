import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accumulateSignature, locationPlot, soundPlot } from '../src/rules/signature.js';
import { createRng } from '../src/rules/rng.js';

test('tirer deux fois du même endroit accumule la signature', () => {
  let s = accumulateSignature(0, null, 200, 300, 1);
  s = accumulateSignature(s.sig, s.sigPos, 205, 302, 1);
  assert.equal(s.sig, 2);
});

test('décrocher remet la signature à celle du seul dernier coup', () => {
  let s = accumulateSignature(0, null, 200, 300, 1);
  s = accumulateSignature(s.sig, s.sigPos, 400, 300, 1.4);
  assert.equal(s.sig, 1.4);
  assert.deepEqual(s.sigPos, { x: 400, y: 300 });
});

test('sous le seuil de signature, aucune localisation n\'est possible', () => {
  assert.equal(locationPlot(200, 300, .5, createRng(1)), null);
});

test('plus la signature est forte, plus le plot est précis (borné 20–160)', () => {
  const rng = createRng(1);
  assert.equal(locationPlot(200, 300, 1, rng).err, 160);
  assert.equal(locationPlot(200, 300, 2, rng).err, 80);
  assert.equal(locationPlot(200, 300, 100, rng).err, 20);
});

test('le plot tombe dans le rayon d\'erreur autour de la pièce', () => {
  const rng = createRng(42);
  for (let i = 0; i < 20; i++){
    const p = locationPlot(200, 300, 1, rng);
    assert.ok(Math.hypot(p.x-200, p.y-300) <= p.err);
  }
});

test('le plot acoustique démarre grossier puis s\'affine jusqu\'au plancher', () => {
  const rng = createRng(7);
  let p = soundPlot(null, 800, 300, rng);
  assert.equal(p.err, 115);
  p = soundPlot(p, 800, 300, rng);
  assert.equal(p.err, 81);
  p = soundPlot(p, 800, 300, rng);
  p = soundPlot(p, 800, 300, rng);
  assert.equal(p.err, 28); // plancher
});

test('une batterie qui a bougé casse l\'affinage acoustique', () => {
  const rng = createRng(7);
  let p = soundPlot(null, 800, 300, rng);
  p = soundPlot(p, 800, 300, rng);
  p = soundPlot(p, 900, 300, rng); // elle a décroché
  assert.equal(p.err, 115);
});
