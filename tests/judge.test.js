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

test('rotation and mirroring do matter (north is up)', () => {
  const ring = box(outline(world, 'ITA'));
  const t = world.targetFor('ITA');
  const rot = ring.map(([x, y]) => [y, -x]);
  const mirror = ring.map(([x, y]) => [-x, y]);
  assert.ok(judge([rot], t).accuracy < 0.3);
  assert.ok(judge([mirror], t).accuracy < 0.6);
});

test('the same drawing always gets the same score', () => {
  const t = world.targetFor('ESP');
  const strokes = [box(outline(world, 'FRA'))];
  const a = judge(strokes, t);
  const b = judge(structuredClone(strokes), prepareTarget(outline(world, 'ESP')));
  assert.equal(a.iou, b.iou);
  assert.deepEqual(a.fit, b.fit);
});

test('a featureless circle or square earns only 1x', () => {
  const circle = [Array.from({ length: 64 }, (_, i) => [Math.cos((i / 64) * 6.2832) * 100, Math.sin((i / 64) * 6.2832) * 100])];
  const square = [[[0, 0], [100, 0], [100, 100], [0, 100]]];
  for (const [pack, id] of [[world, 'FRA'], [world, 'ESP'], [world, 'DEU'], [us, 'CO'], [us, 'AZ']]) {
    const t = pack.targetFor(id);
    assert.equal(multiplierFor(judge(circle, t).accuracy), 1, `${id} circle`);
    assert.equal(multiplierFor(judge(square, t).accuracy), 1, `${id} square`);
    assert.ok(t.baseline > 0.5, `${id} baseline ${t.baseline}`);
  }
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
test('real player drawings: recognisable shapes beat blobs', () => {
  const human = JSON.parse(readFileSync(new URL('./fixtures/human-drawings.json', import.meta.url), 'utf8'));
  const acc = Object.fromEntries(Object.entries(human).map(([id, d]) => [id, judge([d.drawing], world.targetFor(id)).accuracy]));
  // Spain and Germany were drawn with their real features: clearly above a blob.
  assert.ok(acc.ESP >= 0.5 && multiplierFor(acc.ESP) >= 10, `ESP ${acc.ESP}`);
  assert.ok(acc.DEU >= 0.5 && multiplierFor(acc.DEU) >= 10, `DEU ${acc.DEU}`);
  // France and Kenya were drawn as a rounded square and a blob: blob level, not zero.
  for (const id of ['FRA', 'KEN']) assert.ok(acc[id] > 0.25 && acc[id] < 0.4, `${id} ${acc[id]}`);
  // Only the southern half of Norway was drawn: low.
  assert.ok(acc.NOR < 0.3, `NOR ${acc.NOR}`);
});
