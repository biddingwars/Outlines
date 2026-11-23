// Content packs: validation, preparation and pool selection.
//
// A pack is a data module (see packs/*/pack.js) plus an outlines module
// generated from public-domain map data. Packs are checked on load: a pack
// that fails validation is refused, never half-loaded.

import { LANGS, buildIndex, fold } from './names.js';
import { evalTest, opOf } from './clues.js';
import { area } from './geometry.js';
import { prepareTarget, unflatten } from './judge.js';

export const CLUES_PER_ITEM = 5;

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
export function validatePack(pack, outlines) {
  const errors = [];
  const warnings = [];
  if (!pack || typeof pack !== 'object') return { ok: false, errors: ['pack is not an object'], warnings };
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
    if (!Array.isArray(it.clues) || it.clues.length !== CLUES_PER_ITEM) {
      errors.push(`${w}: needs exactly ${CLUES_PER_ITEM} clues`);
    } else {
      it.clues.forEach((c, k) => {
        checkText(c.text, `${w}.clues[${k}].text`, errors);
        if (!c.test || !opOf(c.test)) errors.push(`${w}.clues[${k}]: test missing or has no operator`);
        else {
          const r = evalTest(c.test, it.facts);
          if (r !== true) errors.push(`${w}.clues[${k}]: test ${JSON.stringify(c.test)} is ${r === undefined ? 'unknown' : 'false'} for its own facts`);
        }
        if (/\d{4,}|\d+(\.\d+)?\s?(km|million|%|mi\b)/i.test(c.text?.en ?? '')) warnings.push(`${w}.clues[${k}]: looks like a raw statistic`);
      });
    }
    checkText(it.fact, `${w}.fact`, errors);
  }

  // Clues must identify their place: all five together match only it.
  for (const it of items) {
    if (!Array.isArray(it.clues) || it.clues.length !== CLUES_PER_ITEM) continue;
    const tests = it.clues.map((c) => c.test);
    const others = items.filter((o) => o !== it && tests.every((t) => evalTest(t, o.facts) === true));
    if (others.length) errors.push(`item ${it.id}: its clues also fit ${others.map((o) => o.id).join(', ')}`);
    // The last clue should be easy: on its own it should leave few candidates.
    const last = tests[CLUES_PER_ITEM - 1];
    const fit = items.filter((o) => evalTest(last, o.facts) !== false).length;
    if (fit > 3) warnings.push(`item ${it.id}: final clue alone fits ${fit} places`);
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
  const items = pack.items.map((it) => {
    const geo = outlines.items[it.geo];
    return Object.freeze({ ...it, outline: unflatten(geo.pts), centroid: geo.c, kmPerUnit: geo.km, mainShare: geo.share });
  });
  const byId = new Map(items.map((it) => [it.id, it]));
  const targets = new Map();
  return Object.freeze({
    ...pack,
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
