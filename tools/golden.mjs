#!/usr/bin/env node
// Golden scores: reference drawings for every outline, pinned to exact values.
//   node tools/golden.mjs            check (exit 1 on any difference)
//   node tools/golden.mjs --update   rewrite tests/golden/*.json
// Any change to the judge, the outlines or the bot sketcher shows up here.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { goldenFor } from './golden-lib.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const update = process.argv.includes('--update');
let bad = 0;
for (const id of ['world', 'us-states']) {
  const { default: outlines } = await import(`../packs/${id}/outlines.js`);
  const now = goldenFor(outlines);
  const file = join(root, 'tests/golden', `${id}.json`);
  if (update || !existsSync(file)) {
    writeFileSync(file, JSON.stringify(now, null, 1) + '\n');
    console.log(`wrote ${file} (${Object.keys(now).length} outlines)`);
    continue;
  }
  const was = JSON.parse(readFileSync(file, 'utf8'));
  for (const k of new Set([...Object.keys(was), ...Object.keys(now)])) {
    if (JSON.stringify(was[k]) !== JSON.stringify(now[k])) {
      bad++;
      console.log(`${id}/${k}: ${JSON.stringify(was[k])} → ${JSON.stringify(now[k])}`);
    }
  }
}
process.exit(bad ? 1 : 0);
