import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, CELL, MOVE_GUN, T_MARSH } from '../src/config.js';
import { computeReach, pathTo } from '../src/rules/reach.js';
import { ei } from '../src/rules/grid.js';

const flatTer = () => new Uint8Array(COLS*ROWS);
const flatElev = () => new Float32Array(COLS*ROWS);
const px = cx => cx*CELL + CELL/2;

test('une unité ne peut pas s\'installer dans le bandeau nord', () => {
  const { dist } = computeReach(flatTer(), flatElev(), px(10), px(5), MOVE_GUN);
  assert.equal(dist[ei(10, 1)], Infinity);
  assert.equal(dist[ei(10, 0)], Infinity);
});

test('traverser un marais coûte plus de points de mouvement que du découvert', () => {
  const marsh = flatTer();
  for (let cy = 0; cy < ROWS; cy++) marsh[ei(12, cy)] = T_MARSH;
  const open = computeReach(flatTer(), flatElev(), px(10), px(10), MOVE_GUN);
  const wet = computeReach(marsh, flatElev(), px(10), px(10), MOVE_GUN);
  assert.ok(wet.dist[ei(14, 10)] > open.dist[ei(14, 10)]);
});

test('monter une pente coûte, la descendre ne coûte rien de plus', () => {
  const elev = flatElev();
  for (let cy = 0; cy < ROWS; cy++) elev[ei(12, cy)] = 100;
  const up = computeReach(flatTer(), elev, px(10), px(10), MOVE_GUN);
  const flat = computeReach(flatTer(), flatElev(), px(10), px(10), MOVE_GUN);
  assert.ok(up.dist[ei(12, 10)] > flat.dist[ei(12, 10)]);
  assert.equal(up.dist[ei(11, 10)], flat.dist[ei(11, 10)]);
});

test('le chemin reconstruit va de la position de départ à la destination', () => {
  const { prev } = computeReach(flatTer(), flatElev(), px(10), px(10), MOVE_GUN);
  const path = pathTo(px(10), px(10), px(14), px(10), prev);
  assert.deepEqual(path[0], { x: px(10), y: px(10) });
  assert.deepEqual(path[path.length-1], { x: px(14), y: px(10) });
});
