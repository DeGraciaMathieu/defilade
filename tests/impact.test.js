import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, CELL, AMMO, T_MARSH } from '../src/config.js';
import { resolveImpact } from '../src/rules/impact.js';
import { ei } from '../src/rules/grid.js';

const flatTer = () => new Uint8Array(COLS*ROWS);
const gun = (over) => ({ id:'A', x:200, y:300, hp:2, alive:true, ...over });
const battery = (over) => ({ x:800, y:300, alive:true, seen:true, threat:0, ...over });

test('un obus adverse au contact détruit une pièce d\'un coup', () => {
  const r = resolveImpact(205, 300, AMMO.he, 'them', flatTer(), [gun()], [], 1);
  assert.equal(r.gunHits[0].alive, false);
  assert.equal(r.events[0].msg, 'PIÈCE A DÉTRUITE.');
});

test('des éclats en limite de rayon n\'enlèvent qu\'un point', () => {
  const r = resolveImpact(200+28, 300, AMMO.he, 'them', flatTer(), [gun()], [], 1);
  assert.equal(r.gunHits[0].hp, 1);
  assert.equal(r.gunHits[0].alive, true);
  assert.equal(r.events[0].msg, 'Éclats sur la pièce A.');
});

test('le marais étouffe les éclats : même distance, aucun dégât', () => {
  const marsh = flatTer();
  const x = 200+28, y = 300;
  marsh[ei(Math.floor(x/CELL), Math.floor(y/CELL))] = T_MARSH;
  const r = resolveImpact(x, y, AMMO.he, 'them', marsh, [gun()], [], 1);
  assert.equal(r.gunHits.length, 0);
});

test('un explosif au but neutralise la batterie', () => {
  const r = resolveImpact(805, 300, AMMO.he, 'us', flatTer(), [], [battery()], 3);
  assert.equal(r.enemyHits[0].killed, true);
  assert.equal(r.events[0].msg, 'OBJECTIF DÉTRUIT — batterie neutralisée.');
});

test('l\'obus de réglage ne détruit jamais, mais révèle et inquiète', () => {
  const r = resolveImpact(810, 300, AMMO.reg, 'us', flatTer(), [], [battery()], 3);
  const h = r.enemyHits[0];
  assert.ok(!h.killed);
  assert.equal(h.threat, .5);
  assert.deepEqual(h.lk, { x:800, y:300, t:3 });
});

test('un impact à moins de 220 px augmente la menace, plafonnée à 4', () => {
  const e = battery({ threat: 3.8 });
  const r = resolveImpact(800, 300+200, AMMO.he, 'us', flatTer(), [], [e], 3);
  assert.equal(r.enemyHits[0].threat, 4);
});

test('une batterie déjà détruite est ignorée', () => {
  const r = resolveImpact(805, 300, AMMO.he, 'us', flatTer(), [], [battery({ alive:false })], 3);
  assert.equal(r.enemyHits.length, 0);
  assert.equal(r.events.length, 0);
});
