import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, deriveSeed } from '../engine/rng.js';
import { decide, moodFor, thresholdFor, sketch, line, TEMPERAMENTS } from '../engine/bot.js';
import { judge } from '../engine/judge.js';
import { createGame, botView } from '../engine/game.js';
import { world } from './helpers.js';

function viewFor(itemId, clueIndex, wrong = []) {
  const it = world.byId.get(itemId);
  return {
    clueIndex,
    lastClue: clueIndex === 4,
    tests: it.clues.slice(0, clueIndex + 1).map((c) => c.test),
    wrong,
    candidates: world.items.map((i) => ({ id: i.id, facts: i.facts })),
  };
}

test('the bot view never carries the answer', () => {
  const g = createGame(world, { seed: 5, seats: [{ kind: 'human' }, { kind: 'bot' }] });
  const v = botView(world, g, 2, []);
  const keys = JSON.stringify(Object.keys(v));
  assert.equal(keys, JSON.stringify(['clueIndex', 'lastClue', 'tests', 'wrong', 'candidates']));
  // Candidates are in pack order, not answer-first, and include several places.
  assert.ok(v.candidates.length >= 5);
  const ids = v.candidates.map((c) => c.id);
  assert.deepEqual(ids, world.items.map((i) => i.id).filter((id) => ids.includes(id)));
  // No text: the bot reasons only over clue tests.
  assert.ok(!JSON.stringify(v.tests).includes('"text"'));
});

test('decisions depend only on what is revealed', () => {
  // Two places whose first clue is the same test ("drive on the left")
  const a = viewFor('GBR', 0);
  const b = viewFor('JPN', 0);
  assert.deepEqual(a.tests, b.tests);
  for (let s = 0; s < 50; s++) {
    const mind = { temperament: 'aggressive', mood: 'calm', knowledge: 0.9, seed: deriveSeed(s, 'x') };
    assert.deepEqual(decide(a, mind), decide(b, mind));
  }
});

test('the bot rarely knows the answer on clue 1, and always guesses on clue 5', () => {
  let right = 0;
  let guessed = 0;
  let n = 0;
  for (const it of world.items) {
    for (let s = 0; s < 20; s++) {
      const mind = { temperament: 'aggressive', mood: 'calm', knowledge: 1, seed: deriveSeed(s, it.id) };
      const d = decide(viewFor(it.id, 0), mind);
      n++;
      if (d.type === 'guess') {
        guessed++;
        if (d.id === it.id) right++;
      }
      const last = decide(viewFor(it.id, 4), { ...mind, temperament: 'conservative' });
      assert.equal(last.type, 'guess');
    }
  }
  assert.ok(right / n < 0.35, `clue-1 hit rate ${right / n}`);
});

test('wrong guesses are excluded next time', () => {
  const mind = { temperament: 'aggressive', mood: 'calm', knowledge: 1, seed: 7 };
  const d1 = decide(viewFor('CHN', 4), mind);
  assert.equal(d1.id, 'CHN');
  const d2 = decide(viewFor('CHN', 4, ['CHN']), mind);
  assert.notEqual(d2.id, 'CHN');
});

test('temperament: aggressive bots guess earlier than conservative ones', () => {
  const firstGuess = (temperament) => {
    let sum = 0;
    let n = 0;
    for (const it of world.items) {
      for (let s = 0; s < 10; s++) {
        const mind = { temperament, mood: 'calm', knowledge: 0.9, seed: deriveSeed(s, it.id, 't') };
        for (let k = 0; k < 5; k++) {
          if (decide(viewFor(it.id, k), mind).type === 'guess') {
            sum += k;
            n++;
            break;
          }
        }
      }
    }
    return sum / n;
  };
  const agg = firstGuess('aggressive');
  const bal = firstGuess('balanced');
  const con = firstGuess('conservative');
  assert.ok(agg < bal && bal < con, `${agg} ${bal} ${con}`);
});

test('mood: bold when behind late, cautious when far ahead', () => {
  assert.equal(moodFor({ round: 2, rounds: 10, mine: 0, others: [500] }), 'calm');
  assert.equal(moodFor({ round: 7, rounds: 10, mine: 10, others: [500] }), 'bold');
  assert.equal(moodFor({ round: 7, rounds: 10, mine: 900, others: [500] }), 'cautious');
  assert.equal(moodFor({ round: 7, rounds: 10, mine: 600, others: [500] }), 'calm');
  for (const t of Object.keys(TEMPERAMENTS)) {
    assert.ok(thresholdFor(t, 'bold') < thresholdFor(t, 'calm'));
    assert.ok(thresholdFor(t, 'cautious') > thresholdFor(t, 'calm'));
  }
});

test('sketches are deterministic and better with skill', () => {
  const it = world.byId.get('ITA');
  const a = sketch(it.outline, 0.5, createRng(1));
  const b = sketch(it.outline, 0.5, createRng(1));
  assert.deepEqual(a, b);
  const mean = (skill) => {
    let s = 0;
    const ids = ['ITA', 'FRA', 'MEX', 'IND', 'NOR', 'AUS'];
    for (const id of ids) for (let k = 0; k < 4; k++) s += judge(sketch(world.byId.get(id).outline, skill, createRng(k, id)), world.targetFor(id)).accuracy;
    return s / (ids.length * 4);
  };
  const lo = mean(0.2);
  const mid = mean(0.6);
  const hi = mean(0.95);
  assert.ok(lo < mid && mid < hi, `${lo} ${mid} ${hi}`);
  assert.ok(hi > 0.8);
});

test('one-liners name the place in the player’s language', () => {
  const s = line(world, 'early', { itemId: 'DEU', lang: 'it', rng: createRng(1) });
  assert.ok(s.includes('Germania') || !s.includes('{place}'), s);
  assert.ok(!s.includes('{place}'));
  for (const kind of ['early', 'late', 'miss', 'drawGood', 'drawBad']) {
    for (const lang of ['en', 'de', 'it', 'es', 'fr']) assert.ok(line(world, kind, { itemId: 'ESP', lang, rng: createRng(2) }).length > 3);
  }
});

test('bots think about every place, not just the difficulty pool, and do not cross off places played', async () => {
  const { world } = await import('./helpers.js');
  const { createGame, botView } = await import('../engine/game.js');
  const s = createGame(world, { seed: 7, rounds: 30, difficulty: 'beginner', seats: [{ kind: 'human', name: 'H' }, { kind: 'bot' }] });
  // beta log 4: on Beginner (32 places) the bots knew the 32 and crossed off the ones played
  const late = { ...s, round: 29 };
  const v = botView(world, late, 0, []);
  assert.equal(v.candidates.length, world.items.length);
  assert.ok(v.candidates.some((c) => c.id === late.places[0]));
});
