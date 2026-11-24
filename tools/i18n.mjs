#!/usr/bin/env node
// Lists every pack text that still lacks a translation in an added language.
//   node tools/i18n.mjs [lang]           one line per gap: "lang id<TAB>English"
//   node tools/i18n.mjs --count          gaps per language
import { missing as world } from '../packs/world/pack.js';
import { missing as us } from '../packs/us-states/pack.js';

const all = [...world, ...us];
const lang = process.argv[2];
if (lang === '--count') {
  const n = {};
  for (const m of all) n[m.split(' ')[0]] = (n[m.split(' ')[0]] ?? 0) + 1;
  console.log(n);
} else {
  for (const m of all) if (!lang || m.startsWith(lang + ' ')) console.log(m);
}
