import { loadPack } from '../packs/registry.js';
export const world = await loadPack('world');
export const us = await loadPack('us-states');

/** Deep-freeze an object so any mutation throws in strict mode. */
export function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}
