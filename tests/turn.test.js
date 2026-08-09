import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agedPlot, decayedThreat, tickDrones, missionOutcome } from '../src/rules/turn.js';

test('un plot périmé disparaît au bout de deux tours, un plot frais ne vieillit pas', () => {
  let plot = { x:200, y:300, err:80, stale:true, age:0 };
  plot = agedPlot(plot);
  assert.equal(plot.age, 1);
  assert.equal(agedPlot(plot), null);
  const fresh = { x:200, y:300, err:80, stale:false, age:0 };
  assert.equal(agedPlot(fresh), fresh);
});

test('la menace retombe de 0.6 par tour sans passer sous zéro', () => {
  assert.equal(decayedThreat(4), 3.4);
  assert.equal(decayedThreat(.3), 0);
});

test('un drone tient trois tours de station puis tombe', () => {
  let d = [{ x:500, y:300, turns:3 }];
  d = tickDrones(d).drones;
  d = tickDrones(d).drones;
  assert.equal(d.length, 1);
  const last = tickDrones(d);
  assert.equal(last.drones.length, 0);
  assert.equal(last.expired, 1);
});

test('groupe détruit : la mission s\'arrête en défaite', () => {
  const out = missionOutcome([{ alive:false }, { alive:false }], [{ alive:true }], { he:5 });
  assert.equal(out.t1, 'GROUPE DÉTRUIT');
});

test('trois batteries neutralisées : mission remplie', () => {
  const out = missionOutcome([{ alive:true }], [{ alive:false }, { alive:false }], { he:5 });
  assert.equal(out.t1, 'MISSION REMPLIE');
});

test('sans plus rien de létal en stock, la mission est perdue même avec des pièces', () => {
  const out = missionOutcome([{ alive:true }], [{ alive:true }], { reg:Infinity, he:0, icm:0, gui:0, rec:2 });
  assert.equal(out.t1, 'À COURT DE MUNITIONS');
});

test('tant qu\'il reste de quoi combattre, la mission continue', () => {
  assert.equal(missionOutcome([{ alive:true }], [{ alive:true }], { he:1, icm:0, gui:0 }), null);
});
