// Pack registry. Packs are loaded only when needed (dynamic import works in
// the browser and in Node, and the service worker caches the files).

import { preparePack } from '../engine/pack.js';

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });

// Titles live here too so the menu can show every pack without loading it.
export const PACKS = Object.freeze([
  {
    id: 'world',
    mark: '🌍',
    title: t('Countries', 'Länder', 'Paesi', 'Países', 'Pays'),
    blurb: t('Outlines of the world', 'Umrisse der Welt', 'Contorni del mondo', 'Contornos del mundo', 'Contours du monde'),
    load: () => Promise.all([import('./world/pack.js'), import('./world/outlines.js')]),
    globe: () => import('./world/globe.js'),
    focus: [10, 25],
  },
  {
    id: 'us-states',
    mark: '🇺🇸',
    title: t('US States', 'US-Bundesstaaten', 'Stati USA', 'Estados de EE. UU.', 'États américains'),
    blurb: t('The shapes of the states', 'Die Formen der Staaten', 'Le forme degli stati', 'Las formas de los estados', 'Les formes des États'),
    load: () => Promise.all([import('./us-states/pack.js'), import('./us-states/outlines.js')]),
    globe: () => import('./us-states/globe.js'),
    focus: [-98, 38],
  },
]);

const cache = new Map();

/** Load, validate and prepare a pack by id. Throws if it fails validation. */
export function loadPack(id) {
  if (!cache.has(id)) {
    const entry = PACKS.find((p) => p.id === id);
    if (!entry) return Promise.reject(new Error(`unknown pack "${id}"`));
    const p = entry.load().then(([pack, outlines]) => preparePack(pack.default, outlines.default));
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return cache.get(id);
}

/** Globe outlines (lon/lat) for a pack, keyed like the pack's `geo` codes. */
export function loadGlobe(id) {
  const entry = PACKS.find((p) => p.id === id);
  return entry ? entry.globe().then((m) => m.default) : Promise.reject(new Error(`unknown pack "${id}"`));
}
