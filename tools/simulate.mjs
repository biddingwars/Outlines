#!/usr/bin/env node
// Plays scripted strategies against the bot and reports win rates.
//   node tools/simulate.mjs [--games 200] [--bots 1] [--pack world]
// Rule: no blind strategy may win more than 60 % of games.

import { loadPack } from '../packs/registry.js';
import { STRATEGIES, winRate } from './sim.js';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const games = +arg('games', 200);
const bots = +arg('bots', 1);
const pack = await loadPack(arg('pack', 'world'));

console.log(`${pack.id}: ${games} games of ${Math.min(10, pack.items.length)} rounds vs ${bots} bot(s)\n`);
let failed = false;
for (const [key, strat] of Object.entries(STRATEGIES)) {
  const r = winRate(pack, strat, { games, bots });
  const flag = strat.blind && r.rate > 0.6 ? '  ✗ over 60 %' : '';
  if (flag) failed = true;
  console.log(`${(r.rate * 100).toFixed(1).padStart(5)} %  ${strat.blind ? 'blind' : 'ref  '}  avg ${r.avgScore.toFixed(0).padStart(6)} vs bot ${r.avgBotScore.toFixed(0).padStart(6)}  ${key}: ${strat.name}${flag}`);
}
process.exit(failed ? 1 : 0);
