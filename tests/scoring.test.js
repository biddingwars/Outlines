import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CURVE, DEFAULT_RULES, multiplierFor, stampValue, accuracyFromGap, ZERO_GAP, basePointsFor, roundScore, validateCurve } from '../engine/scoring.js';

test('the multiplier is the accuracy: 70 % = 70x, perfect = 100x, never below 1x', () => {
  assert.equal(multiplierFor(0.7), 70);
  assert.equal(multiplierFor(1), 100);
  assert.equal(multiplierFor(0.843), 84);
  assert.equal(multiplierFor(0), 1);
  assert.equal(multiplierFor(0.004), 1);
  assert.equal(multiplierFor(NaN), 1);
  assert.equal(multiplierFor(2), 100);
  let prev = 0;
  for (let a = 0; a <= 1.0001; a += 0.001) {
    const m = multiplierFor(a);
    assert.ok(m >= prev && m >= 1 && m <= 100);
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
  // 6 down to 1: clue 1 is worth 6, clue 5 is worth 2, and a missed place still 1 (× the drawing)
  assert.deepEqual([0, 1, 2, 3, 4].map((k) => basePointsFor(k, 0)), [6, 5, 4, 3, 2]);
  assert.equal(basePointsFor(null, 0), 1);
  assert.equal(basePointsFor(null, 3), 1);
  assert.equal(basePointsFor(1, 1), 4);
  assert.equal(basePointsFor(4, 4), 1);
  assert.equal(basePointsFor(1, 1, { ...DEFAULT_RULES, wrongGuessPenalty: 0 }), 5);
});

test('round score range is 0 or 1..500', () => {
  assert.equal(roundScore(5, 100), 500);
  assert.equal(roundScore(1, 1), 1);
  assert.equal(roundScore(0, 100), 0);
  assert.equal(roundScore(3, 70), 210);
});

test('curve validation', () => {
  assert.equal(validateCurve(DEFAULT_CURVE), null);
  assert.ok(validateCurve({ linear: true, max: 0 }));
  assert.ok(validateCurve({ anchors: [[0.3, 1]] }));
  assert.ok(validateCurve(null));
});
