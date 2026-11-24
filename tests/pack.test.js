import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePack, preparePack, poolFor, expandPack } from '../engine/pack.js';
import worldPack from '../packs/world/pack.js';
import worldOutlines from '../packs/world/outlines.js';
import usPack from '../packs/us-states/pack.js';
import usOutlines from '../packs/us-states/outlines.js';
import { loadPack, PACKS } from '../packs/registry.js';
import { LANGS } from '../engine/names.js';

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
