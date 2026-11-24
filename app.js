/* ============ ENGINE + PACK BINDINGS ============
   Project X runs on the Bidding Wars shell: the same screens, sheets, theme,
   settings, record, results reveal and globe. Only the game is different.
   The rules (clues, guess checking, the drawing judge, the multiplier, the
   bot, the game state machine) live in engine.js — pure and unit-tested.
   Content lives in lazily loaded packs (packs.js, pack-*.js). Sound is
   sound.js, motion is fx.js. This file is the view: it renders what the
   engine returns and wires the controls. Nothing here decides a score. */
const DEFAULT_PACK = 'countries';
let PACK = null;                                    // pack of the game on screen

const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const cname = it => (it.names && (it.names[LANG] || it.names.en)) || it.id;
const flag = code => code.split('').map(ch => String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 65)).join('');
function icon(it) { return it.iso2 ? flag(it.iso2) : `<span class="ibadge">${esc(it.id)}</span>`; }
let SELPACK = DEFAULT_PACK;                         // the pack picked on the menu
const ini = n => { const t = String(n || '?').trim(), m = t.match(/^(.*\S)\s+(\d)$/); return ((Array.from(m ? m[1] : t)[0] || '?') + (m ? m[2] : '')).toUpperCase(); };
const IC = (id, cls) => `<svg class="i ${cls || ''}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
const fmtN = n => Number(n).toLocaleString(LANG);
const fmtX = m => (m >= 1000 ? fmtN(m) : String(m).replace('.', LANG === 'en' ? '.' : ','));

/* ============ SHELL (from Bidding Wars) ============ */
const app = document.getElementById('app');
const layer = document.getElementById('layer');
const rootEl = document.getElementById('root');
let G = null;                                       // the engine's game state
let CFG = null;                                     // the config it was created from
let navTok = 0;
let stopGlobe = null;

function on(id, fn) { const e = document.getElementById(id); if (e) e.onclick = fn; }
function val(id) { const e = document.getElementById(id); return e ? e.value.trim() : ''; }

const THEMES = ['dark', 'light'];
let THEME = 'dark';
const THEME_COLOR = { dark: '#0E0D0B', light: '#EEF0FF' };
function applyTheme() {
  document.documentElement.setAttribute('data-theme', THEME);
  $$('meta[name=theme-color]').forEach(m => m.setAttribute('content', THEME_COLOR[THEME]));
}
async function loadTheme() { const v = await Store.get('theme:v1'); THEME = v === 'light' ? 'light' : 'dark'; applyTheme(); }
async function setTheme(v) {
  THEME = v === 'light' ? 'light' : 'dark'; applyTheme();
  if (THEME === 'dark') await Store.remove('theme:v1'); else await Store.set('theme:v1', 'light');
}
const themeLabel = () => t(THEME === 'light' ? 'themeLight' : 'themeDark');

/* ---- settings: one small local value (settings:v1) holding only what differs from the defaults ---- */
const SETTINGS_KEY = 'settings:v1';
const SET_DEFAULT = { tz: 0, shapes: false, motion: 'auto', faint: false };
function parseSettings(raw) {
  let o = {}; try { o = JSON.parse(raw || '{}') || {}; } catch (e) {}
  return {
    tz: [-1, 0, 1, 2].includes(o.tz) ? o.tz : 0,
    shapes: o.shapes === true,
    motion: o.motion === 'reduce' ? 'reduce' : 'auto',
    faint: o.faint === true,
  };
}
let SET = parseSettings(null);
function applySettings() {
  const r = document.documentElement;
  r.dataset.tz = String(SET.tz); r.dataset.shapes = SET.shapes ? '1' : '0'; r.dataset.motion = SET.motion === 'reduce' ? 'reduce' : 'auto';
  FX.forceReduced(SET.motion === 'reduce');
}
async function loadSettings() { SET = parseSettings(await Store.get(SETTINGS_KEY)); applySettings(); }
async function saveSettings() {
  applySettings();
  const diff = {}; Object.keys(SET_DEFAULT).forEach(k => { if (SET[k] !== SET_DEFAULT[k]) diff[k] = SET[k]; });
  if (Object.keys(diff).length) await Store.set(SETTINGS_KEY, JSON.stringify(diff)); else await Store.remove(SETTINGS_KEY);
}

const navBtns = (withTheme = true) => `<span class="navr">${withTheme ? `<button class="ibtn" id="theme" aria-label="${esc(themeLabel())}">${IC('theme')}</button>` : ''}<button class="ibtn${Snd.muted ? ' off' : ''}" id="mute" aria-label="${esc(t('aSound'))}" aria-pressed="${Snd.muted}">${IC(Snd.muted ? 'mute' : 'note')}</button></span>`;
function bindNav(sec) {
  const th = $('#theme', sec);
  if (th) th.onclick = () => { setTheme(THEMES[(THEMES.indexOf(THEME) + 1) % THEMES.length]); th.setAttribute('aria-label', themeLabel()); Snd.ui(); Haptics.light(); toast(themeLabel()); };
  const mu = $('#mute', sec);
  if (mu) mu.onclick = () => {
    Snd.setMuted(!Snd.muted);
    if (!Snd.muted) Snd.ui();
    mu.classList.toggle('off', Snd.muted); mu.setAttribute('aria-pressed', Snd.muted); mu.innerHTML = IC(Snd.muted ? 'mute' : 'note');
    Haptics.light();
  };
}

const langFlag = l => (l.id === 'en' && (PACK ? PACK.id : SELPACK) === 'states') ? 'US' : l.flag;
function syncPackTheme() { const us = (PACK ? PACK.id : SELPACK) === 'states'; document.body.classList.toggle('pk-states', us); if (us) document.documentElement.dataset.pack = 'states'; else delete document.documentElement.dataset.pack; }
function go(h, name) {
  navTok++; closeSheets(true); stopClock();
  if (stopGlobe) { stopGlobe(); stopGlobe = null; }
  const sec = document.createElement('section');
  sec.className = 'screen'; sec.dataset.screen = name || 'page'; sec.innerHTML = h;
  app.replaceChildren(sec);
  document.body.classList.toggle('playing', name === 'auction');
  syncPackTheme();
  bindNav(sec);
  if (!FX.reduced) FX.spring(sec, 0, 1, v => ({ opacity: Math.min(1, v * 1.4), transform: `translateY(${(1 - v) * 14}px) scale(${.985 + .015 * v})` }), { k: 220, c: 20 });
  return sec;
}

let toastT = null;
function toast(msg) {
  $$('.toast', layer).forEach(x => x.remove());
  const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = msg;
  layer.appendChild(d);
  if (!FX.reduced) FX.spring(d, 0, 1, v => ({ opacity: Math.min(1, v * 1.5), transform: `translate(-50%, ${(1 - v) * -16}px)` }), { k: 240, c: 18 });
  clearTimeout(toastT); toastT = setTimeout(() => d.remove(), 2600);
}

let sheetH = null;
let holdClock = 0;                                   // >0 while a sheet is open: the clock waits
function sheet(o) {
  closeSheets(true);
  const wrap = document.createElement('div');
  wrap.className = 'sheetwrap' + (o.alert ? ' alertwrap' : '');
  wrap.innerHTML = `<div class="backdrop"></div><div class="sheetbox${o.alert ? ' alert' : ''}" role="${o.alert ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="shT" tabindex="-1">${o.alert ? '' : '<div class="grab"></div>'}<div class="sheetbody"><h2 class="sh-title" id="shT">${esc(o.title)}</h2><div class="sbc">${o.body || ''}</div></div><div class="sheetfoot">${o.foot || ''}</div></div>`;
  layer.appendChild(wrap);
  const box = $('.sheetbox', wrap), bd = $('.backdrop', wrap), opener = document.activeElement;
  const h = {
    wrap, box, onDismiss: o.onDismiss || null, alive: true,
    set(body, foot) { $('.sbc', wrap).innerHTML = body; $('.sheetfoot', wrap).innerHTML = foot || ''; },
    close(now) {
      if (!h.alive) return; h.alive = false; holdClock--;
      if (sheetH === h) { sheetH = null; if ('inert' in app) app.inert = false; if (!now) setTimeout(() => window.maybeUpdate && maybeUpdate(), 300); }
      wrap.style.pointerEvents = 'none';
      if (opener && opener.focus && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
      if (now || FX.reduced) { wrap.remove(); return; }
      box.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 200, easing: 'ease-in', fill: 'both' }).finished.then(() => wrap.remove(), () => wrap.remove());
      FX.fade(bd, 1, 0, 180);
    },
    dismiss() { h.close(); if (h.onDismiss) h.onDismiss(); }
  };
  holdClock++; sheetH = h;
  if ('inert' in app) app.inert = true;
  bd.onclick = () => h.dismiss();
  wrap.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); h.dismiss(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('button:not(:disabled),input:not(:disabled),a[href]', box).filter(x => x.offsetParent !== null);
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  });
  FX.fade(bd, 0, 1, 200);
  if (o.alert) FX.spring(box, 0, 1, v => ({ opacity: Math.min(1, v * 1.6), transform: `scale(${.92 + .08 * v})` }), { k: 300, c: 24 });
  else FX.spring(box, 0, 1, v => ({ transform: `translateY(${(1 - v) * 100}%)` }), { k: 260, c: 26 });
  try { box.focus({ preventScroll: true }); } catch (e) {}
  return h;
}
function closeSheets(now) { if (sheetH) sheetH.close(now); }

function ask(title, body, yes, onYes, onNo, noLabel) {
  const h = sheet({
    title, alert: true, body: `<p>${esc(body)}</p>`, onDismiss: onNo,
    foot: `<button class="btn drop" id="dy">${esc(yes)}</button><button class="btn ghost" id="dn">${esc(noLabel || t('stay'))}</button>`
  });
  $('#dy', h.wrap).onclick = () => { Snd.ui(); h.close(true); onYes(); };
  $('#dn', h.wrap).onclick = () => { Snd.ui(); h.dismiss(); };
  return h;
}

/* ============ LANGUAGE (strings.js holds every word) ============ */
let LANG = 'en';
function t(key, vars) {
  let v = (STR[LANG] && STR[LANG][key]) || STR.en[key] || key;
  if (vars) Object.keys(vars).forEach(k => { v = v.split('{' + k + '}').join(vars[k]); });
  return v;
}
// Sets lang (for fonts and screen readers) and dir: Arabic reads right to left.
function applyLang() {
  const d = document.documentElement;
  d.lang = LANG;
  d.dir = (LANGS.find(l => l.id === LANG) || {}).rtl ? 'rtl' : 'ltr';
}
async function loadLang() {
  const v = await Store.get('lang:v1'); if (v && STR[v]) { LANG = v; applyLang(); return; }
  const n = (navigator.language || 'en').slice(0, 2);
  if (STR[n]) LANG = n;
  applyLang();
}
async function setLang(id) {
  if (!STR[id]) return;
  LANG = id; applyLang();
  await Store.set('lang:v1', id);
  home();
}

/* ============ RECORD — you against the bot, per pack, stored on this device (record:v1) ============ */
const REC_KEY = 'record:v1';
const blankRec = () => ({ played: 0, won: 0, lost: 0, drawn: 0, streak: 0, best: 0, pts: 0, botPts: 0, bestGame: null, byLevel: {} });
const nn = x => (Number.isFinite(x) && x >= 0 ? Math.round(x) : 0);
let RECS = { packs: {}, last: null, best: {} };
function parseRecs(raw) {
  let o = {}; try { o = JSON.parse(raw || '{}') || {}; } catch (e) {}
  const out = { packs: {}, last: Packs.ids().includes(o.last) ? o.last : null, best: {} };
  Packs.ids().forEach(id => {
    const r = (o.packs || {})[id] || {}, b = blankRec();
    ['played', 'won', 'lost', 'drawn', 'best', 'pts', 'botPts'].forEach(k => { b[k] = nn(r[k]); });
    b.streak = Number.isInteger(r.streak) ? r.streak : 0;
    b.bestGame = r.bestGame && Number.isFinite(r.bestGame.pts) ? { pts: nn(r.bestGame.pts) } : null;
    Object.keys(r.byLevel || {}).forEach(k => { const l = r.byLevel[k]; if (l) b.byLevel[k] = { played: nn(l.played), won: nn(l.won) }; });
    out.packs[id] = b;
  });
  Object.keys(o.best || {}).forEach(k => { const b = o.best[k]; if (b && b.accuracy >= 0 && b.accuracy <= 1 && Array.isArray(b.rings)) out.best[k] = b; });
  return out;
}
const recFor = id => RECS.packs[id] || (RECS.packs[id] = blankRec());
async function loadRec() { RECS = parseRecs(await Store.get(REC_KEY)); if (RECS.last) SELPACK = RECS.last; }
async function saveRec() { await Store.set(REC_KEY, JSON.stringify(RECS)); }
async function clearRec() { const best = RECS.best; RECS = parseRecs(null); RECS.best = best; await saveRec(); }
function applyGame(R, you, bot, level) {
  const won = you > bot, lost = you < bot;
  R.played++; R.pts += you; R.botPts += bot;
  if (won) { R.won++; R.streak = R.streak > 0 ? R.streak + 1 : 1; } else if (lost) { R.lost++; R.streak = R.streak < 0 ? R.streak - 1 : -1; } else { R.drawn++; R.streak = 0; }
  R.best = Math.max(R.best, R.streak);
  const record = !R.bestGame || you > R.bestGame.pts;
  if (record) R.bestGame = { pts: you };
  const L = R.byLevel[level] || (R.byLevel[level] = { played: 0, won: 0 }); L.played++; if (won) L.won++;
  return { record: record && R.played > 1 };
}

/* ============ HOME ============ */
function home() {
  G = null; PACK = null;
  $$('.overlay', layer).forEach(o => o.remove()); rootEl.classList.remove('soldOpen', 'celebrating');
  const REC = recFor(SELPACK), count = Packs.meta(SELPACK).count;
  const lang = LANGS.find(l => l.id === LANG) || LANGS[0], has = REC.played > 0;
  const sec = go(`
    <div class="nav"><span></span>${navBtns()}</div>
    <div class="menu-grid">
      <div class="m-l">
        <div class="hero" data-pk="${SELPACK}"><img class="globe" src="globe-hero.webp" alt="" width="280" height="280" decoding="async">
          <h1 class="title"><span>Project</span><span class="goldtext">X</span></h1>
          <p class="tag">${esc(t('tagline'))}</p></div>
        <button class="glass recpill" id="mrec" aria-label="${esc(t('record'))}">
          <span class="big num">${REC.won}<i>–</i>${REC.lost}${REC.drawn ? `<i>–</i>${REC.drawn}` : ''}</span>
          <span class="m"><b>${esc(t('record'))}</b><br>${has ? `${REC.played} ${esc(t('games'))} · ${Math.round(REC.won / REC.played * 100)}% ${esc(t('winRate'))}` : esc(t('noGames'))}</span>
          ${has && REC.streak > 1 ? `<span class="streak">+${REC.streak}</span>` : ''}
        </button>
      </div>
      <div class="m-r">
        <div class="packs" role="list">
          ${Packs.META.map(pm => { const sel = pm.id === SELPACK; return `<button class="pack ${sel ? 'on glass2' : 'off'}" data-pack="${pm.id}" role="listitem" ${sel ? 'aria-current="true"' : ''}><b>${esc(pm.title[LANG] || pm.title.en)}</b><span class="s">${pm.count} · ${esc(t('popLabel'))}</span></button>`; }).join('')}
        </div>
        <div class="modes">
          <button class="glass mode" id="m1"><span class="ic">${IC('person')}</span><span class="t"><b>${esc(t('solo'))}</b><span class="d">${esc(t('soloShort'))}</span></span><span class="go">${IC('chev', 'sm')}</span></button>
          <button class="glass mode" id="m2"><span class="ic b">${IC('people')}</span><span class="t"><b>${esc(t('multi'))}</b><span class="d">${esc(t('multiShort'))}</span></span><span class="go">${IC('chev', 'sm')}</span></button>
        </div>
        <div class="dockbar">
          <button class="glass chipbtn" id="mr">${IC('book', 'sm')}${esc(t('how'))}</button>
          <button class="glass chipbtn" id="ml" aria-label="${esc(t('language'))}: ${esc(lang.label)}"><span aria-hidden="true">${flag(langFlag(lang))}</span> ${esc(lang.label)}</button>
          <button class="glass chipbtn sq" id="mset" aria-label="${esc(t('settings'))}">${IC('gear', 'sm')}</button>
          <button class="glass chipbtn sq" id="mp" aria-label="${esc(t('privacy'))}">${IC('lock', 'sm')}</button>
        </div>
        <p class="foot">${esc(t('footer', { n: count }))} · <span class="ver" aria-label="Version ${CONFIG.version}">v${CONFIG.version}</span></p>
      </div>
    </div>`, 'menu');
  const tap = (id, fn) => on(id, () => { Snd.ui(); Haptics.light(); fn(); });
  tap('m1', () => setup('solo'));
  tap('m2', () => setup('multi'));
  tap('mr', rules); tap('mp', privacy); tap('mrec', recordScreen); tap('ml', langSheet); tap('mset', settingsSheet);
  $$('[data-pack]', sec).forEach(b => b.onclick = () => {
    if (b.dataset.pack === SELPACK) return;
    Snd.ui(); Haptics.light(); SELPACK = b.dataset.pack; RECS.last = SELPACK; saveRec(); home();
    (window.requestIdleCallback || (f => setTimeout(f, 200)))(() => Packs.load(SELPACK).catch(() => {}));
  });
  setTimeout(window.maybeUpdate, 0);
}
window.onMenuIdle = () => !!$('.screen[data-screen=menu]') && !sheetH;
window.maybeUpdate = () => { if (window.pendingReload && window.onMenuIdle()) window.pendingReload(); };

/* ============ SHEETS: settings, language, record, privacy, credits, rules ============ */
const seg = (g, label, items, def) => `<div class="sg" role="radiogroup" aria-label="${esc(label)}" data-g="${g}">${items.map(([v, l]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(def)}">${esc(l)}</button>`).join('')}</div>`;

function settingsSheet() {
  const sw = (k, label, desc, on) => `<button class="row sw" role="switch" aria-checked="${on}" data-k="${k}"><span class="t">${esc(label)}<small>${esc(desc)}</small></span><span class="knob" aria-hidden="true"></span></button>`;
  const lang = LANGS.find(l => l.id === LANG) || LANGS[0];
  const h = sheet({ title: t('settings'), foot: `<button class="btn ghost" id="sreset">${esc(t('resetSettings'))}</button><button class="btn gold" id="sdone">${esc(t('done'))}</button>`, body: `
    <div class="fld"><span class="label">${esc(t('setAppear'))}</span>
      ${seg('theme', t('setAppear'), [['dark', t('themeDarkL')], ['light', t('themeLightL')]], THEME)}
      <div class="sgl">${seg('tz', t('textSize'), [[-1, t('tzS')], [0, t('tz0')], [1, t('tz1')], [2, t('tz2')]], SET.tz)}</div></div>
    <div class="fld"><span class="label">${esc(t('language'))}</span><button class="row glass langrow" id="slang"><span class="t"><span aria-hidden="true">${flag(langFlag(lang))}</span> ${esc(lang.label)}</span>${IC('chev', 'sm')}</button></div>
    <div class="fld"><span class="label">${esc(t('setAccess'))}</span><div class="group">
      ${sw('motion', t('reduceMotion'), t('reduceMotionD'), SET.motion === 'reduce')}${sw('shapes', t('seatShapes'), t('seatShapesD'), SET.shapes)}</div></div>
    <div class="fld"><span class="label">${esc(t('setHelpers'))}</span><div class="group">${sw('faint', t('faint'), t('faintSub'), SET.faint)}</div></div>` });
  const box = h.wrap;
  $$('[data-g]', box).forEach(grp => $$('[role=radio]', grp).forEach(b => b.onclick = () => {
    $$('[role=radio]', grp).forEach(x => x.setAttribute('aria-checked', 'false')); b.setAttribute('aria-checked', 'true');
    Snd.ui(); Haptics.light();
    if (grp.dataset.g === 'theme') setTheme(b.dataset.v); else { SET.tz = +b.dataset.v; saveSettings(); }
  }));
  $$('.sw', box).forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = b.getAttribute('aria-checked') !== 'true';
    if (k === 'motion') SET.motion = v ? 'reduce' : 'auto'; else SET[k] = v;
    b.setAttribute('aria-checked', String(v)); Snd.ui(); Haptics.light(); saveSettings();
  });
  on('slang', () => { Snd.ui(); langSheet(); });
  on('sdone', () => { Snd.ui(); h.close(); if (!G) home(); });
  on('sreset', () => { Snd.ui(); ask(t('resetSetTitle'), t('resetSetBody'), t('resetSettings'), async () => { SET = parseSettings(null); await saveSettings(); settingsSheet(); }, () => settingsSheet(), t('cancel')); });
  h.onDismiss = () => { if (!G) home(); };
  return h;
}

function langSheet() {
  const h = sheet({ title: t('language'), foot: `<button class="btn gold" id="ld">${esc(t('done'))}</button>`,
    body: `<div class="group" role="radiogroup" aria-label="${esc(t('language'))}">${LANGS.map(l => `<button class="row" role="radio" aria-checked="${l.id === LANG}" data-l="${l.id}"><span class="t"><span aria-hidden="true">${flag(langFlag(l))}</span> ${esc(l.label)}</span>${l.id === LANG ? `<span class="val" aria-hidden="true">✓</span>` : ''}</button>`).join('')}</div>` });
  $$('[data-l]', h.wrap).forEach(b => b.onclick = () => { Snd.ui(); setLang(b.dataset.l); });
  on('ld', () => { Snd.ui(); h.close(); });
}

async function recordScreen() {
  const REC = recFor(SELPACK);
  let pack = Packs.get(SELPACK);
  if (!pack) { try { pack = await Packs.load(SELPACK); } catch (e) {} }
  const pct = REC.played ? Math.round(REC.won / REC.played * 100) : 0;
  const avg = REC.played ? Math.round(REC.pts / REC.played) : 0, avgBot = REC.played ? Math.round(REC.botPts / REC.played) : 0;
  const bestN = Object.keys(RECS.best).filter(k => k.startsWith(SELPACK + ':')).length;
  const lvlName = k => { const l = pack && pack.difficulties[k]; return l ? (l.label[LANG] || l.label.en) : k; };
  const row = (l, v) => `<div class="row"><span class="t">${esc(l)}</span><span class="val num">${v}</span></div>`;
  const h = sheet({ title: t('record'), foot: `${REC.played ? `<button class="btn ghost" id="rs">${esc(t('reset'))}</button>` : ''}<button class="btn gold" id="rd">${esc(t('done'))}</button>`,
    body: `<p class="label">${esc(Packs.meta(SELPACK).title[LANG] || Packs.meta(SELPACK).title.en)}</p>` + (REC.played ? `
      <div class="rec3"><div class="w"><div class="rn num">${REC.won}</div><div class="rl">${esc(t('wins'))}</div></div><div><div class="rn num">${REC.lost}</div><div class="rl">${esc(t('losses'))}</div></div><div><div class="rn num">${REC.drawn}</div><div class="rl">${esc(t('draws'))}</div></div></div>
      <div class="group">${row(t('games'), REC.played)}${row(t('winRate'), pct + '%')}${row(t('streak'), REC.streak > 0 ? '+' + REC.streak : REC.streak)}${row(t('bestStreak'), '+' + REC.best)}${row(t('avgPts'), fmtN(avg) + ' — ' + fmtN(avgBot))}${REC.bestGame ? row(t('bestGame'), fmtN(REC.bestGame.pts)) : ''}${row(t('bestSaved'), bestN)}</div>
      ${Object.keys(REC.byLevel).length ? `<div class="group">${Object.keys(REC.byLevel).map(k => row(lvlName(k), REC.byLevel[k].won + '/' + REC.byLevel[k].played)).join('')}</div>` : ''}
      <p class="sm">${esc(t('recordNote'))}</p>` : `<p>${esc(t('noGames'))}</p>`) });
  on('rd', () => { Snd.ui(); h.close(); });
  on('rs', () => { Snd.ui(); ask(t('resetTitle'), t('resetBody'), t('reset'), async () => { await clearRec(); home(); }, null, t('cancel')); });
}

function privacy() {
  const h = sheet({ title: t('privacy'), foot: `<button class="btn ghost" id="wipe">${esc(t('wipe'))}</button><button class="btn gold" id="pd">${esc(t('done'))}</button>`,
    body: `<p>${esc(t('privP1'))}</p><p>${esc(t('privP2'))}</p><p>${esc(t('privP3'))}</p><p class="sm">${esc(t('privP4'))}</p><a class="btn glassb wide" id="ppol" href="privacy.html">${esc(t('privPolicy'))}</a><a class="btn glassb wide" id="psup" href="support.html">${esc(t('supportLink'))}</a><button class="btn glassb wide" id="cr">${esc(t('credits'))}</button>` });
  on('pd', () => { Snd.ui(); h.close(); });
  on('cr', () => { Snd.ui(); credits(); });
  on('wipe', () => { Snd.ui(); ask(t('wipeTitle'), t('wipeBody'), t('wipe'), async () => {
    await Store.remove(REC_KEY); await Store.remove('lang:v1'); await Store.remove('name:v1'); await Store.remove('theme:v1'); await Store.remove(SETTINGS_KEY);
    RECS = parseRecs(null); SELPACK = DEFAULT_PACK; CFG = null;
    THEME = 'dark'; applyTheme(); SET = parseSettings(null); applySettings(); await loadLang(); toast(t('wiped')); home();
  }, null, t('cancel')); });
}

function credits() {
  const h = sheet({ title: t('credits'), foot: `<button class="btn gold" id="cd">${esc(t('done'))}</button>`,
    body: `<p>${esc(t('creditsIntro'))}</p>` + ['xCredits1', 'xCredits2', 'xCredits3', 'creditsImg', 'creditsWorld', 'creditsGlobe', 'creditsThree', 'creditsSound'].map(k => `<p class="sm">${t(k)}</p>`).join('') });
  on('cd', () => { Snd.ui(); h.close(); });
}

function rules() {
  const h = sheet({ title: t('how'), foot: `<button class="btn gold" id="rd">${esc(t('done'))}</button>`,
    body: ['rulesP1', 'rulesP2', 'rulesP3', 'rulesP4', 'rulesP5', 'rulesP6'].map(k => `<p>${esc(t(k))}</p>`).join('') + `<p class="sm">${esc(t('rulesP7'))}</p>` });
  on('rd', () => { Snd.ui(); h.close(); });
}

/* ============ SETUP (a sheet over the menu, or over the results for "Play again") ============ */
let LASTCFG = null;
async function setup(kind, packId = SELPACK) {
  const tok = navTok;
  const h = sheet({ title: kind === 'solo' ? t('solo') : t('multi'), body: `<p style="text-align:center"><span class="spin"></span></p>`, foot: '' });
  let pack = Packs.get(packId);
  if (!pack) {
    try { pack = await Packs.load(packId); }
    catch (e) { if (tok === navTok && h.alive) { h.close(true); toast(t('packFail')); } return; }
    if (tok !== navTok || !h.alive) return;
  }
  PACK = pack;
  const c0 = LASTCFG && LASTCFG.packId === pack.id && LASTCFG.kind === kind ? LASTCFG : {};
  const diffs = Object.keys(pack.difficulties);
  const level = diffs.includes(c0.level) ? c0.level : diffs[0];
  const roundOpts = lv => [5, 10, 15, 20, 30].filter(n => n <= Engine.poolFor(pack, lv).length);
  const rounds = roundOpts(level).includes(c0.rounds) ? c0.rounds : 5;
  const clue = [10, 15, 20, 30].includes(c0.clue) ? c0.clue : 15;
  const draw = [15, 20, 30, 45].includes(c0.draw) ? c0.draw : 20;
  const nPl = [2, 3, 4].includes(c0.players) ? c0.players : 2;
  const nBots = kind === 'solo' ? ([1, 2, 3].includes(c0.bots) ? c0.bots : 1) : ([0, 1, 2].includes(c0.bots) && nPl + c0.bots <= 4 ? c0.bots : 0);
  const lvParts = k => { const l = pack.difficulties[k]; return [l.label[LANG] || l.label.en, `${t('diffSub_' + k)} · ${Engine.poolFor(pack, k).length}`]; };
  h.set(`
    <p class="sm">${esc(kind === 'solo' ? t('rivalDesc') : t('multiDesc'))}</p>
    ${kind === 'multi' ? `<div class="fld inl"><span class="label">${esc(t('peopleN'))}</span>${seg('players', t('peopleN'), [[2, '2'], [3, '3'], [4, '4']], nPl)}</div>` : ''}
    <div class="fld inl"><span class="label">${esc(t('botsN'))}</span>${seg('bots', t('botsN'), (kind === 'solo' ? [1, 2, 3] : [0, 1, 2]).map(n => [n, String(n)]), nBots)}<p class="sm" id="botsHint" role="note"${nBots > 1 ? '' : ' hidden'}>${esc(t('botsHint'))}</p></div>
    <div class="fld"><span class="label">${esc(t('lots'))}</span><div id="roundsBox">${seg('rounds', t('lots'), roundOpts(level).map(n => [n, String(n)]), rounds)}</div><p class="sm" id="lotHint" role="note"${rounds <= 5 ? '' : ' hidden'}>${esc(t('shortHint'))}</p></div>
    ${diffs.length > 1 ? `<div class="fld"><span class="label">${esc(t('difficulty'))}</span><div class="lvls" role="radiogroup" aria-label="${esc(t('difficulty'))}" data-g="level">${diffs.map(k => { const [a, b] = lvParts(k); return `<button type="button" class="lvl" role="radio" data-v="${k}" aria-checked="${k === level}"><span class="tt">${esc(a)}<small>${esc(b)}</small></span><span class="ck" aria-hidden="true"></span></button>`; }).join('')}</div></div>` : ''}
    <div class="fld"><span class="label">${esc(t('seconds'))}</span>${seg('clue', t('seconds'), [[10, '10'], [15, '15'], [20, '20'], [30, '30']], clue)}</div>
    <div class="fld"><span class="label">${esc(t('drawTime'))}</span>${seg('draw', t('drawTime'), [[15, '15'], [20, '20'], [30, '30'], [45, '45']], draw)}</div>
    <div class="fld"><span class="label">${esc(kind === 'solo' ? t('nickOne') : t('nickMany'))}</span>
      <div class="names">${(kind === 'solo' ? [1] : [1, 2, 3, 4]).map(i => `<input class="field" id="p${i}" maxlength="16" autocomplete="off" autocapitalize="words" aria-label="${esc(t('player'))} ${i}" placeholder="${esc(t('player'))} ${i}" ${kind === 'multi' && i > nPl ? 'hidden' : ''}>`).join('')}</div></div>
    ${SET.faint ? `<p class="sm">${esc(t('faintSub'))}</p>` : ''}`,
    `<button class="btn gold big" id="start">${esc(t('open'))}</button><button class="btn ghost" id="back">${esc(t('back'))}</button>`);
  const box = h.wrap;
  const pick = g => { const b = $(`[data-g="${g}"] [aria-checked="true"]`, box); return b ? b.dataset.v : null; };
  const bindGroups = () => $$('[data-g]', box).forEach(grp => $$('[role=radio]', grp).forEach(b => b.onclick = () => {
    $$('[role=radio]', grp).forEach(x => x.setAttribute('aria-checked', 'false')); b.setAttribute('aria-checked', 'true');
    Snd.ui(); Haptics.light();
    const g = grp.dataset.g;
    if (g === 'rounds') $('#lotHint', box).hidden = +b.dataset.v > 5;
    if (g === 'level') {                               // a smaller pool offers fewer rounds
      const cur = +pick('rounds'), opts = roundOpts(b.dataset.v);
      $('#roundsBox', box).innerHTML = seg('rounds', t('lots'), opts.map(n => [n, String(n)]), opts.includes(cur) ? cur : opts[opts.length - 1]);
      bindGroups();
    }
    if (g === 'players') [3, 4].forEach(i => { const el = $('#p' + i, box); if (el) el.hidden = i > +b.dataset.v; });
    if (g === 'players' || g === 'bots') seats();
  }));
  const seats = () => {
    if (kind !== 'multi') { const hb = $('#botsHint', box); if (hb) hb.hidden = !(+pick('bots') > 1); return; }
    const people = +pick('players') || 2, grp = $('[data-g="bots"]', box);
    $$('[role=radio]', grp).forEach(x => { const over = people + +x.dataset.v > 4; x.disabled = over; x.setAttribute('aria-disabled', String(over)); });
    if (people + (+pick('bots') || 0) > 4) { const keep = $(`[role=radio][data-v="${4 - people}"]`, grp); $$('[role=radio]', grp).forEach(x => x.setAttribute('aria-checked', String(x === keep))); }
    const hb = $('#botsHint', box); if (hb) hb.hidden = !(+pick('bots') > 1);
  };
  bindGroups(); seats();
  Store.get('name:v1').then(n => { const el = $('#p1', box); if (n && el && !el.value) el.value = String(n).slice(0, 16); });
  on('back', () => { Snd.ui(); h.close(); });
  on('start', () => {
    Snd.unlock(); Snd.ui(); Haptics.medium();
    const p1val = val('p1').slice(0, 16); if (p1val) Store.set('name:v1', p1val);
    const count = kind === 'solo' ? 1 : +pick('players') || 2, bots = Math.max(kind === 'solo' ? 1 : 0, Math.min(kind === 'solo' ? 3 : 4 - count, +pick('bots') || 0));
    const seats = kind === 'solo' ? [{ kind: 'human', name: p1val || t('you') }] : [1, 2, 3, 4].slice(0, count).map(i => ({ kind: 'human', name: val('p' + i).slice(0, 16) || `${t('player')} ${i}` }));
    for (let k = 1; k <= bots; k++) seats.push({ kind: 'bot', name: bots === 1 ? t('bot') : `${t('bot')} ${k}` });
    LASTCFG = { packId: pack.id, kind, level: pick('level') || level, rounds: +pick('rounds'), clue: +pick('clue'), draw: +pick('draw'), players: count, bots };
    h.close(true);
    CFG = { seed: Math.floor(Math.random() * 2 ** 32), difficulty: LASTCFG.level, rounds: LASTCFG.rounds, clueSeconds: LASTCFG.clue, drawSeconds: LASTCFG.draw, seats, practice: { faintOutline: SET.faint } };
    G = Engine.createGame(pack, CFG);
    G._kind = kind;
    S0 = { recorded: false };
    show();
  });
}

/* ============ THE GAME — one engine state, one screen per phase ============ */
let S0 = {};                                         // view-only memory for the game on screen
const seatOf = i => i % 4;
const nameOf = id => cname(PACK.byId.get(id));
const itemOf = id => PACK.byId.get(id);
const turnNow = () => Engine.activeTurn(G);
const seatNow = () => Engine.activeSeat(G);

function show() {
  if (!G) return home();
  switch (G.phase) {
    case 'handoff': return handoff();
    case 'clue': return clueScreen();
    case 'draw': return drawScreen();
    case 'reveal': return revealMoment();
    case 'roundEnd': return roundEnd();
    default: return finish();
  }
}

function act(action) {
  const before = G, tb = turnNow();
  G = Engine.step(PACK, before, action);
  const ta = turnNow();
  if (G.notice && G.notice.type === 'unknownPlace') { FX.shakeX($('#cus')); return toast(t('unknown', { t: G.notice.text })); }
  if (G.notice && G.notice.type === 'alreadyGuessed') { FX.shakeX($('#cus')); return toast(t('already', { p: nameOf(G.notice.id) })); }
  if (action.type === 'guess' && tb && ta && ta.guesses.length > tb.guesses.length) {
    const g = ta.guesses[ta.guesses.length - 1];
    if (g.ok) { Snd.chime(); Haptics.success(); } else { Snd.drop(); Haptics.warning(); S0.wrong = g.id; }
  }
  if (G.phase !== before.phase || G.phase !== 'clue') return show();
  if (ta && tb && ta.clue !== tb.clue) return show();
}

const navGame = (mid, pause) => `<div class="nav"><button class="ibtn pill" id="nb">${IC('menu')}${esc(t('menu'))}</button><span class="lotpill num">${mid}</span><span class="navr">${pause ? `<button class="ibtn" id="pause" aria-label="${esc(t('pauseBtn'))}">${IC('pause')}</button>` : ''}${navBtns(false)}</span></div>`;
const roundPill = () => `${esc(t('round', { r: G.round + 1, n: G.config.rounds }))}`;
function bindGameNav() {
  on('nb', () => { Snd.ui(); Haptics.light(); ask(t('leaveTitle'), t('quitNote'), t('leave'), () => home(), null); });
  on('pause', () => { Snd.ui(); Haptics.light(); pauseGame(); });
}
function pauseGame() {
  const h = sheet({ title: t('pausedTitle'), body: `<p>${esc(t('pausedBody'))}</p>`,
    foot: `<button class="btn gold" id="pr">${esc(t('resume'))}</button><button class="btn ghost" id="pl">${esc(t('leaveGame'))}</button>` });
  on('pr', () => { Snd.ui(); h.close(); });
  on('pl', () => { Snd.ui(); h.close(true); ask(t('leaveTitle'), t('quitNote'), t('leave'), () => home(), null); });
}

/* the seat tiles, as in the auction: avatar, name, a status line, a badge for whose turn it is */
function seatsHtml(phase) {
  const me = seatNow(), turn = turnNow();
  return `<div class="orbs" id="players" style="--n:${G.config.seats.length}">${G.config.seats.map((s, i) => {
    const active = i === me;
    let st;
    if (active) st = phase === 'draw' ? t('drawing') : t('guessing');
    else if (s.kind === 'bot') st = botDone(i, turn) ? t('lockedIn') : t('thinking');
    else st = G.turns[G.round][i].done ? t('lockedIn') : t('waiting');
    return `<div class="po${active ? ' active' : ''}" data-i="${i}" role="group" aria-label="${esc(s.name)}, ${esc(st)}"><span class="now">${esc(active ? st : t('thinking'))}</span><div class="o s${seatOf(i)}" aria-hidden="true">${esc(ini(s.name))}</div><div class="nm">${esc(s.name)}</div><div class="rl" ${s.kind === 'bot' ? `data-bot="${i}"` : ''}>${esc(active ? '' : st)}</div></div>`;
  }).join('')}</div>`;
}
function botDone(i, turn) {
  const last = G.turns[G.round][i].bot.timeline.slice(-1)[0];
  if (!turn || G.phase !== 'clue') return true;
  const elapsed = clk ? clk.elapsed : 0;
  return turn.clue > last.clue || (turn.clue === last.clue && elapsed >= last.atMs);
}

/* ---- hot-seat: pass the phone ---- */
function handoff() {
  PACK = PACK || Packs.get(CFG && LASTCFG.packId);
  const s = seatNow();
  const sec = go(`${navGame(roundPill(), false)}
    <div class="pxcenter"><div class="glass win pxcard">
      <div class="o s${seatOf(s)}" style="width:96px;height:96px;font-size:40px;margin:0 auto 10px" aria-hidden="true">${esc(ini(G.config.seats[s].name))}</div>
      <p class="label">${esc(t('passTo'))}</p><h2>${esc(G.config.seats[s].name)}</h2><p>${esc(t('passNote'))}</p>
      <button class="btn gold big" id="rdy" style="margin-top:14px">${esc(t('ready'))}</button></div></div>`, 'auction');
  bindGameNav();
  on('rdy', () => { Snd.ui(); Haptics.medium(); act({ type: 'ready' }); });
  return sec;
}

/* ---- clue phase: the ring is the clock, the points sit inside it ---- */
function clueScreen() {
  const turn = turnNow(), rules = G.config.rules;
  const clues = Engine.revealedClues(PACK, G, LANG);
  const wrong = turn.guesses.filter(x => !x.ok).length;
  const worth = Math.max(1, (rules.basePoints[turn.clue] || 1) - wrong * rules.wrongGuessPenalty);
  const last = S0.wrong; S0.wrong = null;
  const sec = go(`
    <p class="sr" id="live" role="status" aria-live="polite">${esc(clues[clues.length - 1])}</p>
    ${navGame(roundPill(), true)}
    <div class="aud">
      <div class="aud-l"><div class="stage" id="stage">
        <div class="head"><div class="orb" aria-hidden="true"><span class="ibadge">?</span></div><h2 class="cname n2">${esc(t('mystery'))}</h2></div>
        <div class="ringwrap" id="timer" role="progressbar" aria-label="${esc(t('aTimer'))}" aria-valuemin="0" aria-valuemax="${G.config.clueSeconds}" style="--p:1">
          <svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--gold1)"/><stop offset="1" style="stop-color:var(--gold2)"/></linearGradient></defs>
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--track)" stroke-width="9"/><circle class="prog" cx="100" cy="100" r="92" fill="none" stroke="url(#rg)" stroke-width="9" stroke-linecap="round"/></svg>
          <div class="in" id="bump"><div class="lbl">${esc(t('worthLabel'))}</div><div class="price"><span id="price">${worth}</span></div><div class="lbl">${esc(worth === 1 ? t('point') : t('pointsWord'))}</div></div><span class="secs num" id="secs" aria-hidden="true"></span></div>
        <div class="holder"><span class="dot s0"></span><span>${esc(t('clueOf', { n: clues.length }))}</span></div>
        <div class="taunt fact" id="taunt">${esc(last ? t('notIt', { p: nameOf(last) }) : t('costNote'))}</div>
      </div></div>
      <div class="aud-r">
        ${seatsHtml('clue')}
        <div class="glass dock" id="ctrl">
          <ol class="pxclues">${clues.map((c, k) => `<li class="${k === clues.length - 1 ? 'cur' : ''}"><span class="n num">${k + 1}</span><span>${esc(c)}</span></li>`).join('')}${clues.length < 5 ? `<li class="later"><span class="n num">${clues.length + 1}</span><span>${esc(t('clueN', { n: clues.length + 1 }))} · ${esc(t('worth', { p: rules.basePoints[clues.length] }))}</span></li>` : ''}</ol>
          <ul class="pxsugg" id="sugg" role="listbox"></ul>
          <div class="custom"><input class="in" id="cus" type="text" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" placeholder="${esc(t('guessPh'))}" aria-label="${esc(t('guessPh'))}"><button class="btn gold" id="cb">${esc(t('guess'))}</button></div>
          <button class="btn ghost" id="pass">${esc(t('nextClue'))}</button>
        </div>
      </div>
    </div>`, 'auction');
  bindGameNav();
  const inp = $('#cus', sec), ul = $('#sugg', sec);
  let sugg = [], sel = -1;
  const paintSugg = () => {
    sugg = inp.value.trim() ? Engine.suggest(PACK.index, inp.value, LANG, 3) : [];
    if (sel >= sugg.length) sel = sugg.length - 1;
    ul.innerHTML = sugg.map((s, i) => `<li><button type="button" data-pick="${s.id}" aria-selected="${i === sel}">${esc(s.label)}${s.matched ? `<small>${esc(s.matched)}</small>` : ''}</button></li>`).join('');
    $$('[data-pick]', ul).forEach(b => b.onclick = () => { Snd.ui(); act({ type: 'guess', id: b.dataset.pick }); });
  };
  const submit = () => {
    const p = sel >= 0 ? sugg[sel] : sugg.length === 1 ? sugg[0] : null;
    if (p) return act({ type: 'guess', id: p.id });
    if (!inp.value.trim()) { FX.shakeX(inp); return; }
    act({ type: 'guess', text: inp.value });
  };
  inp.oninput = () => { sel = -1; paintSugg(); };
  inp.onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = e.key === 'ArrowDown' ? Math.min(sugg.length - 1, sel + 1) : Math.max(-1, sel - 1); paintSugg(); }
  };
  on('cb', () => { Snd.ui(); submit(); });
  on('pass', () => { Snd.ui(); act({ type: 'clueTimeout' }); });
  if (matchMedia('(hover: hover)').matches) setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 50);
  const stage = $('#stage', sec);
  if (stage && !FX.reduced && clues.length === 1) FX.spring(stage, 0, 1, v => ({ opacity: Math.min(1, v * 1.5), transform: `translateY(${(1 - v) * -26}px) scale(${1.05 - .05 * v})` }), { k: 200, c: 15 });
  Snd.chime();
  startClock(G.config.clueSeconds, () => act({ type: 'clueTimeout' }), () => {
    $$('[data-bot]', sec).forEach(el => { const d = botDone(+el.dataset.bot, turnNow()); el.textContent = d ? t('lockedIn') : t('thinking'); });
  });
}

/* ---- drawing: the largest canvas that fits, shaped roughly like the place ---- */
const LONG = 1000;
let DR = null;                                       // { cv, ctx, w, h, strokes, cur }
function drawScreen() {
  const turn = turnNow(), item = itemOf(G.places[G.round]), solved = turn.solvedAt !== null;
  const sec = go(`
    ${navGame(roundPill(), true)}
    <div class="aud pxdraw">
      <div class="aud-l"><div class="stage pxdrawstage" id="stage">
        <div class="pxcanvas" id="cbox"><canvas id="cv" aria-label="${esc(t('drawHere'))}"></canvas><span class="pxnorth">▲ N</span><span class="pxempty" id="emptyhint">${esc(t('drawHere'))}</span></div>
      </div></div>
      <div class="aud-r">
        ${seatsHtml('draw')}
        <div class="glass dock" id="ctrl">
          <div class="pxdrawhead"><span class="orb" aria-hidden="true">${icon(item)}</span><div><span class="label">${esc(t('drawEyebrow'))}</span><h2>${esc(cname(item))}</h2></div></div>
          <p class="hint">▲ ${esc(t('northUp'))}${item.mainlandOnly ? ' · ' + esc(t('mainland')) : ''} · ${esc(solved ? t('solvedOn', { n: turn.solvedAt + 1, b: turn.base }) : t('missedIt'))}</p>
          <div class="pxbar"><i id="dbar"></i></div>
          <div class="custom"><button class="btn glassb" id="undo" style="flex:1;width:auto">${esc(t('undo'))}</button><button class="btn glassb" id="clr" style="flex:1;width:auto">${esc(t('clear'))}</button></div>
          <button class="btn gold" id="done">${esc(t('done'))}</button>
        </div>
      </div>
    </div>`, 'auction');
  bindGameNav();
  DR = { strokes: [], cur: null };
  sizeCanvas();
  requestAnimationFrame(() => requestAnimationFrame(sizeCanvas));
  const cv = $('#cv', sec);
  const pt = e => { const r = cv.getBoundingClientRect(), u = LONG / Math.max(DR.w, DR.h); return [(e.clientX - r.left) * u, (e.clientY - r.top) * u]; };
  cv.onpointerdown = e => { if (sheetH) return; e.preventDefault(); Snd.unlock(); cv.setPointerCapture(e.pointerId); DR.cur = [pt(e)]; DR.strokes.push(DR.cur); paint(); };
  cv.onpointermove = e => {
    if (!DR.cur) return;
    (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach(ev => { const p = pt(ev), l = DR.cur[DR.cur.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 2) DR.cur.push(p); });
    paint();
  };
  cv.onpointerup = cv.onpointercancel = () => {
    const s = DR.cur; DR.cur = null;
    if (s && s.length > 8 && Math.hypot(s[0][0] - s[s.length - 1][0], s[0][1] - s[s.length - 1][1]) < LONG * 0.05) { Haptics.light(); Snd.ui(); }
  };
  on('undo', () => { Snd.ui(); DR.strokes.pop(); paint(); });
  on('clr', () => { Snd.ui(); DR.strokes = []; paint(); });
  on('done', () => { Snd.ui(); Haptics.medium(); submitDrawing(); });
  startClock(G.config.drawSeconds, submitDrawing, null, 'dbar');
}
function sizeCanvas() {
  const box = $('#cbox'), cv = $('#cv'), stage = $('#stage'); if (!box || !cv || !stage) return;
  const r = stage.getBoundingClientRect();
  // the same, largest possible drawing area for every place (shape is judged, never size)
  const w = r.width - 8, h = r.height - 8;
  DR.w = Math.max(140, Math.floor(w)); DR.h = Math.max(140, Math.floor(h));
  const dpr = Math.min(3, devicePixelRatio || 1);
  cv.width = DR.w * dpr; cv.height = DR.h * dpr; cv.style.width = DR.w + 'px'; cv.style.height = DR.h + 'px';
  DR.ctx = cv.getContext('2d'); DR.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint();
}
function paint() {
  const c = DR && DR.ctx; if (!c) return;
  const css = getComputedStyle(document.documentElement), k = Math.max(DR.w, DR.h) / LONG;
  c.clearRect(0, 0, DR.w, DR.h);
  if (G.config.practice.faintOutline) {
    const o = itemOf(G.places[G.round]).outline, b = Engine.bbox(o), s = Math.min(DR.w * .8 / b.w, DR.h * .8 / b.h);
    const ox = (DR.w - b.w * s) / 2 - b.minX * s, oy = (DR.h - b.h * s) / 2 - b.minY * s;
    c.beginPath(); o.forEach(([x, y], i) => i ? c.lineTo(x * s + ox, y * s + oy) : c.moveTo(x * s + ox, y * s + oy)); c.closePath();
    c.globalAlpha = .22; c.strokeStyle = css.getPropertyValue('--ink2'); c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
  }
  c.strokeStyle = css.getPropertyValue('--ink'); c.lineWidth = 3.5; c.lineJoin = c.lineCap = 'round';
  DR.strokes.forEach(s => { c.beginPath(); s.forEach(([x, y], i) => i ? c.lineTo(x * k, y * k) : c.moveTo(x * k, y * k)); if (s.length === 1) c.lineTo(s[0][0] * k + .1, s[0][1] * k); c.stroke(); });
  const hint = $('#emptyhint'); if (hint) hint.hidden = DR.strokes.length > 0;
}
function submitDrawing() {
  if (!G || G.phase !== 'draw') return;
  const strokes = DR.strokes.map(s => s.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));
  act({ type: 'submitDrawing', strokes });
}
addEventListener('resize', () => { if (G && G.phase === 'draw' && DR) sizeCanvas(); });

/* ---- the clock: a smooth ring (or bar), one tick a second at the end, paused while a sheet is open ---- */
let clk = null;
function startClock(seconds, onOut, onSecond, barId) {
  stopClock();
  const c = clk = { t0: performance.now(), last: performance.now(), total: seconds * 1000, lastSec: seconds, raf: 0, elapsed: 0 };
  const loop = now => {
    if (clk !== c) return;
    const dt = now - c.last; c.last = now;
    if (holdClock > 0 || dt > 250) c.t0 += dt;
    c.elapsed = now - c.t0;
    const left = c.total - c.elapsed, frac = Math.max(0, Math.min(1, left / c.total)), sec = Math.ceil(left / 1000);
    const tm = $('#timer');
    if (tm) { tm.style.setProperty('--p', frac.toFixed(4)); tm.classList.toggle('warn', frac < .34 && frac > 0); const el = $('#secs'); if (el) el.textContent = '0:' + String(Math.max(0, sec)).padStart(2, '0'); }
    const bar = barId && $('#' + barId); if (bar) { bar.style.transform = `scaleX(${frac})`; bar.classList.toggle('warn', frac < .25); }
    if (sec !== c.lastSec) { c.lastSec = sec; if (sec <= 5 && sec > 0) { Snd.tick(sec <= 3); if (sec <= 3) Haptics.warning(); } if (onSecond) onSecond(sec); }
    if (left <= 0) { stopClock(); return onOut(); }
    c.raf = requestAnimationFrame(loop);
  };
  c.raf = requestAnimationFrame(loop);
}
function stopClock() { if (clk) { cancelAnimationFrame(clk.raf); clk = null; } }
function clearTimer() { stopClock(); }

/* ---- the reveal: the real outline traces itself over the sketch, the accuracy counts up, the plate stamps on ---- */
const bboxOf = pts => Engine.bbox(pts);
const pathOf = pts => (pts.length ? 'M' + pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L') + 'Z' : '');
function overlaySvg(turn, itemId, animate) {
  const item = itemOf(itemId), rings = turn.rings || [];
  let real;
  if (turn.fit) real = Engine.outlineToCanvas(item.outline, turn.fit);
  else { const b = bboxOf(item.outline), s = LONG * .8 / Math.max(b.w, b.h); real = item.outline.map(([x, y]) => [(x - b.minX) * s + LONG * .1, (y - b.minY) * s + LONG * .1]); }
  const bb = bboxOf(real.concat(...rings)), side = Math.max(bb.w, bb.h) * 1.08 || LONG, cx = bb.minX + bb.w / 2, cy = bb.minY + bb.h / 2;
  return `<svg class="pxov" viewBox="${(cx - side / 2).toFixed(1)} ${(cy - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}" role="img" aria-label="${esc(cname(item))}">
    ${rings.map(r => `<path class="pxmine" d="${pathOf(r)}"/>`).join('')}<path class="pxreal${animate ? ' trace' : ''}" pathLength="1" d="${pathOf(real)}"/></svg>`;
}
function tierOf(m) { return m >= 90 ? 'tierMaster' : m >= 75 ? 'tierGreat' : m >= 55 ? 'tierGood' : m >= 30 ? 'tierFair' : 'tierBlob'; }
function revealMoment() {
  const turn = turnNow(), id = G.places[G.round], item = itemOf(id), q = turn.multiplier >= 75 ? 'bargain' : turn.multiplier >= 55 ? 'fair' : 'overpay';
  const sec = go(`${navGame(roundPill(), false)}<div class="aud"></div>`, 'auction');
  bindGameNav();
  const wrap = document.createElement('div');
  wrap.className = 'overlay pxreveal'; wrap.id = 'sold'; wrap.dataset.q = q; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
  wrap.innerHTML = `<p class="sr" role="status">${esc(cname(item))}: ${Math.round(turn.accuracy * 100)}%, ${fmtX(turn.multiplier)}×</p>
    <div class="scrim"></div><div class="rays"></div>
    <div class="pxovwrap">${overlaySvg(turn, id, !FX.reduced)}</div>
    <div class="plate slab pxplate"><b class="num">${fmtX(turn.multiplier)}×</b><small>${esc(t(tierOf(turn.multiplier)))}</small></div>
    <div class="soldline"><div class="who"><span class="orb" aria-hidden="true">${icon(item)}</span><span>${esc(cname(item))} · <span class="num" id="acc">0%</span></span></div>
      <div class="deal q-${q} num">${turn.base} ${esc(turn.base === 1 ? t('point') : t('pointsWord'))} × ${fmtX(turn.multiplier)} = ${fmtN(turn.score)}</div></div>
    <button class="btn gold nextbtn" id="n">${esc(t('continue'))}</button><p class="skiphint" aria-hidden="true">${esc(t('tapSkip'))}</p>`;
  layer.appendChild(wrap); rootEl.classList.add('soldOpen');
  const plate = $('.pxplate', wrap), line = $('.soldline', wrap), rays = $('.rays', wrap), acc = $('#acc', wrap);
  const target = Math.round(turn.accuracy * 100), tok = navTok;
  let doneShown = false;
  const finishIt = () => {
    if (doneShown) return; doneShown = true;
    acc.textContent = target + '%';
    $$('.pxreal', wrap).forEach(p => p.classList.remove('trace'));
    plate.style.opacity = 1; line.style.opacity = 1; rays.style.opacity = turn.multiplier >= 55 ? 1 : .35;
    if (!FX.reduced) plate.animate([{ transform: 'rotate(-4deg) scale(2.4)', opacity: 0 }, { transform: 'rotate(-4deg) scale(1)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,1.6,.4,1)', fill: 'both' });
    if (turn.multiplier >= 75) { Snd.fanfare(); Haptics.success(); if (!FX.reduced) FX.confetti(wrap, turn.multiplier >= 90 ? 40 : 22); }
    else if (turn.multiplier < 30) { Snd.sting(); Haptics.light(); } else { Snd.knock(0, .8); Haptics.medium(); }
    wrap.classList.add('ready');
  };
  plate.style.opacity = 0; line.style.opacity = .0; rays.style.opacity = 0;
  if (FX.reduced) finishIt();
  else {
    Snd.whoosh(0, 1.1);
    const t0 = performance.now();
    const tick = now => {
      if (doneShown || tok !== navTok) return;
      const k = Math.min(1, Math.max(0, (now - t0 - 500) / 800));
      acc.textContent = Math.round(target * (1 - (1 - k) ** 3)) + '%'; line.style.opacity = Math.min(1, k * 2);
      if (now - t0 >= 1500) return finishIt();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  let left = false;
  const leave = e => {
    if (e) e.stopPropagation();
    if (!doneShown) return finishIt();
    if (left) return; left = true;
    wrap.remove(); rootEl.classList.remove('soldOpen'); Snd.ui(); act({ type: 'continue' });
  };
  wrap.onclick = () => { if (!doneShown) finishIt(); };
  $('#n', wrap).onclick = leave;
  return sec;
}

/* ---- round end: what it was, a fact, the bots' one-liners; scores stay sealed ---- */
function roundEnd() {
  const id = G.places[G.round], item = itemOf(id), last = G.round + 1 >= G.config.rounds;
  const lines = G.config.seats.map((s, i) => s.kind === 'bot' ? `<p class="taunt fact" style="height:auto"><b>${esc(s.name)}:</b> “${esc(Engine.botLine(PACK, G, G.round, i, 0, LANG))}”</p>` : '').join('');
  const sec = go(`${navGame(roundPill(), false)}
    <div class="pxcenter"><div class="glass win final pxcard">
      <div class="crown" aria-hidden="true">${icon(item)}</div><p class="label">${esc(t('itWas'))}</p><h2>${esc(cname(item))}</h2>
      <p><b>${esc(t('didYouKnow'))}</b> ${esc(item.fact[LANG] || item.fact.en)}</p>${lines}
      <p class="sm">${esc(t('scoresHidden'))}</p>
      <button class="btn gold big" id="nx" style="margin-top:10px">${esc(last ? t('seeResult') : t('nextRound'))}</button></div></div>`, 'results');
  bindGameNav();
  on('nx', () => { Snd.ui(); act({ type: 'continue' }); });
  return sec;
}

/* ============ RESULTS — no winner named until every bar is off (as in Bidding Wars) ============ */
async function recordGame(res) {
  const humans = res.seats.filter(s => s.kind === 'human');
  if (G._kind !== 'solo' || humans.length !== 1 || res.practice) return null;
  const you = humans[0], bot = res.seats.filter(s => s.kind === 'bot').sort((a, b) => b.total - a.total)[0];
  const out = applyGame(recFor(PACK.id), you.total, bot.total, G.config.difficulty);
  const at = new Date().toISOString().slice(0, 10);
  G.turns.forEach((round, k) => round.forEach(turn => {
    if (G.config.seats[turn.seat].kind !== 'human' || !turn.rings || !turn.rings.length) return;
    const key = PACK.id + ':' + G.places[k], prev = RECS.best[key];
    if (!prev || prev.accuracy < turn.accuracy) RECS.best[key] = { accuracy: turn.accuracy, rings: turn.rings.map(r => r.map(([x, y]) => [Math.round(x), Math.round(y)])), at };
  }));
  await saveRec();
  return out;
}

function finish() {
  stopClock();
  const res = Engine.results(PACK, G), REC = recFor(PACK.id);
  const red = (v, label) => `<button type="button" class="redact" data-v="${esc(v)}" aria-label="${esc(label || t('hiddenValue'))}"></button>`;
  const order = res.seats.slice().sort((a, b) => b.total - a.total);
  const sec = go(`
    <div class="nav"><button class="ibtn pill" id="nb">${IC('menu')}${esc(t('menu'))}</button><span></span>${navBtns(false)}</div>
    <div class="res2">
      <div class="r-l">
        <div class="glass win" id="verdict"><div class="crown" aria-hidden="true">🔒</div><h2>${esc(t('sealed'))}</h2><p>${esc(t('revealShort'))}</p></div>
        <div class="glass lb" id="lb">${order.map(r => `
          <div class="lbr"><div class="o s${seatOf(r.seat)}" aria-hidden="true">${esc(ini(r.name))}</div><div class="n">${esc(r.name)}</div><div class="p">${red(fmtN(r.total), t('points') + ' · ' + r.name)}</div></div>
          <div class="fl">${r.rounds.map(x => { const it = itemOf(x.itemId); return `<span class="f1"><em aria-hidden="true">${icon(it)}</em><span class="sr">${esc(cname(it))}</span><span>${Math.round(x.accuracy * 100)}%</span><s>${red(fmtN(x.score), cname(it))}</s></span>`; }).join('')}</div>`).join('')}
        </div>
      </div>
      <div class="r-r"><div id="extra" hidden></div>
        <div class="acts" id="acts"><button class="btn gold wide" id="rev">${esc(t('liftAll'))}</button></div></div>
    </div>`, 'results');
  on('nb', () => { Snd.ui(); home(); });
  const bars = $$('.redact', sec);
  let opened = 0, revealed = false;
  const lift = b => {
    if (b.classList.contains('open')) return;
    b.classList.add('open'); b.textContent = b.dataset.v; b.removeAttribute('aria-label'); b.tabIndex = -1;
    Snd.ui(); Haptics.light();
    if (!FX.reduced) b.animate([{ transform: 'scale(.85)', opacity: .3 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' });
    opened++;
    if (opened === bars.length && !revealed) { revealed = true; setTimeout(() => reveal(sec, res, REC), 420); }
  };
  bars.forEach(b => b.onclick = () => lift(b));
  on('rev', () => { let d = 0; bars.forEach(b => { if (!b.classList.contains('open')) setTimeout(() => lift(b), d += 70); }); $('#rev').disabled = true; });
}

async function reveal(sec, res, REC) {
  if (!sec.isConnected) return;
  const tok = navTok;
  const outcome = await recordGame(res);
  if (tok !== navTok) return;
  rootEl.classList.add('celebrating');
  const top = res.seats.find(s => s.seat === res.winners[0]), tie = res.winners.length > 1, win = res.winners.some(i => G.config.seats[i].kind === 'human');
  const v = $('#verdict', sec);
  v.classList.add('final');
  v.innerHTML = `<div class="crown" aria-hidden="true">${tie ? '🤝' : top.kind === 'bot' ? '🤖' : '👑'}</div>
    <h2>${tie ? esc(t('tie')) : top.kind === 'human' && G.config.seats.filter(x => x.kind === 'human').length === 1 ? esc(t('youWin')) : t('takesIt', { name: esc(top.name) })}</h2>
    <div class="pts goldtext num" aria-hidden="true"><span class="v" data-n="${top.total}">${FX.reduced ? fmtN(top.total) : '0'}</span><small>${esc(t('points'))}</small></div>
    <p>${res.seats.filter(s => s !== top).map(s => `<b>${esc(s.name)}</b> ${fmtN(s.total)}`).join(' · ')}</p>
    <p>${res.seats.map(s => `${esc(s.name)} ${Math.round(s.avgAccuracy * 100)}%`).join(' · ')} ${esc(t('avgAcc'))}</p>`;
  if (!FX.reduced) FX.spring(v, 0, 1, x => ({ transform: `scale(${.96 + .04 * x})`, opacity: Math.min(1, x * 1.6) }), { k: 220, c: 14 });
  $('#acts', sec).innerHTML = `<button class="btn glassb" id="again">${esc(t('playAgain'))}</button><button class="btn gold" id="menu">${esc(t('menu'))}</button>`;
  on('again', () => { Snd.ui(); setup(G._kind || 'solo', PACK.id); });
  on('menu', () => { Snd.ui(); home(); });
  const step = (ms, fn) => setTimeout(() => { if (tok === navTok) fn(); }, FX.reduced ? 0 : ms);
  step(120, () => { const n = $('.pts .v', v); if (n) FX.roll(n, 0, +n.dataset.n, 700, x => fmtN(Math.round(x))); });
  step(260, () => {
    if (win && !tie) { PACK.id === 'states' ? Snd.eagle() : Snd.fanfare(); Haptics.success(); FX.confetti(sec, 22); } else { Snd.sting(); Haptics.warning(); }
  });
  /* the world card: every place played, lit by how well the first human drew it; the best drawing of the game */
  const human = res.seats.find(s => s.kind === 'human');
  const lots = res.places.map(p => Object.assign({}, itemOf(p.itemId), { value: Math.round((p.accuracy[human.seat] || 0) * 100) }));
  const best = res.best;
  const recHtml = outcome ? `<div class="glass recpill" style="padding:8px 14px;order:0"><div class="big num" style="font-size:24px">${REC.won}<i>–</i>${REC.lost}${REC.drawn ? `<i>–</i>${REC.drawn}` : ''}</div><div class="m"><b>${esc(outcome.record ? t('newRecord') : t('record'))}</b><br>${REC.played} ${esc(t('games'))}${REC.streak ? ` · ${esc(t('streak'))} ${REC.streak > 0 ? '+' : ''}${REC.streak}` : ''}</div></div>` : res.practice ? `<div class="glass recpill" style="padding:8px 14px;order:0"><div class="m"><b>${esc(t('practiceTitle'))}</b><br>${esc(t('practiceNote'))}</div></div>` : '';
  const usMode = PACK.id === 'states' && window.USView;
  const ex = $('#extra', sec);
  ex.innerHTML = `<div class="glass gl${usMode ? ' gl-us' : ''}">${usMode ? `<div class="usm" id="gl"><img class="gph" src="us-map.webp" alt="" decoding="async"></div>` : `<div class="globe" id="gl"><img class="gph" src="globe-hero.webp" alt="" decoding="async"></div>`}
      <div class="cap"><b>${esc(t('worldTitle'))}</b>${esc(t('dragSpin'))}</div>
      <div class="chips">${lots.map(b => `<span class="chip"><span aria-hidden="true">${icon(b)}</span> ${esc(cname(b))} <b class="num">${b.value}%</b></span>`).join('')}</div></div>
    ${best && best.rings && best.rings.length ? `<div class="glass gl pxbest"><div class="cap"><b>${esc(t('best'))}</b>${esc(G.config.seats[best.seat].name)} · ${esc(nameOf(best.itemId))} · ${Math.round(best.accuracy * 100)}%</div><div class="pxbestsvg">${overlaySvg({ rings: best.rings, fit: best.fit }, best.itemId, false)}</div></div>` : ''}${recHtml}`;
  step(520, () => { ex.hidden = false; if (!FX.reduced) FX.spring(ex, 0, 1, x => ({ transform: `translateY(${(1 - x) * 18}px)`, opacity: Math.min(1, x * 1.6) }), { k: 200, c: 18 }); });
  step(2400, () => {
    rootEl.classList.remove('celebrating');
    const host = $('#gl', sec); if (!host) return;
    if (usMode) { USView.render(host, lots, { reduced: FX.reduced, label: b => b.id, value: b => b.value + '%', aria: t('worldTitle') + ': ' + lots.map(cname).join(', ') }).catch(() => {}); return; }
    const mount = () => {
      if (tok !== navTok) return;
      const ph = $('.gph', host); if (ph) ph.remove();
      if (stopGlobe) stopGlobe();
      stopGlobe = globe(host, lots, { items: PACK.items, metric: { format: v => v + '%' }, globe: {} });
    };
    (window.requestIdleCallback || (f => setTimeout(f, 60)))(mount, { timeout: 700 });
  });
  if (FX.reduced) rootEl.classList.remove('celebrating');
}
