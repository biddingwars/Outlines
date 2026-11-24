// Name matching and autocomplete across every language of the game.

export const LANGS = Object.freeze(['en', 'de', 'it', 'es', 'fr', 'pt', 'id', 'zh', 'hi', 'ja', 'ko', 'ar', 'th']);
/** Languages written in a script other than Latin. */
export const NON_LATIN = Object.freeze(['zh', 'hi', 'ja', 'ko', 'ar', 'th']);

/** Fold a name for comparison: no accents, case, punctuation or articles. Letters of
 * every script are kept (NFC, so Hangul, kana and Devanagari stay whole). */
export function fold(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ø/g, 'o')
    .replace(/&/g, ' and ')
    .replace(/['’`´.]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^(the|la|le|les|el|los|las|il|lo|gli|i|die|der|das|l) /, '');
}

/**
 * Build a search index for a pack's items.
 * @param {Array<{id:string, names:Object<string,string>, aliases?:string[]}>} items
 */
export function buildIndex(items) {
  const entries = [];
  for (const it of items) {
    const seen = new Set();
    const add = (label, lang) => {
      const key = fold(label);
      if (!key || seen.has(key)) return;
      seen.add(key);
      entries.push({ id: it.id, key, words: key.split(' '), label, lang });
    };
    for (const l of LANGS) if (it.names?.[l]) add(it.names[l], l);
    for (const a of it.aliases ?? []) add(a, null);
  }
  const byKey = new Map();
  for (const e of entries) {
    if (!byKey.has(e.key)) byKey.set(e.key, new Set());
    byKey.get(e.key).add(e.id);
  }
  const names = new Map(items.map((it) => [it.id, it.names]));
  return { entries, byKey, names };
}

function editDistanceAtMost1(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else if (i + 1 < la && a[i] === b[j + 1] && a[i + 1] === b[j]) {
      // transposition
      i += 2;
      j += 2;
    } else {
      i++;
      j++;
    }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

/**
 * Resolve typed text to an item id: exact match on any name in any language,
 * else a single unambiguous one-typo match (names of 5+ letters).
 * @returns {string|null}
 */
export function resolve(index, text) {
  const key = fold(text);
  if (!key) return null;
  const exact = index.byKey.get(key);
  if (exact) return exact.size === 1 ? [...exact][0] : null;
  if (key.length < 5) return null;
  const hits = new Set();
  for (const e of index.entries) if (e.key.length >= 5 && editDistanceAtMost1(key, e.key)) hits.add(e.id);
  return hits.size === 1 ? [...hits][0] : null;
}

/**
 * Autocomplete. Matches the start of the name or of any word in it, in any
 * language; shows the name in the player's language.
 * @returns {Array<{id:string, label:string, matched:string|null}>}
 */
export function suggest(index, text, lang = 'en', limit = 6) {
  const key = fold(text);
  if (!key) return [];
  const best = new Map();
  for (const e of index.entries) {
    let rank = -1;
    if (e.key === key) rank = 0;
    else if (e.key.startsWith(key)) rank = 1;
    else if (e.words.some((w) => w.startsWith(key))) rank = 2;
    else if (key.length >= 3 && e.key.includes(key)) rank = 3;
    if (rank < 0) continue;
    const prev = best.get(e.id);
    const score = rank * 10 + (e.lang === lang ? 0 : 1);
    if (!prev || score < prev.score) best.set(e.id, { score, e });
  }
  return [...best.values()]
    .map(({ score, e }) => {
      const label = index.names.get(e.id)?.[lang] ?? index.names.get(e.id)?.en ?? e.label;
      return { id: e.id, label, matched: fold(label) === e.key ? null : e.label, score };
    })
    .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map(({ id, label, matched }) => ({ id, label, matched }));
}
