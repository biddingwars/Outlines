import { test } from 'node:test';
import assert from 'node:assert/strict';
import { area, signedArea, centroid, simplify, simplifyRing, resample, perimeter, bbox, projectLAEA } from '../engine/geometry.js';

const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];

test('area and centroid of a square', () => {
  assert.equal(area(sq), 100);
  assert.equal(signedArea(sq), 100);
  assert.equal(signedArea(sq.slice().reverse()), -100);
  assert.deepEqual(centroid(sq), [5, 5]);
});

test('centroid of a degenerate ring falls back to the vertex mean', () => {
  assert.deepEqual(centroid([[0, 0], [2, 0], [4, 0]]), [2, 0]);
});

test('simplify keeps corners and drops collinear points', () => {
  const line = [[0, 0], [1, 0.01], [2, 0], [3, 0], [3, 3]];
  assert.deepEqual(simplify(line, 0.1), [[0, 0], [3, 0], [3, 3]]);
  const dense = resample(sq, 200);
  const s = simplifyRing(dense, 0.05);
  assert.ok(s.length >= 4 && s.length <= 8, `got ${s.length}`);
  assert.ok(Math.abs(area(s) - 100) < 1);
});

test('resample spaces points evenly', () => {
  const r = resample(sq, 40);
  assert.equal(r.length, 40);
  assert.ok(Math.abs(perimeter(r) - 40) < 1e-6);
});

test('bbox', () => {
  assert.deepEqual(bbox(sq), { minX: 0, minY: 0, maxX: 10, maxY: 10, w: 10, h: 10 });
});

test('LAEA projection is centred and preserves area', () => {
  assert.deepEqual(projectLAEA([10, 50], [10, 50]).map((v) => Math.round(v * 1e6) / 1e6), [0, 0]);
  // A 1°×1° cell at the equator ≈ 12,364 km²; at 60°N it is about half.
  const cell = (lat) => area([[0, lat], [1, lat], [1, lat + 1], [0, lat + 1]].map((p) => projectLAEA(p, [0.5, lat + 0.5])));
  assert.ok(Math.abs(cell(0) - 12364) < 50);
  assert.ok(Math.abs(cell(60) / cell(0) - 0.4954) < 0.01);
});
