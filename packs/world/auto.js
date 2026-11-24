// Builds every country's item from open data: facts from source.js (world-
// countries, ODbL), lists.js and the outline (latitudes, crossings), and a pool
// of 20 clues, 4 per tier. Tier 1 is the vaguest, tier 5 gives the place away.
// A tier short of clues borrows the vaguer tiers' leftovers (a harder clue in an
// easier slot is fine); tier 5 only takes give-aways, each true of one place.
import { DRIVE_LEFT, MONARCHY, GOV_UNCLEAR, EU, SUMMER_OLYMPICS, WORLD_CUP } from './lists.js';
import { LANGS, NON_LATIN } from '../../engine/names.js';

export const PER_TIER = 4;

export const slug = (s) =>
  String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const fold = (s) => slug(s).replace(/-/g, '');
export const flagEmoji = (cc) => [...cc].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
const letters = (s) => [...String(s)].filter((ch) => /\p{L}/u.test(ch));
const oneWord = (s) => /^\p{L}+$/u.test(s);

const FAMILIES = [
  ['cfa-franc', /cfa franc/i], ['euro', /^euro$/i], ['dollar', /dollar/i], ['franc', /franc/i], ['peso', /peso/i],
  ['pound', /pound/i], ['dinar', /dinar|denar/i], ['rupee', /rupee/i], ['shilling', /shilling/i], ['krone', /kron|krón/i],
  ['riyal', /riyal|rial/i], ['dirham', /dirham/i], ['rand', /rand$/i], ['won', /won$/i], ['ruble', /ruble/i],
  ['lira', /lira/i], ['kwacha', /kwacha/i], ['leu', /leu$/i], ['manat', /manat/i], ['yuan', /yuan/i], ['yen', /yen$/i], ['real', /real$/i],
];
export function currencyFact(names) {
  const n = names[0]; // the country's own currency comes first in the data
  for (const [fam, re] of FAMILIES) if (n && re.test(n)) return { family: fam };
  if (!n) return null;
  const word = n.replace(/ soberano$/i, '').split(' ').pop(); // Venezuelan bolívar soberano → bolívar
  return word && word.length > 2 ? { word } : null;
}

/** Difficulty tier of a country: 1 big and famous … 4 micro-states. */
export function countryTier(s) {
  if (s.area < 1000) return 4;
  if (s.pop >= 60 || s.area >= 2e6) return 1;
  if (s.pop >= 15 || s.area >= 3e5) return 2;
  return 3;
}

const sizeBand = (a) => (a >= 1e6 ? 'huge' : a >= 3e5 ? 'large' : a >= 5e4 ? 'medium' : a >= 1e3 ? 'small' : 'tiny');
const peopleBand = (p) => (p >= 100 ? 'over100' : p >= 30 ? 'over30' : p >= 10 ? 'over10' : p >= 1 ? 'over1' : 'under1');

// A fixed shuffle, so the scrambled name never changes between builds.
function scramble(word, seed) {
  const a = [...word.toUpperCase()];
  let h = seed;
  for (let i = a.length - 1; i > 0; i--) {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  const out = a.join('');
  return out === word.toUpperCase() && a.length > 1 ? out.slice(1) + out[0] : out;
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

function shuffled(list, seed) {
  const a = list.slice();
  let h = seed;
  for (let i = a.length - 1; i > 0; i--) {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fill(frame, values) {
  const o = {};
  for (const l of LANGS) {
    if (typeof frame[l] !== 'string') continue; // untranslated: the pack validator reports it
    const s = frame[l].replaceAll('{x}', values[l]);
    o[l] = s.charAt(0).toUpperCase() + s.slice(1);
  }
  return o;
}


/**
 * Facts and candidate clues per tier for one country.
 * @param id ISO alpha-3 (Kosovo: UNK), s its source entry, geo its outline
 *        entry, all every source entry, frames the per-language sentences,
 *        vocabLangs official languages that have words in templates.js
 */
export function autoItem(id, s, geo, all, frames, vocabLangs) {
  const cc = s.iso2;
  const cross = geo?.cross ?? [];
  const lat = geo?.lat ?? [0, 0];
  const hemisphere = lat[0] > 0 ? 'north' : lat[1] < 0 ? 'south' : 'both';
  const zone = lat[0] > 23.44 ? 'north' : lat[1] < -23.44 ? 'south' : lat[0] > -23.44 && lat[1] < 23.44 ? 'tropics' : undefined;
  const continent = s.region === 'Americas' ? (s.subregion === 'South America' ? 'south-america' : 'north-america') : s.region.toLowerCase();
  const cur = currencyFact(s.currencies);
  const iddZone = s.idd ? Number(s.idd[1]) : undefined;
  const facts = {
    iso2: cc,
    continent,
    subregion: s.subregion,
    hemisphere,
    zone,
    meridian: geo?.meridian,
    latMin: lat[0],
    latMax: lat[1],
    southOf: -lat[1],
    equator: cross.includes('equator'),
    tropics: cross.filter((c) => c !== 'equator'),
    drive: DRIVE_LEFT.includes(cc) ? 'left' : 'right',
    landlocked: s.landlocked,
    neighbours: s.borders,
    official: s.official,
    currency: cur ? (cur.family ?? cur.word) : undefined,
    eu: EU.includes(cc),
    summerOlympics: SUMMER_OLYMPICS.includes(cc),
    worldCup: WORLD_CUP.includes(cc),
    size: sizeBand(s.area),
    people: peopleBand(s.pop),
    capital: s.capital ? slug(s.capital.en) : undefined,
    tld: s.tld ?? undefined,
    idd: s.idd ?? undefined,
    iddZone,
    native: s.native,
  };
  if (!GOV_UNCLEAR.includes(cc)) facts.monarchy = MONARCHY.includes(cc);
  if (!s.borders.length && !s.landlocked && s.area < 1e6) facts.islands = true;

  const c = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const free = (tier, key, text) => c[tier].push([`${id.toLowerCase()}-${key}`, text, true]);
  // tier 1: broad facts shared by many places (continent first, the rest in a
  // fixed per-country order so pools differ from one country to the next)
  const t1 = [['people', facts.people], ['size', facts.size], [facts.drive === 'left' ? 'drive_left' : 'drive_right'], [s.landlocked ? 'landlocked' : 'has_coast']];
  if (facts.monarchy !== undefined) t1.push([facts.monarchy ? 'monarchy' : 'republic']);
  if (facts.meridian === 'east' || facts.meridian === 'west') t1.push([facts.meridian]);
  if (hemisphere === 'north' || hemisphere === 'south') t1.push([hemisphere]);
  if (zone) t1.push(['zone', zone]);
  const rare = [];
  if (facts.equator) rare.push(['equator']);
  for (const line of facts.tropics) rare.push(['tropic', line]);
  if (facts.summerOlympics) rare.push(['olympics']);
  if (facts.eu) rare.push(['eu']);
  c[1].push(['continent', continent], ...rare, ...shuffled(t1, hash(id)));
  // tier 2: narrows to a region or a group
  if (s.subregion !== 'North America' && s.subregion !== 'South America') c[2].push(['subregion', s.subregion]);
  if (!s.borders.length) c[2].push(['no_border']);
  else if (s.borders.length === 1) c[2].push(['one_border']);
  else c[2].push(['borders_n', s.borders.length]);
  if (cur?.family) c[2].push(['currency_family', cur.family]);
  if (iddZone) c[2].push(['idd_zone', iddZone]);
  if (facts.islands) c[2].push(['islands']);
  if (facts.worldCup) c[2].push(['worldcup']);
  const narrow = lat[1] - lat[0] <= 15; // spread-out states (overseas parts) get no latitude band
  if (narrow && lat[0] >= 5) c[2].push(['lat_above', Math.floor(lat[0] / 5) * 5]);
  else if (narrow && lat[1] <= -5) c[2].push(['lat_south', Math.floor(-lat[1] / 5) * 5]);
  // tier 3: languages, a neighbour, the shape of its name
  const nb = s.borders.filter((b) => all[b]).sort((a, b) => all[b].pop - all[a].pop);
  if (nb[0]) c[3].push(['neighbour', nb[0]]);
  for (const l of s.official.filter((x) => vocabLangs.has(x)).slice(0, 2)) c[3].push(['official', l]);
  if (cur?.word) c[3].push(['currency_word', cur.word]);
  if (lat[1] > 0 && lat[1] < 60) c[3].push(['lat_below', Math.ceil(lat[1] / 5) * 5]);
  // Name clues read the name in the player's language; in a non-Latin script they
  // read the English name (the frames say so).
  const N = Object.fromEntries(LANGS.map((l) => [l, NON_LATIN.includes(l) ? s.names.en : s.names[l]]));
  if (LANGS.every((l) => oneWord(N[l]))) {
    free(3, 'letters', fill(frames.letters, Object.fromEntries(LANGS.map((l) => [l, letters(N[l]).length]))));
    if (LANGS.every((l) => N[l].length >= 5)) free(3, 'ending', fill(frames.ending, Object.fromEntries(LANGS.map((l) => [l, N[l].slice(-2).toLowerCase()]))));
  } else if (LANGS.every((l) => /^[\p{L} ]+$/u.test(N[l]) && N[l].split(' ').length > 1)) {
    free(3, 'words', fill(frames.words, Object.fromEntries(LANGS.map((l) => [l, N[l].split(' ').length]))));
  }
  // tier 4: specific facts
  for (const b of nb.slice(1, 3)) c[4].push(['neighbour', b]);
  free(4, 'initial', fill(frames.initial, Object.fromEntries(LANGS.map((l) => [l, letters(N[l])[0].toUpperCase()]))));
  if (s.capital) {
    const C = Object.fromEntries(LANGS.map((l) => [l, NON_LATIN.includes(l) ? s.capital.en : s.capital[l]]));
    free(4, 'cap-initial', fill(frames.capInitial, Object.fromEntries(LANGS.map((l) => [l, letters(C[l])[0].toUpperCase()]))));
    if (LANGS.every((l) => oneWord(C[l]))) free(4, 'cap-letters', fill(frames.capLetters, Object.fromEntries(LANGS.map((l) => [l, letters(C[l]).length]))));
  }
  if (s.idd) c[4].push(['idd', s.idd]);
  // tier 5: give-aways, each true of this country only
  if (s.capital) c[5].push(['capital_is', facts.capital]);
  c[5].push(['flag_emoji', cc]);
  if (s.tld) c[5].push(['tld', s.tld]);
  const nat = s.native.find((n) => !fold(N.en).includes(fold(n)) && !fold(n).includes(fold(N.en)) && fold(n));
  if (nat) c[5].push(['native', nat]);
  free(5, 'scrambled', fill(frames.scrambled, Object.fromEntries(LANGS.map((l) => [l, N[l].split(' ').map((w, k) => scramble(w, hash(id + l + k))).join(' ')]))));

  // Too few give-aways (no capital, no native name): the full dialling code is one.
  if (c[5].length < PER_TIER && s.idd) {
    c[4] = c[4].filter((e) => e[0] !== 'idd');
    c[5].unshift(['idd', s.idd]);
  }

  return { facts, candidates: c };
}

/**
 * Fill tiers 1..5 with PER_TIER clues each: a tier's own clues first, then
 * leftovers from vaguer tiers. Tier 5 takes only its own give-aways.
 * Returns { clues, short } where short lists tiers that could not be filled.
 */
export function fillTiers(c) {
  const clues = [];
  const short = [];
  let carry = [];
  for (let tier = 1; tier <= 5; tier++) {
    const pool = tier === 5 ? c[tier] : c[tier].concat(carry);
    const take = pool.slice(0, PER_TIER);
    carry = pool.slice(PER_TIER);
    if (take.length < PER_TIER) short.push(tier);
    for (const e of take) clues.push(e[2] === true ? [tier, e[0], e[1]] : [tier, ...e]);
  }
  return { clues, short };
}
