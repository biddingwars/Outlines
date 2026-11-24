// Balance: no blind strategy may beat the bot in more than 60 % of games.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRATEGIES, winRate } from '../tools/sim.js';
import { world, us } from './helpers.js';

for (const [key, strat] of Object.entries(STRATEGIES).filter(([, s]) => s.blind)) {
  test(`blind strategy stays under 60 %: ${key}`, () => {
    for (const pack of [world, us]) {
      const r = winRate(pack, strat, { games: 24, rounds: 5, seed: 7 });
      assert.ok(r.rate <= 0.6, `${pack.id}: ${(r.rate * 100).toFixed(0)} %`);
    }
  });
}

test('a decent player can beat the bot, but not always', () => {
  const r = winRate(world, STRATEGIES.decentPlayer, { games: 80, rounds: 5, seed: 11, difficulty: 'beginner' });
  assert.ok(r.rate > 0.2 && r.rate < 1, `${(r.rate * 100).toFixed(0)} %`);
});

test('with all 196 countries the bot stays a fair match for a realistic player', () => {
  const r = winRate(world, STRATEGIES.realPlayer, { games: 24, rounds: 5, seed: 11, difficulty: 'master' });
  assert.ok(r.rate > 0.2 && r.rate < 0.8, `${(r.rate * 100).toFixed(0)} %`);
});
