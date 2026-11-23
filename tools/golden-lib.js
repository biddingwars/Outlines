// Reference drawings used by the golden tests.
import { createRng } from '../engine/rng.js';
import { judge, prepareTarget, unflatten, outlineToBox } from '../engine/judge.js';
import { sketch } from '../engine/bot.js';

const CIRCLE = [Array.from({ length: 48 }, (_, i) => [500 + 300 * Math.cos((i / 48) * 2 * Math.PI), 500 + 300 * Math.sin((i / 48) * 2 * Math.PI)].map((v) => Math.round(v * 10) / 10))];

/** Pinned results for one outline: baseline, perfect copy, circle, two seeded sketches. */
export function goldenEntry(flat) {
  const ring = unflatten(flat);
  const t = prepareTarget(ring);
  const perfect = [outlineToBox(ring, 1000).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])];
  const r = (strokes) => {
    const j = judge(strokes, t);
    return [j.overlap, j.accuracy];
  };
  return {
    grid: t.grid,
    baseline: t.baseline,
    perfect: r(perfect),
    circle: r(CIRCLE),
    skill50: r(sketch(ring, 0.5, createRng(42, 'golden', 0.5))),
    skill80: r(sketch(ring, 0.8, createRng(42, 'golden', 0.8))),
  };
}

export function goldenFor(outlines) {
  const out = {};
  for (const k of Object.keys(outlines.items).sort()) out[k] = goldenEntry(outlines.items[k].pts);
  return out;
}
