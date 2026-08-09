import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, CELL } from '../src/config.js';
import { losClear, observed } from '../src/rules/los.js';
import { ei } from '../src/rules/grid.js';

const flatTer = () => new Uint8Array(COLS*ROWS);
const flatElev = () => new Float32Array(COLS*ROWS);

test('sur terrain plat et découvert, la ligne de vue passe', () => {
  assert.equal(losClear(flatTer(), flatElev(), 5, 5, 20, 5), true);
});

test('un bois sur le trajet bloque la ligne de vue', () => {
  const ter = flatTer();
  ter[ei(12, 5)] = 1; // T_WOOD
  assert.equal(losClear(ter, flatElev(), 5, 5, 20, 5), false);
});

test('une cible sous couvert ne se voit pas, même adjacente', () => {
  const ter = flatTer();
  ter[ei(6, 5)] = 1; // T_WOOD
  assert.equal(losClear(ter, flatElev(), 5, 5, 6, 5), false);
});

test('une crête plus haute que l\'observateur et la cible masque la vue', () => {
  const elev = flatElev();
  elev[ei(12, 5)] = 50;
  assert.equal(losClear(flatTer(), elev, 5, 5, 20, 5), false);
});

test('une position dans le champ du drone est observée même hors visibilité', () => {
  const vis = new Uint8Array(COLS*ROWS); // rien de visible
  const x = 30*CELL, y = 10*CELL;
  assert.equal(observed(vis, [], x, y), false);
  assert.equal(observed(vis, [{ x, y }], x, y), true);
});

test('hors carte, rien n\'est observé', () => {
  const vis = new Uint8Array(COLS*ROWS).fill(1);
  assert.equal(observed(vis, [], -10, -10), false);
});
