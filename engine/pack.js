// Content packs: validation, preparation and pool selection.
//
// A pack is a data module (see packs/*/pack.js) plus an outlines module
// generated from public-domain map data. Packs are checked on load: a pack
// that fails validation is refused, never half-loaded.

import { LANGS, buildIndex, fold } from './names.js';
import { evalTest, opOf } from './clues.js';
import { area } from './geometry.js';
import { prepareTarget, unflatten } from './judge.js';

/** Clues shown per round: one from each difficulty tier, hardest first. */
export const CLUES_PER_ITEM = 5;
export const TIERS = 5;

const AND = { en: ' and ', de: ' und ', it: ' e ', es: ' y ', fr: ' et ', pt: ' e ', id: ' dan ', zh: '和', hi: ' और ', ja: 'と', ko: ' 및 ', ar: ' و', th: ' และ ' };
const COMMA = { zh: '、', ja: '、', ar: '، ' };

/**
 * Turn a pack's compact clue entries into { tier, text, test } objects.
 * An entry is one of:
 *   { text, test, tier? }             written out (tier defaults to position + 1)
 *   [tier, templateName, param?]       from pack.templates, words from pack.vocab
 *   [tier, slug, { en, de, … }, test?] free text; its test is `test`, else { f: 'tags', has: slug }
 * Free-text slugs are added to the item's facts.tags, so the bot can use them.
 */
export function expandPack(pack) {
  const T = pack.templates ?? {};
  const V = pack.vocab ?? {};
  const word = (vocab, v, l) => {
    const e = V[vocab]?.[v];
    if (!e) throw new Error(`vocab ${vocab}.${v} missing`);
    return e[l] ?? e.en;
  };
  const render = (tpl, param, l) => {
    let x = '';
    if (param !== undefined) {
      if (Array.isArray(param)) {
        const ws = param.map((v) => word(tpl.vocab, v, l));
        x = ws.length > 1 ? `${ws.slice(0, -1).join(COMMA[l] ?? ', ')}${AND[l]}${ws[ws.length - 1]}` : ws[0];
      } else x = tpl.vocab ? word(tpl.vocab, param, l) : String(param);
    }
    const s = tpl.text[l].replaceAll('{x}', x).replace(/\.\.$/, '.');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const items = (pack.items ?? []).map((it) => {
    if (!Array.isArray(it?.clues)) return it;
    const tags = new Set(it.facts?.tags ?? []);
    const clues = it.clues.map((c, k) => {
      if (!Array.isArray(c)) return { ...c, tier: c.tier ?? k + 1 };
      const [tier, name, arg] = c;
      if (T[name]) {
        const tpl = T[name];
        const value = 'value' in tpl ? tpl.value : arg;
        const text = Object.fromEntries(LANGS.map((l) => [l, render(tpl, arg, l)]));
        return { tier, text, test: { f: tpl.f, [tpl.op]: value } };
      }
      tags.add(name);
      // a free sentence may carry its own test ([tier, slug, text, test]); else its tag
      const own = c[3] && typeof c[3] === 'object' && typeof c[3].f === 'string' ? c[3] : null;
      return { tier, text: arg, test: own ?? { f: 'tags', has: name } };
    });
    return { ...it, facts: { ...it.facts, tags: [...tags] }, clues };
  });
  return { ...pack, items };
}

function checkText(obj, where, errors) {
  if (!obj || typeof obj !== 'object') {
    errors.push(`${where}: missing translations`);
    return;
  }
  for (const l of LANGS) {
    if (typeof obj[l] !== 'string' || !obj[l].trim()) errors.push(`${where}: missing ${l}`);
  }
}

/**
 * Validate a pack against its outlines.
 * @returns {{ok:boolean, errors:string[], warnings:string[]}}
 */
export function validatePack(rawPack, outlines) {
  const errors = [];
  let pack;
  try {
    pack = expandPack(rawPack ?? {});
  } catch (e) {
    return { ok: false, errors: [String(e.message)], warnings: [] };
  }
  if (!rawPack || typeof rawPack !== 'object') return { ok: false, errors: ['pack is not an object'], warnings: [] };
  const warnings = [];
  if (!/^[a-z0-9-]+$/.test(pack.id ?? '')) errors.push('pack.id must be kebab-case');
  checkText(pack.title, 'pack.title', errors);
  if (!Array.isArray(pack.sources) || !pack.sources.length) errors.push('pack.sources: credit the map and fact sources');
  const items = Array.isArray(pack.items) ? pack.items : [];
  if (!items.length) errors.push('pack.items is empty');

  const diffs = pack.difficulties ?? {};
  const diffIds = Object.keys(diffs);
  if (!diffIds.length) errors.push('pack.difficulties is empty');
  for (const d of diffIds) {
    checkText(diffs[d].label, `difficulty ${d}.label`, errors);
    if (!Number.isInteger(diffs[d].maxTier)) errors.push(`difficulty ${d}: maxTier must be an integer`);
  }

  const ids = new Set();
  const names = new Map();
  for (const it of items) {
    const w = `item ${it?.id ?? '?'}`;
    if (!it || typeof it.id !== 'string' || !it.id) {
      errors.push('item without id');
      continue;
    }
    if (ids.has(it.id)) errors.push(`${w}: duplicate id`);
    ids.add(it.id);
    checkText(it.names, `${w}.names`, errors);
    for (const l of LANGS) {
      const k = fold(it.names?.[l]);
      if (k && names.has(k) && names.get(k) !== it.id) errors.push(`${w}: name "${it.names[l]}" collides with ${names.get(k)}`);
      if (k) names.set(k, it.id);
    }
    if (!Number.isInteger(it.tier) || it.tier < 1) errors.push(`${w}: tier must be a positive integer`);
    const geo = outlines?.items?.[it.geo];
    if (!geo) errors.push(`${w}: no outline for geo "${it.geo}"`);
    else {
      const ring = unflatten(geo.pts);
      if (ring.length < 8 || !(area(ring) > 0)) errors.push(`${w}: outline is degenerate`);
      if (geo.share < 0.8 && !it.mainlandOnly) warnings.push(`${w}: main landmass is ${Math.round(geo.share * 100)} % of the area; set mainlandOnly so the rules text says so`);
    }
    if (!it.facts || typeof it.facts !== 'object') errors.push(`${w}: facts missing`);
    if (!Array.isArray(it.clues) || !it.clues.length) {
      errors.push(`${w}: has no clues`);
    } else {
      for (let tier = 1; tier <= TIERS; tier++) {
        if (!it.clues.some((c) => c.tier === tier)) errors.push(`${w}: no clue at tier ${tier}`);
      }
      it.clues.forEach((c, k) => {
        if (!(Number.isInteger(c.tier) && c.tier >= 1 && c.tier <= TIERS)) errors.push(`${w}.clues[${k}]: tier must be 1..${TIERS}`);
        checkText(c.text, `${w}.clues[${k}].text`, errors);
        if (!c.test || !opOf(c.test)) errors.push(`${w}.clues[${k}]: test missing or has no operator`);
        else {
          const r = evalTest(c.test, it.facts);
          if (r !== true) errors.push(`${w}.clues[${k}]: test ${JSON.stringify(c.test)} is ${r === undefined ? 'unknown' : 'false'} for its own facts`);
        }
        if (/\d{4,}|\d+(\.\d+)?\s?(km|million|%|mi\b)/i.test(c.text?.en ?? '')) warnings.push(`${w}.clues[${k}]: looks like a raw statistic`);
      });
      const texts = it.clues.map((c) => c.text?.en);
      if (new Set(texts).size !== texts.length) errors.push(`${w}: two clues say the same thing`);
    }
    checkText(it.fact, `${w}.fact`, errors);
  }

  // Clues must identify their place: every last-tier clue, on its own, fits
  // only that place, so any five drawn for a round single it out.
  for (const it of items) {
    if (!Array.isArray(it.clues)) continue;
    it.clues.forEach((c, k) => {
      if (c.tier !== TIERS || !c.test) return;
      const others = items.filter((o) => o !== it && evalTest(c.test, o.facts) === true);
      if (others.length) errors.push(`item ${it.id}: final-tier clue ${k} (${JSON.stringify(c.test)}) also fits ${others.map((o) => o.id).join(', ')}`);
    });
  }

  for (const kind of ['early', 'late', 'miss', 'drawGood', 'drawBad']) {
    const list = pack.taunts?.[kind];
    if (!Array.isArray(list) || !list.length) errors.push(`taunts.${kind} is empty`);
    else list.forEach((t, i) => checkText(t, `taunts.${kind}[${i}]`, errors));
  }

  const r = pack.settings?.rounds;
  if (!r || !(r.min >= 1 && r.max >= r.min)) errors.push('settings.rounds needs min ≤ max');
  for (const d of diffIds) {
    const n = items.filter((it) => it.tier <= diffs[d].maxTier).length;
    if (r && n < r.min) errors.push(`difficulty ${d}: only ${n} places, fewer than the minimum ${r.min} rounds`);
    else if (r && n < r.max) warnings.push(`difficulty ${d}: ${n} places, so games cap at ${n} rounds`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validate and prepare a pack for play. Throws when invalid.
 * Outline targets are prepared lazily per item (see targetFor).
 */
export function preparePack(pack, outlines) {
  const v = validatePack(pack, outlines);
  if (!v.ok) {
    const e = new Error(`pack ${pack?.id} is invalid:\n  ${v.errors.join('\n  ')}`);
    e.errors = v.errors;
    throw e;
  }
  const full = expandPack(pack);
  const items = full.items.map((it) => {
    const geo = outlines.items[it.geo];
    return Object.freeze({ ...it, outline: unflatten(geo.pts), centroid: geo.c, lon: geo.c[0], lat: geo.c[1], kmPerUnit: geo.km, mainShare: geo.share });
  });
  const byId = new Map(items.map((it) => [it.id, it]));
  const targets = new Map();
  return Object.freeze({
    ...full,
    items,
    byId,
    index: buildIndex(items),
    warnings: v.warnings,
    targetFor(id) {
      if (!targets.has(id)) targets.set(id, prepareTarget(byId.get(id).outline));
      return targets.get(id);
    },
  });
}

/** Item ids playable at a difficulty, in pack order. */
export function poolFor(pack, difficulty) {
  const d = pack.difficulties[difficulty];
  if (!d) throw new Error(`unknown difficulty "${difficulty}"`);
  return pack.items.filter((it) => it.tier <= d.maxTier).map((it) => it.id);
}

/** True when an item has a position (the globe on the results screen uses it). */
export function hasCoords(item) {
  return !!item && Number.isFinite(item.lat) && Number.isFinite(item.lon);
}

/**
 * Pick the clues for one round: one per tier, hardest first, at random from
 * each tier's pool (rng: a seeded generator), skipping sentences in `shown`
 * (English text) while the tier has others. Returns indices into item.clues.
 */
export function pickClues(item, rng, shown = new Set()) {
  const out = [];
  for (let tier = 1; tier <= TIERS; tier++) {
    const all = [];
    item.clues.forEach((c, k) => {
      if (c.tier === tier) all.push(k);
    });
    const fresh = all.filter((k) => !shown.has(item.clues[k].text.en));
    const pool = fresh.length ? fresh : all;
    out.push(pool[rng.int(pool.length)]);
  }
  return out;
}
