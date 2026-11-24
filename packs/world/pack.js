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
import { LANGS } from '../../engine/names.js';
import { autoItem, fillTiers, countryTier, flagEmoji, slug, currencyFact } from './auto.js';
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

export const shortfalls = {};
const items = Object.entries(source).map(([id, s]) => {
  const geo = outlines.items[s.geo];
  const auto = autoItem(id, s, geo, source, lframes, vocabLangs);
  const own = crafted.get(id);
  const pool = pools[id];
  if (own) {
    return { ...own, names: namesIn(id, own.names), iso2: s.iso2, flag: flagEmoji(s.iso2), facts: { ...auto.facts, ...own.facts, ...(pool?.facts ?? {}) }, clues: pool ? pool.clues : own.clues };
  }
  const { clues, short } = fillTiers(auto.candidates);
  if (short.length) shortfalls[id] = short;
  const item = {
    id,
    geo: s.geo,
    iso2: s.iso2,
    flag: flagEmoji(s.iso2),
    tier: countryTier(s),
    names: s.names,
    aliases: s.alt.filter((a) => a !== s.iso2 && a.length > 1),
    facts: auto.facts,
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
