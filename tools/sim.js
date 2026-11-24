// Simulation harness: plays whole games through the real engine with
// scripted human strategies, for balance tuning and the 60 % rule.
//
// A strategy is { name, blind, guess(ctx), draw(ctx) }:
//   guess(ctx) → item id, or null to let the clue time out
//     ctx: { clueIndex, pool, guessed, answerFor?, rng }  (answerFor only for non-blind strategies)
//   draw(ctx) → strokes
//     ctx: { outline?, rng }  (outline only for non-blind strategies)
// Blind strategies never see the answer or the outline.

import { createRng } from '../engine/rng.js';
import { createGame, step, activeTurn, results } from '../engine/game.js';
import { poolFor } from '../engine/pack.js';
import { sketch } from '../engine/bot.js';

const circle = (n = 40) => [Array.from({ length: n }, (_, i) => [500 + 300 * Math.cos((i / n) * 2 * Math.PI), 500 + 300 * Math.sin((i / n) * 2 * Math.PI)])];

export const STRATEGIES = {
  // Blind: no knowledge of the place, ever.
  randomCircle: {
    name: 'guess at random every clue, draw a circle',
    blind: true,
    guess: ({ pool, guessed, rng }) => rng.pick(pool.filter((id) => !guessed.includes(id))) ?? null,
    draw: () => circle(),
  },
  waitSquare: {
    name: 'never guess, draw a square',
    blind: true,
    guess: () => null,
    draw: () => [[[200, 200], [800, 200], [800, 800], [200, 800]]],
  },
  randomScribble: {
    name: 'guess at random, scribble wildly',
    blind: true,
    guess: ({ pool, guessed, rng }) => rng.pick(pool.filter((id) => !guessed.includes(id))) ?? null,
    draw: ({ rng }) => [Array.from({ length: 60 }, () => [rng.range(0, 1000), rng.range(0, 1000)])],
  },
  firstThenBlob: {
    name: 'guess the first place in the list, draw a blob',
    blind: true,
    guess: ({ pool, guessed }) => pool.find((id) => !guessed.includes(id)) ?? null,
    draw: () => [[[300, 200], [700, 180], [820, 500], [650, 820], [300, 780], [180, 480]]],
  },
  // Not blind: references for calibration.
  knowsAllDrawsCircle: {
    name: 'always knows the place on clue 1, draws a circle',
    blind: false,
    guess: ({ answerFor }) => answerFor(),
    draw: () => circle(),
  },
  decentPlayer: {
    name: 'knows the place by clue 3, draws with skill 0.4 (like the play-tester)',
    blind: false,
    guess: ({ clueIndex, answerFor }) => (clueIndex >= 2 ? answerFor() : null),
    draw: ({ outline, rng }) => sketch(outline, 0.4, rng),
  },
  realPlayer: {
    name: 'knows big countries by clue 3, smaller ones by clue 4, the smallest by clue 5; draws with skill 0.4',
    blind: false,
    guess: ({ clueIndex, answerFor, placeTier }) => (clueIndex >= Math.min(4, placeTier + 1) ? answerFor() : null),
    draw: ({ outline, rng }) => sketch(outline, 0.4, rng),
  },
  strongPlayer: {
    name: 'knows the place by clue 2, draws with skill 0.6',
    blind: false,
    guess: ({ clueIndex, answerFor }) => (clueIndex >= 1 ? answerFor() : null),
    draw: ({ outline, rng }) => sketch(outline, 0.6, rng),
  },
};

/**
 * Play one solo game: the strategy in seat 0 against `bots` bots.
 * @returns results(pack, state)
 */
export function playGame(pack, strategy, { seed, bots = 1, rounds = 10, difficulty }) {
  const seats = [{ kind: 'human', name: 'Sim' }, ...Array.from({ length: bots }, () => ({ kind: 'bot' }))];
  let s = createGame(pack, { seed, seats, rounds, difficulty: difficulty ?? Object.keys(pack.difficulties).at(-1) });
  const rng = createRng(seed, 'strategy');
  const pool = poolFor(pack, s.config.difficulty);
  let guard = 0;
  while (s.phase !== 'gameOver') {
    if (++guard > 10000) throw new Error('simulation stuck');
    const turn = activeTurn(s);
    const answer = s.places[s.round];
    switch (s.phase) {
      case 'handoff':
        s = step(pack, s, { type: 'ready' });
        break;
      case 'clue': {
        const ctx = {
          clueIndex: turn.clue,
          pool,
          guessed: turn.guesses.map((g) => g.id),
          rng,
          answerFor: strategy.blind ? undefined : () => answer,
          placeTier: strategy.blind ? undefined : pack.byId.get(answer).tier,
        };
        const id = strategy.guess(ctx);
        s = id ? step(pack, s, { type: 'guess', id }) : step(pack, s, { type: 'clueTimeout' });
        break;
      }
      case 'draw': {
        const strokes = strategy.draw({ rng, outline: strategy.blind ? undefined : pack.byId.get(answer).outline });
        s = step(pack, s, { type: 'submitDrawing', strokes });
        break;
      }
      default:
        s = step(pack, s, { type: 'continue' });
    }
  }
  return results(pack, s);
}

/** Win rate of a strategy over many seeded games. A shared first place counts as half a win. */
export function winRate(pack, strategy, { games = 200, seed = 1, bots = 1, rounds = 10, difficulty } = {}) {
  let wins = 0;
  let totalMine = 0;
  let totalBot = 0;
  for (let g = 0; g < games; g++) {
    const res = playGame(pack, strategy, { seed: seed * 100003 + g, bots, rounds, difficulty });
    const w = res.winners;
    if (w.includes(0)) wins += 1 / w.length;
    totalMine += res.seats[0].total;
    totalBot += res.seats.slice(1).reduce((a, x) => a + x.total, 0) / bots;
  }
  return { rate: wins / games, avgScore: totalMine / games, avgBotScore: totalBot / games };
}
