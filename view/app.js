// The view: renders state, runs the clocks, captures strokes, plays sounds.
// No game rules live here; every decision goes through the engine.

import { loadPack, loadGlobe, PACKS } from '../packs/registry.js';
import { createGame, step, activeTurn, activeSeat, revealedClues, results, botLine, isPractice } from '../engine/game.js';
import { poolFor } from '../engine/pack.js';
import { suggest } from '../engine/names.js';
import { outlineToCanvas, drawingAspect } from '../engine/judge.js';
import { bbox } from '../engine/geometry.js';
import { emptyRecord, sanitizeRecord, recordGame, recordDrawing } from '../engine/records.js';
import { tr, UI_LANGS, LANG_NAMES } from './i18n.js';
import { sfx, setSound, unlockAudio, haptic } from './audio.js';
import { createGlobe } from './globe.js';

const STORE = 'projectx.v1';
const LONG = 1000; // strokes are stored with the canvas's longer side = 1000
const FLAGS = { en: '🇬🇧', de: '🇩🇪', it: '🇮🇹', es: '🇪🇸', fr: '🇫🇷' };

// ─────────────────────────────────────────── storage
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ settings: ui.settings, record: ui.record }));
  } catch {
    /* private mode: play on without saving */
  }
}

const stored = load();
const navLang = (navigator.language || 'en').slice(0, 2);
const ui = {
  settings: {
    lang: UI_LANGS.includes(navLang) ? navLang : 'en',
    skin: 'nocturne',
    sound: true,
    reduceMotion: false,
    packId: 'world',
    difficulty: 'beginner',
    rounds: 5,
    bots: 1,
    players: 2,
    hsBots: 0,
    clueSeconds: 15,
    drawSeconds: 20,
    practice: false,
    names: ['', '', '', ''],
    ...(stored.settings || {}),
  },
  record: sanitizeRecord(stored.record ?? emptyRecord()),
  pack: null,
  globes: {},
  game: null,
  sheet: null,
  setupMode: 'solo',
  notice: null,
  sugg: [],
  sel: -1,
  draft: '',
  strokes: [],
  clock: { key: null, left: 0, total: 1, lastSec: null },
  reveal: null,
  barsOpen: 0,
  recorded: false,
};

const $app = document.getElementById('app');
const L = () => ui.settings.lang;
const t = (k, v) => tr(L(), k, v);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduced = () => ui.settings.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtN = (n) => Number(n).toLocaleString(L());
const fmtX = (m) => (m >= 1000 ? fmtN(m) : String(m).replace('.', L() === 'en' ? '.' : ','));

function applySkin() {
  if (ui.settings.skin === 'daylight') document.documentElement.setAttribute('data-skin', 'daylight');
  else document.documentElement.removeAttribute('data-skin');
  document.documentElement.lang = L();
  setSound(ui.settings.sound);
}

const I = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h12"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="3.6" height="14" rx="1.2"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.2"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><path d="M3 3l18 18"/></svg>',
  half: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c1.3-3.6 4-5.4 7-5.4s5.7 1.8 7 5.4"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8.5" r="3.2"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3 19.5c1-3.2 3.3-5 6-5s5 1.8 6 5M15 14.5c2.4 0 4.3 1.4 5.3 4"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3.5 5.5c3-1.2 6-1 8.5.8v13c-2.5-1.8-5.5-2-8.5-.8zM20.5 5.5c-3-1.2-6-1-8.5.8v13c2.5-1.8 5.5-2 8.5-.8z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
};

// ─────────────────────────────────────────── helpers
const itemOf = (id) => ui.pack.byId.get(id);
const nameOf = (id) => itemOf(id).names[L()] ?? itemOf(id).names.en;
const seat = (i) => ui.game.config.seats[i];
const initial = (s) => esc((s || '?').trim().charAt(0).toUpperCase());
const avatar = (i, cls = '') => `<span class="av seat-${seat(i).color} ${cls}">${initial(seat(i).name)}</span>`;
const pathOf = (pts) => (pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z` : '');
const packMeta = () => PACKS.find((p) => p.id === ui.settings.packId);

function bar({ mid = '', pause = false, home = false } = {}) {
  const left = home
    ? '<span></span>'
    : `<button class="chipbtn" data-act="menu">${I.menu}<span>${t('menu')}</span></button>`;
  const right = home
    ? `<button class="chipbtn round" data-act="skin" aria-label="${t('appearance')}">${I.half}</button>`
    : pause
      ? `<button class="chipbtn round" data-act="menu" aria-label="${t('paused')}">${I.pause}</button>`
      : '';
  return `<div class="bar">${left}<div>${mid ? `<span class="lotpill">${mid}</span>` : ''}</div>
    <div>${right}<button class="chipbtn round" data-act="sound" aria-label="${t('sound')}">${ui.settings.sound ? I.note : I.mute}</button></div></div>`;
}
const roundPill = () => t('round', { r: ui.game.round + 1, n: ui.game.config.rounds });

// ─────────────────────────────────────────── render
function render() {
  applySkin();
  destroyGlobes();
  const g = ui.game;
  let html;
  if (!g) html = renderHome();
  else if (g.phase === 'handoff') html = renderHandoff();
  else if (g.phase === 'clue') html = renderClue();
  else if (g.phase === 'draw') html = renderDraw();
  else if (g.phase === 'reveal') html = renderReveal();
  else if (g.phase === 'roundEnd') html = renderRoundEnd();
  else html = renderFinal();
  $app.innerHTML = `<div class="frame">${html}</div>${renderSheet()}`;
  afterRender();
}

function renderHome() {
  const rec = ui.record.packs[ui.settings.packId];
  const games = rec ? rec.won + rec.lost + rec.tied : 0;
  const rate = games ? Math.round((rec.won / games) * 100) : 0;
  return `${bar({ home: true })}
  <div class="stage">
    <div class="col hero">
      <div class="globe-wrap"><canvas id="homeglobe" aria-label="${t('theWorld')}"></canvas></div>
      <h1 class="title">Project<span>X</span></h1>
      <p class="tag">${t('tagline')}</p>
      <button class="card record" data-act="record">
        <span class="big num">${rec ? rec.won : 0}–${rec ? rec.lost : 0}</span>
        <span><b>${t('record')}</b><small>${games ? `${t('games', { n: games })} · ${rate}% ${t('winRate').toLowerCase()}` : t('noGames')}</small></span>
      </button>
    </div>
    <div class="col">
      <div class="packs">${PACKS.map((p) => `<button class="pack" data-pack="${p.id}" aria-pressed="${p.id === ui.settings.packId}">
          <span class="flags">${p.id === 'world' ? '🇯🇵🇧🇷🇰🇪🇲🇽' : '🇺🇸'}</span><b>${esc(p.title[L()])}</b><small>${esc(p.blurb[L()])}</small></button>`).join('')}</div>
      <button class="mode" data-act="setup-solo"><span class="ic">${I.person}</span><span class="tx"><b>${t('solo')}</b><small>${t('soloSub')}</small></span><span class="chev">${I.chev}</span></button>
      <button class="mode" data-act="setup-hs"><span class="ic alt">${I.people}</span><span class="tx"><b>${t('hotseat')}</b><small>${t('hotseatSub')}</small></span><span class="chev">${I.chev}</span></button>
      <div class="tools">
        <button class="btn" data-act="rules">${I.book}<span>${t('howToPlay')}</span></button>
        <button class="btn" data-act="language">${FLAGS[L()]}<span>${LANG_NAMES[L()]}</span></button>
        <button class="chipbtn round" style="height:60px;width:60px" data-act="settings" aria-label="${t('settings')}">${I.gear}</button>
        <button class="chipbtn round" style="height:60px;width:60px" data-act="privacy" aria-label="${t('privacy')}">${I.lock}</button>
      </div>
      <div class="foot">${t('footer')}</div>
    </div>
  </div>`;
}

function renderHandoff() {
  const s = activeSeat(ui.game);
  return `${bar({ mid: roundPill() })}
  <div class="solo-center">
    <span class="eyebrow">${t('passTo')}</span>
    ${avatar(s, 'on').replace('class="av', 'style="width:110px;height:110px;font-size:44px" class="av')}
    <h1>${esc(seat(s).name)}</h1>
    <p class="muted">${t('passNote')}</p>
    <button class="btn gold" data-act="ready" style="min-width:280px">${t('ready')}</button>
  </div>`;
}

function seatsRow(phase) {
  const g = ui.game;
  const me = activeSeat(g);
  const turn = activeTurn(g);
  const elapsed = (ui.clock.total - ui.clock.left) * 1000;
  return `<div class="seats">${g.config.seats
    .map((s, i) => {
      let st;
      let tag = '';
      if (i === me) {
        tag = `<span class="tag2">${phase === 'draw' ? t('drawing') : t('guessing')}</span>`;
        st = '&nbsp;';
      } else if (s.kind === 'bot') {
        const last = g.turns[g.round][i].bot.timeline.at(-1);
        const done = phase !== 'clue' || turn.clue > last.clue || (turn.clue === last.clue && elapsed >= last.atMs);
        st = done ? t('lockedIn') : `${t('thinking')}…`;
      } else st = g.turns[g.round][i].done ? t('lockedIn') : t('waiting');
      return `<div class="seat">${tag}${avatar(i, i === me ? 'on' : '')}<span class="who">${esc(s.name)}</span><span class="st" ${s.kind === 'bot' ? `data-botst="${i}"` : ''}>${st}</span></div>`;
    })
    .join('')}</div>`;
}

function ringSvg(id) {
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--gold-1)"/><stop offset="1" stop-color="var(--gold-3)"/></linearGradient></defs>
    <circle class="track" cx="100" cy="100" r="92"/><circle class="arc" id="${id}" cx="100" cy="100" r="92" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/></svg>`;
}

function renderClue() {
  const g = ui.game;
  const turn = activeTurn(g);
  const clues = revealedClues(ui.pack, g, L());
  const wrong = turn.guesses.filter((x) => !x.ok).length;
  const worth = Math.max(1, (g.config.rules.basePoints[turn.clue] ?? 1) - wrong * g.config.rules.wrongGuessPenalty);
  const list = clues
    .map((c, k) => {
      const cur = k === clues.length - 1;
      return `<div class="cl ${cur ? 'cur' : ''} ${cur && ui.freshClue ? 'new' : ''}"><span class="n num">${k + 1}</span><p>${esc(c)}</p></div>`;
    })
    .join('');
  const later = clues.length < 5 ? `<div class="cl later"><span class="n num">${clues.length + 1}</span><p>${t('clueN', { n: clues.length + 1 })} · ${t('worth', { p: g.config.rules.basePoints[clues.length] })}</p></div>` : '';
  ui.freshClue = false;
  const n = ui.notice;
  return `${bar({ mid: roundPill(), pause: true })}
  <div class="stage">
    <div class="col center">
      <div class="place-head"><span class="badge">?</span><h1>${t('mystery')}</h1></div>
      <div class="ringbox">${ringSvg('cluearc')}
        <div class="disc"><div><div class="unit">${t('worth', { p: '' }).trim()}</div><div class="big num">${worth}</div><div class="unit">${worth === 1 ? t('point') : t('points')}</div></div></div>
        <span class="clock num" id="clockpill">0:${String(g.config.clueSeconds).padStart(2, '0')}</span>
      </div>
      <span class="pillnote"><span class="dot" style="background:${n ? 'var(--danger)' : 'var(--accent)'}"></span><span id="noticeline">${n ? esc(n.text) : t('clueOf', { n: clues.length })}</span></span>
      <span class="quote">${t('costNote')}</span>
    </div>
    <div class="col">
      ${seatsRow('clue')}
      <div class="card panel">
        <div class="clist">${list}${later}</div>
        <form class="guessrow" id="guessform" autocomplete="off">
          <ul class="sugg" id="sugg"></ul>
          <input class="field" id="guessinput" type="text" autocapitalize="words" autocorrect="off" spellcheck="false" placeholder="${t('guessPh')}" value="${esc(ui.draft)}" aria-label="${t('guessPh')}">
          <button type="submit" class="btn gold" style="min-width:150px">${t('guess')}</button>
        </form>
        <button class="btn wide quiet" data-act="skip">${t('nextClue')}</button>
      </div>
    </div>
  </div>`;
}

function renderDraw() {
  const g = ui.game;
  const turn = activeTurn(g);
  const item = itemOf(g.places[g.round]);
  const solved = turn.solvedAt !== null;
  return `${bar({ mid: roundPill(), pause: true })}
  <div class="drawstage">
    <div class="drawside top">
      <span class="eyebrow">${t('drawEyebrow')}</span>
      <h1>${esc(nameOf(item.id))}</h1>
      <div class="hint"><span>▲ ${t('northUp')}</span>${item.mainlandOnly ? `<span>${t('mainland')}</span>` : ''}<span>${solved ? t('solvedOn', { n: turn.solvedAt + 1, b: turn.base }) : t('missedIt')}</span></div>
      <div class="tbar"><i id="drawbar"></i></div>
    </div>
    <div class="drawarea" id="drawarea"><div class="canvasbox" id="canvasbox"><canvas id="cv"></canvas><span class="north">▲ N</span><span class="empty" id="emptyhint">${t('drawHere')}</span></div></div>
    <div class="drawside bottom">
      <div class="tools2"><button class="btn" data-act="undo">${I.undo}<span>${t('undo')}</span></button><button class="btn" data-act="clear">${I.trash}<span>${t('clear')}</span></button></div>
      <button class="btn gold wide" data-act="submit">${t('done')}</button>
    </div>
  </div>`;
}

function tierOf(m) {
  if (m >= 1000) return t('tierMaster');
  if (m >= 100) return t('tierGreat');
  if (m >= 10) return t('tierGood');
  if (m > 1) return t('tierFair');
  return t('tierBlob');
}

function overlaySvg(turn, itemId, animate) {
  const item = itemOf(itemId);
  const rings = turn.rings || [];
  let real;
  if (turn.fit) real = outlineToCanvas(item.outline, turn.fit);
  else {
    const b = bbox(item.outline);
    const s = (LONG * 0.8) / Math.max(b.w, b.h);
    real = item.outline.map(([x, y]) => [(x - b.minX) * s + LONG * 0.1, (y - b.minY) * s + LONG * 0.1]);
  }
  const all = real.concat(...rings);
  const bb = bbox(all);
  const side = Math.max(bb.w, bb.h) * 1.08 || LONG;
  const cx = bb.minX + bb.w / 2;
  const cy = bb.minY + bb.h / 2;
  const vb = `${(cx - side / 2).toFixed(1)} ${(cy - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`;
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(nameOf(itemId))}">
    ${rings.map((r) => `<path class="mine" d="${pathOf(r)}"></path>`).join('')}
    <path class="real ${animate && !reduced() ? 'trace' : ''}" pathLength="1" d="${pathOf(real)}"></path></svg>`;
}

function renderReveal() {
  const g = ui.game;
  const turn = activeTurn(g);
  const id = g.places[g.round];
  const done = ui.reveal?.done;
  const weak = turn.multiplier < 3;
  return `${bar({ mid: roundPill() })}
  <div class="moment" data-act="skipreveal">
    ${done ? `<div class="rays ${weak ? 'dim' : ''}"></div>` : ''}
    <div class="overlay">${overlaySvg(turn, id, !done)}</div>
    <div style="min-height:118px;display:grid;place-items:center">${done ? `<div class="plaque on ${weak ? 'weak' : ''}"><span class="x">${fmtX(turn.multiplier)}×</span><span class="lbl">${tierOf(turn.multiplier)}</span></div>` : ''}</div>
    <div class="momentline">${esc(nameOf(id))} · <span class="num accbig" id="acc">${done ? Math.round(turn.accuracy * 100) : 0}%</span></div>
    <span class="goldpill num" style="visibility:${done ? 'visible' : 'hidden'}">${turn.base} ${turn.base === 1 ? t('point') : t('points')} × ${fmtX(turn.multiplier)} = ${fmtN(turn.score)}</span>
    <button class="btn gold" data-act="continue" style="min-width:300px;visibility:${done ? 'visible' : 'hidden'}">${t('continue')}</button>
  </div>`;
}

function renderRoundEnd() {
  const g = ui.game;
  const id = g.places[g.round];
  const item = itemOf(id);
  const bots = g.config.seats
    .map((s, i) => (s.kind === 'bot' ? `<div class="pillnote">${avatar(i, 'sm')}<span class="quote" style="min-height:0">“${esc(botLine(ui.pack, g, g.round, i, 0, L()))}”</span></div>` : ''))
    .join('');
  const last = g.round + 1 >= g.config.rounds;
  return `${bar({ mid: roundPill() })}
  <div class="solo-center">
    <span class="eyebrow">${t('itWas')}</span>
    <h1>${esc(nameOf(id))}</h1>
    <div class="card factcard"><span class="eyebrow">${t('didYouKnow')}</span><p>${esc(item.fact[L()] ?? item.fact.en)}</p></div>
    ${bots}
    <span class="muted">${t('scoresHidden')}</span>
    <button class="btn gold" data-act="continue" style="min-width:300px">${last ? t('seeResults') : t('nextRound')}</button>
  </div>`;
}

function renderFinal() {
  const g = ui.game;
  const res = results(ui.pack, g);
  const n = g.config.rounds;
  const open = ui.barsOpen;
  const all = open >= n;
  let verdict;
  if (all) {
    const w = res.winners;
    const top = res.seats.find((s) => s.seat === w[0]);
    const others = res.seats.filter((s) => s.seat !== w[0]).map((s) => `<b>${esc(s.name)}</b> ${fmtN(s.total)}`).join(' · ');
    verdict = `<div class="card verdict">${w.length > 1 ? `<h1>${t('tie')}</h1>` : `<span style="font-size:30px">${top.kind === 'bot' ? '🤖' : '🏆'}</span><h1>${esc(t('takesIt', { n: top.name }))}</h1>`}
      <div><span class="pts num">${fmtN(top.total)}</span> <span class="muted" style="font-weight:600">${t('pointsCap')}</span></div>
      <span class="muted">${others}</span>
      <span class="muted">${res.seats.map((s) => `${esc(s.name)} ${Math.round(s.avgAccuracy * 100)}%`).join(' · ')} ${t('avgAcc')}</span></div>`;
  } else {
    verdict = `<div class="card verdict"><span class="sealed">🔒</span><h1>${t('sealed')}</h1><span class="muted">${t('sealedSub')}</span></div>`;
  }
  const cols = `grid-template-columns:repeat(${n},1fr)`;
  const rows = res.seats
    .map(
      (s) => `<div class="srow"><span class="name">${avatar(s.seat, 'sm')}<span>${esc(s.name)}</span></span><span class="tot num">${all ? fmtN(s.total) : '—'}</span>
      <div class="bars" style="${cols}">${s.rounds.map((r, k) => `<div class="barcell num ${k < open ? 'open' : ''} ${k < open && r.multiplier >= 100 ? 'hot' : ''}">${k < open ? fmtN(r.score) : ''}</div>`).join('')}</div></div>`,
    )
    .join('');
  const human = res.seats.find((s) => s.kind === 'human');
  const chips = res.places.map((p) => `<span class="chip"><i style="opacity:${0.25 + 0.75 * (p.accuracy[human.seat] ?? 0)}"></i>${esc(nameOf(p.itemId))}${all ? ` ${Math.round((p.accuracy[human.seat] ?? 0) * 100)}%` : ''}</span>`).join('');
  const best = res.best;
  return `${bar({ mid: t('finalScores') })}
  <div class="stage final">
    <div class="col">
      ${verdict}
      <div class="card board">${rows}</div>
      ${all ? '' : `<div class="finalbtns"><button class="btn" data-act="openall">${t('revealAll')}</button><button class="btn gold" data-act="opennext">${t('revealNext', { r: open + 1 })}</button></div>`}
    </div>
    <div class="col">
      <div class="card globecard">
        <div class="gl"><canvas id="endglobe"></canvas></div>
        <div><b style="font-size:20px">${all && best ? esc(t('bestBy', { n: seat(best.seat).name, p: nameOf(best.itemId), a: Math.round(best.accuracy * 100) })) : esc(packMeta().title[L()])}</b><div class="muted" style="font-size:14px">${t('dragSpin')}</div></div>
        <div class="chips">${chips}</div>
      </div>
      ${all ? `<div class="finalbtns"><button class="btn" data-act="home">${t('menu')}</button><button class="btn gold" data-act="again">${t('playAgain')}</button></div>` : ''}
    </div>
  </div>`;
}

// ─────────────────────────────────────────── sheets
function sheet(body, foot) {
  return `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true"><div class="body">${body}</div>${foot ? `<div class="foot2">${foot}</div>` : ''}</div></div>`;
}
const done = () => `<button class="btn gold wide" data-act="closesheet">${t('done')}</button>`;
const chipRow = (key, values, cur, fmt = (v) => v) => `<div class="chiprow fill">${values.map((v) => `<button class="opt num" data-set="${key}" data-v="${v}" aria-pressed="${v === cur}">${fmt(v)}</button>`).join('')}</div>`;
const toggle = (key, on) => `<button class="toggle" data-toggle="${key}" aria-pressed="${on}" aria-label="${key}"></button>`;

function renderSheet() {
  const sh = ui.sheet;
  if (!sh) return '';
  if (sh === 'rules') {
    return sheet(`<h2>${t('howToPlay')}</h2><ol>${t('rules').map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`, done());
  }
  if (sh === 'language') {
    return sheet(`<h2>${t('language')}</h2><div class="group">${UI_LANGS.map((l) => `<button class="row2" data-lang="${l}"><span>${FLAGS[l]} &nbsp;${LANG_NAMES[l]}</span>${l === L() ? `<span style="color:var(--accent)">${I.check.replace('<svg', '<svg width="20" height="20"')}</span>` : ''}</button>`).join('')}</div>`, done());
  }
  if (sh === 'settings') {
    const s = ui.settings;
    return sheet(
      `<h2>${t('settings')}</h2>
      <span class="lbl2">${t('appearance')}</span>
      <div class="chiprow fill"><button class="opt" data-skin="nocturne" aria-pressed="${s.skin !== 'daylight'}">${t('dark')}</button><button class="opt" data-skin="daylight" aria-pressed="${s.skin === 'daylight'}">${t('light')}</button></div>
      <span class="lbl2">${t('language')}</span>
      <div class="group"><button class="row2" data-act="language"><span>${FLAGS[L()]} &nbsp;${LANG_NAMES[L()]}</span>${I.chev.replace('<svg', '<svg width="16" height="16"')}</button></div>
      <div class="group">
        <div class="row2"><span>${t('sound')}</span>${toggle('sound', s.sound)}</div>
        <div class="row2"><span>${t('reduceMotion')}<small>${t('reduceMotionSub')}</small></span>${toggle('reduceMotion', s.reduceMotion)}</div>
        <div class="row2"><span>${t('faint')}<small>${t('faintSub')}</small></span>${toggle('practice', s.practice)}</div>
      </div>`,
      done(),
    );
  }
  if (sh === 'privacy' || sh === 'delete') {
    return sheet(
      `<h2>${t('privacy')}</h2>${t('privacyText').map((p) => `<p>${esc(p)}</p>`).join('')}<p class="muted" style="font-size:14px">${t('credits')}</p>
      ${sh === 'delete' ? `<p><b>${t('deleteAsk')}</b></p><div class="chiprow fill"><button class="btn" data-act="privacy">${t('cancel')}</button><button class="btn danger" data-act="deleteyes">${t('deleteYes')}</button></div>` : ''}`,
      `${sh === 'privacy' ? `<button class="btn text" data-act="delete">${t('deleteData')}</button>` : ''}${done()}`,
    );
  }
  if (sh === 'record') {
    const r = ui.record.packs[ui.settings.packId] ?? { won: 0, lost: 0, tied: 0, streak: 0 };
    const games = r.won + r.lost + r.tied;
    const best = Object.keys(ui.record.best).filter((k) => k.startsWith(`${ui.settings.packId}:`)).length;
    return sheet(
      `<h2>${t('record')}</h2><span class="lbl2">${esc(packMeta().title[L()])}</span>
      <div class="stats3"><div><b class="g">${r.won}</b><span class="eyebrow">${t('wins')}</span></div><div><b>${r.lost}</b><span class="eyebrow">${t('losses')}</span></div><div><b>${r.tied}</b><span class="eyebrow">${t('ties')}</span></div></div>
      <div class="group"><div class="row2"><span>${t('games', { n: '' }).trim()}</span><b class="num">${games}</b></div><div class="row2"><span>${t('winRate')}</span><b class="num">${games ? Math.round((r.won / games) * 100) : 0}%</b></div><div class="row2"><span>${t('streak')}</span><b class="num">${r.streak > 0 ? '+' : ''}${r.streak}</b></div><div class="row2"><span>${t('bestSaved')}</span><b class="num">${best}</b></div></div>
      <p class="muted" style="font-size:14px">${t('soloOnly')}</p>`,
      `<button class="btn text" data-act="resetrecord">${t('resetRecord')}</button>${done()}`,
    );
  }
  if (sh === 'pause') {
    return sheet(
      `<h2>${t('paused')}</h2><div class="chiprow fill"><button class="btn" data-act="rules">${t('howToPlay')}</button><button class="btn" data-act="settings">${t('settings')}</button></div>
       <button class="btn danger wide" data-act="quit">${t('quit')}</button><p class="muted" style="font-size:14px;text-align:center">${t('quitNote')}</p>`,
      `<button class="btn gold wide" data-act="closesheet">${t('resume')}</button>`,
    );
  }
  if (sh === 'setup') return renderSetup();
  return '';
}

function renderSetup() {
  const s = ui.settings;
  const solo = ui.setupMode === 'solo';
  const diffs = Object.entries(ui.pack.difficulties);
  const poolN = poolFor(ui.pack, s.difficulty).length;
  const roundOpts = [5, 10, 15, 20, 30].filter((r) => r <= poolN);
  if (!roundOpts.includes(s.rounds)) s.rounds = roundOpts.at(-1) ?? Math.max(5, poolN);
  const names = solo
    ? `<input class="input" id="name0" data-name="0" maxlength="16" value="${esc(s.names[0])}" placeholder="${t('playerN', { n: 1 })}" aria-label="${t('nickname')}">`
    : Array.from({ length: s.players }, (_, i) => `<input class="input" id="name${i}" data-name="${i}" maxlength="16" value="${esc(s.names[i])}" placeholder="${t('playerN', { n: i + 1 })}" aria-label="${t('playerN', { n: i + 1 })}">`).join('');
  return sheet(
    `<h2>${solo ? t('solo') : t('hotseat')}</h2><p>${solo ? t('setupSolo') : t('setupHs')}</p>
    ${solo ? '' : `<div class="optrow"><span class="lbl2">${t('people')}</span>${chipRow('players', [2, 3, 4], s.players)}</div>`}
    <div class="optrow"><span class="lbl2">${t('bots')}</span>${solo ? chipRow('bots', [1, 2, 3], s.bots) : chipRow('hsBots', [0, 1, 2].filter((b) => b + s.players <= 4), s.hsBots)}</div>
    <span class="lbl2">${t('rounds2')}</span>${chipRow('rounds', roundOpts.length ? roundOpts : [poolN], s.rounds)}
    <p class="muted" style="font-size:15px">${t('roundsNote')}</p>
    <span class="lbl2">${t('difficulty')}</span>
    ${diffs.map(([k, d]) => `<button class="radio" data-diff="${k}" aria-pressed="${k === s.difficulty}"><span><b>${esc(d.label[L()])}</b><small>${t(`diffSub_${k}`)} · ${poolFor(ui.pack, k).length}</small></span><span class="o">${k === s.difficulty ? I.check : ''}</span></button>`).join('')}
    <span class="lbl2">${t('clueTime')}</span>${chipRow('clueSeconds', [10, 15, 20, 30], s.clueSeconds)}
    <span class="lbl2">${t('drawTime')}</span>${chipRow('drawSeconds', [15, 20, 30, 45], s.drawSeconds)}
    <span class="lbl2">${solo ? t('nickname') : t('nicknames')}</span>${names}
    ${s.practice ? `<p class="muted" style="font-size:14px">${t('practiceNote')}</p>` : ''}`,
    `<button class="btn gold wide" data-act="start">${t('startGame')}</button><button class="btn text" data-act="closesheet">${t('back')}</button>`,
  );
}

// ─────────────────────────────────────────── globes
function destroyGlobes() {
  for (const g of Object.values(ui.globes)) g.destroy();
  ui.globes = {};
}

async function globeLayers(packId) {
  const world = await loadGlobe('world');
  if (packId === 'world') return [{ items: world.items, base: 'land' }];
  const sub = await loadGlobe(packId);
  return [{ items: world.items, base: 'land' }, { items: sub.items, base: 'sub' }];
}

async function mountGlobe(id, packId, opts) {
  const cv = document.getElementById(id);
  if (!cv) return;
  const layers = await globeLayers(packId);
  if (!cv.isConnected) return;
  ui.globes[id] = createGlobe(cv, { layers, focus: PACKS.find((p) => p.id === packId).focus, ...opts });
}

// ─────────────────────────────────────────── actions
function startGame() {
  const s = ui.settings;
  const solo = ui.setupMode === 'solo';
  const humans = solo ? 1 : s.players;
  const bots = solo ? s.bots : Math.min(s.hsBots, 4 - humans);
  const seats = [];
  for (let i = 0; i < humans; i++) seats.push({ kind: 'human', name: s.names[i]?.trim() || tr(L(), 'playerN', { n: i + 1 }) });
  for (let i = 0; i < bots; i++) seats.push({ kind: 'bot', name: bots > 1 ? `${t('bot')} ${i + 1}` : t('bot') });
  ui.config = {
    seed: Math.floor(Math.random() * 2 ** 32),
    difficulty: s.difficulty,
    rounds: s.rounds,
    clueSeconds: s.clueSeconds,
    drawSeconds: s.drawSeconds,
    seats,
    practice: { faintOutline: s.practice },
  };
  ui.game = createGame(ui.pack, ui.config);
  ui.sheet = null;
  ui.barsOpen = 0;
  ui.recorded = false;
  ui.freshClue = true;
  resetPhase();
  save();
  render();
  if (ui.game.phase === 'clue') sfx.clue();
}

function resetPhase() {
  ui.notice = null;
  ui.draft = '';
  ui.sugg = [];
  ui.sel = -1;
  ui.strokes = [];
  ui.reveal = null;
}

function dispatch(action) {
  const before = ui.game;
  const turnBefore = activeTurn(before);
  const phaseBefore = before.phase;
  ui.game = step(ui.pack, before, action);
  const g = ui.game;
  const turn = activeTurn(g);
  ui.notice = null;
  if (g.notice?.type === 'unknownPlace') ui.notice = { text: t('unknown', { t: g.notice.text }) };
  else if (g.notice?.type === 'alreadyGuessed') ui.notice = { text: t('already', { p: nameOf(g.notice.id) }) };
  else if (action.type === 'guess' && turnBefore && turn && turn.guesses.length > turnBefore.guesses.length) {
    const last = turn.guesses.at(-1);
    if (last.ok) sfx.right();
    else {
      sfx.wrong();
      haptic(30);
      ui.notice = { text: t('notIt', { p: nameOf(last.id) }) };
    }
  }
  if (!g.notice) ui.draft = '';
  ui.sugg = [];
  ui.sel = -1;
  if (g.phase === 'clue' && ((turn && turnBefore && turn.clue !== turnBefore.clue) || phaseBefore !== 'clue')) {
    ui.freshClue = true;
    sfx.clue();
  }
  if (phaseBefore !== g.phase) {
    if (g.phase !== 'clue') ui.notice = null;
    if (g.phase === 'draw') ui.strokes = [];
    if (g.phase === 'reveal') startReveal();
    if (g.phase === 'gameOver') finishGame();
  }
  render();
}

function finishGame() {
  if (ui.recorded) return;
  ui.recorded = true;
  const res = results(ui.pack, ui.game);
  if (isPractice(ui.game.config)) return;
  ui.record = recordGame(ui.record, res, { packId: ui.pack.id });
  const at = new Date().toISOString().slice(0, 10);
  ui.game.turns.forEach((round, k) =>
    round.forEach((turn) => {
      if (seat(turn.seat).kind !== 'human') return;
      ui.record = recordDrawing(ui.record, { packId: ui.pack.id, itemId: ui.game.places[k], accuracy: turn.accuracy, rings: turn.rings, name: seat(turn.seat).name, at });
    }),
  );
  save();
}

function startReveal() {
  const turn = activeTurn(ui.game);
  ui.reveal = { done: false };
  if (reduced()) {
    ui.reveal.done = true;
    setTimeout(() => sfx.stamp(turn.multiplier), 60);
    return;
  }
  sfx.trace();
  const t0 = performance.now();
  const target = Math.round(turn.accuracy * 100);
  const tick = (now) => {
    if (!ui.reveal || ui.reveal.done || ui.game.phase !== 'reveal') return;
    const k = Math.min(1, Math.max(0, (now - t0 - 600) / 800));
    const el = document.getElementById('acc');
    if (el) el.textContent = `${Math.round(target * (1 - (1 - k) ** 3))}%`;
    if (now - t0 >= 1500) return finishReveal();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function finishReveal() {
  if (!ui.reveal || ui.reveal.done) return;
  ui.reveal.done = true;
  const turn = activeTurn(ui.game);
  sfx.stamp(turn.multiplier);
  haptic(turn.multiplier >= 100 ? 40 : 15);
  render();
  if (turn.multiplier >= 100) confetti(turn.multiplier >= 1000 ? 140 : 70);
}

function confetti(n) {
  if (reduced()) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['var(--gold-1)', 'var(--gold-2)', 'var(--fg)', 'var(--seat-red)', 'var(--seat-blue)', 'var(--seat-green)'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:-20px;width:${6 + Math.random() * 5}px;height:${10 + Math.random() * 8}px;border-radius:2px;background:${colors[i % colors.length]}`;
    box.appendChild(p);
    p.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${(Math.random() - 0.5) * 240}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 900}deg)`, opacity: 0.9 },
      ],
      { duration: 2000 + Math.random() * 1500, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
    );
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}

function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

// ─────────────────────────────────────────── clock
function phaseKey() {
  const g = ui.game;
  if (!g || (g.phase !== 'clue' && g.phase !== 'draw')) return null;
  return `${g.round}:${activeSeat(g)}:${g.phase}:${activeTurn(g).clue}`;
}

function clockLoop(prev) {
  const now = performance.now();
  const dt = (now - prev) / 1000;
  const key = phaseKey();
  const c = ui.clock;
  if (key !== c.key) {
    c.key = key;
    if (key) {
      c.total = ui.game.phase === 'clue' ? ui.game.config.clueSeconds : ui.game.config.drawSeconds;
      c.left = c.total;
      c.lastSec = null;
    }
  } else if (key && !ui.sheet && !document.hidden) {
    c.left -= dt;
    const sec = Math.max(0, Math.ceil(c.left));
    const frac = Math.max(0, c.left / c.total);
    if (sec !== c.lastSec) {
      c.lastSec = sec;
      if (sec <= 5 && sec > 0) sfx.tick();
      const pill = document.getElementById('clockpill');
      if (pill) pill.textContent = `0:${String(sec).padStart(2, '0')}`;
      if (ui.game.phase === 'clue') {
        const turn = activeTurn(ui.game);
        const elapsed = (c.total - c.left) * 1000;
        document.querySelectorAll('[data-botst]').forEach((el) => {
          const last = ui.game.turns[ui.game.round][+el.dataset.botst].bot.timeline.at(-1);
          const isDone = turn.clue > last.clue || (turn.clue === last.clue && elapsed >= last.atMs);
          el.textContent = isDone ? t('lockedIn') : `${t('thinking')}…`;
        });
      }
    }
    const arc = document.getElementById('cluearc');
    if (arc) {
      arc.setAttribute('stroke-dashoffset', String(1 - frac));
      arc.classList.toggle('low', c.left <= 5);
    }
    const db = document.getElementById('drawbar');
    if (db) {
      db.style.transform = `scaleX(${frac})`;
      db.classList.toggle('low', c.left <= 5);
    }
    if (c.left <= 0) {
      c.key = null;
      if (ui.game.phase === 'clue') dispatch({ type: 'clueTimeout' });
      else submitDrawing();
    }
  }
  requestAnimationFrame(() => clockLoop(now));
}

// ─────────────────────────────────────────── drawing
let cv;
let cctx;
let cw = 0;
let ch = 0;
let drawing = null;

function sizeCanvas() {
  const area = document.getElementById('drawarea');
  cv = document.getElementById('cv');
  if (!area || !cv) return;
  const r = area.getBoundingClientRect();
  const aspect = drawingAspect(itemOf(ui.game.places[ui.game.round]).outline);
  let w = r.width - 4;
  let h = r.height - 4;
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  cw = Math.max(120, Math.floor(w));
  ch = Math.max(120, Math.floor(h));
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = cw * dpr;
  cv.height = ch * dpr;
  cv.style.width = `${cw}px`;
  cv.style.height = `${ch}px`;
  cctx = cv.getContext('2d');
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint();
}

const unit = () => LONG / Math.max(cw, ch); // stroke units per css px

function paint() {
  if (!cctx) return;
  const css = getComputedStyle(document.documentElement);
  cctx.clearRect(0, 0, cw, ch);
  const k = 1 / unit();
  if (ui.game.config.practice.faintOutline) {
    const o = itemOf(ui.game.places[ui.game.round]).outline;
    const b = bbox(o);
    const s = Math.min((cw * 0.8) / b.w, (ch * 0.8) / b.h);
    const ox = (cw - b.w * s) / 2 - b.minX * s;
    const oy = (ch - b.h * s) / 2 - b.minY * s;
    cctx.beginPath();
    o.forEach(([x, y], i) => (i ? cctx.lineTo(x * s + ox, y * s + oy) : cctx.moveTo(x * s + ox, y * s + oy)));
    cctx.closePath();
    cctx.strokeStyle = css.getPropertyValue('--muted');
    cctx.globalAlpha = 0.25;
    cctx.lineWidth = 2;
    cctx.stroke();
    cctx.globalAlpha = 1;
  }
  cctx.strokeStyle = css.getPropertyValue('--stroke');
  cctx.lineWidth = 3.5;
  cctx.lineJoin = cctx.lineCap = 'round';
  for (const s of ui.strokes) {
    if (!s.length) continue;
    cctx.beginPath();
    s.forEach(([x, y], i) => (i ? cctx.lineTo(x * k, y * k) : cctx.moveTo(x * k, y * k)));
    if (s.length === 1) cctx.lineTo(s[0][0] * k + 0.1, s[0][1] * k);
    cctx.stroke();
  }
  const hint = document.getElementById('emptyhint');
  if (hint) hint.hidden = ui.strokes.length > 0;
}

function pointFrom(e) {
  const r = cv.getBoundingClientRect();
  const u = unit();
  return [(e.clientX - r.left) * u, (e.clientY - r.top) * u];
}

function bindCanvas() {
  sizeCanvas();
  if (!cv) return;
  cv.addEventListener('pointerdown', (e) => {
    if (ui.sheet) return;
    e.preventDefault();
    unlockAudio();
    cv.setPointerCapture(e.pointerId);
    drawing = [pointFrom(e)];
    ui.strokes.push(drawing);
    paint();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs) {
      const p = pointFrom(ev);
      const last = drawing[drawing.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) > 2) drawing.push(p);
    }
    sfx.scratch();
    paint();
  });
  const end = () => {
    if (!drawing) return;
    const s = drawing;
    drawing = null;
    if (s.length > 8 && Math.hypot(s[0][0] - s.at(-1)[0], s[0][1] - s.at(-1)[1]) < LONG * 0.05) {
      haptic(10);
      sfx.close();
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

function submitDrawing() {
  if (ui.game.phase !== 'draw') return;
  drawing = null;
  const strokes = ui.strokes.map((s) => s.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]));
  dispatch({ type: 'submitDrawing', strokes });
}

// ─────────────────────────────────────────── guessing
function updateSugg() {
  const ul = document.getElementById('sugg');
  if (!ul) return;
  ui.sugg = ui.draft.trim() ? suggest(ui.pack.index, ui.draft, L(), 5) : [];
  if (ui.sel >= ui.sugg.length) ui.sel = ui.sugg.length - 1;
  ul.innerHTML = ui.sugg
    .map((s, i) => `<li><button type="button" data-pick="${s.id}" aria-selected="${i === ui.sel}">${esc(s.label)}${s.matched ? `<small>${esc(s.matched)}</small>` : ''}</button></li>`)
    .join('');
}

function submitGuess() {
  if (ui.game.phase !== 'clue') return;
  const pick = ui.sel >= 0 ? ui.sugg[ui.sel] : ui.sugg.length === 1 ? ui.sugg[0] : null;
  if (pick) return dispatch({ type: 'guess', id: pick.id });
  if (!ui.draft.trim()) return;
  dispatch({ type: 'guess', text: ui.draft });
}

// ─────────────────────────────────────────── events
function afterRender() {
  const g = ui.game;
  if (!g && ui.pack) mountGlobe('homeglobe', ui.settings.packId, { spin: 5 });
  if (g?.phase === 'gameOver') {
    const res = results(ui.pack, g);
    const human = res.seats.find((s) => s.kind === 'human').seat;
    const hl = {};
    for (const p of res.places) hl[itemOf(p.itemId).geo] = ui.barsOpen >= g.config.rounds ? p.accuracy[human] ?? 0 : 0.3;
    mountGlobe('endglobe', ui.pack.id, { spin: 3, highlight: hl }).then(() => {
      const last = itemOf(res.places.at(-1).itemId).centroid;
      ui.globes.endglobe?.focus(last);
    });
  }
  if (g?.phase === 'draw') bindCanvas();
  if (g?.phase === 'clue') {
    const input = document.getElementById('guessinput');
    input.addEventListener('input', () => {
      ui.draft = input.value;
      ui.sel = -1;
      updateSugg();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        ui.sel = e.key === 'ArrowDown' ? Math.min(ui.sugg.length - 1, ui.sel + 1) : Math.max(-1, ui.sel - 1);
        updateSugg();
        e.preventDefault();
      }
    });
    document.getElementById('guessform').addEventListener('submit', (e) => {
      e.preventDefault();
      submitGuess();
    });
    updateSugg();
    if (!ui.sheet && window.matchMedia('(hover: hover)').matches) input.focus();
  }
  if (ui.sheet === 'setup') {
    document.querySelectorAll('[data-name]').forEach((el) =>
      el.addEventListener('input', () => {
        ui.settings.names[+el.dataset.name] = el.value;
        save();
      }),
    );
  }
}

$app.addEventListener('click', async (e) => {
  unlockAudio();
  const el = e.target.closest('[data-act],[data-pack],[data-lang],[data-skin],[data-toggle],[data-diff],[data-set],[data-pick]');
  if (!el) return;
  const d = el.dataset;
  const s = ui.settings;
  if (d.pick) return dispatch({ type: 'guess', id: d.pick });
  if (d.pack) {
    s.packId = d.pack;
    ui.pack = await loadPack(d.pack);
    if (!ui.pack.difficulties[s.difficulty]) s.difficulty = Object.keys(ui.pack.difficulties)[0];
    save();
    return render();
  }
  if (d.lang) {
    s.lang = d.lang;
    save();
    ui.sheet = ui.game ? 'pause' : null;
    return render();
  }
  if (d.skin) {
    s.skin = d.skin;
    save();
    return render();
  }
  if (d.toggle) {
    s[d.toggle] = !s[d.toggle];
    save();
    return render();
  }
  if (d.diff) {
    s.difficulty = d.diff;
    save();
    return render();
  }
  if (d.set) {
    s[d.set] = +d.v;
    if (d.set === 'players') s.hsBots = Math.min(s.hsBots, 4 - s.players);
    save();
    return render();
  }
  switch (d.act) {
    case 'scrim':
      if (e.target === el) {
        ui.sheet = null;
        render();
      }
      return;
    case 'menu':
      ui.sheet = ui.game ? 'pause' : 'settings';
      return render();
    case 'sound':
      s.sound = !s.sound;
      save();
      return render();
    case 'skin':
      s.skin = s.skin === 'daylight' ? 'nocturne' : 'daylight';
      save();
      render();
      return toast(t('appearanceIs', { v: s.skin === 'daylight' ? t('light') : t('dark') }));
    case 'settings':
    case 'rules':
    case 'privacy':
    case 'record':
    case 'language':
    case 'delete':
      ui.sheet = d.act;
      return render();
    case 'closesheet':
      ui.sheet = null;
      return render();
    case 'deleteyes':
      try {
        localStorage.removeItem(STORE);
      } catch {
        /* nothing stored */
      }
      ui.record = emptyRecord();
      s.names = ['', '', '', ''];
      s.practice = false;
      ui.sheet = null;
      render();
      return toast(t('deleted'));
    case 'resetrecord':
      delete ui.record.packs[s.packId];
      save();
      return render();
    case 'setup-solo':
    case 'setup-hs':
      ui.setupMode = d.act === 'setup-solo' ? 'solo' : 'hs';
      ui.pack ??= await loadPack(s.packId);
      ui.sheet = 'setup';
      return render();
    case 'start':
      return startGame();
    case 'quit':
    case 'home':
      ui.game = null;
      ui.sheet = null;
      return render();
    case 'again':
      ui.game = createGame(ui.pack, { ...ui.config, seed: Math.floor(Math.random() * 2 ** 32) });
      ui.barsOpen = 0;
      ui.recorded = false;
      ui.freshClue = true;
      resetPhase();
      return render();
    case 'ready':
      return dispatch({ type: 'ready' });
    case 'skip':
      return dispatch({ type: 'clueTimeout' });
    case 'undo':
      ui.strokes.pop();
      return paint();
    case 'clear':
      ui.strokes = [];
      return paint();
    case 'submit':
      return submitDrawing();
    case 'skipreveal':
      if (ui.reveal && !ui.reveal.done) finishReveal();
      return;
    case 'continue':
      if (ui.game.phase === 'reveal' && !ui.reveal?.done) return finishReveal();
      return dispatch({ type: 'continue' });
    case 'opennext':
      ui.barsOpen++;
      sfx.bar();
      render();
      if (ui.barsOpen >= ui.game.config.rounds) celebrate();
      return;
    case 'openall':
      return openAllBars();
    default:
  }
});

function openAllBars() {
  const n = ui.game.config.rounds;
  const stepOpen = () => {
    if (!ui.game || ui.game.phase !== 'gameOver' || ui.barsOpen >= n) return;
    ui.barsOpen++;
    sfx.bar();
    render();
    if (ui.barsOpen >= n) celebrate();
    else setTimeout(stepOpen, reduced() ? 0 : 320);
  };
  stepOpen();
}

function celebrate() {
  const res = results(ui.pack, ui.game);
  const humanWon = res.winners.some((i) => seat(i).kind === 'human');
  setTimeout(() => {
    if (humanWon) {
      sfx.fanfare();
      confetti(160);
    } else sfx.stamp(1);
  }, 300);
}

window.addEventListener('resize', () => {
  if (ui.game?.phase === 'draw') sizeCanvas();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.sheet) {
    ui.sheet = null;
    render();
  }
});

// ─────────────────────────────────────────── boot
applySkin();
render();
loadPack(ui.settings.packId)
  .then((p) => {
    ui.pack = p;
    if (!p.difficulties[ui.settings.difficulty]) ui.settings.difficulty = Object.keys(p.difficulties)[0];
    if (!ui.game) render();
  })
  .catch((err) => {
    $app.innerHTML = `<div class="solo-center"><h1>Pack failed to load</h1><p class="muted">${esc(err.message)}</p></div>`;
  });
requestAnimationFrame(() => clockLoop(performance.now()));
