// Pinned scores for reference drawings on every outline in every pack.
// Regenerate deliberately with `npm run golden:update` and review the diff.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goldenEntry } from '../tools/golden-lib.js';
import worldOutlines from '../packs/world/outlines.js';
import usOutlines from '../packs/us-states/outlines.js';

for (const [id, outlines] of [['world', worldOutlines], ['us-states', usOutlines]]) {
  test(`golden scores: ${id}`, () => {
    const golden = JSON.parse(readFileSync(new URL(`./golden/${id}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(Object.keys(golden).sort(), Object.keys(outlines.items).sort(), 'outline set changed');
    const diffs = [];
    for (const k of Object.keys(golden)) {
      const now = goldenEntry(outlines.items[k].pts);
      if (JSON.stringify(now) !== JSON.stringify(golden[k])) diffs.push(`${k}: ${JSON.stringify(golden[k])} → ${JSON.stringify(now)}`);
      // Sanity on top of pinning: a perfect copy is near-perfect, a circle is worthless.
      assert.ok(now.perfect[1] >= 0.9, `${k} perfect ${now.perfect[1]}`);
      assert.ok(now.circle[1] <= 0.9, `${k} circle ${now.circle[1]}`);
    }
    assert.deepEqual(diffs, []);
  });
}
