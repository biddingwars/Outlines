// Clue tests: every clue carries a machine-readable test over an item's facts,
// so the bot can reason about clues without reading prose, and the pack
// validator can prove each clue is true of its own place.
//
// A test is { f: factKey, <op>: value }. Ops:
//   eq      fact === value
//   ne      fact !== value
//   has     array fact contains value
//   lacks   array fact does not contain value
//   all     array fact contains every value in the list
//   any     array fact contains at least one value in the list
//   count   array fact has exactly this many entries
//   in      scalar fact is one of the listed values
//   same    array fact holds exactly the listed values (any order)

export const OPS = ['eq', 'ne', 'has', 'lacks', 'all', 'any', 'count', 'in', 'same'];

export function opOf(test) {
  return OPS.find((op) => op in test) ?? null;
}

/**
 * Evaluate a test against an item's facts.
 * @returns {boolean|undefined} undefined when the fact is unknown for that item
 */
export function evalTest(test, facts) {
  if (!test || typeof test.f !== 'string') return undefined;
  const v = facts?.[test.f];
  if (v === undefined || v === null) return undefined;
  const op = opOf(test);
  const x = test[op];
  const arr = Array.isArray(v) ? v : null;
  switch (op) {
    case 'eq':
      return v === x;
    case 'ne':
      return v !== x;
    case 'in':
      return Array.isArray(x) && x.includes(v);
    case 'has':
      return arr ? arr.includes(x) : v === x;
    case 'lacks':
      return arr ? !arr.includes(x) : v !== x;
    case 'all':
      return !!arr && Array.isArray(x) && x.every((e) => arr.includes(e));
    case 'any':
      return !!arr && Array.isArray(x) && x.some((e) => arr.includes(e));
    case 'count':
      return !!arr && arr.length === x;
    case 'same':
      return !!arr && Array.isArray(x) && arr.length === x.length && x.every((e) => arr.includes(e));
    default:
      return undefined;
  }
}

/** Items (from `items`) consistent with every test; unknown facts keep an item in. */
export function filterByTests(items, tests) {
  return items.filter((it) => tests.every((t) => evalTest(t, it.facts) !== false));
}
