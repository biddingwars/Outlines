// Hostile drawings: the judge must never throw, never return NaN, and stay fast.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge } from '../engine/judge.js';
import { createRng } from '../engine/rng.js';
import { world, us } from './helpers.js';

const targets = [world.targetFor('ITA'), world.targetFor('CHL'), us.targetFor('CO')];

function check(strokes, label) {
  for (const t of targets) {
    const t0 = performance.now();
    let r;
    assert.doesNotThrow(() => {
      r = judge(strokes, t);
    }, label);
    const ms = performance.now() - t0;
    assert.ok(Number.isFinite(r.accuracy) && r.accuracy >= 0 && r.accuracy <= 1, `${label}: accuracy ${r.accuracy}`);
    assert.ok(Number.isFinite(r.overlap) && r.overlap >= 0 && r.overlap <= 1, `${label}: overlap ${r.overlap}`);
    assert.ok(ms < 1500, `${label}: ${ms.toFixed(0)} ms`);
    if (r.fit) for (const v of Object.values(r.fit)) assert.ok(Number.isFinite(v), `${label}: fit`);
  }
}

const cases = {
  undefined: undefined,
  null: null,
  string: 'hello',
  number: 42,
  'empty list': [],
  'empty stroke': [[]],
  'single dot': [[[5, 5]]],
  'same point repeated': [Array(500).fill([3, 3])],
  'two points': [[[0, 0], [100, 100]]],
  'collinear line': [Array.from({ length: 50 }, (_, i) => [i, 2 * i])],
  'NaN and Infinity': [[[NaN, 1], [Infinity, 2], [3, -Infinity], [0, 0], [1, 0], [1, 1]]],
  'non-numeric points': [[['a', 'b'], { x: 1 }, null, [1], [0, 0], [5, 0], [5, 5]]],
  'huge coordinates': [[[0, 0], [1e12, 0], [1e12, 1e12], [0, 1e12]]],
  'absurd coordinates': [[[0, 0], [1e300, 0], [1e300, 1e300], [0, 1e300]]],
  'tiny coordinates': [[[0, 0], [1e-12, 0], [1e-12, 1e-12], [0, 1e-12]]],
  'negative space': [[[-5000, -5000], [-4000, -5000], [-4500, -4000]]],
  'bow tie': [[[0, 0], [100, 100], [100, 0], [0, 100]]],
  'spike': [[[0, 0], [1, 0], [1000, 0.5], [1, 1], [0, 1]]],
  'nested loops': [Array.from({ length: 400 }, (_, i) => [Math.cos(i / 10) * (50 + i), Math.sin(i / 10) * (50 + i)])],
  'thousand strokes': Array.from({ length: 1000 }, (_, i) => [[i, 0], [i + 1, 5], [i, 10]]),
  '50k-point scribble': [Array.from({ length: 50000 }, (_, i) => [Math.sin(i * 1.7) * 400, Math.cos(i * 2.3) * 400])],
  'zero-area squiggle': [[[0, 0], [10, 0], [0, 0], [10, 0]]],
};

for (const [label, strokes] of Object.entries(cases)) {
  test(`hostile drawing: ${label}`, () => check(strokes, label));
}

test('random garbage (seeded)', () => {
  const rng = createRng(2024, 'fuzz');
  for (let i = 0; i < 60; i++) {
    const strokes = Array.from({ length: 1 + rng.int(4) }, () =>
      Array.from({ length: rng.int(80) }, () => {
        const scale = 10 ** rng.int(8);
        return [rng.range(-1, 1) * scale, rng.range(-1, 1) * scale];
      }),
    );
    check(strokes, `garbage #${i}`);
  }
});

test('degenerate drawings count as empty, not as a lucky score', () => {
  for (const label of ['single dot', 'two points', 'collinear line', 'zero-area squiggle', 'empty list']) {
    assert.equal(judge(cases[label], targets[0]).accuracy, 0, label);
  }
});
