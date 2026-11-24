import { test } from 'node:test';
import { world } from './helpers.js';
import assert from 'node:assert/strict';
import { validatePack, preparePack, poolFor, expandPack } from '../engine/pack.js';
import { evalTest } from '../engine/clues.js';
import worldPack from '../packs/world/pack.js';
import worldOutlines from '../packs/world/outlines.js';
import usPack from '../packs/us-states/pack.js';
import usOutlines from '../packs/us-states/outlines.js';
import { loadPack, PACKS } from '../packs/registry.js';
import { LANGS, resolve, suggest } from '../engine/names.js';

const clone = (p) => structuredClone(p);

test('shipped packs are valid', () => {
  for (const [p, o] of [[worldPack, worldOutlines], [usPack, usOutlines]]) {
    const v = validatePack(p, o);
    assert.deepEqual(v.errors, [], p.id);
  }
});

test('every registered pack loads', async () => {
  for (const { id } of PACKS) {
    const p = await loadPack(id);
    assert.equal(p.id, id);
    for (const it of p.items) for (const l of LANGS) assert.ok(it.names[l] && it.fact[l] && it.clues.every((c) => c.text[l]));
  }
  await assert.rejects(loadPack('nope'));
});

test('a clue that is false for its own place is refused', () => {
  // The brief's own example: "Its flag has no red" … "Its capital is Lisbon".
  const p = clone(worldPack);
  const prt = p.items.find((i) => i.id === 'PRT');
  prt.clues[0] = { text: prt.clues[0].text, test: { f: 'flag', lacks: 'red' } };
  const v = validatePack(p, worldOutlines);
  assert.ok(v.errors.some((e) => e.includes('PRT') && e.includes('false')), v.errors.join('\n'));
  assert.throws(() => preparePack(p, worldOutlines), /invalid/);
});

test('a final-tier clue that fits another place is refused', () => {
  const p = clone(worldPack);
  const esp = p.items.find((i) => i.id === 'ESP');
  // "Most people speak Spanish" fits Mexico, Argentina and Chile too: not a giveaway.
  esp.clues = esp.clues.map((c) => (Array.isArray(c) && c[0] === 5 && c[1] === 'capital' ? [5, 'lang', 'spanish'] : c));
  const v = validatePack(p, worldOutlines);
  assert.ok(v.errors.some((e) => e.startsWith('item ESP: final-tier clue') && e.includes('also fits')), v.errors.join('\n'));
});

test('every country has a pool of 20 clues, 4 at each tier', () => {
  for (const it of expandPack(worldPack).items) {
    assert.equal(it.clues.length, 20, it.id);
    for (let tier = 1; tier <= 5; tier++) assert.equal(it.clues.filter((c) => c.tier === tier).length, 4, `${it.id} tier ${tier}`);
  }
});

test('missing translations, outlines, duplicates and taunts are reported', () => {
  const p = clone(worldPack);
  delete p.items[0].names.fr;
  p.items[1].geo = '999999';
  p.items[2].id = p.items[3].id;
  p.items[4].clues = p.items[4].clues.filter((c) => c[0] !== 3);
  p.taunts.miss = [];
  const v = validatePack(p, worldOutlines);
  const all = v.errors.join('\n');
  assert.match(all, /names: missing fr/);
  assert.match(all, /no outline/);
  assert.match(all, /duplicate id/);
  assert.match(all, /no clue at tier 3/);
  assert.match(all, /taunts.miss/);
});

test('name collisions across items are refused', () => {
  const p = clone(worldPack);
  p.items[0].names.it = p.items[1].names.en;
  assert.ok(validatePack(p, worldOutlines).errors.some((e) => e.includes('collides')));
});

test('difficulty pools', async () => {
  const w = await loadPack('world');
  const beginner = poolFor(w, 'beginner');
  const standard = poolFor(w, 'standard');
  assert.ok(beginner.length >= 5);
  assert.ok(standard.length > beginner.length);
  assert.ok(beginner.every((id) => standard.includes(id)));
  assert.ok(!beginner.includes('KEN'));
  assert.throws(() => poolFor(w, 'impossible'));
});

test('archipelago items are flagged mainland-only', async () => {
  const w = await loadPack('world');
  for (const it of w.items) if (it.mainShare < 0.8) assert.ok(it.mainlandOnly, it.id);
});

test('every country has a real fun fact in every language', async () => {
  const { funFacts } = await import('../packs/world/pack.js');
  const base = (await import('../packs/world/base.js')).default;
  const crafted = new Set(base.items.map((it) => it.id));
  const ids = new Set(worldPack.items.map((it) => it.id));
  for (const id of Object.keys(funFacts)) {
    assert.ok(ids.has(id), `fun fact for unknown country ${id}`);
    assert.ok(!crafted.has(id), `${id} already has a fact in base.js`);
  }
  for (const it of worldPack.items) {
    const f = crafted.has(it.id) ? it.fact : funFacts[it.id];
    assert.ok(f, `${it.id} has no fun fact`);
    for (const l of LANGS) assert.ok(typeof it.fact[l] === 'string' && it.fact[l].length > 8, `${it.id} fact ${l}`);
    assert.equal(it.fact.en, f.en);
  }
  const en = Object.values(funFacts).map((f) => f.en);
  assert.equal(new Set(en).size, en.length, 'two countries share a fun fact');
});

test('every pack text has a translation in every added language', async () => {
  const { missing: world } = await import('../packs/world/pack.js');
  const { missing: states } = await import('../packs/us-states/pack.js');
  const gaps = [...world, ...states];
  assert.deepEqual(gaps.slice(0, 10), [], `${gaps.length} gaps; run node tools/i18n.mjs`);
});

test('country names resolve in every language and script', () => {
  const cases = { pt: 'Alemanha', id: 'Jerman', zh: '德国', hi: 'जर्मनी', ja: 'ドイツ', ko: '독일', ar: 'ألمانيا', th: 'เยอรมนี' };
  for (const [l, name] of Object.entries(cases)) {
    assert.equal(resolve(world.index, name), 'DEU', `${l}: ${name}`);
    assert.equal(suggest(world.index, name.slice(0, 2), l).some((s) => s.id === 'DEU'), true, `${l} autocomplete`);
  }
});

test('every clue is specific enough for its tier, and nothing gives a place away early', () => {
  // Most countries a clue may fit (out of 196), per tier. Tier 1 may use a broad
  // fact only when a country has nothing narrower (the United States).
  const LIMIT = { 2: 50, 3: 40, 4: 10, 5: 1 };
  const bad = [];
  // Only facts known for every country can be counted (language, coast, flag and
  // climate facts exist for the 20 hand-written countries only).
  const known = (f) => world.items.every((o) => o.facts[f] !== undefined);
  for (const it of world.items) {
    for (const c of it.clues) {
      if (!known(c.test.f)) continue;
      const fits = world.items.filter((o) => evalTest(c.test, o.facts) === true).length;
      if (LIMIT[c.tier] && fits > LIMIT[c.tier]) bad.push(`${it.id} tier ${c.tier}: ${fits} – ${c.text.en}`);
      if (c.tier <= 3 && fits === 1 && c.test.f !== 'tags') bad.push(`${it.id} tier ${c.tier} gives it away: ${c.text.en}`);
    }
  }
  assert.deepEqual(bad, []);
});
