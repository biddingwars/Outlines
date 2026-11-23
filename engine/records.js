// The on-device record: won/lost per pack against the bot, and the best
// drawing per place. Pure functions; the view loads and saves the object.

import { simplify } from './geometry.js';

export const RECORD_VERSION = 1;

export function emptyRecord() {
  return { v: RECORD_VERSION, packs: {}, best: {} };
}

const nonNegInt = (x) => (Number.isInteger(x) && x >= 0 ? x : 0);

/** Accept whatever came out of storage; anything malformed is dropped. */
export function sanitizeRecord(raw) {
  const r = emptyRecord();
  if (!raw || typeof raw !== 'object' || raw.v !== RECORD_VERSION) return r;
  for (const [id, p] of Object.entries(raw.packs ?? {})) {
    if (!/^[a-z0-9-]+$/.test(id) || !p || typeof p !== 'object') continue;
    r.packs[id] = { won: nonNegInt(p.won), lost: nonNegInt(p.lost), tied: nonNegInt(p.tied), streak: Number.isInteger(p.streak) ? p.streak : 0 };
  }
  for (const [key, b] of Object.entries(raw.best ?? {})) {
    if (!b || typeof b !== 'object' || !(b.accuracy >= 0 && b.accuracy <= 1) || !Array.isArray(b.rings)) continue;
    r.best[key] = { accuracy: b.accuracy, name: String(b.name ?? '').slice(0, 24), rings: b.rings, at: String(b.at ?? '') };
  }
  return r;
}

function compactRings(rings) {
  return rings.map((ring) => {
    const s = ring.length > 80 ? simplify(ring, 1.5) : ring;
    return s.map(([x, y]) => [Math.round(x), Math.round(y)]);
  });
}

/**
 * Fold a finished game into the record.
 * - won/lost only for solo games (one human vs bots); ties counted apart
 * - practice games change nothing
 * Best drawings are kept separately with recordDrawing().
 * @param {object} res  results(pack, state)
 * @param {object} opts { packId }
 */
export function recordGame(record, res, { packId }) {
  if (res.practice) return record;
  const r = structuredClone(record);
  const humans = res.seats.filter((s) => s.kind === 'human');
  if (humans.length === 1) {
    const me = humans[0];
    const p = (r.packs[packId] ??= { won: 0, lost: 0, tied: 0, streak: 0 });
    const top = res.winners;
    if (top.length === 1 && top[0] === me.seat) {
      p.won++;
      p.streak = p.streak > 0 ? p.streak + 1 : 1;
    } else if (top.includes(me.seat)) {
      p.tied++;
    } else {
      p.lost++;
      p.streak = p.streak < 0 ? p.streak - 1 : -1;
    }
  }
  return r;
}

/** Keep the best drawing per place; call once per human turn. */
export function recordDrawing(record, { packId, itemId, accuracy, rings, name, at = '' }) {
  if (!rings?.length) return record;
  const key = `${packId}:${itemId}`;
  const prev = record.best[key];
  if (prev && prev.accuracy >= accuracy) return record;
  const r = structuredClone(record);
  r.best[key] = { accuracy, name: String(name ?? '').slice(0, 24), rings: compactRings(rings), at };
  return r;
}
