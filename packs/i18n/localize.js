// Fills the languages added after the first five (pt, id, zh, hi, ja, ko, ar, th)
// into a pack's text objects. Each language has one file here (pt.js, zh.js, …):
//   tpl   { template name: sentence }        templates.<name>.text
//   frame { frame name: sentence }           name clues built by auto.js
//   voc   { 'group.key': word }              vocab.<group>.<key>
//   fact  { ISO3: sentence }                 the round-end fun fact
//   clue  { slug: sentence }                 hand-written clues of the 20 classic countries
//   us    { path: text }                     everything in the US States pack
//   misc  { path: text }                     title, difficulty labels, taunts
//   city  { English name: name }             capitals and other cities
//   cur   { currency word: name }
// A text's id is its path in the raw pack ('ALB.fact', 'templates.east.text', …).
// `node tools/i18n.mjs` lists what is missing; a test fails while anything is.
import { LANGS } from '../../engine/names.js';
import pt from './pt.js';
import id from './id.js';
import zh from './zh.js';
import hi from './hi.js';
import ja from './ja.js';
import ko from './ko.js';
import ar from './ar.js';
import th from './th.js';

export const ADDED = ['pt', 'id', 'zh', 'hi', 'ja', 'ko', 'ar', 'th'];
const TABLES = { pt, id, zh, hi, ja, ko, ar, th };

function lookup(T, key) {
  const p = key.split('.');
  if (p[0] === 'us') return T.us?.[p.slice(1).join('.')];
  if (p[0] === 'templates' && p[2] === 'text') return T.tpl?.[p[1]];
  if (p[0] === 'frames') return T.frame?.[p[1]];
  if (p[0] === 'vocab') return T.voc?.[p.slice(1).join('.')];
  if (/^[A-Z]{3}$/.test(p[0]) && p[1] === 'fact') return T.fact?.[p[0]];
  if (/^[A-Z]{3}$/.test(p[0]) && p[1] === 'clues') return T.clue?.[p[p.length - 1]];
  return T.misc?.[key];
}

const isText = (o) => o && typeof o === 'object' && !Array.isArray(o) && typeof o.en === 'string' && Object.keys(o).every((k) => LANGS.includes(k));

/**
 * Return a copy of `raw` with every text object completed from the tables.
 * @param prefix  id prefix ('' for the World pack, 'us' for US States, 'frames' …)
 * @param missing optional array that collects "lang id" for every gap
 */
export function localize(raw, prefix = '', missing = null) {
  const walk = (o, path, parent) => {
    if (Array.isArray(o)) {
      // a raw clue entry [tier, slug, text]: its text is known by the slug
      if (o.length === 3 && Number.isInteger(o[0]) && typeof o[1] === 'string' && isText(o[2])) return [o[0], o[1], fill(o[2], path.concat(o[1]), null)];
      return o.map((v, k) => walk(v, path.concat(v && typeof v === 'object' && !Array.isArray(v) && typeof v.id === 'string' ? v.id : String(k)), o));
    }
    if (!o || typeof o !== 'object') return o;
    if (isText(o)) return fill(o, path, parent);
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v, path.concat(k), o)]));
  };
  const fill = (o, path, parent) => {
    const segs = path[0] === 'items' ? path.slice(1) : path;
    const key = (prefix ? [prefix, ...segs] : segs).join('.');
    const vocab = path[0] === 'vocab' ? path[1] : null;
    const out = { ...o };
    for (const l of ADDED) {
      if (typeof out[l] === 'string') continue;
      const T = TABLES[l];
      const v = vocab === 'city' || vocab === 'capitalName' ? T.city?.[o.en] : vocab === 'currencyWord' ? T.cur?.[o.en] : lookup(T, key);
      if (typeof v === 'string') out[l] = v;
      else if (missing) missing.push(`${l} ${key}${vocab === 'city' || vocab === 'capitalName' ? ` (city ${o.en})` : vocab === 'currencyWord' ? ` (currency ${o.en})` : ''}\t${o.en}`);
    }
    return out;
  };
  return walk(raw, [], null);
}
