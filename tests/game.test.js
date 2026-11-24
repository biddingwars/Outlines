import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, replay, results, activeSeat, activeTurn, revealedClues, normalizeConfig, isPractice, totals, botLine } from '../engine/game.js';
import { outlineToBox } from '../engine/judge.js';
import { createRng } from '../engine/rng.js';
import { world, us, deepFreeze } from './helpers.js';
import { poolFor } from '../engine/pack.js';

const solo = (extra = {}) => ({ seed: 1234, rounds: 5, difficulty: 'standard', seats: [{ kind: 'human', name: 'Leo' }, { kind: 'bot' }], ...extra });
const perfect = (pack, s) => [outlineToBox(pack.byId.get(s.places[s.round]).outline, 600)];

function playRound(pack, s, { guessOn = 0, draw = perfect } = {}) {
  while (s.phase === 'handoff' || s.phase === 'clue') {
    if (s.phase === 'handoff') s = step(pack, s, { type: 'ready' });
    else if (activeTurn(s).clue >= guessOn) s = step(pack, s, { type: 'guess', id: s.places[s.round] });
    else s = step(pack, s, { type: 'clueTimeout' });
  }
  if (s.phase === 'draw') s = step(pack, s, { type: 'submitDrawing', strokes: draw(pack, s) });
  return s;
}

test('config limits', () => {
  assert.throws(() => normalizeConfig(world, { seats: [{ kind: 'human' }] }), /solo/);
  assert.throws(() => normalizeConfig(world, { seats: [{ kind: 'bot' }, { kind: 'bot' }] }), /human/);
  assert.throws(() => normalizeConfig(world, { seats: [{ kind: 'human' }, { kind: 'human' }, { kind: 'bot' }, { kind: 'bot' }, { kind: 'bot' }] }), /at most/);
  const c = normalizeConfig(world, { seats: [{ kind: 'human' }, { kind: 'bot' }], rounds: 99, difficulty: 'beginner', clueSeconds: 1, drawSeconds: 1000 });
  assert.equal(c.rounds, Math.min(world.settings.rounds.max, poolFor(world, 'beginner').length)); // capped
  assert.equal(c.clueSeconds, 5);
  assert.equal(c.drawSeconds, 90);
  assert.equal(normalizeConfig(world, { seats: [{ kind: 'human' }, { kind: 'bot' }], rounds: 1 }).rounds, 5);
  assert.deepEqual(c.seats.map((s) => s.color), ['red', 'black']);
  assert.throws(() => normalizeConfig(world, solo({ practice: { botStyle: 'sneaky' } })));
});

test('a solo game from start to finish', () => {
  let s = createGame(world, solo());
  assert.equal(s.phase, 'clue');
  assert.equal(s.places.length, 5);
  assert.equal(new Set(s.places).size, 5);
  assert.equal(activeSeat(s), 0);
  for (let r = 0; r < 5; r++) {
    s = playRound(world, s, { guessOn: r % 5 });
    assert.equal(s.phase, 'reveal');
    const t = s.turns[r][0];
    assert.equal(t.solvedAt, r % 5);
    assert.equal(t.base, 5 - (r % 5));
    assert.ok(t.accuracy > 0.85);
    assert.ok(t.multiplier >= 85);
    assert.equal(t.score, Math.round(t.base * t.multiplier));
    s = step(world, s, { type: 'continue' });
    assert.equal(s.phase, 'roundEnd');
    s = step(world, s, { type: 'continue' });
  }
  assert.equal(s.phase, 'gameOver');
  const res = results(world, s);
  assert.equal(res.seats.length, 2);
  assert.equal(res.seats[0].total, totals(s)[0]);
  assert.ok(res.best.accuracy > 0.85);
  assert.equal(res.places.length, 5);
  assert.ok(res.winners.length >= 1);
});

test('a wrong guess reveals the next clue and costs a point', () => {
  let s = createGame(world, solo());
  const answer = s.places[0];
  const wrong = world.items.find((i) => i.id !== answer).id;
  s = step(world, s, { type: 'guess', id: wrong });
  assert.equal(activeTurn(s).clue, 1);
  assert.equal(revealedClues(world, s).length, 2);
  s = step(world, s, { type: 'guess', id: answer });
  assert.equal(s.phase, 'draw');
  assert.equal(activeTurn(s).base, 3); // clue 2 = 4 points, minus 1 for the wrong guess
});

test('missing all five clues scores zero but still draws', () => {
  let s = createGame(world, solo());
  for (let k = 0; k < 5; k++) s = step(world, s, { type: 'clueTimeout' });
  assert.equal(s.phase, 'draw');
  s = step(world, s, { type: 'submitDrawing', strokes: perfect(world, s) });
  const t = s.turns[0][0];
  assert.equal(t.base, 0);
  assert.equal(t.score, 0);
  assert.ok(t.accuracy > 0.85);
});

test('typed guesses: any language, unknown text costs nothing, repeats are ignored', () => {
  let s = createGame(world, solo());
  const it = world.byId.get(s.places[0]);
  s = step(world, s, { type: 'guess', text: 'Atlantis' });
  assert.equal(s.notice.type, 'unknownPlace');
  assert.equal(activeTurn(s).clue, 0);
  const wrong = world.items.find((i) => i.id !== it.id);
  s = step(world, s, { type: 'guess', text: wrong.names.fr });
  assert.equal(activeTurn(s).clue, 1);
  s = step(world, s, { type: 'guess', text: wrong.names.de });
  assert.equal(s.notice.type, 'alreadyGuessed');
  assert.equal(activeTurn(s).clue, 1);
  s = step(world, s, { type: 'guess', text: it.names.es });
  assert.equal(s.phase, 'draw');
});

test('illegal actions are rejected without changing the game', () => {
  const s0 = createGame(world, solo());
  const s1 = step(world, s0, { type: 'submitDrawing', strokes: [] });
  assert.equal(s1.notice.type, 'rejected');
  assert.deepEqual({ ...s1, notice: null }, s0);
  assert.equal(step(world, s0, null).notice.type, 'rejected');
  assert.throws(() => results(world, s0), /game over/);
});

test('step never mutates its input', () => {
  let s = deepFreeze(createGame(world, solo()));
  for (const a of [{ type: 'clueTimeout' }, { type: 'guess', text: 'nope' }, { type: 'guess', id: s.places[0] }]) {
    s = deepFreeze(step(world, s, a));
  }
  deepFreeze(step(world, s, { type: 'submitDrawing', strokes: perfect(world, s) }));
});

test('hot-seat: handoffs, rotating order, every human plays every round', () => {
  let s = createGame(us, { seed: 9, rounds: 5, seats: [{ kind: 'human', name: 'A' }, { kind: 'human', name: 'B' }, { kind: 'human', name: 'C' }, { kind: 'bot' }] });
  const firsts = [];
  for (let r = 0; r < 5; r++) {
    firsts.push(s.queue[0]);
    for (let h = 0; h < 3; h++) {
      assert.equal(s.phase, 'handoff');
      assert.deepEqual(revealedClues(us, s), []); // nothing on screen while passing the phone
      s = playRound(us, s, { guessOn: h });
      s = step(us, s, { type: 'continue' });
    }
    assert.equal(s.phase, 'roundEnd');
    assert.ok(s.turns[r].every((t) => t.done));
    s = step(us, s, { type: 'continue' });
  }
  assert.deepEqual(firsts, [0, 1, 2, 0, 1]);
  assert.equal(s.phase, 'gameOver');
});

test('replaying the action log reproduces the game exactly', () => {
  const rng = createRng(99);
  const cfg = solo({ seed: 'replay-me', seats: [{ kind: 'human' }, { kind: 'bot' }, { kind: 'bot' }] });
  let s = createGame(world, cfg);
  while (s.phase !== 'gameOver') {
    if (s.phase === 'clue') {
      const r = rng.next();
      s = step(world, s, r < 0.3 ? { type: 'guess', id: s.places[s.round] } : r < 0.6 ? { type: 'guess', id: rng.pick(world.items).id } : { type: 'clueTimeout' });
    } else if (s.phase === 'draw') {
      s = step(world, s, { type: 'submitDrawing', strokes: [Array.from({ length: 30 }, () => [rng.range(0, 500), rng.range(0, 500)])] });
    } else s = step(world, s, { type: 'continue' });
  }
  const again = replay(world, cfg, s.log);
  assert.deepEqual(again, s);
  assert.deepEqual(results(world, again), results(world, s));
});

test('seeds decide places and bots; different seeds differ', () => {
  const a = createGame(world, solo({ seed: 1 }));
  const b = createGame(world, solo({ seed: 1 }));
  const c = createGame(world, solo({ seed: 2 }));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.places, c.places);
});

test('each bot gets a different hidden temperament', () => {
  for (let seed = 0; seed < 20; seed++) {
    const s = createGame(world, solo({ seed, seats: [{ kind: 'human' }, { kind: 'bot' }, { kind: 'bot' }, { kind: 'bot' }] }));
    assert.equal(new Set(Object.values(s.bots).map((b) => b.temperament)).size, 3);
  }
});

test('bot turns are complete and consistent with their timeline', () => {
  const s = createGame(world, solo({ seats: [{ kind: 'human' }, { kind: 'bot' }, { kind: 'bot' }] }));
  for (const seat of [1, 2]) {
    const t = s.turns[0][seat];
    assert.ok(t.done);
    const guesses = t.bot.timeline.filter((e) => e.type === 'guess');
    assert.deepEqual(guesses.map(({ clue, id, ok }) => ({ clue, id, ok })), t.guesses);
    if (t.solvedAt !== null) assert.equal(t.guesses.at(-1).id, s.places[0]);
    assert.ok(t.rings.length >= 1);
    assert.ok(t.accuracy >= 0 && t.accuracy <= 1);
    assert.ok(botLine(world, s, 0, seat, 0, 'fr').length > 0);
  }
});

test('practice games are flagged', () => {
  assert.equal(isPractice(normalizeConfig(world, solo())), false);
  assert.equal(isPractice(normalizeConfig(world, solo({ practice: { faintOutline: true } }))), true);
  const s = createGame(world, solo({ practice: { botStyle: 'aggressive' }, seats: [{ kind: 'human' }, { kind: 'bot' }, { kind: 'bot' }] }));
  assert.deepEqual(Object.values(s.bots).map((b) => b.temperament), ['aggressive', 'aggressive']);
});

test('ties share a rank and are broken by average accuracy', () => {
  // Two humans who both miss everything and draw nothing: total 0, accuracy 0, and bots that also score 0 are unlikely,
  // so build the tie on the human seats only.
  let s = createGame(world, { seed: 3, rounds: 5, seats: [{ kind: 'human' }, { kind: 'human' }] });
  while (s.phase !== 'gameOver') {
    if (s.phase === 'handoff') s = step(world, s, { type: 'ready' });
    else if (s.phase === 'clue') s = step(world, s, { type: 'clueTimeout' });
    else if (s.phase === 'draw') s = step(world, s, { type: 'submitDrawing', strokes: [] });
    else s = step(world, s, { type: 'continue' });
  }
  const res = results(world, s);
  assert.deepEqual(res.winners, [0, 1]);
  assert.deepEqual(res.ranking.map((r) => r.rank), [1, 1]);
});

test('each round shows one clue per tier, hardest first, drawn afresh each game', () => {
  const seen = new Map();
  for (let seed = 0; seed < 40; seed++) {
    const s = createGame(world, solo({ seed }));
    s.places.forEach((id, r) => {
      const idx = s.clueSets[r];
      assert.deepEqual(idx.map((k) => world.byId.get(id).clues[k].tier), [1, 2, 3, 4, 5]);
      if (!seen.has(id)) seen.set(id, new Set());
      seen.get(id).add(idx.join(','));
    });
  }
  // A place that came up several times was not read with the same five clues every time.
  const repeats = [...seen.values()].filter((v) => v.size > 1);
  assert.ok(repeats.length >= 10, `only ${repeats.length} places varied`);
});

test('a game never shows the same clue sentence twice while a tier has another', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const s = createGame(world, { seats: [{ kind: 'human' }, { kind: 'bot' }], rounds: 30, difficulty: 'master', seed });
    const seen = new Map();
    s.places.forEach((id, r) => {
      const item = world.byId.get(id);
      for (const k of s.clueSets[r]) {
        const text = item.clues[k].text.en;
        if (seen.has(text)) {
          // allowed only when every clue of that tier was already shown
          const tier = item.clues[k].tier;
          const others = item.clues.filter((c) => c.tier === tier && !seen.has(c.text.en));
          assert.equal(others.length, 0, `seed ${seed}: "${text}" repeated in round ${r}`);
        }
      }
      for (const k of s.clueSets[r]) seen.set(item.clues[k].text.en, r);
    });
  }
});

test('places from recent games come last; each game still draws from half the pool at random', () => {
  const pool = poolFor(world, 'standard');
  const recent = pool.slice(0, 40);
  const s = createGame(world, { seats: [{ kind: 'human' }, { kind: 'bot' }], rounds: 10, difficulty: 'standard', seed: 9, recent });
  const held = new Set(recent.slice(-Math.floor(pool.length / 2)));
  assert.ok(s.places.every((id) => !held.has(id)));
  const a = createGame(world, { seats: [{ kind: 'human' }, { kind: 'bot' }], rounds: 10, difficulty: 'standard', seed: 10, recent });
  assert.notDeepEqual(a.places, s.places);
});
