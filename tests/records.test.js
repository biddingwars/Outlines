import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyRecord, sanitizeRecord, recordGame, recordDrawing } from '../engine/records.js';

const res = (winners, { practice = false, humans = 1 } = {}) => ({
  practice,
  winners,
  seats: [{ seat: 0, kind: 'human' }, ...(humans > 1 ? [{ seat: 1, kind: 'human' }] : [{ seat: 1, kind: 'bot' }])],
});

test('wins, losses, ties and streaks per pack', () => {
  let r = emptyRecord();
  r = recordGame(r, res([0]), { packId: 'world' });
  r = recordGame(r, res([0]), { packId: 'world' });
  assert.deepEqual(r.packs.world, { won: 2, lost: 0, tied: 0, streak: 2 });
  r = recordGame(r, res([1]), { packId: 'world' });
  assert.deepEqual(r.packs.world, { won: 2, lost: 1, tied: 0, streak: -1 });
  r = recordGame(r, res([0, 1]), { packId: 'world' });
  assert.equal(r.packs.world.tied, 1);
  r = recordGame(r, res([0]), { packId: 'us-states' });
  assert.equal(r.packs['us-states'].won, 1);
});

test('practice and hot-seat games do not touch the record', () => {
  const r = emptyRecord();
  assert.equal(recordGame(r, res([0], { practice: true }), { packId: 'world' }), r);
  assert.deepEqual(recordGame(r, res([0], { humans: 2 }), { packId: 'world' }), r);
});

test('best drawing per place', () => {
  let r = emptyRecord();
  const ring = Array.from({ length: 200 }, (_, i) => [Math.cos(i / 32) * 100, Math.sin(i / 32) * 100]);
  r = recordDrawing(r, { packId: 'world', itemId: 'ITA', accuracy: 0.5, rings: [ring], name: 'Leo', at: '2026-11-23' });
  assert.equal(r.best['world:ITA'].accuracy, 0.5);
  assert.ok(r.best['world:ITA'].rings[0].length < 200);
  const same = recordDrawing(r, { packId: 'world', itemId: 'ITA', accuracy: 0.4, rings: [ring] });
  assert.equal(same, r);
  r = recordDrawing(r, { packId: 'world', itemId: 'ITA', accuracy: 0.7, rings: [ring] });
  assert.equal(r.best['world:ITA'].accuracy, 0.7);
});

test('a corrupt or foreign record is cleaned up', () => {
  assert.deepEqual(sanitizeRecord(null), emptyRecord());
  assert.deepEqual(sanitizeRecord({ v: 99 }), emptyRecord());
  const r = sanitizeRecord({ v: 1, packs: { world: { won: 3, lost: -2, streak: 'x' }, 'Bad Id': { won: 1 } }, best: { 'world:ITA': { accuracy: 2, rings: [] }, 'world:FRA': { accuracy: 0.5, rings: [[[0, 0]]] } } });
  assert.deepEqual(r.packs, { world: { won: 3, lost: 0, tied: 0, streak: 0 } });
  assert.deepEqual(Object.keys(r.best), ['world:FRA']);
});
