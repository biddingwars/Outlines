// The bot opponent.
//
// Guessing: the bot is handed a BotView, which holds the clue tests revealed
// so far, its own wrong guesses and the list of possible places with their
// public facts. It never receives the answer. It narrows the list clue by
// clue and guesses once its confidence passes a threshold set by its hidden
// temperament and its mood.
//
// Drawing: the bot sketches the real outline through a noisy hand model
// (smoothing that loses peninsulas, wobble, jitter, skew, simplification),
// with a skill rolled per round. Its sketch goes through the same judge as a
// human drawing.

import { createRng } from './rng.js';
import { evalTest } from './clues.js';
import { centroid, maxRadius, resample, simplifyRing, bbox } from './geometry.js';

export const TEMPERAMENTS = Object.freeze({
  conservative: Object.freeze({ threshold: 0.8 }),
  balanced: Object.freeze({ threshold: 0.5 }),
  aggressive: Object.freeze({ threshold: 0.28 }),
});

/** How much more readily a bot thinks of a place, by its tier (1 = famous … 4 = obscure). */
export const FAME = Object.freeze({ 1: 4, 2: 2, 3: 1, 4: 0.6 });

/** Chance the bot understands clue k (before its per-game knowledge factor). */
export const CLUE_RECALL = Object.freeze([0.45, 0.6, 0.75, 0.9, 1.0]);

/** Per-game knowledge factor for a bot seat: how well it knows its facts. */
export function rollKnowledge(rng) {
  return rng.range(0.78, 1.0);
}

/** Per-round drawing skill in [0, 1]. Shape tuned by tools/tune-curve.mjs. */
export function rollSkill(rng) {
  const s = 0.2 + 0.15 * rng.normal();
  return s < 0.02 ? 0.02 : s > 0.98 ? 0.98 : s;
}

/**
 * Mood late in the game. Returns 'bold' when behind the leader, 'cautious'
 * when comfortably ahead, otherwise 'calm'.
 * @param {{round:number, rounds:number, mine:number, others:number[]}} s
 */
export function moodFor({ round, rounds, mine, others }) {
  if (rounds <= 0 || round / rounds < 0.6 || !others.length) return 'calm';
  const best = Math.max(...others);
  if (mine < best) return 'bold';
  if (mine > 0 && mine >= 1.5 * best) return 'cautious';
  return 'calm';
}

export function thresholdFor(temperament, mood) {
  const base = (TEMPERAMENTS[temperament] ?? TEMPERAMENTS.balanced).threshold;
  if (mood === 'bold') return base * 0.6;
  if (mood === 'cautious') return Math.min(0.95, base * 1.3);
  return base;
}

/**
 * Decide what to do at the current clue.
 * @param {object} view BotView: { clueIndex, lastClue, tests[], wrong[], candidates[{id, facts}] }
 * @param {object} mind { temperament, mood, knowledge, seed }  seed is the bot's round stream seed
 * @returns {{type:'guess', id:string, confidence:number, remaining:number}
 *          |{type:'wait', confidence:number, remaining:number}}
 */
export function decide(view, mind) {
  const rng = createRng(mind.seed, 'understand');
  // Which clues has the bot understood? Rolled per clue index, independent of the answer.
  const understood = [];
  for (let k = 0; k < view.tests.length; k++) {
    const p = (CLUE_RECALL[k] ?? 1) * mind.knowledge;
    if (rng.fork(k).chance(p)) understood.push(view.tests[k]);
  }
  const wrong = new Set(view.wrong);
  let cands = view.candidates.filter((c) => !wrong.has(c.id));
  // A place whose facts do not show a clue to be true is ruled out (the answer's own
  // facts always do; facts only some places have, like language, cannot keep others in).
  const narrowed = cands.filter((c) => understood.every((t) => evalTest(t, c.facts) === true));
  // If its memory let it down and nothing fits, fall back to the last clue alone.
  if (narrowed.length) cands = narrowed;
  else if (view.tests.length) {
    const last = view.tests[view.tests.length - 1];
    const f = cands.filter((c) => evalTest(last, c.facts) === true);
    if (f.length) cands = f;
  }
  if (!cands.length) return { type: 'wait', confidence: 0, remaining: 0 };
  // Hunches: a fixed, hidden lean per place for this bot and round.
  let total = 0;
  let top = null;
  for (const c of cands) {
    // a person thinks of well-known places first: tier 1 (famous) … 4 (obscure)
    const w = (FAME[c.tier] ?? 1) * Math.exp(0.35 * createRng(mind.seed, 'hunch', c.id).normal());
    total += w;
    if (!top || w > top.w || (w === top.w && c.id < top.id)) top = { id: c.id, w };
  }
  const confidence = top.w / total;
  const threshold = thresholdFor(mind.temperament, mind.mood);
  if (view.lastClue || confidence >= threshold) {
    return { type: 'guess', id: top.id, confidence, remaining: cands.length };
  }
  return { type: 'wait', confidence, remaining: cands.length };
}

// --- drawing -----------------------------------------------------------------

function smoothRing(ring, radius) {
  if (radius < 1) return ring;
  const n = ring.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    let sx = 0;
    let sy = 0;
    for (let k = -radius; k <= radius; k++) {
      const p = ring[(i + k + n) % n];
      sx += p[0];
      sy += p[1];
    }
    out[i] = [sx / (2 * radius + 1), sy / (2 * radius + 1)];
  }
  return out;
}

/**
 * Sketch an outline like a person drawing from memory.
 * @param {number[][]} outline  ring in outline units
 * @param {number} skill        0 (wild) .. 1 (near perfect)
 * @param {object} rng          seeded rng
 * @param {number} [size=1000]  canvas size in px
 * @returns {number[][][]} strokes in canvas px
 */
export function sketch(outline, skill, rng, size = 1000) {
  const u = 1 - skill;
  const n = 180;
  let ring = resample(outline, n);
  const c = centroid(ring);
  const r = maxRadius(ring, c) || 1;
  // Lose detail: peninsulas and bays melt away for weaker hands.
  ring = smoothRing(ring, Math.round(u * u * 26));
  // Global distortion: skew of proportions and a slight tilt.
  const stretch = Math.exp(0.32 * u * rng.normal());
  const tilt = (12 * u * rng.normal() * Math.PI) / 180;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  // Low-frequency wobble along the outline.
  const waves = [0, 1, 2].map(() => ({
    k: 2 + rng.int(6),
    amp: rng.range(0.3, 1) * 0.16 * u * u * r,
    ph: rng.range(0, 2 * Math.PI),
  }));
  const jitter = 0.012 * u * r;
  const pts = ring.map(([x, y], i) => {
    let dx = x - c[0];
    let dy = y - c[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    let off = 0;
    for (const w of waves) off += w.amp * Math.sin((w.k * 2 * Math.PI * i) / n + w.ph);
    dx += (dx / len) * off + jitter * rng.normal();
    dy += (dy / len) * off + jitter * rng.normal();
    dx *= stretch;
    dy /= stretch;
    return [dx * cos - dy * sin, dx * sin + dy * cos];
  });
  const simple = simplifyRing(pts, (0.004 + 0.05 * u * u) * r);
  // Place on the canvas at a random size and position (the judge ignores both).
  const b = bbox(simple);
  const s = (size * rng.range(0.5, 0.8)) / Math.max(b.w, b.h, 1e-9);
  const ox = rng.range(0.1, 0.9) * size - (b.minX + b.w / 2) * s;
  const oy = rng.range(0.1, 0.9) * size - (b.minY + b.h / 2) * s;
  const placed = simple.map(([x, y]) => [Math.round((x * s + ox) * 10) / 10, Math.round((y * s + oy) * 10) / 10]);
  // Sometimes in two strokes with a small gap; the judge rejoins them.
  if (placed.length > 12 && rng.chance(0.3)) {
    const cut = 4 + rng.int(placed.length - 8);
    return [placed.slice(0, cut), placed.slice(cut + 1)];
  }
  return [placed];
}

// --- talk --------------------------------------------------------------------

/**
 * Pick a one-liner. Item-specific lines are preferred when present.
 * @param {object} pack prepared pack
 * @param {string} kind e.g. 'early', 'late', 'miss', 'drawGood', 'drawBad'
 */
export function line(pack, kind, { itemId, lang = 'en', rng }) {
  const item = itemId ? pack.byId.get(itemId) : null;
  const own = item?.taunts?.[kind];
  const pool = (own && own.length ? own : pack.taunts?.[kind]) ?? [];
  if (!pool.length) return '';
  const pick = pool[rng.int(pool.length)];
  const text = pick[lang] ?? pick.en ?? '';
  const name = item ? item.names[lang] ?? item.names.en : '';
  return text.replaceAll('{place}', name);
}
