// View-side checks that need no browser: every interface string exists in all
// five languages, and the single-file test build still bundles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { missingTranslations } from '../view/i18n.js';

test('every interface string is translated', () => {
  assert.deepEqual(missingTranslations(), []);
});

test('the single-file test build bundles every module', () => {
  const out = 'dist/test-bundle.html';
  execFileSync(process.execPath, ['tools/bundle.mjs', '--out', out], { cwd: new URL('..', import.meta.url) });
  const html = readFileSync(new URL(`../${out}`, import.meta.url), 'utf8');
  for (const m of ['engine/game.js', 'engine/judge.js', 'packs/world/outlines.js', 'packs/us-states/pack.js', 'view/i18n.js']) assert.ok(html.includes(`__defs["${m}"]`), m);
  assert.ok(!/\bimport\s*\(/.test(html.replace(/importScripts/g, '')), 'no dynamic imports left');
});
