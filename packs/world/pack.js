// World Countries pack: all 196 countries (193 UN members, Vatican City,
// Kosovo, Taiwan). Every country gets facts and a 20-clue pool built from open
// data (auto.js over source.js, lists.js and the outlines). Twenty countries
// also have hand-written pools (clues-*.js) and fun facts (base.js), which take
// precedence. templates.js holds the clue sentences and words in five languages.
import base from './base.js';
import { templates, vocab, frames } from './templates.js';
import rawSource from './source.js';
import outlines from './outlines.js';
import { CAPITAL_FIX, NO_CAPITAL } from './lists.js';
import { localize, ADDED } from '../i18n/localize.js';
import { LANGS, NON_LATIN } from '../../engine/names.js';
import { evalTest } from '../../engine/clues.js';
import { autoItem, assignTiers, countryTier, flagEmoji, slug, currencyFact } from './auto.js';
import fEurope from './facts-europe.js';
import fAsia from './facts-asia.js';
import fAfrica from './facts-africa.js';
import fAmericasOceania from './facts-americas-oceania.js';
import c1 from './clues-1.js';
import c2 from './clues-2.js';
import c3 from './clues-3.js';
import c4 from './clues-4.js';

const pools = { ...c1, ...c2, ...c3, ...c4 };
// Fun facts for the countries without a hand-written entry in base.js.
export const funFacts = { ...fEurope, ...fAsia, ...fAfrica, ...fAmericasOceania };
const crafted = new Map(base.items.map((it) => [it.id, it]));
const vocabLangs = new Set(Object.keys(vocab.officialLang));

// Country names in the added languages come from the Unicode CLDR data built into
// every JavaScript engine (Intl.DisplayNames); a few long forms read better.
const NAME_FIX = {
  COD: { pt: 'República Democrática do Congo', id: 'Republik Demokratik Kongo', hi: 'कांगो लोकतांत्रिक गणराज्य', ko: '콩고 민주 공화국', ar: 'جمهورية الكونغو الديمقراطية', th: 'สาธารณรัฐประชาธิปไตยคองโก', zh: '刚果民主共和国', ja: 'コンゴ民主共和国' },
  COG: { pt: 'República do Congo', id: 'Republik Kongo', hi: 'कांगो गणराज्य', ko: '콩고 공화국', ar: 'جمهورية الكونغو', th: 'สาธารณรัฐคองโก', zh: '刚果共和国', ja: 'コンゴ共和国' },
  CIV: { id: 'Pantai Gading' },
  USA: { hi: 'संयुक्त राज्य अमेरिका' },
};
const iso2Of = Object.fromEntries(Object.entries(rawSource).map(([id, s]) => [id, s.iso2]));
const display = Object.fromEntries(ADDED.map((l) => [l, new Intl.DisplayNames([l], { type: 'region' })]));
export function namesIn(id, names) {
  const out = { ...names };
  for (const l of ADDED) out[l] = NAME_FIX[id]?.[l] ?? display[l].of(iso2Of[id]);
  return out;
}
// Words the data clues need: every country's and every capital's name.
const source = Object.fromEntries(
  Object.entries(rawSource).map(([id, s]) => [id, { ...s, names: namesIn(id, s.names), capital: NO_CAPITAL.includes(id) ? null : (CAPITAL_FIX[id] ?? s.capital) }]),
);
const lframes = localize(frames, 'frames');
const cname = {};
const flag = {};
const capitalName = {};
const currencyWord = {}; // a currency's own name; German capitalises nouns
const addWord = (w) => (currencyWord[w] = { en: w, de: w.charAt(0).toUpperCase() + w.slice(1), it: w, es: w, fr: w });
for (const [id, s] of Object.entries(source)) {
  cname[id] = s.names;
  flag[s.iso2] = Object.fromEntries(LANGS.map((l) => [l, flagEmoji(s.iso2)]));
  if (s.capital) capitalName[slug(s.capital.en)] = s.capital;
  const cur = currencyFact(s.currencies);
  if (cur?.word) addWord(cur.word);
}

// Pass 1: every country's facts (the 20 classic ones keep their own on top).
const continentWords = localize({ continent: vocab.continent }, 'vocab').continent;
const autos = Object.fromEntries(Object.entries(source).map(([id, s]) => [id, autoItem(id, s, outlines.items[s.geo], source, lframes, vocabLangs, continentWords)]));
const factsOf = Object.fromEntries(
  Object.keys(source).map((id) => [id, crafted.has(id) ? { ...autos[id].facts, ...crafted.get(id).facts, ...(pools[id]?.facts ?? {}) } : autos[id].facts]),
);
const allFacts = Object.values(factsOf);
// Facts every country has; others (language, coast, flag) exist for the 20 hand-written ones only.
const KNOWN = new Set(Object.keys(allFacts[0]).filter((k) => allFacts.every((f) => f[k] !== undefined)));

const tplTest = (e) => {
  const tpl = templates[e[0]];
  return { f: tpl.f, [tpl.op]: 'value' in tpl ? tpl.value : e[1] };
};
// Hand-written template clues fitting more countries than this are swapped out.
const HAND_LIMIT = { 1: 100, 2: 45, 3: 25, 4: 10, 5: 1 };

// How many of the 196 countries a candidate clue is true of.
const nameIn = (id, l, src) => {
  const n = src === 'cap' ? source[id].capital : source[id].names;
  return n ? (NON_LATIN.includes(l) ? n.en : n[l]) : null;
};
function fitsOf(id) {
  return (e) => {
    if (e[2] === true) {
      const meta = e[3];
      if (!meta || meta.unique) return 1;
      if (meta.count) return meta.count;
      if (meta.pred) return allFacts.filter(meta.pred).length;
      let most = 0; // the language in which the clue is least specific counts
      for (const l of LANGS) {
        const mine = meta.f(nameIn(id, l, meta.src));
        let n = 0;
        for (const o of Object.keys(source)) {
          const s = nameIn(o, l, meta.src);
          if (s && meta.f(s) === mine) n++;
        }
        most = Math.max(most, n);
      }
      return most;
    }
    if (typeof e[1] === 'object' && !Array.isArray(e[1])) return 1; // a hand-written sentence
    const test = tplTest(e);
    return allFacts.filter((f) => evalTest(test, f) === true).length;
  };
}

/** Clues placed in a tier they are too vague for ("tier:fits"), per country; see auto.js. */
export const loose = {};
const items = Object.entries(source).map(([id, s]) => {
  const geo = outlines.items[s.geo];
  const own = crafted.get(id);
  const pool = pools[id];
  if (own) {
    // Hand-written clues stay; a template clue far too general for its tier
    // ("It is a republic") makes room for a sharper automatic one.
    const fits = fitsOf(id);
    const giveaway = (e) => e[0] <= 3 && KNOWN.has(tplTest(e.slice(1)).f) && fits(e.slice(1)) === 1; // "borders the UK" is Ireland
    const kept = pool.clues.filter((e) => typeof e[2] === 'object' || (fits(e.slice(1)) <= HAND_LIMIT[e[0]] && !giveaway(e)));
    const testOf = (e) => (e[2] === true || typeof e[1] === 'object' ? null : JSON.stringify(tplTest(e)));
    const taken = new Set(kept.filter((e) => typeof e[2] !== 'object').map((e) => testOf(e.slice(1))));
    const { clues } = assignTiers(autos[id].candidates, fits, kept.map((e) => ({ tier: e[0], entry: e.slice(1) })), (e) => taken.has(testOf(e)));
    return { ...own, names: namesIn(id, own.names), iso2: s.iso2, flag: flagEmoji(s.iso2), facts: factsOf[id], clues };
  }
  const { clues, loose: l } = assignTiers(autos[id].candidates, fitsOf(id));
  if (l.length) loose[id] = l;
  const item = {
    id,
    geo: s.geo,
    iso2: s.iso2,
    flag: flagEmoji(s.iso2),
    tier: countryTier(s),
    names: s.names,
    aliases: s.alt.filter((a) => a !== s.iso2 && a.length > 1),
    facts: autos[id].facts,
    clues,
    fact: funFacts[id],
  };
  if (geo && geo.share < 0.8) item.mainlandOnly = true;
  return item;
});

const t = (en, de, it, es, fr) => ({ en, de, it, es, fr });

const countryWords = Object.fromEntries(Object.entries(vocab.country).map(([k, v]) => [k, iso2Of[k] ? namesIn(k, v) : v]));

const raw = {
  ...base,
  sources: [
    ...base.sources,
    'Country facts: world-countries by Mohammed Le Doze (ODbL 1.0), with hand-kept lists in packs/world/lists.js.',
  ],
  difficulties: {
    ...base.difficulties,
    expert: { maxTier: 3, label: t('Expert', 'Experte', 'Esperto', 'Experto', 'Expert') },
    master: { maxTier: 4, label: t('Master', 'Meister', 'Maestro', 'Maestro', 'Maître') },
  },
  templates,
  vocab: { ...vocab, country: countryWords, cname, capitalName, flag, currencyWord },
  items,
};

/** Texts still missing a translation ("lang id\ttext"); tools/i18n.mjs prints them. */
export const missing = [];
const framesMissing = [];
localize(frames, 'frames', framesMissing);
missing.push(...framesMissing);
export default localize(raw, '', missing);
