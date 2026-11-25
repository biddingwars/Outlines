// The game state machine. Pure: (pack, state, action) → new state.
// No timers, no storage, no screen code. The view runs the clocks and
// dispatches `clueTimeout` / `submitDrawing` when they run out.
//
// Phases, per round:
//   handoff → clue → draw → reveal   (once per human seat, in turn)
//   roundEnd                          (after every human has played)
// then gameOver after the last round. `handoff` only appears in hot-seat
// games ("pass the phone to …"); bots play their whole turn when the round
// begins, without seeing the answer, and their turn carries a timeline the
// view can stage.

import { createRng, deriveSeed, toSeed } from './rng.js';
import { judge } from './judge.js';
import { resolve } from './names.js';
import { poolFor, pickClues, CLUES_PER_ITEM } from './pack.js';
import { DEFAULT_RULES, basePointsFor, multiplierFor, roundScore, validateCurve } from './scoring.js';
import { TEMPERAMENTS, decide, moodFor, rollKnowledge, rollSkill, sketch, line } from './bot.js';

export const SEAT_COLORS = Object.freeze(['red', 'black', 'blue', 'green']);
export const SEAT_SHAPES = Object.freeze(['circle', 'square', 'triangle', 'diamond']);
export const MAX_SEATS = 4;
export const LIMITS = Object.freeze({
  rounds: [5, 30],
  clueSeconds: [5, 60],
  drawSeconds: [5, 90],
});
export const BOT_CANVAS = 1000;

const clamp = (x, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(x)));

/** Normalise and check a game config. Throws on an unplayable config. */
export function normalizeConfig(pack, config = {}) {
  const seats = (config.seats ?? []).map((s, i) => ({
    kind: s.kind === 'bot' ? 'bot' : 'human',
    name: String(s.name ?? '').trim().slice(0, 24) || null,
    color: SEAT_COLORS[i],
    shape: SEAT_SHAPES[i],
  }));
  const humans = seats.filter((s) => s.kind === 'human').length;
  const bots = seats.length - humans;
  if (seats.length > MAX_SEATS) throw new Error(`at most ${MAX_SEATS} seats`);
  if (humans < 1) throw new Error('at least one human seat');
  if (humans === 1 && (bots < 1 || bots > 3)) throw new Error('solo is one player against 1 to 3 bots');
  if (humans > 1 && bots > 2) throw new Error('hot-seat allows at most 2 bots');
  let botNo = 0;
  for (const s of seats) {
    if (s.kind === 'bot') {
      botNo++;
      s.name ??= bots > 1 ? `Bot ${botNo}` : 'Bot';
    } else s.name ??= `Player ${seats.indexOf(s) + 1}`;
  }
  const difficulty = config.difficulty ?? Object.keys(pack.difficulties)[0];
  const pool = poolFor(pack, difficulty);
  const lim = pack.settings?.rounds ?? { min: LIMITS.rounds[0], max: LIMITS.rounds[1] };
  const rounds = Math.min(clamp(config.rounds ?? pack.settings?.rounds?.default ?? 10, [Math.max(LIMITS.rounds[0], lim.min), Math.min(LIMITS.rounds[1], lim.max)]), pool.length);
  const rules = { ...DEFAULT_RULES, ...(config.rules ?? {}) };
  const curveErr = validateCurve(rules.curve);
  if (curveErr) throw new Error(curveErr);
  if (config.practice?.botStyle && !TEMPERAMENTS[config.practice.botStyle]) throw new Error('unknown bot style');
  return {
    packId: pack.id,
    seed: toSeed(config.seed ?? 0),
    difficulty,
    rounds,
    clueSeconds: clamp(config.clueSeconds ?? pack.settings?.clueSeconds ?? 15, LIMITS.clueSeconds),
    drawSeconds: clamp(config.drawSeconds ?? pack.settings?.drawSeconds ?? 20, LIMITS.drawSeconds),
    seats,
    practice: {
      faintOutline: !!config.practice?.faintOutline,
      botStyle: config.practice?.botStyle ?? null,
    },
    rules,
    // Places from the player's recent games: dealt only once the rest of the pool is used.
    // Oldest first; only the newest half of the pool is held back, so every game
    // still draws from at least half of it at random.
    recent: (Array.isArray(config.recent) ? config.recent.filter((id) => typeof id === 'string' && pool.includes(id)) : []).slice(-Math.floor(pool.length / 2)),
  };
}

/** Practice games (faint outline, forced bot style) never touch records. */
export function isPractice(cfg) {
  return !!(cfg.practice.faintOutline || cfg.practice.botStyle);
}

/** The group a place belongs to for dealing: its continent (countries) or region (US states). */
export function placeGroup(item) {
  return item?.facts?.continent ?? item?.facts?.region ?? '';
}

/**
 * Deal places so every continent (or US region) shows up in proportion to its share of the
 * pool, and two places from the same group never follow each other while another group
 * has places left. A beta tester saw 9 European countries in a 30-round game.
 * Each group keeps its own (already shuffled) order; ties are broken at random.
 */
export function spread(pack, ids, rng) {
  if (ids.length < 3) return ids.slice();
  const groups = new Map();
  for (const id of ids) {
    const g = placeGroup(pack.byId.get(id));
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(id);
  }
  if (groups.size < 2) return ids.slice();
  const share = new Map([...groups].map(([g, list]) => [g, list.length / ids.length]));
  const taken = new Map([...groups.keys()].map((g) => [g, 0]));
  const out = [];
  let prev = null;
  while (out.length < ids.length) {
    const open = [...groups.keys()].filter((g) => taken.get(g) < groups.get(g).length);
    const choices = open.length > 1 ? open.filter((g) => g !== prev) : open;
    // the group furthest behind its fair share so far
    const owed = (g) => share.get(g) * (out.length + 1) - taken.get(g);
    let best = -Infinity;
    let pick = [];
    for (const g of choices) {
      const o = owed(g);
      if (o > best + 1e-9) {
        best = o;
        pick = [g];
      } else if (Math.abs(o - best) <= 1e-9) pick.push(g);
    }
    const g = pick[rng.int(pick.length)];
    out.push(groups.get(g)[taken.get(g)]);
    taken.set(g, taken.get(g) + 1);
    prev = g;
  }
  return out;
}

export function createGame(pack, config) {
  const cfg = normalizeConfig(pack, config);
  const rng = createRng(cfg.seed, 'setup');
  // A random order of the whole pool; places from recent games go to the back, oldest first.
  const recent = new Set(cfg.recent);
  const order = rng.fork('places').shuffle(poolFor(pack, cfg.difficulty));
  const fresh = order.filter((id) => !recent.has(id));
  const spreadRng = rng.fork('spread');
  const places = [...spread(pack, fresh, spreadRng), ...spread(pack, cfg.recent.filter((id) => !fresh.includes(id)), spreadRng)].slice(0, cfg.rounds);
  // Which five clues each round shows: one per tier, drawn from the place's pool,
  // so the same place reads differently from game to game. A sentence already
  // shown this game is not shown again while its tier has another one.
  const shown = new Set();
  const clueSets = places.map((id, r) => {
    const item = pack.byId.get(id);
    const set = pickClues(item, rng.fork('clues', r), shown);
    for (const k of set) shown.add(item.clues[k].text.en);
    return set;
  });
  // Each bot gets a different hidden temperament.
  const temps = rng.fork('temperaments').shuffle(Object.keys(TEMPERAMENTS));
  const bots = {};
  let b = 0;
  cfg.seats.forEach((s, i) => {
    if (s.kind !== 'bot') return;
    bots[i] = {
      temperament: cfg.practice.botStyle ?? temps[b++ % temps.length],
      knowledge: rollKnowledge(rng.fork('knowledge', i)),
    };
  });
  const state = {
    v: 1,
    config: cfg,
    places,
    clueSets,
    bots,
    round: 0,
    phase: 'clue',
    queue: [],
    qpos: 0,
    turns: [],
    notice: null,
    log: [],
  };
  return beginRound(pack, state);
}

function emptyTurn(seat) {
  return {
    seat,
    clue: 0,
    guesses: [],
    solvedAt: null,
    base: 0,
    rings: null,
    overlap: 0,
    accuracy: 0,
    multiplier: 1,
    score: 0,
    done: false,
  };
}

/** Totals so far (completed turns only). */
export function totals(state) {
  const t = state.config.seats.map(() => 0);
  for (const round of state.turns) for (const turn of round) if (turn.done) t[turn.seat] += turn.score;
  return t;
}

function beginRound(pack, state) {
  const r = state.round;
  const cfg = state.config;
  const humans = cfg.seats.map((s, i) => (s.kind === 'human' ? i : -1)).filter((i) => i >= 0);
  // Rotate who goes first each round.
  const k = r % humans.length;
  state.queue = humans.slice(k).concat(humans.slice(0, k));
  state.qpos = 0;
  const sums = totals(state);
  state.turns[r] = cfg.seats.map((s, i) => (s.kind === 'bot' ? botTurn(pack, state, i, sums) : emptyTurn(i)));
  state.phase = humans.length > 1 ? 'handoff' : 'clue';
  state.notice = null;
  return state;
}

/** The view a bot is given: revealed clue tests, its wrong guesses, all candidates. No answer. */
export function botView(pack, state, clueIndex, wrong) {
  const item = pack.byId.get(state.places[state.round]);
  const played = new Set(state.places.slice(0, state.round));
  return {
    clueIndex,
    lastClue: clueIndex === CLUES_PER_ITEM - 1,
    tests: state.clueSets[state.round].slice(0, clueIndex + 1).map((k) => item.clues[k].test),
    wrong: wrong.slice(),
    candidates: poolFor(pack, state.config.difficulty)
      .filter((id) => !played.has(id))
      .map((id) => ({ id, facts: pack.byId.get(id).facts })),
  };
}

function botTurn(pack, state, seat, sums) {
  const cfg = state.config;
  const r = state.round;
  const answer = state.places[r];
  const bot = state.bots[seat];
  const seed = deriveSeed(cfg.seed, 'round', r, 'seat', seat, 'bot');
  const rng = createRng(seed, 'turn');
  const mood = moodFor({ round: r, rounds: cfg.rounds, mine: sums[seat], others: sums.filter((_, i) => i !== seat) });
  const mind = { temperament: bot.temperament, mood, knowledge: bot.knowledge, seed };
  const turn = emptyTurn(seat);
  const timeline = [];
  const wrong = [];
  const clueMs = cfg.clueSeconds * 1000;
  for (let c = 0; c < CLUES_PER_ITEM; c++) {
    const d = decide(botView(pack, state, c, wrong), mind);
    if (d.type === 'guess') {
      const ok = d.id === answer; // checked by the engine, not the bot
      const atMs = Math.round(clueMs * rng.range(0.15, 0.8));
      timeline.push({ clue: c, type: 'guess', id: d.id, ok, atMs });
      turn.guesses.push({ clue: c, id: d.id, ok });
      if (ok) {
        turn.solvedAt = c;
        break;
      }
      wrong.push(d.id);
    } else {
      timeline.push({ clue: c, type: 'wait', atMs: clueMs });
    }
  }
  turn.clue = turn.solvedAt ?? CLUES_PER_ITEM - 1;
  turn.base = basePointsFor(turn.solvedAt, wrong.length, cfg.rules);
  const skill = rollSkill(rng.fork('skill'));
  const strokes = sketch(pack.byId.get(answer).outline, skill, rng.fork('sketch'), BOT_CANVAS);
  Object.assign(turn, judgeTurn(pack, answer, strokes, turn.base, cfg.rules));
  const talk = rng.fork('talk');
  const kind = turn.solvedAt === null ? 'miss' : turn.solvedAt <= 1 ? 'early' : 'late';
  turn.bot = {
    mood,
    timeline,
    // Lines are resolved per language by the view through botLine(); keep the kinds and seeds.
    lines: [
      { kind, seed: talk.int(2 ** 31) },
      { kind: turn.multiplier >= 75 ? 'drawGood' : 'drawBad', seed: talk.int(2 ** 31) },
    ],
    skill: Math.round(skill * 1000) / 1000,
  };
  turn.done = true;
  return turn;
}

/** A bot one-liner in the player's language. */
export function botLine(pack, state, round, seat, n = 0, lang = 'en') {
  const t = state.turns[round]?.[seat];
  const l = t?.bot?.lines?.[n];
  if (!l) return '';
  return line(pack, l.kind, { itemId: state.places[round], lang, rng: createRng(l.seed) });
}

function roundRings(rings) {
  return rings.map((r) => r.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));
}

function judgeTurn(pack, itemId, strokes, base, rules) {
  const res = judge(strokes, pack.targetFor(itemId));
  const multiplier = multiplierFor(res.accuracy, rules.curve);
  return {
    rings: roundRings(res.rings),
    fit: res.fit,
    overlap: res.overlap,
    accuracy: res.accuracy,
    multiplier,
    score: roundScore(base, multiplier),
  };
}

/** The human seat whose turn it is, or null. */
export function activeSeat(state) {
  return ['handoff', 'clue', 'draw', 'reveal'].includes(state.phase) ? state.queue[state.qpos] : null;
}

export function activeTurn(state) {
  const s = activeSeat(state);
  return s === null ? null : state.turns[state.round][s];
}

function advanceClue(state, turn) {
  if (turn.clue < CLUES_PER_ITEM - 1) turn.clue++;
  else {
    turn.base = 0;
    state.phase = 'draw';
  }
}

/**
 * Apply an action. Never mutates `state`. Illegal actions return the state
 * unchanged apart from `notice`.
 * Actions:
 *   { type: 'ready' }                         handoff → clue
 *   { type: 'guess', id } | { type: 'guess', text }
 *   { type: 'clueTimeout' }
 *   { type: 'submitDrawing', strokes }        strokes: [[[x,y],...], ...] in canvas px
 *   { type: 'continue' }                      reveal → next, roundEnd → next round
 */
export function step(pack, state, action) {
  const s = structuredClone(state);
  s.notice = null;
  const turn = activeTurn(s);
  const reject = (why) => {
    const out = structuredClone(state);
    out.notice = { type: 'rejected', reason: why, action: action?.type ?? null };
    return out;
  };
  const type = action?.type;
  switch (s.phase) {
    case 'handoff':
      if (type !== 'ready') return reject('expected ready');
      s.phase = 'clue';
      break;
    case 'clue': {
      if (type === 'clueTimeout') {
        advanceClue(s, turn);
        break;
      }
      if (type !== 'guess') return reject('expected guess or clueTimeout');
      const id = action.id && pack.byId.has(action.id) ? action.id : resolve(pack.index, action.text ?? '');
      if (!id) {
        const out = structuredClone(state);
        out.notice = { type: 'unknownPlace', text: String(action.text ?? action.id ?? '') };
        return out;
      }
      if (turn.guesses.some((g) => g.id === id)) {
        const out = structuredClone(state);
        out.notice = { type: 'alreadyGuessed', id };
        return out;
      }
      const ok = id === s.places[s.round];
      turn.guesses.push({ clue: turn.clue, id, ok });
      if (ok) {
        turn.solvedAt = turn.clue;
        turn.base = basePointsFor(turn.clue, turn.guesses.length - 1, s.config.rules);
        s.phase = 'draw';
      } else advanceClue(s, turn);
      break;
    }
    case 'draw': {
      if (type !== 'submitDrawing') return reject('expected submitDrawing');
      Object.assign(turn, judgeTurn(pack, s.places[s.round], action.strokes ?? [], turn.base, s.config.rules));
      turn.done = true;
      s.phase = 'reveal';
      break;
    }
    case 'reveal':
      if (type !== 'continue') return reject('expected continue');
      s.qpos++;
      if (s.qpos < s.queue.length) s.phase = 'handoff';
      else s.phase = 'roundEnd';
      break;
    case 'roundEnd':
      if (type !== 'continue') return reject('expected continue');
      s.round++;
      if (s.round >= s.config.rounds) {
        s.phase = 'gameOver';
        s.queue = [];
      } else beginRound(pack, s);
      break;
    default:
      return reject('game over');
  }
  s.log.push(action);
  return s;
}

/** Rebuild a game from its config and action log. */
export function replay(pack, config, actions) {
  let s = createGame(pack, config);
  for (const a of actions) s = step(pack, s, a);
  return s;
}

/** Clue texts revealed so far for the active human, in a language. */
export function revealedClues(pack, state, lang = 'en') {
  const t = activeTurn(state);
  if (!t || state.phase === 'handoff') return [];
  const item = pack.byId.get(state.places[state.round]);
  const upto = state.phase === 'clue' ? t.clue : t.solvedAt ?? CLUES_PER_ITEM - 1;
  return state.clueSets[state.round].slice(0, upto + 1).map((k) => item.clues[k].text[lang] ?? item.clues[k].text.en);
}

/**
 * End-of-game results. Round scores are all here; the view keeps them behind
 * bars and lifts them one at a time.
 */
export function results(pack, state) {
  if (state.phase !== 'gameOver') throw new Error('results are only available at game over');
  const cfg = state.config;
  const sums = totals(state);
  const seats = cfg.seats.map((seat, i) => {
    const rounds = state.turns.map((r, k) => {
      const t = r[i];
      return {
        itemId: state.places[k],
        solvedAt: t.solvedAt,
        base: t.base,
        accuracy: t.accuracy,
        overlap: t.overlap,
        multiplier: t.multiplier,
        score: t.score,
      };
    });
    const avg = rounds.reduce((a, r) => a + r.accuracy, 0) / Math.max(1, rounds.length);
    return { seat: i, name: seat.name, kind: seat.kind, color: seat.color, shape: seat.shape, total: sums[i], avgAccuracy: Math.round(avg * 1000) / 1000, rounds };
  });
  const order = seats.slice().sort((a, b) => b.total - a.total || b.avgAccuracy - a.avgAccuracy || a.seat - b.seat);
  let rank = 0;
  order.forEach((s, k) => {
    const prev = order[k - 1];
    if (!prev || prev.total !== s.total || prev.avgAccuracy !== s.avgAccuracy) rank = k + 1;
    s.rank = rank;
  });
  let best = null;
  state.turns.forEach((r, k) =>
    r.forEach((t) => {
      if (!best || t.accuracy > best.accuracy) best = { seat: t.seat, round: k, itemId: state.places[k], accuracy: t.accuracy, multiplier: t.multiplier, rings: t.rings, fit: t.fit };
    }),
  );
  const places = state.places.map((id, k) => ({
    itemId: id,
    centroid: pack.byId.get(id).centroid,
    accuracy: Object.fromEntries(state.turns[k].map((t) => [t.seat, t.accuracy])),
  }));
  return {
    seats,
    ranking: order.map((s) => ({ seat: s.seat, rank: s.rank })),
    winners: order.filter((s) => s.rank === 1).map((s) => s.seat),
    best,
    places,
    practice: isPractice(cfg),
  };
}
