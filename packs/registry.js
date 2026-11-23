// Pack registry. Packs are loaded only when needed (dynamic import works in
// the browser and in Node, and the service worker caches the files).

import { preparePack } from '../engine/pack.js';

export const PACKS = Object.freeze([
  { id: 'world', load: () => Promise.all([import('./world/pack.js'), import('./world/outlines.js')]) },
  { id: 'us-states', load: () => Promise.all([import('./us-states/pack.js'), import('./us-states/outlines.js')]) },
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
