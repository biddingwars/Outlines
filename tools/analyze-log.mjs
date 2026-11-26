#!/usr/bin/env node
// Reads a game log exported from the app (Settings → Game log → Export) and
// prints what it shows: results, how early places are solved, drawing
// accuracy per place, wrong and unrecognised guesses, timing and app errors.
//
//   node tools/analyze-log.mjs <log.json> [--svg <dir>]
//
// --svg writes every drawing over the real outline (as the judge placed it),
// one file per drawing, worst first, to look at by eye.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadPack } from '../packs/registry.js';
import { parseLog, outlineToCanvas } from '../engine/index.js';

const file = process.argv[2];
if (!file) {
  console.error('usage: node tools/analyze-log.mjs <log.json> [--svg <dir>]');
  process.exit(1);
}
const svgDir = process.argv.includes('--svg') ? process.argv[process.argv.indexOf('--svg') + 1] : null;
const raw = readFileSync(file, 'utf8').trim();
const log = parseLog(raw);
const packs = { countries: await loadPack('world'), states: await loadPack('us-states') };
const nameOf = (packId, id) => packs[packId]?.byId.get(id)?.names.en ?? id;

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');
const median = (a) => {
  const s = a.slice().sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
const count = (arr) => arr.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map());
const top = (m, n = 10) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
const out = [];
const say = (s = '') => out.push(s);

const games = log.games;
say(`# Outlines game log: ${games.length} games, ${log.errors.length} distinct errors`);
if (games.length) {
  say(`From ${games[0].t ?? '?'} to ${games[games.length - 1].t ?? '?'} · app versions ${[...new Set(games.map((g) => g.app))].join(', ')} · languages ${[...new Set(games.map((g) => g.lang))].join(', ')}`);
  say(`Packs ${top(count(games.map((g) => `${g.pack}/${g.level}`))).map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  say(`Finished ${games.filter((g) => g.end === 'done').length}, left early ${games.filter((g) => g.end === 'quit').length}, practice ${games.filter((g) => g.practice).length}`);
}

// --- results against the bot (finished solo games)
const solo = games.filter((g) => g.end === 'done' && g.seats.filter((s) => s === 'human').length === 1 && !g.practice);
if (solo.length) {
  let won = 0;
  let mine = 0;
  let bots = 0;
  for (const g of solo) {
    const totals = g.seats.map((_, i) => g.r.reduce((a, r) => a + (r.turns.find((t) => t.seat === i)?.score ?? 0), 0));
    const you = totals[g.seats.indexOf('human')];
    const best = Math.max(...totals.filter((_, i) => g.seats[i] === 'bot'));
    if (you > best) won++;
    mine += you;
    bots += best;
  }
  say();
  say(`## Against the bot: won ${won}/${solo.length} (${pct(won, solo.length)}) · average ${Math.round(mine / solo.length)} vs ${Math.round(bots / solo.length)}`);
}

// --- every human and bot turn
const human = [];
const bot = [];
for (const g of games) {
  for (const r of g.r) {
    for (const t of r.turns) {
      if (t.done === false) continue; // a turn the player never finished (the game was left): not a miss
      const row = { g, r, t, pack: g.pack };
      (g.seats[t.seat] === 'human' ? human : bot).push(row);
    }
  }
}
const solvedDist = (rows) => [0, 1, 2, 3, 4].map((c) => rows.filter((x) => x.t.solvedAt === c).length);
if (human.length) {
  say();
  say(`## You (${human.length} turns)`);
  say(`Solved on clue 1–5: ${solvedDist(human).join(' / ')} · missed ${human.filter((x) => x.t.solvedAt == null).length}`);
  say(`Wrong guesses per turn: ${(human.reduce((a, x) => a + x.t.guesses.filter((q) => !q[2]).length, 0) / human.length).toFixed(2)}`);
  const acc = human.filter((x) => x.t.accuracy != null).map((x) => x.t.accuracy);
  say(`Drawing accuracy: median ${Math.round(median(acc) * 100)}% · under 30%: ${acc.filter((a) => a < 0.3).length} · over 80%: ${acc.filter((a) => a > 0.8).length}`);
}
if (bot.length) {
  say(`Bot: solved on clue 1–5: ${solvedDist(bot).join(' / ')} · missed ${bot.filter((x) => x.t.solvedAt == null).length} · median accuracy ${Math.round(median(bot.map((x) => x.t.accuracy ?? 0)) * 100)}%`);
}

// --- per place
const byPlace = new Map();
for (const x of human) {
  const k = `${x.pack}:${x.r.id}`;
  if (!byPlace.has(k)) byPlace.set(k, []);
  byPlace.get(k).push(x);
}
if (byPlace.size) {
  say();
  say('## Hardest places to draw (your accuracy)');
  const rows = [...byPlace.entries()].map(([k, xs]) => [k, xs.reduce((a, x) => a + (x.t.accuracy ?? 0), 0) / xs.length, xs.length]).sort((a, b) => a[1] - b[1]);
  for (const [k, a, n] of rows.slice(0, 12)) say(`- ${nameOf(k.split(':')[0], k.split(':')[1])}: ${Math.round(a * 100)}% (${n}×)`);
  say();
  say('## Places you missed or solved late (clue 5)');
  const late = human.filter((x) => x.t.solvedAt == null || x.t.solvedAt === 4);
  for (const x of late.slice(-15)) say(`- ${nameOf(x.pack, x.r.id)}: ${x.t.solvedAt == null ? 'missed' : 'clue 5'} · clues: ${x.r.clues.map((c) => c[1]).join(' | ')}`);
}

// --- guesses
const wrong = [];
for (const x of human) for (const q of x.t.guesses) if (!q[2]) wrong.push(`${nameOf(x.pack, x.r.id)} → guessed ${nameOf(x.pack, q[1])} (clue ${q[0] + 1})`);
if (wrong.length) {
  say();
  say('## Wrong guesses (latest)');
  for (const w of wrong.slice(-15)) say(`- ${w}`);
}
const unknown = games.flatMap((g) => g.events.filter((e) => e[3] === 'notice' && String(e[4]).startsWith('unknown:')).map((e) => String(e[4]).slice(8)));
if (unknown.length) {
  say();
  say('## Typed names the game did not recognise (missing aliases?)');
  for (const [k, n] of top(count(unknown), 25)) say(`- “${k}” ×${n}`);
}

// --- timing (from the action events: [ms, round, seat, type, detail])
const guessTimes = [];
let timeouts = 0;
const drawTimes = [];
for (const g of games) {
  let last = 0;
  for (const e of g.events) {
    const [ms, , seat, type] = e;
    if (g.seats[seat] === 'human') {
      if (type === 'guess') guessTimes.push((ms - last) / 1000);
      if (type === 'clueTimeout') timeouts++;
      if (type === 'submitDrawing') drawTimes.push((ms - last) / 1000);
    }
    last = ms;
  }
}
if (guessTimes.length || drawTimes.length) {
  say();
  say(`## Timing: median ${median(guessTimes)?.toFixed(1) ?? '–'} s per guess · ${timeouts} clue timeouts or skips · median ${median(drawTimes)?.toFixed(1) ?? '–'} s per drawing`);
}

// --- errors
if (log.errors.length) {
  say();
  say('## App errors');
  for (const e of log.errors) say(`- ×${e.n} ${e.msg} @ ${e.where ?? '?'} (screen ${e.screen ?? '?'}, app v${e.app ?? '?'}, ${e.t ?? '?'})${e.stack ? `\n  ${e.stack.split('\n').slice(0, 3).join('\n  ')}` : ''}`);
}
console.log(out.join('\n'));

// --- drawings as SVG, worst first
if (svgDir) {
  mkdirSync(svgDir, { recursive: true });
  const drawn = human.filter((x) => x.t.rings?.length && x.t.fit).sort((a, b) => (a.t.accuracy ?? 0) - (b.t.accuracy ?? 0));
  drawn.forEach((x, k) => {
    const item = packs[x.pack]?.byId.get(x.r.id);
    if (!item) return;
    const shape = outlineToCanvas(item.outline, x.t.fit);
    const all = [...shape, ...x.t.rings.flat()];
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const [x0, y0] = [Math.min(...xs) - 20, Math.min(...ys) - 20];
    const [w, h] = [Math.max(...xs) - x0 + 20, Math.max(...ys) - y0 + 50];
    const path = (pts, close) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}${close ? 'Z' : ''}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="480"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#111"/><path d="${path(shape, true)}" fill="rgba(212,175,55,.25)" stroke="#d4af37" stroke-width="3"/>${x.t.rings.map((r) => `<path d="${path(r, true)}" fill="none" stroke="#fff" stroke-width="3"/>`).join('')}<text x="${x0 + 10}" y="${y0 + h - 15}" fill="#fff" font-size="22" font-family="sans-serif">${nameOf(x.pack, x.r.id)} · ${Math.round((x.t.accuracy ?? 0) * 100)}%</text></svg>`;
    writeFileSync(join(svgDir, `${String(k + 1).padStart(3, '0')}-${x.r.id}.svg`), svg);
  });
  console.log(`\nwrote ${drawn.length} drawings to ${svgDir}`);
}
