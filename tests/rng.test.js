import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed, hashString, toSeed } from '../engine/rng.js';

test('same seed, same sequence', () => {
  const a = createRng(123);
  const b = createRng(123);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('labels derive independent streams', () => {
  assert.notEqual(deriveSeed(1, 'a'), deriveSeed(1, 'b'));
  assert.notEqual(deriveSeed(1, 'round', 1), deriveSeed(1, 'round', 2));
  assert.equal(deriveSeed(9, 'x', 3), deriveSeed(9, 'x', 3));
  assert.equal(createRng(5, 'k').next(), createRng(deriveSeed(5, 'k')).next());
});

test('values are in range and roughly uniform', () => {
  const r = createRng(77);
  const bins = new Array(10).fill(0);
  for (let i = 0; i < 20000; i++) {
    const x = r.next();
    assert.ok(x >= 0 && x < 1);
    bins[Math.floor(x * 10)]++;
  }
  for (const b of bins) assert.ok(b > 1800 && b < 2200, `bin ${b}`);
  for (let i = 0; i < 1000; i++) {
    const k = r.int(7);
    assert.ok(Number.isInteger(k) && k >= 0 && k < 7);
  }
});

test('shuffle is a permutation and does not mutate', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8];
  const s = createRng(3).shuffle(arr);
  assert.deepEqual(arr, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(s.slice().sort((a, b) => a - b), arr);
});

test('normal has mean ≈ 0 and sd ≈ 1', () => {
  const r = createRng(11);
  let s = 0;
  let s2 = 0;
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const x = r.normal();
    s += x;
    s2 += x * x;
  }
  assert.ok(Math.abs(s / n) < 0.03);
  assert.ok(Math.abs(Math.sqrt(s2 / n) - 1) < 0.03);
});

test('seed normalisation', () => {
  assert.equal(toSeed(42), 42);
  assert.equal(toSeed('abc'), hashString('abc'));
  assert.equal(toSeed(-1), 4294967295);
  assert.equal(typeof toSeed(undefined), 'number');
});
