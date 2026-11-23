// Architecture guard: the engine is pure JavaScript with no screen code,
// storage, timers, network or unseeded randomness, and imports only itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../engine/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
const banned = [/\bwindow\b/, /\bdocument\b/, /localStorage|sessionStorage|indexedDB/, /\bsetTimeout\b|\bsetInterval\b|requestAnimationFrame/, /\bfetch\(/, /Math\.random/, /Date\.now|new Date\(/, /\bprocess\./, /XMLHttpRequest|WebSocket/];

for (const f of files) {
  test(`engine/${f} is pure`, () => {
    const src = readFileSync(new URL(f, dir), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const re of banned) assert.ok(!re.test(src), `${f} uses ${re}`);
    for (const m of src.matchAll(/from\s+'([^']+)'/g)) assert.ok(m[1].startsWith('./'), `${f} imports ${m[1]}`);
  });
}
