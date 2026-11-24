// World Countries pack. Base data (names, geography, fun facts, taunts) is in
// base.js; each country's 20-clue pool is in clues-*.js; templates.js holds the
// clue templates and their words in five languages. This file merges them.
import base from './base.js';
import { templates, vocab } from './templates.js';
import c1 from './clues-1.js';
import c2 from './clues-2.js';
import c3 from './clues-3.js';
import c4 from './clues-4.js';

const pools = { ...c1, ...c2, ...c3, ...c4 };

export default {
  ...base,
  templates,
  vocab,
  items: base.items.map((it) => {
    const p = pools[it.id];
    return p ? { ...it, facts: { ...it.facts, ...p.facts }, clues: p.clues } : it;
  }),
};
