#!/usr/bin/env node
// Measures how drawing skill turns into shape accuracy and multipliers, so the
// multiplier curve and the bot's skill roll are tuned by simulation.
//
//   node tools/tune-curve.mjs [--pack world|us-states] [--samples 6]
//
// Prints: accuracy by skill level, blind-shape results (circle, square,
// nothing), and the multiplier distribution for the bot's per-round skill roll.

import { createRng } from '../engine/rng.js';
import { judge, prepareTarget, unflatten } from '../engine/judge.js';
import { sketch, rollSkill } from '../engine/bot.js';
import { DEFAULT_CURVE, multiplierFor } from '../engine/scoring.js';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const packId = arg('pack', 'world');
const samples = +arg('samples', 4);
const { default: outlines } = await import(`../packs/${packId}/outlines.js`);

// Countries big enough to be playable (skip specks).
const ids = Object.keys(outlines.items).filter((k) => outlines.items[k].area > 15000 || packId !== 'world');
const targets = ids.map((id) => prepareTarget(unflatten(outlines.items[id].pts)));
const pct = (arr, q) => {
  const s = arr.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
const fmt = (x) => (x * 100).toFixed(1).padStart(5);

console.log(`pack ${packId}: ${targets.length} outlines, ${samples} sketches each per skill level\n`);
console.log('skill  acc p10  p50  p90   overlap p50   mult p50');
for (const skill of [0.1, 0.25, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97]) {
  const acc = [];
  const ov = [];
  targets.forEach((t, i) => {
    for (let s = 0; s < samples; s++) {
      const rng = createRng(7, 'tune', skill, i, s);
      const r = judge(sketch(t.outline, skill, rng), t);
      acc.push(r.accuracy);
      ov.push(r.overlap);
    }
  });
  console.log(
    `${skill.toFixed(2)}  ${fmt(pct(acc, 0.1))} ${fmt(pct(acc, 0.5))} ${fmt(pct(acc, 0.9))}     ${fmt(pct(ov, 0.5))}       ${multiplierFor(pct(acc, 0.5))}x`,
  );
}

const circle = [Array.from({ length: 48 }, (_, i) => [500 + 300 * Math.cos((i / 48) * 2 * Math.PI), 500 + 300 * Math.sin((i / 48) * 2 * Math.PI)])];
const square = [[[200, 200], [800, 200], [800, 800], [200, 800]]];
const triangle = [[[500, 150], [850, 800], [150, 800]]];
for (const [name, shape] of [['circle', circle], ['square', square], ['triangle', triangle]]) {
  const acc = targets.map((t) => judge(shape, t).accuracy);
  const m = acc.map((a) => multiplierFor(a));
  console.log(`\nblind ${name}: accuracy p50 ${fmt(pct(acc, 0.5))}, p90 ${fmt(pct(acc, 0.9))}, max ${fmt(Math.max(...acc))}; mean multiplier ${(m.reduce((s, x) => s + x, 0) / m.length).toFixed(2)}x`);
}

// The bot's real per-round distribution.
const rolled = [];
targets.forEach((t, i) => {
  for (let s = 0; s < samples; s++) {
    const rng = createRng(11, 'roll', i, s);
    const skill = rollSkill(rng);
    rolled.push(judge(sketch(t.outline, skill, rng), t).accuracy);
  }
});
const buckets = new Map();
for (const a of rolled) {
  const m = multiplierFor(a, DEFAULT_CURVE);
  const k = m >= 1000 ? '1000x' : m >= 100 ? '100x+' : m >= 10 ? '10x+' : m > 1 ? '1-10x' : '1x';
  buckets.set(k, (buckets.get(k) ?? 0) + 1);
}
console.log(`\nbot skill roll → accuracy p10 ${fmt(pct(rolled, 0.1))} p50 ${fmt(pct(rolled, 0.5))} p90 ${fmt(pct(rolled, 0.9))}`);
for (const k of ['1x', '1-10x', '10x+', '100x+', '1000x']) {
  console.log(`  ${k.padEnd(6)} ${(((buckets.get(k) ?? 0) / rolled.length) * 100).toFixed(1)} %`);
}
