// The US States pack: all 50 states, their facts and their clue pools.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { us } from './helpers.js';
import { poolFor } from '../engine/pack.js';
import { evalTest } from '../engine/clues.js';
import { LANGS, suggest } from '../engine/names.js';
import { createGame } from '../engine/game.js';
import { STATES, MORE } from '../packs/us-states/data.js';

const clueList = (it) => it.clues.map((c) => ({ tier: c.tier, test: c.test, text: c.text }));
const fits = (test) => us.items.filter((it) => evalTest(test, it.facts) === true).length;

test('all 50 states are in the pack, each with its outline', () => {
  assert.equal(us.items.length, 50);
  assert.equal(Object.keys(STATES).length, 50);
  for (const it of us.items) assert.ok(it.outline && it.outline.length >= 4, it.id); // Colorado and Wyoming are nearly rectangles
  assert.equal(Object.keys(MORE).length, 40); // the 10 of the starter set keep their own texts
});

test('the state facts agree with each other', () => {
  for (const [code, s] of Object.entries(STATES)) {
    for (const n of s.nb) assert.ok(STATES[n]?.nb.includes(code), `${code} borders ${n} but not back`);
    assert.ok(['west', 'south', 'midwest', 'northeast'].includes(s.region), code);
  }
  for (const k of ['popRank', 'areaRank']) {
    const ranks = Object.values(STATES).map((s) => s[k]).sort((a, b) => a - b);
    assert.deepEqual(ranks, Array.from({ length: 50 }, (_, i) => i + 1), `${k} is 1…50 once each`);
  }
  // a few facts everyone knows
  assert.equal(STATES.RI.areaRank, 50);
  assert.equal(STATES.AK.areaRank, 1);
  assert.equal(STATES.CA.popRank, 1);
  assert.deepEqual(STATES.ME.nb, ['NH']);
  assert.equal(Object.values(STATES).filter((s) => s.year <= 1790).length, 13);
});

test('every state has 15 clues, 3 per tier, specific enough for their tier', () => {
  const MAX = { 1: 30, 2: 15, 3: 6, 4: 2, 5: 1 };
  for (const it of us.items) {
    const cs = clueList(it);
    assert.equal(cs.length, 15, it.id);
    for (const t of [1, 2, 3, 4, 5]) assert.equal(cs.filter((c) => c.tier === t).length, 3, `${it.id} tier ${t}`);
    for (const c of cs) {
      assert.equal(evalTest(c.test, it.facts), true, `${it.id}: "${c.text.en}" is false for its own state`);
      const n = fits(c.test);
      if (c.tier < 4) assert.ok(n >= 2, `${it.id}: "${c.text.en}" gives it away at tier ${c.tier}`);
      assert.ok(n <= MAX[c.tier] || c.tier === 1, `${it.id}: "${c.text.en}" fits ${n} states at tier ${c.tier}`);
    }
  }
});

test('every clue, name and fun fact is in all thirteen languages', () => {
  for (const it of us.items) {
    for (const l of LANGS) {
      assert.ok(it.names[l]?.trim(), `${it.id} name ${l}`);
      assert.ok(it.fact[l]?.trim(), `${it.id} fact ${l}`);
      for (const c of clueList(it)) {
        assert.ok(c.text[l]?.trim(), `${it.id} "${c.text.en}" in ${l}`);
        assert.ok(!c.text[l].includes('{x}') && !c.text[l].includes('{y}') && !c.text[l].includes('undefined'), `${it.id} ${l}: ${c.text[l]}`);
      }
    }
  }
});

test('difficulties grow to all 50 states', () => {
  const sizes = ['beginner', 'standard', 'expert', 'master'].map((d) => poolFor(us, d).length);
  assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
  assert.ok(sizes[0] >= 10);
  assert.equal(sizes[3], 50);
});

test('names, translations and postal codes are understood', () => {
  const top = (q) => suggest(us.index, q, 'en', 3).map((s) => s.id);
  assert.equal(top('new')[0], 'NY'); // the better-known place first
  assert.equal(top('TX')[0], 'TX');
  assert.equal(top('Nueva York')[0], 'NY');
  assert.equal(top('カリフォルニア')[0], 'CA');
});

test('bots do not name a state on the first clue as a rule', () => {
  let turns = 0;
  let first = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const s = createGame(us, { seed, rounds: 5, difficulty: 'standard', seats: [{ kind: 'human', name: 'H' }, { kind: 'bot' }, { kind: 'bot' }] });
    for (const round of s.turns) for (const tr of round) if (tr.bot) {
      turns++;
      const ok = tr.bot.timeline.find((e) => e.type === 'guess' && e.ok);
      if (ok && ok.clue === 0) first++;
    }
  }
  // beta log 2: with only 10 states the bots often guessed right at clue 1
  assert.ok(first / turns < 0.1, `${first}/${turns} solved on clue 1`);
});
