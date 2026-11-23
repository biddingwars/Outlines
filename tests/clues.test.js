import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evalTest, filterByTests } from '../engine/clues.js';

const facts = { drive: 'left', flag: ['red', 'white'], n: 3, neighbours: [] };

test('operators', () => {
  assert.equal(evalTest({ f: 'drive', eq: 'left' }, facts), true);
  assert.equal(evalTest({ f: 'drive', ne: 'left' }, facts), false);
  assert.equal(evalTest({ f: 'drive', in: ['left', 'right'] }, facts), true);
  assert.equal(evalTest({ f: 'flag', has: 'red' }, facts), true);
  assert.equal(evalTest({ f: 'flag', lacks: 'red' }, facts), false);
  assert.equal(evalTest({ f: 'flag', all: ['red', 'white'] }, facts), true);
  assert.equal(evalTest({ f: 'flag', all: ['red', 'blue'] }, facts), false);
  assert.equal(evalTest({ f: 'flag', any: ['blue', 'white'] }, facts), true);
  assert.equal(evalTest({ f: 'flag', count: 2 }, facts), true);
  assert.equal(evalTest({ f: 'neighbours', count: 0 }, facts), true);
});

test('unknown facts are undefined, not false', () => {
  assert.equal(evalTest({ f: 'missing', eq: 1 }, facts), undefined);
  assert.equal(evalTest({ f: 'drive' }, facts), undefined);
  assert.equal(evalTest(null, facts), undefined);
});

test('filtering keeps items with unknown facts', () => {
  const items = [{ id: 'a', facts: { x: 1 } }, { id: 'b', facts: { x: 2 } }, { id: 'c', facts: {} }];
  assert.deepEqual(filterByTests(items, [{ f: 'x', eq: 1 }]).map((i) => i.id), ['a', 'c']);
});
