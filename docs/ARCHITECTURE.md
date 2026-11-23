# Project X: architecture and engine API

Project X: work out a mystery place from clues, then draw its outline from memory.
Guessing early earns base points (5 down to 1) and drawing accurately multiplies them (1x to 1,000x).

This document covers the file layout, the engine API and the rule decisions made so far.
The engine and its tests are built. Screen code has not been started.

## File structure

```
Project-X/
├── index.html              (view: not built yet)
├── sw.js                   (view: cache-first service worker, not built yet)
├── view/                   (view: rendering, stroke capture, Web Audio, haptics; no rules)
├── engine/                 pure JS, runs in the browser and in Node, no DOM/storage/timers
│   ├── index.js            public API (re-exports)
│   ├── rng.js              seeded streams derived from seed + labels
│   ├── geometry.js         area, centroid, simplify, resample, equal-area projection
│   ├── raster.js           deterministic non-zero polygon rasteriser, IoU counts
│   ├── judge.js            stroke cleaning, fitting, overlap, blob baseline
│   ├── scoring.js          base points, shape accuracy, multiplier curve
│   ├── names.js            five-language name folding, guess resolution, autocomplete
│   ├── clues.js            machine-readable clue tests
│   ├── pack.js             pack validation, preparation, difficulty pools
│   ├── bot.js              guessing without the answer, temperament, mood, sketching, lines
│   ├── game.js             state machine, replay, results
│   └── records.js          won/lost per pack, best drawing per place
├── packs/
│   ├── registry.js         lazy loading (dynamic import) + validation
│   ├── world/pack.js       content: names, facts, clues, fun facts, taunts (5 languages)
│   ├── world/outlines.js   GENERATED from Natural Earth 1:50m (235 outlines)
│   ├── us-states/pack.js
│   └── us-states/outlines.js  GENERATED from US Census 1:10m (56 outlines)
├── tools/
│   ├── build-outlines.mjs  map data → outlines.js (main landmass, local LAEA, simplified)
│   ├── tune-curve.mjs      skill → accuracy → multiplier distributions
│   ├── sim.js              strategy harness that plays whole games through the engine
│   ├── simulate.mjs        win rates of scripted strategies vs the bot
│   ├── golden-lib.js       reference drawings
│   └── golden.mjs          check or regenerate golden scores
└── tests/                  node:test, no dependencies
    ├── golden/*.json       pinned scores for every outline
    └── *.test.js
```

No build step and no runtime dependencies. `npm test` needs Node 20 or later.

## Engine API

Everything is a pure function. Game state is plain JSON (no class instances
and no RNG objects inside it), so it can be stored, logged and replayed.

### Packs

```js
import { loadPack } from './packs/registry.js';
const pack = await loadPack('world');      // validated + prepared; throws if invalid

pack.items          // [{ id, names{en,de,it,es,fr}, aliases, tier, facts, clues[5], fact, outline, centroid, mainlandOnly }]
pack.byId           // Map
pack.index          // name index for guesses
pack.difficulties   // { beginner: { maxTier, label }, ... }
pack.targetFor(id)  // prepared outline target (lazy, cached)
validatePack(packData, outlines) → { ok, errors[], warnings[] }
poolFor(pack, difficulty) → ids
```

Every clue has prose in five languages and a `test` over the place's facts,
for example `{ f: 'drive', eq: 'left' }` or `{ f: 'flag', all: ['green', 'red'] }`.
The validator refuses a pack when:
- a clue's test is false for its own place, or
- the five tests together also fit another place.

The brief's own example would be refused: "Its flag has no red" is false for
Portugal, whose capital is Lisbon. One of the tests checks exactly this case.

### Game

```js
import { createGame, step, replay, results, revealedClues, activeSeat, activeTurn, botLine } from './engine/game.js';

let s = createGame(pack, {
  seed: 'any string or number',
  difficulty: 'beginner', rounds: 10, clueSeconds: 15, drawSeconds: 20,
  seats: [{ kind: 'human', name: 'Leo' }, { kind: 'bot' }],
  practice: { faintOutline: false, botStyle: null },
});

s = step(pack, s, { type: 'ready' });                         // handoff → clue (hot-seat only)
s = step(pack, s, { type: 'guess', id: 'PRT' });              // or { type: 'guess', text: 'Portogallo' }
s = step(pack, s, { type: 'clueTimeout' });                   // the view's clock ran out
s = step(pack, s, { type: 'submitDrawing', strokes });        // [[[x,y],...], ...] in canvas px
s = step(pack, s, { type: 'continue' });                      // reveal → next, roundEnd → next round
```

Phases for each human seat, every round: `handoff` (hot-seat only), `clue`,
`draw`, `reveal`. Once every human has played, the round goes to `roundEnd`.
After the last round the game is `gameOver`.

- `step` never mutates its input.
- An illegal action returns the same state with a `notice` set.
- Unknown text and repeated guesses cost nothing: they only set a `notice`.
- `s.log` is the action list. `replay(pack, config, s.log)` rebuilds the game bit for bit.
- `results(pack, s)` only works at `gameOver`. It returns:
  - totals, ranks (ties share a rank, then average accuracy breaks them) and winners
  - per-round scores, for the black-bar reveal
  - the best drawing and its `fit`
  - played places with each seat's accuracy, for tinting the globe

### Judge

```js
judge(strokes, pack.targetFor(id)) → { accuracy, overlap, iou, baseline, fit, rings, empty }
outlineToCanvas(outline, fit)        // the real outline in the sketch's coordinates, for the reveal
```

The judge works in these steps:
1. Clean the strokes: drop non-finite points, cap the points, and join strokes whose ends nearly meet.
2. Close each stroke and fill it with the non-zero rule, so self-crossing loops stay filled.
3. Match the drawing's area and centroid to the real outline.
4. Search over scale and offset (72 deterministic fits) for the best intersection over union on a grid.

The grid is finer for thin shapes such as Chile and Norway. Rotation and aspect ratio are never adjusted, because north is up.

### Bot

```js
bot.decide(view, mind)   // view = { clueIndex, lastClue, tests[], wrong[], candidates[{id, facts}] }
bot.sketch(outline, skill, rng)
bot.moodFor(...), bot.thresholdFor(temperament, mood), bot.line(pack, kind, {...})
```

The bot never receives the answer. Its view holds only the clue *tests*
revealed so far, its own wrong guesses, and the public facts of every
candidate. Each turn works like this:
1. It understands each clue with a probability (harder clues less often).
2. It drops candidates that don't fit, then applies hidden per-place hunches.
3. It guesses when its confidence passes its threshold.

Temperament sets the threshold (aggressive 0.28, balanced 0.5, conservative 0.8), and mood scales it.
Bot turns are computed when a round starts and carry a timeline (`atMs` per clue), so the view can stage them.

### Records

`recordGame(record, results, { packId })` updates won, lost, tied and the streak.
It counts solo games only and skips practice games.
`recordDrawing(record, {...})` keeps the best drawing per place.
`sanitizeRecord(raw)` accepts anything read from storage.

## Decisions that change or sharpen the brief

1. **Accuracy comes from the outline gap, calibrated per place.** Raw overlap
   (IoU) can't tell a recognisable drawing from a blob. A circle overlaps
   France by 77%, about as much as a real player's careful drawing. The judge
   still places the drawing by best overlap, then measures the *outline gap*:
   the average distance between the drawn line and the real border, both
   ways, divided by the place's equal-area radius. Each place also gets a
   *blob gap*, the smallest gap a circle or square reaches on it (capped for
   thin places). The formula is
   `accuracy = 1 − (gap / blobGap) × 0.65`. On every shape:
   - a blob scores about 35% (1x)
   - a recognisable drawing scores 50–70% (10–100x)
   - a near-perfect one scores 90% or more (1,000x)

   The curve anchors are 35/50/70/90% → 1/10/100/1,000x.
   `tests/fixtures/human-drawings.json` holds five drawings by a real
   play-tester, traced from screenshots, and pins their ordering. Spain
   (55%, 17x) and Germany (53%, 15x) beat a blob. France and Kenya (about
   33%, 1x) were drawn as a rounded square and a blob. Half of Norway scores 0%.
   The canvas also takes roughly the place's proportions (`drawingAspect`), so
   tall places like Chile have room.

2. **A wrong guess costs a point** (`rules.wrongGuessPenalty = 1`; the solved
   base never drops below 1). In the brief, a wrong guess and a timeout both
   just reveal the next clue. That makes guessing free, so "always guess" beats
   waiting and the conservative temperament has nothing to be careful about.
   Set the penalty to 0 to restore the brief exactly.

3. **At most 4 seats.** The brief allows 4 people plus 2 bots, but there are only
   four seat colours. Solo is 1 player against 1 to 3 bots. Hot-seat is 2 to 4
   people plus up to 2 bots, with 4 seats in total.

4. **Main landmass is the largest polygon.** Items whose main landmass is under
   80% of their area must set `mainlandOnly`, so the rules text can say so
   (Japan: Honshu; Greece: the mainland; Michigan: the Lower Peninsula).

5. **The bot's mood uses the running totals.** The brief asks for mood to depend
   on the standings, and those standings stay hidden from the humans. This is
   the bot's only extra information, and it affects only when the bot dares to
   guess, never what it guesses.

## Tuning results so far

From `npm run tune` and `npm run sim` (100 games of 10 rounds against one bot):

| strategy | win rate |
|---|---|
| every blind strategy (random guesses, circle, square, scribble, never guessing) | 0% |
| knows every place on clue 1, but draws a circle | 0% |
| play-tester level (knows the place by clue 3, drawing skill 0.4) | 48% |
| strong player (knows the place by clue 2, drawing skill 0.6) | 97% |

The bot's drawing skill is set so that its typical drawing is about as good as the play-tester's.

The real calibration of how human drawings map to the curve needs playtest
drawings. Collect them with the optional game log, then re-run `tune-curve`.

## Content status

The starter packs are fully valid:
- World: 20 countries (14 Beginner).
- US States: 10 states (6 Beginner).

Every name, clue, fun fact and taunt is in all five languages. Outlines are already
generated for all 235 countries and 56 states and territories, so adding a place means
writing its facts and clues. The engine and the map data do not change. Until
the packs grow, games are capped at the pool size (the validator warns about this).
