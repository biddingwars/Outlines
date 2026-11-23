// The Bidding Wars-style shell: generated files stay in sync with their
// sources, the classic scripts load the way the browser loads them, every
// word on screen exists in all five languages, and the release numbers match.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const read = (f) => readFileSync(new URL(f, root), 'utf8');

test('engine.js and pack-*.js are generated from the current sources', () => {
  for (const tool of ['tools/make-engine.mjs', 'tools/make-packs.mjs']) {
    assert.doesNotThrow(() => execFileSync(process.execPath, [tool, '--check'], { cwd: root, stdio: 'pipe' }), `${tool} --check: run it without --check`);
  }
});

function browserish() {
  const ctx = { console, Math, JSON, Map, Set, Promise };
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('engine.js'), ctx);
  vm.runInContext(read('packs.js'), ctx);
  return ctx;
}

test('engine.js runs as a classic script and registers every pack', () => {
  const ctx = browserish();
  assert.equal(typeof ctx.Engine.createGame, 'function');
  assert.equal(typeof ctx.Engine.hasCoords, 'function');
  for (const m of ctx.Packs.META) {
    vm.runInContext(read(m.file), ctx);
    const p = ctx.Packs.get(m.id);
    assert.ok(p, m.id);
    assert.equal(p.items.length, m.count, `${m.id}: META.count`);
    assert.ok(p.items.every(ctx.Engine.hasCoords), `${m.id}: every place has a position for the globe`);
    const g = ctx.Engine.createGame(p, { seed: 1, seats: [{ kind: 'human' }, { kind: 'bot' }] });
    assert.equal(g.phase, 'clue');
  }
});

test('every word the app asks for exists in all five languages', () => {
  const STR = new Function(read('strings.js') + ';return STR;')();
  const keys = [...new Set([...read('app.js').matchAll(/\bt\('(\w+)'/g)].map((m) => m[1]))].filter((k) => !k.endsWith('_'));
  const missing = [];
  for (const l of ['en', 'de', 'it', 'es', 'fr']) for (const k of keys) if (!STR[l][k]) missing.push(`${l}:${k}`);
  assert.deepEqual(missing, []);
  for (const l of ['de', 'it', 'es', 'fr']) for (const k of ['beginner', 'standard']) assert.ok(STR[l]['diffSub_' + k], `${l}:diffSub_${k}`);
});

test('the release number on the menu matches the service-worker cache', () => {
  const v = +read('platform.js').match(/version:\s*(\d+)/)[1];
  const c = +read('sw.js').match(/const CACHE = 'project-x-v(\d+)'/)[1];
  assert.equal(v, c);
});

test('every file the service worker caches exists, flat at the root', () => {
  const shell = [...read('sw.js').matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of shell) {
    assert.ok(!f.includes('/'), `${f} must sit at the root`);
    assert.doesNotThrow(() => readFileSync(new URL(f, root)), f);
  }
});
