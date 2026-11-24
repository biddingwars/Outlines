// The optional game log (as in Bidding Wars): off by default, kept on the
// device only under log:v1, exported by the player as text for analysis.
// One compact record per game (finished or left), plus the app errors seen
// while recording. No names, no network. tools/analyze-log.mjs reads it.

import { simplifyRing } from './geometry.js';

export const LOG_KEY = 'log:v1';
export const LOG_MAX_GAMES = 40;
export const LOG_MAX_ERRORS = 30;
export const LOG_MAX_CHARS = 1500000;
const MAX_POINTS = 80; // per drawn ring, after simplifying

const r3 = (x) => (Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null);

/** A drawn ring as at most MAX_POINTS integer points. */
function compactRing(ring) {
  let pts = ring;
  for (let tol = 1; pts.length > MAX_POINTS && tol < 64; tol *= 1.5) pts = simplifyRing(ring, tol);
  if (pts.length > MAX_POINTS) pts = pts.filter((_, k) => k % Math.ceil(pts.length / MAX_POINTS) === 0);
  return pts.map(([x, y]) => [Math.round(x), Math.round(y)]);
}

/**
 * The log record of one game.
 * @param pack   the prepared pack
 * @param state  the game state (finished or not)
 * @param extra  { t, app, lang, kind, end: 'done'|'quit', events: [[ms, round, seat, action, detail]] }
 */
export function gameLog(pack, state, extra = {}) {
  const cfg = state.config;
  const played = state.turns.length;
  return {
    v: 1,
    t: extra.t ?? null,
    app: extra.app ?? null,
    lang: extra.lang ?? null,
    kind: extra.kind ?? null,
    end: extra.end ?? (state.phase === 'gameOver' ? 'done' : 'quit'),
    pack: pack.id,
    level: cfg.difficulty,
    rounds: cfg.rounds,
    clueSeconds: cfg.clueSeconds,
    drawSeconds: cfg.drawSeconds,
    practice: !!(cfg.practice.faintOutline || cfg.practice.botStyle),
    seats: cfg.seats.map((s) => s.kind),
    bots: Object.fromEntries(Object.entries(state.bots).map(([i, b]) => [i, { temperament: b.temperament, knowledge: r3(b.knowledge) }])),
    r: state.places.slice(0, played).map((id, k) => {
      const item = pack.byId.get(id);
      return {
        id,
        clues: state.clueSets[k].map((i) => [item.clues[i].tier, item.clues[i].text.en]),
        turns: (state.turns[k] ?? []).map((t) => ({
          seat: t.seat,
          guesses: t.guesses.map((g) => [g.clue, g.id, g.ok ? 1 : 0]),
          solvedAt: t.solvedAt ?? null,
          base: t.base ?? null,
          accuracy: r3(t.accuracy),
          overlap: r3(t.overlap),
          multiplier: t.multiplier ?? null,
          score: t.score ?? null,
          // the drawing and how the judge placed it (people only; bot sketches can be regenerated)
          rings: cfg.seats[t.seat].kind === 'human' && Array.isArray(t.rings) ? t.rings.map(compactRing) : null,
          fit: cfg.seats[t.seat].kind === 'human' && t.fit ? Object.fromEntries(Object.entries(t.fit).map(([k2, v]) => [k2, r3(v)])) : null,
        })),
      };
    }),
    events: Array.isArray(extra.events) ? extra.events.slice(0, 2000) : [],
  };
}

/** Read the stored log: { games, errors }. Anything unreadable gives an empty log. */
export function parseLog(raw) {
  let o = null;
  try {
    o = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    o = null;
  }
  const games = Array.isArray(o?.games) ? o.games.filter((g) => g && g.v === 1 && Array.isArray(g.r)) : [];
  const errors = Array.isArray(o?.errors) ? o.errors.filter((e) => e && typeof e.msg === 'string') : [];
  return { v: 1, games, errors };
}

function serialise(log) {
  while (log.games.length > LOG_MAX_GAMES) log.games.shift();
  while (log.errors.length > LOG_MAX_ERRORS) log.errors.shift();
  let out = JSON.stringify(log);
  while (out.length > LOG_MAX_CHARS && log.games.length > 1) {
    log.games.shift();
    out = JSON.stringify(log);
  }
  return out;
}

/** Add one game record; returns the new stored text (oldest games dropped first). */
export function addGameToLog(raw, game) {
  const log = parseLog(raw);
  log.games.push(game);
  return serialise(log);
}

/**
 * Add one app error; the same message again only raises its count.
 * @param err { msg, where, stack, t, app, screen }
 */
export function addErrorToLog(raw, err) {
  const log = parseLog(raw);
  const msg = String(err.msg ?? '').slice(0, 300);
  const same = log.errors.find((e) => e.msg === msg && e.where === (err.where ?? null));
  if (same) {
    same.n = (same.n ?? 1) + 1;
    same.last = err.t ?? null;
  } else {
    log.errors.push({ msg, where: err.where ?? null, stack: String(err.stack ?? '').slice(0, 800), t: err.t ?? null, app: err.app ?? null, screen: err.screen ?? null, n: 1 });
  }
  return serialise(log);
}
