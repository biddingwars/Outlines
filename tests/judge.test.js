import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judge, prepareTarget, cleanStrokes, outlineToBox, outlineToCanvas } from '../engine/judge.js';
import { multiplierFor } from '../engine/scoring.js';
import { readFileSync } from 'node:fs';
import { world, us } from './helpers.js';

const outline = (pack, id) => pack.byId.get(id).outline;
const box = (ring, size = 1000) => outlineToBox(ring, size);

test('a perfect copy scores near 100 %', () => {
  for (const [pack, id] of [[world, 'ITA'], [world, 'FRA'], [world, 'CHL'], [world, 'JPN'], [us, 'CO'], [us, 'MI']]) {
    const r = judge([box(outline(pack, id))], pack.targetFor(id));
    assert.ok(r.overlap > 0.97, `${id} overlap ${r.overlap}`);
    assert.ok(r.accuracy > 0.93, `${id} accuracy ${r.accuracy}`);
  }
});

test('position and size of the drawing do not matter', () => {
  const ring = outline(world, 'ITA');
  const t = world.targetFor('ITA');
  const base = judge([box(ring, 1000)], t).accuracy;
  const small = judge([box(ring, 200).map(([x, y]) => [x + 37, y + 512])], t).accuracy;
  const big = judge([box(ring, 5000).map(([x, y]) => [x - 900, y - 40])], t).accuracy;
  assert.ok(Math.abs(small - base) <= 0.005, `${small} vs ${base}`);
  assert.ok(Math.abs(big - base) <= 0.005, `${big} vs ${base}`);
});

test('a quarter turn or a mirror image still matters (north is up)', () => {
  const ring = box(outline(world, 'ITA'));
  const t = world.targetFor('ITA');
  const rot = ring.map(([x, y]) => [y, -x]);
  const mirror = ring.map(([x, y]) => [-x, y]);
  assert.ok(judge([rot], t).accuracy < 0.3);
  assert.ok(judge([mirror], t).accuracy < 0.8);
});

test('the same drawing always gets the same score', () => {
  const t = world.targetFor('ESP');
  const strokes = [box(outline(world, 'FRA'))];
  const a = judge(strokes, t);
  const b = judge(structuredClone(strokes), prepareTarget(outline(world, 'ESP')));
  assert.equal(a.iou, b.iou);
  assert.deepEqual(a.fit, b.fit);
});

test('a featureless circle or square scores far below a real drawing', () => {
  const circle = [Array.from({ length: 64 }, (_, i) => [Math.cos((i / 64) * 6.2832) * 100, Math.sin((i / 64) * 6.2832) * 100])];
  for (const [pack, id] of [[world, 'FRA'], [world, 'ESP'], [world, 'DEU'], [world, 'IND']]) {
    const t = pack.targetFor(id);
    const blob = judge(circle, t).accuracy;
    const real = judge([box(pack.byId.get(id).outline)], t).accuracy;
    assert.ok(real - blob > 0.25, `${id} ${real} vs ${blob}`);
  }
  // On long, thin places a blob is worthless.
  for (const id of ['CHL', 'NOR', 'ITA']) assert.ok(judge(circle, world.targetFor(id)).accuracy < 0.1, id);
});

test('a square drawn for a square-ish place scores well (Egypt)', () => {
  const square = [[[0, 0], [100, 0], [100, 100], [0, 100]]];
  assert.ok(multiplierFor(judge(square, world.targetFor('EGY')).accuracy) >= 75);
});

test('a drawing tilted by up to 30° is turned back before judging', () => {
  const ring = box(outline(world, 'ITA'));
  const t = world.targetFor('ITA');
  const a = (20 * Math.PI) / 180;
  const c = [500, 500];
  const tilted = ring.map(([x, y]) => [c[0] + (x - c[0]) * Math.cos(a) - (y - c[1]) * Math.sin(a), c[1] + (x - c[0]) * Math.sin(a) + (y - c[1]) * Math.cos(a)]);
  const straight = judge([ring], t).accuracy;
  const r = judge([tilted], t);
  assert.ok(r.accuracy > straight - 0.08, `${r.accuracy} vs ${straight}`);
  // and the fit maps the outline back onto the tilted sketch
  assert.ok(judge([outlineToCanvas(outline(world, 'ITA'), r.fit)], t).accuracy > 0.9);
});

test('an outline drawn in several pieces, some backwards, is rejoined', () => {
  const ring = box(outline(world, 'GBR'));
  const n = ring.length;
  const a = ring.slice(0, Math.floor(n / 3) + 1);
  const b = ring.slice(Math.floor(n / 3), Math.floor((2 * n) / 3) + 1).reverse();
  const c = ring.slice(Math.floor((2 * n) / 3));
  const rings = cleanStrokes([c, a, b]);
  assert.equal(rings.length, 1);
  const t = world.targetFor('GBR');
  const whole = judge([ring], t).accuracy;
  const pieces = judge([c, a, b], t).accuracy;
  assert.ok(Math.abs(whole - pieces) < 0.02, `${whole} vs ${pieces}`);
});

test('open shapes close automatically', () => {
  const ring = box(outline(world, 'AUS'));
  const open = ring.slice(0, ring.length - 6); // a gap at the end
  const t = world.targetFor('AUS');
  assert.ok(judge([open], t).accuracy > 0.85);
});

test('the fit maps the real outline back onto the sketch', () => {
  const ring = outline(world, 'EGY');
  const t = world.targetFor('EGY');
  const drawn = box(ring, 700).map(([x, y]) => [x + 100, y + 50]);
  const r = judge([drawn], t);
  const back = outlineToCanvas(ring, r.fit);
  const again = judge([back], t);
  assert.ok(again.accuracy > 0.95);
  // And it sits where the sketch was.
  const cx = (pts) => pts.reduce((s, p) => s + p[0], 0) / pts.length;
  assert.ok(Math.abs(cx(back) - cx(drawn)) < 20);
});

test('thin shapes get a finer grid', () => {
  assert.ok(world.targetFor('CHL').grid > world.targetFor('FRA').grid);
});

// Real drawings by a play-tester, traced from screenshots of the test build.
// What they should score is a judgement call; these pin the agreed ordering.
test('real player drawings: recognisable shapes are rewarded', () => {
  const human = JSON.parse(readFileSync(new URL('./fixtures/human-drawings.json', import.meta.url), 'utf8'));
  const acc = Object.fromEntries(Object.entries(human).map(([id, d]) => [id, judge([d.drawing], world.targetFor(id)).accuracy]));
  // Spain and Germany were drawn with their real features.
  for (const id of ['ESP', 'DEU']) assert.ok(multiplierFor(acc[id]) >= 80, `${id} ${acc[id]}`);
  // France (a rounded square) and Kenya (a blob) are rough but still earn something.
  for (const id of ['FRA', 'KEN']) assert.ok(multiplierFor(acc[id]) >= 65 && multiplierFor(acc[id]) < 80, `${id} ${acc[id]}`);
  // Only the southern half of Norway was drawn.
  assert.ok(acc.NOR < 0.3, `NOR ${acc.NOR}`);
});

test('an island drawn next to the mainland costs nothing (Italy with Sicily)', () => {
  const ring = box(outline(world, 'ITA'), 800);
  const t = world.targetFor('ITA');
  const island = Array.from({ length: 24 }, (_, i) => [300 + 60 * Math.cos((i / 24) * 6.2832), 900 + 35 * Math.sin((i / 24) * 6.2832)]);
  const alone = judge([ring], t).accuracy;
  const withIsland = judge([ring, island], t).accuracy;
  assert.ok(Math.abs(alone - withIsland) < 0.02, `${alone} vs ${withIsland}`);
});

test('real beta drawings drawn upright are not punished for the tilt', async () => {
  const { readFileSync } = await import('node:fs');
  const { world } = await import('./helpers.js');
  const fx = JSON.parse(readFileSync(new URL('./fixtures/beta-drawings.json', import.meta.url), 'utf8'));
  const want = { ITA: 0.35, LTU: 0.72 }; // were 0.18 and 0.67 with ±30°
  for (const d of fx.drawings) {
    const res = judge(d.rings.map((r) => [...r, r[0]]), world.targetFor(d.id));
    assert.ok(res.accuracy >= want[d.id], `${d.id}: ${res.accuracy}`);
  }
});
