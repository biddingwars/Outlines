import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CURVE, DEFAULT_RULES, multiplierFor, stampValue, accuracyFromGap, ZERO_GAP, basePointsFor, roundScore, validateCurve } from '../engine/scoring.js';

test('curve hits its anchors', () => {
  assert.equal(multiplierFor(0), 1);
  assert.equal(multiplierFor(0.5), 1);
  assert.equal(multiplierFor(0.55), 1);
  assert.equal(multiplierFor(0.7), 10);
  assert.equal(multiplierFor(0.85), 100);
  assert.equal(multiplierFor(0.95), 1000);
  assert.equal(multiplierFor(1), 1000);
});

test('curve is logarithmic between anchors and never decreases', () => {
  assert.equal(multiplierFor(0.625), stampValue(Math.sqrt(10)));
  assert.equal(multiplierFor(0.775), stampValue(Math.sqrt(1000)));
  let prev = 0;
  for (let a = 0; a <= 1.0001; a += 0.001) {
    const m = multiplierFor(a);
    assert.ok(m >= prev, `${a}: ${m} < ${prev}`);
    assert.ok(m >= 1 && m <= 1000);
    prev = m;
  }
});

test('stamp values have two significant figures', () => {
  assert.deepEqual([1.04, 1.44, 12.4, 126, 994, 1000].map(stampValue), [1, 1.4, 12, 130, 990, 1000]);
  assert.equal(stampValue(NaN), 1);
});

test('accuracy comes from the outline gap, the same scale for every place', () => {
  assert.equal(accuracyFromGap(0), 1);
  assert.equal(accuracyFromGap(ZERO_GAP / 2), 0.5);
  assert.equal(accuracyFromGap(ZERO_GAP), 0);
  assert.equal(accuracyFromGap(2), 0);
  assert.equal(accuracyFromGap(Infinity), 0);
  assert.equal(accuracyFromGap(NaN), 0);
});

test('base points by clue, minus wrong guesses, floor 1 when solved', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((k) => basePointsFor(k, 0)), [5, 4, 3, 2, 1]);
  assert.equal(basePointsFor(null, 0), 0);
  assert.equal(basePointsFor(1, 1), 3);
  assert.equal(basePointsFor(4, 4), 1);
  assert.equal(basePointsFor(1, 1, { ...DEFAULT_RULES, wrongGuessPenalty: 0 }), 4);
});

test('round score range is 0 or 1..5000', () => {
  assert.equal(roundScore(5, 1000), 5000);
  assert.equal(roundScore(1, 1), 1);
  assert.equal(roundScore(0, 1000), 0);
  assert.equal(roundScore(3, 1.4), 4);
});

test('curve validation', () => {
  assert.equal(validateCurve(DEFAULT_CURVE), null);
  assert.ok(validateCurve({ anchors: [[0.3, 1]] }));
  assert.ok(validateCurve({ anchors: [[0.3, 2], [0.5, 10]] }));
  assert.ok(validateCurve({ anchors: [[0.5, 1], [0.4, 10]] }));
  assert.ok(validateCurve(null));
});
