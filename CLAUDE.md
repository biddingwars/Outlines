# Project X — project rules

Work out a mystery place from clues, then draw its outline from memory.
Guessing early earns base points (5 down to 1); drawing accurately multiplies them (1x to 1,000x).

**Project X runs on the Bidding Wars shell.** The menu, sheets, settings, record,
privacy, setup, sealed-bar results, 3D globe, sounds (`sound.js`), motion (`fx.js`),
platform layer (`platform.js`), service worker and stylesheet (`app.css`) were copied
from `biddingwars/bidding-wars` and keep its conventions. Only the game is new.
When Bidding Wars improves its shell, port the change here by hand.

## Flat file layout (as in Bidding Wars)
Everything the game loads sits flat at the repo root and is referenced by plain
relative paths: `index.html`, `app.css`, `app.js`, `strings.js`, `engine.js`,
`packs.js`, `pack-countries.js`, `pack-states.js`, `globe.js`, `us-view.js`,
`us-map.js`, `platform.js`, `sound.js`, `fx.js`, `sw.js`, `manifest.json`, images.
Dev-only folders: `engine/` (engine source), `packs/` (pack sources and generated
outlines), `tools/`, `tests/`, `docs/`. The game never references them.

## Generated files — rebuild, never edit
- `engine.js` ← `engine/*.js` (ES modules, unit-tested): `node tools/make-engine.mjs`
- `pack-countries.js`, `pack-states.js` ← `packs/<id>/pack.js` + `outlines.js`: `node tools/make-packs.mjs`
- `npm run build` does both; `tests/shell.test.js` fails if either is stale.

## `sw.js` — bump `CACHE` on every deploy that touches a cached file
`const CACHE = 'project-x-v1'` and `CONFIG.version` in `platform.js` must move
together (the test checks). Without the bump, installed apps never see the change.

## House rules carried over
- No network at runtime; every asset bundled; no CDN, no remote code.
- Privacy: no accounts, analytics or SDKs. Stored on device only: `lang:v1`,
  `theme:v1`, `settings:v1`, `record:v1`, `name:v1`. "Delete all data" removes all.
- Five languages (`strings.js`); every word in all five.
- The engine is pure: no DOM, storage or timers (`tests/purity.test.js`).
- Scoring is tuned by simulation (`npm run sim`, `npm run tune`), never by feel.

## Test build
`node tools/make-artifact.mjs` → `dist/` (one page plus its images) for a shared test link.
