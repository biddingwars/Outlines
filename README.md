# Project X (working title)

Work out a mystery place from clues, then draw its outline from memory.
Guessing fast earns base points, and drawing accurately multiplies them (1x to 1,000x).

The game is offline and private: no accounts, no network, five languages. It is plain HTML, CSS and JS with no build step.

## Status

The engine and its tests are built. The screens are not built yet. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```sh
npm test                # unit, golden, fuzz, simulation and purity tests (Node 20 or later)
npm run sim             # scripted strategies vs the bot
npm run tune            # skill → accuracy → multiplier distributions
npm run golden:update   # re-pin golden scores after a deliberate judge or outline change
```

Rebuild outlines from source map data:

```sh
npm pack world-atlas@2.0.2 us-atlas@3.0.1   # then untar both
node tools/build-outlines.mjs --world <countries-50m.json> --us <states-10m.json>
```

## Data credits

- Country outlines: Natural Earth 1:50m (public domain), via world-atlas.
- US state outlines: US Census Bureau Cartographic Boundary Files (public domain), via us-atlas.
- Facts: CIA World Factbook and official sources (listed per pack in `sources`).
