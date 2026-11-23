// Seeded randomness. Every random choice in the engine flows through here so
// that a game can be replayed exactly from its seed and action log.
//
// Streams are never stored in game state: they are re-derived on demand from
// the game seed plus a label path (e.g. seed → "round" 3 → "seat" 1 → "bot").
// That keeps state plain JSON and makes each decision independent of how many
// other random numbers were drawn before it.

/** 32-bit FNV-1a hash of a string. */
export function hashString(str) {
  let h = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Final avalanche mix (murmur3 fmix32). */
function mix32(h) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Derive a child seed from a seed and any number of labels (strings or numbers). */
export function deriveSeed(seed, ...labels) {
  let h = mix32((seed >>> 0) ^ 0x9e3779b9);
  for (const label of labels) {
    h = mix32(h ^ hashString(label));
    h = (h + 0x6d2b79f5) >>> 0;
  }
  return h;
}

/** Normalise a user-facing seed (number or string) to uint32. */
export function toSeed(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value >>> 0;
  return hashString(value ?? '');
}

/**
 * Create a seeded generator (mulberry32). Returns helpers that all consume the
 * same underlying stream.
 */
export function createRng(seed, ...labels) {
  let a = labels.length ? deriveSeed(seed >>> 0, ...labels) : seed >>> 0;
  const base = a;

  function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const rng = {
    seed: base,
    next,
    /** Float in [min, max). */
    range(min, max) {
      return min + (max - min) * next();
    },
    /** Integer in [0, n). */
    int(n) {
      return Math.floor(next() * n);
    },
    chance(p) {
      return next() < p;
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    /** New shuffled copy (Fisher–Yates). */
    shuffle(arr) {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    /** Standard normal via Box–Muller. */
    normal() {
      let u = 0;
      while (u === 0) u = next();
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    /** Independent child stream. */
    fork(...more) {
      return createRng(deriveSeed(base, ...more));
    },
  };
  return rng;
}
