// Builds every state's facts and a pool of clues (3 per tier, 15 in all) from data.js,
// in the same way as the World pack: each clue is placed by how many of the 50
// states it fits. Tier 1 ≈ 16, tier 2 ≈ 7, tier 3 ≈ 3–4, tier 4 ≈ 1–2, tier 5 = 1.
// A give-away (fits one state) never comes before tier 4. The 10 states of the
// starter set keep their hand-written clues, one per tier, and get the rest from here.
//
// Every generated clue is a free entry [tier, slug, text, test] with its text already
// in all thirteen languages: the first five here, the other eight from the `us`
// section of packs/i18n/<lang>.js ('frame.<name>', 'XX.names', 'landmark.XX').
import { LANGS } from '../../engine/names.js';
import { evalTest } from '../../engine/clues.js';
import { frames as WORLD_FRAMES } from '../world/templates.js';
import { STATES, MORE } from './data.js';
import pt from '../i18n/pt.js';
import id from '../i18n/id.js';
import zh from '../i18n/zh.js';
import hi from '../i18n/hi.js';
import ja from '../i18n/ja.js';
import ko from '../i18n/ko.js';
import ar from '../i18n/ar.js';
import th from '../i18n/th.js';

const ADDED = { pt, id, zh, hi, ja, ko, ar, th };
const LATIN = ['en', 'de', 'it', 'es', 'fr', 'pt', 'id'];
export const PER_TIER = 3;
const LIMIT = { 5: 1, 4: 2, 3: 6, 2: 15, 1: 30 };
const TARGET = { 1: 16, 2: 7, 3: 3.5, 4: 1.6 };

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });
const AND = { en: ' and ', de: ' und ', it: ' e ', es: ' y ', fr: ' et ', pt: ' e ', id: ' dan ', zh: '和', hi: ' और ', ja: 'と', ko: ' 및 ', ar: ' و', th: ' และ ' };
export const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// sentences in the first five languages; the other eight come from the i18n files
const FR = {
  region_west: t('In the US Census, it belongs to the West.', 'In der US-Volkszählung gehört es zum Westen.', 'Per il censimento USA fa parte dell’Ovest.', 'Según el censo de EE. UU., pertenece al Oeste.', 'Pour le recensement américain, il fait partie de l’Ouest.'),
  region_south: t('In the US Census, it belongs to the South.', 'In der US-Volkszählung gehört es zum Süden.', 'Per il censimento USA fa parte del Sud.', 'Según el censo de EE. UU., pertenece al Sur.', 'Pour le recensement américain, il fait partie du Sud.'),
  region_midwest: t('In the US Census, it belongs to the Midwest.', 'In der US-Volkszählung gehört es zum Mittleren Westen.', 'Per il censimento USA fa parte del Midwest.', 'Según el censo de EE. UU., pertenece al Medio Oeste.', 'Pour le recensement américain, il fait partie du Midwest.'),
  region_northeast: t('In the US Census, it belongs to the Northeast.', 'In der US-Volkszählung gehört es zum Nordosten.', 'Per il censimento USA fa parte del Nord-est.', 'Según el censo de EE. UU., pertenece al Noreste.', 'Pour le recensement américain, il fait partie du Nord-Est.'),
  miss_west: t('All of it lies west of the Mississippi River.', 'Es liegt ganz westlich des Mississippi.', 'Si trova interamente a ovest del Mississippi.', 'Está por completo al oeste del río Misisipi.', 'Il se trouve entièrement à l’ouest du Mississippi.'),
  miss_east: t('All of it lies east of the Mississippi River.', 'Es liegt ganz östlich des Mississippi.', 'Si trova interamente a est del Mississippi.', 'Está por completo al este del río Misisipi.', 'Il se trouve entièrement à l’est du Mississippi.'),
  miss_river: t('The Mississippi River flows through it or along its border.', 'Der Mississippi fließt durch den Staat oder an seiner Grenze entlang.', 'Il Mississippi lo attraversa o scorre lungo il suo confine.', 'El río Misisipi lo atraviesa o corre por su frontera.', 'Le Mississippi le traverse ou longe sa frontière.'),
  nb_count: t('It borders {x} other states.', 'Es grenzt an {x} andere Staaten.', 'Confina con altri {x} stati.', 'Limita con otros {x} estados.', 'Il touche {x} autres États.'),
  nb_one: t('It borders only one other state.', 'Es grenzt nur an einen anderen Staat.', 'Confina con un solo altro stato.', 'Limita con un solo estado.', 'Il ne touche qu’un seul autre État.'),
  nb_none: t('It borders no other state.', 'Es grenzt an keinen anderen Staat.', 'Non confina con nessun altro stato.', 'No limita con ningún otro estado.', 'Il ne touche aucun autre État.'),
  neighbour: t('One of its neighbours is {x}.', 'Einer seiner Nachbarn ist {x}.', 'Uno dei suoi vicini è {x}.', 'Uno de sus vecinos es {x}.', 'L’un de ses voisins est {x}.'),
  neighbours2: t('Two of its neighbours: {x}.', 'Zwei seiner Nachbarn: {x}.', 'Due dei suoi vicini: {x}.', 'Dos de sus vecinos: {x}.', 'Deux de ses voisins : {x}.'),
  original13: t('It was one of the original thirteen states.', 'Es war einer der dreizehn Gründungsstaaten.', 'Era uno dei tredici stati originari.', 'Fue uno de los trece estados originales.', 'Il faisait partie des treize États fondateurs.'),
  year_before: t('It became a state before 1800.', 'Es wurde vor 1800 ein Bundesstaat.', 'È diventato uno stato prima del 1800.', 'Se convirtió en estado antes de 1800.', 'Il est devenu un État avant 1800.'),
  year_between: t('It became a state between {x} and {y}.', 'Es wurde zwischen {x} und {y} ein Bundesstaat.', 'È diventato uno stato tra il {x} e il {y}.', 'Se convirtió en estado entre {x} y {y}.', 'Il est devenu un État entre {x} et {y}.'),
  year_after: t('It became a state after 1900.', 'Es wurde nach 1900 ein Bundesstaat.', 'È diventato uno stato dopo il 1900.', 'Se convirtió en estado después de 1900.', 'Il est devenu un État après 1900.'),
  year_exact: t('It became a state in {x}.', 'Es wurde {x} ein Bundesstaat.', 'È diventato uno stato nel {x}.', 'Se convirtió en estado en {x}.', 'Il est devenu un État en {x}.'),
  popRank: t('By population, it ranks {x}–{y} among the 50 states (1 = most people).', 'Nach Einwohnerzahl liegt es auf Rang {x}–{y} der 50 Staaten (1 = die meisten).', 'Per popolazione è tra il {x}° e il {y}° posto dei 50 stati (1 = il più popoloso).', 'Por población, ocupa el puesto {x}–{y} de los 50 estados (1 = el más poblado).', 'Par sa population, il se classe entre le {x}e et le {y}e des 50 États (1 = le plus peuplé).'),
  areaRank: t('By area, it ranks {x}–{y} among the 50 states (1 = largest).', 'Nach Fläche liegt es auf Rang {x}–{y} der 50 Staaten (1 = der größte).', 'Per superficie è tra il {x}° e il {y}° posto dei 50 stati (1 = il più grande).', 'Por superficie, ocupa el puesto {x}–{y} de los 50 estados (1 = el más grande).', 'Par sa superficie, il se classe entre le {x}e et le {y}e des 50 États (1 = le plus grand).'),
  high_over: t('Its highest point is more than 4,000 m (13,123 ft) above sea level.', 'Sein höchster Punkt liegt mehr als 4.000 m (13.123 ft) über dem Meer.', 'Il suo punto più alto supera i 4.000 m (13.123 piedi) sul livello del mare.', 'Su punto más alto supera los 4000 m (13 123 pies) sobre el nivel del mar.', 'Son point culminant dépasse 4 000 m (13 123 pieds) d’altitude.'),
  high_under: t('Its highest point is less than 1,000 m (3,281 ft) above sea level.', 'Sein höchster Punkt liegt weniger als 1.000 m (3.281 ft) über dem Meer.', 'Il suo punto più alto è sotto i 1.000 m (3.281 piedi) sul livello del mare.', 'Su punto más alto no llega a 1000 m (3281 pies) sobre el nivel del mar.', 'Son point culminant est à moins de 1 000 m (3 281 pieds) d’altitude.'),
  capLargest: t('Its capital is also its largest city.', 'Seine Hauptstadt ist auch seine größte Stadt.', 'La sua capitale è anche la sua città più grande.', 'Su capital es también su ciudad más grande.', 'Sa capitale est aussi sa plus grande ville.'),
  tz_E: t('Its capital is on Eastern Time.', 'Seine Hauptstadt liegt in der Zeitzone Eastern Time.', 'La sua capitale segue l’ora della costa orientale (Eastern Time).', 'Su capital usa la hora del Este (Eastern Time).', 'Sa capitale vit à l’heure de l’Est (Eastern Time).'),
  tz_C: t('Its capital is on Central Time.', 'Seine Hauptstadt liegt in der Zeitzone Central Time.', 'La sua capitale segue l’ora centrale (Central Time).', 'Su capital usa la hora del Centro (Central Time).', 'Sa capitale vit à l’heure du Centre (Central Time).'),
  tz_M: t('Its capital is on Mountain Time.', 'Seine Hauptstadt liegt in der Zeitzone Mountain Time.', 'La sua capitale segue l’ora delle Montagne Rocciose (Mountain Time).', 'Su capital usa la hora de la Montaña (Mountain Time).', 'Sa capitale vit à l’heure des Rocheuses (Mountain Time).'),
  tz_P: t('Its capital is on Pacific Time.', 'Seine Hauptstadt liegt in der Zeitzone Pacific Time.', 'La sua capitale segue l’ora del Pacifico (Pacific Time).', 'Su capital usa la hora del Pacífico (Pacific Time).', 'Sa capitale vit à l’heure du Pacifique (Pacific Time).'),
  largest: t('Its largest city is {x}.', 'Seine größte Stadt ist {x}.', 'La sua città più grande è {x}.', 'Su ciudad más grande es {x}.', 'Sa plus grande ville est {x}.'),
  capital: t('Its capital is {x}.', 'Seine Hauptstadt ist {x}.', 'La sua capitale è {x}.', 'Su capital es {x}.', 'Sa capitale est {x}.'),
  nickname: t('Its nickname is “{x}”.', 'Sein Spitzname ist „{x}“.', 'Il suo soprannome è «{x}».', 'Su apodo es «{x}».', 'Son surnom est « {x} ».'),
  landmark: t('You can visit {x} here.', 'Hier kann man {x} besuchen.', 'Qui puoi visitare {x}.', 'Aquí puedes visitar {x}.', 'On peut y visiter {x}.'),
};
// city names that differ in the first five languages (the other eight: i18n `city`)
const CITY5 = {
  'New York City': { it: 'New York', es: 'Nueva York', fr: 'New York' },
  Philadelphia: { it: 'Filadelfia', es: 'Filadelfia', fr: 'Philadelphie' },
  'New Orleans': { es: 'Nueva Orleans', fr: 'La Nouvelle-Orléans' },
};

const frame = (name) => {
  const o = { ...(FR[name] ?? WORLD_FRAMES[name]) };
  for (const [l, T] of Object.entries(ADDED)) o[l] = T.us?.[`frame.${name}`] ?? T.frame?.[name];
  return o;
};
/** A text whose first five languages are given and the other eight live in the i18n `us` section under `key`. */
export const fromHand = (five, key) => {
  const o = { ...five };
  for (const [l, T] of Object.entries(ADDED)) o[l] = T.us?.[key];
  return o;
};
function fill(f, values) {
  const o = {};
  for (const l of LANGS) {
    if (typeof f[l] !== 'string') continue; // untranslated: the pack validator reports it
    let s = f[l];
    for (const [k, v] of Object.entries(values)) s = s.replaceAll(`{${k}}`, typeof v === 'object' ? v[l] : v);
    o[l] = s.charAt(0).toUpperCase() + s.slice(1);
  }
  return o;
}
const cityName = (en) => Object.fromEntries(LANGS.map((l) => [l, ADDED[l]?.city?.[en] ?? CITY5[en]?.[l] ?? en]));
const join = (words) => Object.fromEntries(LANGS.map((l) => [l, `${words[0][l]}${AND[l]}${words[1][l]}`]));

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
const letters = (s) => [...s].filter((ch) => /\p{L}/u.test(ch));

/** Facts every state has, from data.js (hand items may add more). */
export function factsOf(code) {
  const s = STATES[code];
  return {
    region: s.region,
    neighbours: s.nb,
    landBorders: s.borders,
    coast: s.coast,
    capital: s.capital,
    largest: s.largest,
    capLargest: s.capital === s.largest,
    capTz: s.capTz,
    nickname: slug(s.nick),
    year: s.year,
    original13: s.year <= 1790,
    popRank: s.popRank,
    areaRank: s.areaRank,
    missSide: s.miss,
    missRiver: s.river,
    highM: s.high,
    dst: s.extra?.dst ?? true,
    fourCorners: !!s.extra?.fourCorners,
    ...(s.extra?.mountains ? { mountains: s.extra.mountains } : {}),
  };
}

/**
 * Every candidate clue for one state: { key, kind, text, test } (kind: what sort of fact,
 * so a tier mixes different ones).
 * @param names   { code: { lang: name } } for all 50 states
 */
function candidates(code, names) {
  const s = STATES[code];
  const out = [];
  const add = (kind, key, text, test) => out.push({ kind, key, text, test });
  add('region', 'region', frame('region_' + s.region), { f: 'region', eq: s.region });
  if (s.miss !== 'both') add('river', 'miss', frame('miss_' + s.miss), { f: 'missSide', eq: s.miss });
  if (s.river) add('river', 'river', frame('miss_river'), { f: 'missRiver', eq: true });
  add('tz', 'tz', frame('tz_' + s.capTz), { f: 'capTz', eq: s.capTz });
  // coasts and borders reuse the starter set's sentences (and their translations)
  if (s.coast.includes('atlantic')) add('coast', 'atl', fromHand(t('It has an Atlantic coastline.', 'Es hat eine Atlantikküste.', 'Ha una costa sull’Atlantico.', 'Tiene costa en el Atlántico.', 'Il a une côte sur l’Atlantique.'), 'NY.clues.1.text'), { f: 'coast', has: 'atlantic' });
  if (s.coast.includes('pacific')) add('coast', 'pac', fromHand(t('It has a Pacific coastline.', 'Es hat eine Pazifikküste.', 'Ha una costa sul Pacifico.', 'Tiene costa en el Pacífico.', 'Il a une côte sur le Pacifique.'), 'CA.clues.1.text'), { f: 'coast', has: 'pacific' });
  if (s.coast.includes('gulf')) add('coast', 'gulf', fromHand(t('It has a coastline on the Gulf of Mexico.', 'Es hat eine Küste am Golf von Mexiko.', 'Ha una costa sul Golfo del Messico.', 'Tiene costa en el golfo de México.', 'Il a une côte sur le golfe du Mexique.'), 'TX.clues.1.text'), { f: 'coast', has: 'gulf' });
  if (s.coast.includes('great-lakes')) add('coast', 'lakes', fromHand(t('It has a shoreline on the Great Lakes.', 'Es hat ein Ufer an den Großen Seen.', 'Si affaccia sui Grandi Laghi.', 'Tiene costa en los Grandes Lagos.', 'Il a une rive sur les Grands Lacs.'), 'MI.clues.0.text'), { f: 'coast', has: 'great-lakes' });
  if (!s.coast.length) add('coast', 'nocoast', fromHand(t('It has no coastline at all.', 'Es hat überhaupt keine Küste.', 'Non ha alcuna costa.', 'No tiene ninguna costa.', 'Il n’a aucune côte.'), 'CO.clues.0.text'), { f: 'coast', count: 0 });
  if (s.borders.includes('canada')) add('border', 'canada', fromHand(t('It shares a land border with Canada.', 'Es hat eine Landgrenze mit Kanada.', 'Ha un confine terrestre con il Canada.', 'Tiene frontera terrestre con Canadá.', 'Il a une frontière terrestre avec le Canada.'), 'NY.clues.0.text'), { f: 'landBorders', has: 'canada' });
  if (s.borders.includes('mexico')) add('border', 'mexico', fromHand(t('It shares a border with Mexico.', 'Es grenzt an Mexiko.', 'Confina con il Messico.', 'Limita con México.', 'Il a une frontière avec le Mexique.'), 'CA.clues.0.text'), { f: 'landBorders', has: 'mexico' });
  if (s.extra?.fourCorners) add('corners', 'corners', fromHand(t('Four states meet at a single point on its border.', 'An seiner Grenze treffen sich vier Staaten in einem Punkt.', 'Sul suo confine quattro stati si incontrano in un solo punto.', 'En su frontera, cuatro estados se tocan en un solo punto.', 'Sur sa frontière, quatre États se rejoignent en un seul point.'), 'AZ.clues.1.text'), { f: 'fourCorners', eq: true });
  if (s.extra?.mountains) add('mountains', 'rockies', fromHand(t('The Rocky Mountains run through it.', 'Die Rocky Mountains verlaufen durch den Staat.', 'Le Montagne Rocciose lo attraversano.', 'Las Montañas Rocosas lo atraviesan.', 'Les montagnes Rocheuses le traversent.'), 'CO.clues.2.text'), { f: 'mountains', has: 'rockies' });
  if (s.extra?.dst === false) add('dst', 'dst', fromHand(t('Most of it does not use daylight saving time.', 'Der größte Teil stellt nicht auf Sommerzeit um.', 'In gran parte non adotta l’ora legale.', 'La mayor parte no usa el horario de verano.', 'La majeure partie n’applique pas l’heure d’été.'), 'AZ.clues.2.text'), { f: 'dst', eq: false });
  // neighbours
  const n = s.nb.length;
  if (n === 0) add('nbcount', 'nb0', frame('nb_none'), { f: 'neighbours', count: 0 });
  else if (n === 1) add('nbcount', 'nb1', frame('nb_one'), { f: 'neighbours', count: 1 });
  else add('nbcount', 'nbn', fill(frame('nb_count'), { x: String(n) }), { f: 'neighbours', count: n });
  for (const b of s.nb) add('neighbour', 'nb-' + b, fill(frame('neighbour'), { x: names[b] }), { f: 'neighbours', has: b });
  const nb = s.nb.slice().sort();
  for (let i = 0; i < nb.length; i++) for (let j = i + 1; j < nb.length; j++) add('neighbour', `nb2-${nb[i]}-${nb[j]}`, fill(frame('neighbours2'), { x: join([names[nb[i]], names[nb[j]]]) }), { f: 'neighbours', all: [nb[i], nb[j]] });
  // history
  if (s.year <= 1790) add('year', 'orig', frame('original13'), { f: 'original13', eq: true });
  if (s.year < 1800) add('year', 'y1700', frame('year_before'), { f: 'year', lte: 1799 });
  else if (s.year > 1900) add('year', 'y1900', frame('year_after'), { f: 'year', gte: 1901 });
  else add('year', 'y1800', fill(frame('year_between'), { x: '1800', y: '1899' }), { f: 'year', within: [1800, 1899] });
  const d = Math.floor(s.year / 10) * 10;
  add('year', 'decade', fill(frame('year_between'), { x: String(d), y: String(d + 9) }), { f: 'year', within: [d, d + 9] });
  const q = Math.floor(s.year / 25) * 25;
  add('year', 'quarter', fill(frame('year_between'), { x: String(q), y: String(q + 24) }), { f: 'year', within: [q, q + 24] });
  add('year', 'yexact', fill(frame('year_exact'), { x: String(s.year) }), { f: 'year', eq: s.year });
  // ranks: bands of 10, 5 and 2
  for (const [f, fr] of [['popRank', 'popRank'], ['areaRank', 'areaRank']]) {
    for (const w of [10, 5, 2]) {
      const lo = Math.floor((s[f] - 1) / w) * w + 1;
      add(f, `${f}-${w}`, fill(frame(fr), { x: String(lo), y: String(lo + w - 1) }), { f, within: [lo, lo + w - 1] });
    }
  }
  if (s.high > 4000) add('high', 'high', frame('high_over'), { f: 'highM', gte: 4000 });
  if (s.high < 1000) add('high', 'high', frame('high_under'), { f: 'highM', lte: 999 });
  if (s.capital === s.largest) add('city', 'caplargest', frame('capLargest'), { f: 'capLargest', eq: true });
  else add('city', 'largest', fill(frame('largest'), { x: cityName(s.largest) }), { f: 'largest', eq: s.largest });
  add('give', 'capital', fill(frame('capital'), { x: cityName(s.capital) }), { f: 'capital', eq: s.capital });
  add('give', 'nickname', fill(frame('nickname'), { x: s.nick }), { f: 'nickname', eq: slug(s.nick) });
  if (MORE[code]) {
    const lm = { ...MORE[code].landmark };
    for (const [l, T] of Object.entries(ADDED)) lm[l] = T.us?.[`landmark.${code}`];
    add('give', 'landmark', fill(frame('landmark'), { x: lm }), { f: 'landmarks', has: 'lm-' + code.toLowerCase() });
  }
  // the name: only what reads the same in every Latin-script language
  // (the others are told the clue is about the English name)
  const latin = LATIN.map((l) => names[code][l]);
  const first = new Set(latin.map((w) => letters(w)[0]?.toUpperCase()));
  if (first.size === 1) add('name', 'initial', fill(frame('initial'), { x: [...first][0] }), { f: 'nameInitial', eq: [...first][0] });
  const count = new Set(latin.map((w) => letters(w).length));
  if (count.size === 1) add('name', 'letters', fill(frame('letters'), { x: String([...count][0]) }), { f: 'nameLetters', eq: [...count][0] });
  const scr = Object.fromEntries(LANGS.map((l) => [l, (LATIN.includes(l) ? names[code][l] : names[code].en).split(' ').map((w, k) => scramble(w, hash(code + l + k))).join(' ')]));
  add('give', 'scrambled', fill(frame('scrambled'), { x: scr }), { f: 'tags', has: 'scr-' + code.toLowerCase() });
  return out;
}

/**
 * Pick 3 clues per tier for every state.
 * @param items   the pack's items with names (all 13 languages) and facts
 * @param fixedOf code → [{ tier, clue }] hand-written clues that keep their tier
 */
export function buildPools(items, fixedOf = () => []) {
  const names = Object.fromEntries(items.map((it) => [it.id, it.names]));
  const all = items.map((it) => it.facts);
  const fits = (test) => all.filter((f) => evalTest(test, f) === true).length;
  const report = {};
  const pools = {};
  for (const it of items) {
    const code = it.id;
    const fixed = fixedOf(code);
    const take = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const seenTest = new Set();
    for (const f of fixed) {
      const n = fits(f.clue.test);
      // a hand-written give-away (a nickname, a landmark) never comes before tier 4
      const tier = n < 2 && f.tier < 4 ? (take[5].length < PER_TIER ? 5 : 4) : f.tier;
      take[tier].push({ kind: 'hand', fits: n, entry: f.clue });
      seenTest.add(JSON.stringify(f.clue.test));
    }
    const cands = candidates(code, names)
      .filter((c) => !seenTest.has(JSON.stringify(c.test)))
      .map((c) => ({ ...c, fits: fits(c.test) }))
      .filter((c) => c.fits >= 1);
    // de-duplicate identical tests (a decade that equals the exact year …): keep the first
    const byTest = new Map();
    for (const c of cands) if (!byTest.has(JSON.stringify(c.test))) byTest.set(JSON.stringify(c.test), c);
    const pool = [...byTest.values()];
    const used = new Set();
    const grab = (tier, c) => {
      take[tier].push(c);
      used.add(c);
    };
    const GIVE = ['capital', 'landmark', 'nickname', 'scrambled', 'largest', 'yexact'];
    for (const k of GIVE) {
      const c = pool.find((x) => x.key === k && x.fits === 1 && !used.has(x));
      if (c && take[5].length < PER_TIER) grab(5, c);
    }
    for (const c of pool.filter((x) => x.fits === 1 && !used.has(x))) if (take[5].length < PER_TIER) grab(5, c);
    for (const tier of [4, 3, 2, 1]) {
      while (take[tier].length < PER_TIER) {
        let best = null;
        let bestScore = Infinity;
        for (const c of pool) {
          if (used.has(c) || (c.fits < 2 && tier < 4) || c.fits > LIMIT[1]) continue;
          const same = take[tier].filter((y) => y.kind === c.kind).length;
          const score = Math.abs(Math.log(c.fits / TARGET[tier])) + 0.6 * same;
          if (score < bestScore) {
            bestScore = score;
            best = c;
          }
        }
        if (!best) break;
        grab(tier, best);
      }
    }
    // a state short of clues (Alaska, Hawaii) takes its broadest unused facts
    const vague = pool.filter((c) => !used.has(c) && c.fits >= 2).sort((a, b) => a.fits - b.fits);
    for (const tier of [1, 2, 3, 4]) while (take[tier].length < PER_TIER && vague.length) grab(tier, vague.shift());
    const clues = [];
    for (const tier of [1, 2, 3, 4, 5]) {
      for (const c of take[tier]) clues.push(c.kind === 'hand' ? { ...c.entry, tier } : [tier, `us-${c.key}`, c.text, c.test]);
    }
    pools[code] = clues;
    report[code] = Object.fromEntries([1, 2, 3, 4, 5].map((tier) => [tier, take[tier].map((c) => c.fits)]));
  }
  return { pools, report };
}
