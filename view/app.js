// The view: renders state, runs the clocks, captures strokes, plays sounds.
// No game rules live here; every decision goes through the engine.

import { loadPack, PACKS } from '../packs/registry.js';
import { createGame, step, activeTurn, activeSeat, revealedClues, results, botLine, isPractice } from '../engine/game.js';
import { poolFor } from '../engine/pack.js';
import { suggest } from '../engine/names.js';
import { outlineToBox, outlineToCanvas } from '../engine/judge.js';
import { emptyRecord, sanitizeRecord, recordGame, recordDrawing } from '../engine/records.js';
import { tr, UI_LANGS, LANG_NAMES } from './i18n.js';
import { sfx, setSound, unlockAudio, haptic } from './audio.js';

const STORE = 'projectx.v1';
const W = 1000; // drawings are stored in a 1000×1000 space

// ---------------------------------------------------------------- storage
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
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applySkin() {
  if (ui.settings.skin === 'daylight') document.documentElement.setAttribute('data-skin', 'daylight');
  else document.documentElement.removeAttribute('data-skin');
  document.documentElement.lang = L();
  setSound(ui.settings.sound);
}

const ICON = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><path d="M3 3l18 18"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5M15 14.5c2.5 0 4.5 1.5 5.5 4.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5c3-1 6-1 8 1v14c-2-2-5-2-8-1zM20 5c-3-1-6-1-8 1v14c2-2 5-2 8-1z"/></svg>',
};

// ---------------------------------------------------------------- helpers
const itemOf = (id) => ui.pack.byId.get(id);
const nameOf = (id) => itemOf(id).names[L()] ?? itemOf(id).names.en;
const seatName = (i) => ui.game.config.seats[i].name;
const initial = (s) => esc((s || '?').trim().charAt(0).toUpperCase());
const avatar = (i, big = false) => `<span class="avatar seat-${ui.game.config.seats[i].color}"${big ? ' style="width:64px;height:64px;font-size:28px"' : ''}>${initial(seatName(i))}</span>`;
const pathOf = (pts) => (pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z` : '');

function topBar({ mid = '', pause = true } = {}) {
  return `<div class="bar">
    <button class="pill" data-act="menu" aria-label="${t('menu')}">${ICON.menu}<span>${t('menu')}</span></button>
    ${mid ? `<div class="mid">${mid}</div>` : '<span></span>'}
    <div class="group">
      ${pause ? `<button class="pill icon" data-act="menu" aria-label="${t('paused')}">${ICON.pause}</button>` : ''}
      <button class="pill icon" data-act="sound" aria-label="${t('sound')}">${ui.settings.sound ? ICON.note : ICON.mute}</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- render
function render() {
  applySkin();
  const g = ui.game;
  let html;
  if (!g) html = renderHome();
  else {
    switch (g.phase) {
      case 'handoff':
        html = renderHandoff();
        break;
      case 'clue':
        html = renderClue();
        break;
      case 'draw':
        html = renderDraw();
        break;
      case 'reveal':
        html = renderReveal();
        break;
      case 'roundEnd':
        html = renderRoundEnd();
        break;
      default:
        html = renderFinal();
    }
  }
  $app.innerHTML = html + renderSheet();
  afterRender();
}

function renderHome() {
  const rec = ui.record.packs[ui.settings.packId];
  const games = rec ? rec.won + rec.lost + rec.tied : 0;
  const mark = ui.pack ? outlineMark() : '';
  return `<div class="bar"><span></span><span></span><div class="group">
      <button class="pill icon" data-act="settings" aria-label="${t('settings')}">${ICON.gear}</button>
      <button class="pill icon" data-act="sound" aria-label="${t('sound')}">${ui.settings.sound ? ICON.note : ICON.mute}</button>
    </div></div>
  <div class="main"><div class="home">
    <div class="brand">
      <div class="globe-mark">${mark}</div>
      <h1>Project<span>X</span></h1>
      <p>${t('tagline')}</p>
    </div>
    <div class="stack">
      <div class="packs">${PACKS.map((p) => `<button class="pack" data-pack="${p.id}" aria-pressed="${p.id === ui.settings.packId}">
          <b>${esc(p.title[L()])}</b><small>${p.mark} ${esc(p.blurb[L()])}</small></button>`).join('')}</div>
      <button class="mode" data-act="setup-solo"><span class="dot">${ICON.person}</span><span><b>${t('solo')}</b><small>${t('soloSub')}</small></span></button>
      <button class="mode" data-act="setup-hs"><span class="dot alt">${ICON.people}</span><span><b>${t('hotseat')}</b><small>${t('hotseatSub')}</small></span></button>
      <div class="row">
        <button class="btn" data-act="rules">${ICON.book}<span>${t('howToPlay')}</span></button>
        <button class="btn" data-act="settings">${LANG_NAMES[L()]}</button>
      </div>
      <div class="card recordline"><span class="big num">${rec ? `${rec.won}–${rec.lost}` : '0–0'}</span>
        <span><b>${t('record')}</b><br><small class="muted">${games ? t('games', { n: games }) + (rec.streak ? ` · ${rec.streak > 0 ? '+' : ''}${rec.streak}` : '') : t('noGames')}</small></span></div>
      <div class="foot">${t('footer')}</div>
    </div>
  </div></div>`;
}

function outlineMark() {
  const ids = poolFor(ui.pack, 'beginner');
  const id = ids[new Date().getDate() % ids.length];
  const pts = outlineToBox(itemOf(id).outline, 200, 0.08);
  return `<svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label="${esc(nameOf(id))}">
    <path d="${pathOf(pts)}" pathLength="1" class="real ${reduced() ? '' : 'trace'}" style="stroke-width:2.5"></path></svg>`;
}

function renderHandoff() {
  const s = activeSeat(ui.game);
  return `${topBar({ mid: t('round', { r: ui.game.round + 1, n: ui.game.config.rounds }), pause: false })}
  <div class="center">
    <span class="eyebrow">${t('passTo')}</span>
    <div style="display:flex;align-items:center;gap:14px">${avatar(s, true)}<h1>${esc(seatName(s))}</h1></div>
    <p class="muted">${t('passNote')}</p>
    <button class="btn gold" data-act="ready" style="min-width:220px">${t('ready')}</button>
  </div>`;
}

function rivalsHtml() {
  const g = ui.game;
  const me = activeSeat(g);
  const turn = activeTurn(g);
  const elapsed = (ui.clock.total - ui.clock.left) * 1000;
  return g.config.seats
    .map((s, i) => {
      if (i === me) return '';
      let done;
      const other = g.turns[g.round][i];
      if (s.kind === 'bot') {
        const last = other.bot.timeline.at(-1);
        done = g.phase !== 'clue' || turn.clue > last.clue || (turn.clue === last.clue && elapsed >= last.atMs);
      } else done = other.done;
      return `<span class="chip">${avatar(i)}${esc(s.name)} · <span class="muted">${done ? t('finished') : t('thinking')}</span></span>`;
    })
    .join('');
}

function renderClue() {
  const g = ui.game;
  const turn = activeTurn(g);
  const clues = revealedClues(ui.pack, g, L());
  const worth = Math.max(1, (g.config.rules.basePoints[turn.clue] ?? 1) - turn.guesses.filter((x) => !x.ok).length * g.config.rules.wrongGuessPenalty);
  const slots = [];
  for (let k = 0; k < 5; k++) {
    if (k < clues.length) {
      const cur = k === clues.length - 1;
      slots.push(`<div class="clue ${cur ? 'current' : ''} ${cur && ui.freshClue ? 'new' : ''}">
        <div class="k"><span>${t('clueN', { n: k + 1 })}</span><span>${t('worth', { p: g.config.rules.basePoints[k] })}</span></div>
        <p>${esc(clues[k])}</p>${cur ? '<div class="timer" id="cluetimer"></div>' : ''}</div>`);
    } else slots.push(`<div class="clue locked"><div class="k"><span>${t('clueN', { n: k + 1 })}</span><span>${t('worth', { p: g.config.rules.basePoints[k] })}</span></div></div>`);
  }
  ui.freshClue = false;
  const n = ui.notice;
  return `${topBar({ mid: t('round', { r: g.round + 1, n: g.config.rounds }) })}
  <div class="main">
    <div class="clues">${slots.join('')}</div>
    <div class="card guess">
      <div class="worth"><span class="eyebrow">${esc(seatName(activeSeat(g)))}</span><span><span class="n num">${worth}</span> <span class="muted">${t('pts')}</span></span></div>
      <form class="field" id="guessform" autocomplete="off">
        <input id="guessinput" type="text" inputmode="text" autocapitalize="words" spellcheck="false" placeholder="${t('guessPh')}" value="${esc(ui.draft)}" aria-label="${t('guessPh')}">
        <ul class="sugg" id="sugg"></ul>
      </form>
      <div class="notice ${n?.ok ? 'ok' : ''}" id="notice">${n ? esc(n.text) : ''}</div>
      <div class="row">
        <button class="btn ghost" data-act="skip">${t('nextClue')}</button>
        <button class="btn gold" data-act="guess">${t('guess')}</button>
      </div>
      <div class="rivals" id="rivals">${rivalsHtml()}</div>
    </div>
  </div>`;
}

function renderDraw() {
  const g = ui.game;
  const turn = activeTurn(g);
  const item = itemOf(g.places[g.round]);
  const solved = turn.solvedAt !== null;
  return `${topBar({ mid: t('round', { r: g.round + 1, n: g.config.rounds }) })}
  <div class="main drawphase">
    <div class="side">
      <span class="eyebrow">${esc(seatName(activeSeat(g)))}</span>
      <h2>${esc(t('draw', { p: nameOf(item.id) }))}</h2>
      <span class="muted">${solved ? t('solvedOn', { n: turn.solvedAt + 1, b: turn.base }) : t('missedIt')}${item.mainlandOnly ? ` · ${t('mainland')}` : ''}</span>
      <div class="tbar"><i id="drawtimer"></i></div>
      <div class="row btns">
        <button class="btn" data-act="undo">${t('undo')}</button>
        <button class="btn" data-act="clear">${t('clear')}</button>
      </div>
      <button class="btn gold wide btns" data-act="submit">${t('done')}</button>
    </div>
    <div class="drawwrap" id="drawwrap"><div class="canvasbox" id="canvasbox"><canvas id="cv"></canvas><span class="north">▲ ${t('northUp')}</span></div></div>
  </div>`;
}

function revealSvg(turn, itemId, { animate = true } = {}) {
  const item = itemOf(itemId);
  const real = turn.fit ? outlineToCanvas(item.outline, turn.fit) : outlineToBox(item.outline, W, 0.15);
  const mine = (turn.rings || []).map((r) => `<path class="mine" d="${pathOf(r)}"></path>`).join('');
  // Fit the view to both shapes with a margin.
  const all = real.concat(...(turn.rings || []));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of all) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const side = Math.max(x1 - x0, y1 - y0) * 1.12 || W;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const vb = `${(cx - side / 2).toFixed(1)} ${(cy - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`;
  return `<svg class="revealsvg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(nameOf(itemId))}">
    ${mine}<path class="real ${animate && !reduced() ? 'trace' : ''}" pathLength="1" d="${pathOf(real)}"></path></svg>`;
}

function renderReveal() {
  const g = ui.game;
  const turn = activeTurn(g);
  const id = g.places[g.round];
  const r = ui.reveal;
  const showAll = r?.done;
  const weak = turn.multiplier < 3;
  return `${topBar({ mid: t('round', { r: g.round + 1, n: g.config.rounds }), pause: false })}
  <div class="main" data-act="skipreveal">
    <div class="drawwrap"><div class="canvasbox revealbox" id="revealbox">${revealSvg(turn, id, { animate: !showAll })}${showAll && turn.multiplier >= 100 && r.burst ? '<div class="burst"></div>' : ''}</div></div>
    <div class="side stat">
      <span class="eyebrow">${esc(nameOf(id))}</span>
      <div><span class="eyebrow">${t('accuracy')}</span><div class="big num" id="acc">${showAll ? Math.round(turn.accuracy * 100) : 0}%</div></div>
      <div style="min-height:80px">${showAll ? `<span class="stamp num on ${weak ? 'weak' : ''}">${fmtMult(turn.multiplier)}×</span>` : ''}</div>
      <div><span class="eyebrow">${t('roundScore')}</span><div class="num" style="font-size:28px;font-weight:700">${showAll ? `${turn.base} × ${fmtMult(turn.multiplier)} = <span style="color:var(--accent)">${turn.score.toLocaleString(L())}</span>` : '…'}</div></div>
      <span class="muted" style="font-size:13px">${showAll ? '' : t('tapSkip')}</span>
      <button class="btn gold wide" data-act="continue" ${showAll ? '' : 'disabled'}>${t('continue')}</button>
    </div>
  </div>`;
}

const fmtMult = (m) => (m >= 1000 ? m.toLocaleString('en').replace(/,/g, ' ') : String(m));

function renderRoundEnd() {
  const g = ui.game;
  const id = g.places[g.round];
  const item = itemOf(id);
  const lines = g.config.seats
    .map((s, i) => (s.kind === 'bot' ? `<div class="chip" style="align-self:center">${avatar(i)}<span class="botline">“${esc(botLine(ui.pack, g, g.round, i, 0, L()))}”</span></div>` : ''))
    .join('');
  const last = g.round + 1 >= g.config.rounds;
  return `${topBar({ mid: t('round', { r: g.round + 1, n: g.config.rounds }), pause: false })}
  <div class="center">
    <span class="eyebrow">${t('itWas')}</span>
    <h1>${esc(nameOf(id))}</h1>
    <div class="card fact"><span class="eyebrow">${t('didYouKnow')}</span><p>${esc(item.fact[L()] ?? item.fact.en)}</p></div>
    ${lines}
    <p class="muted" style="font-size:14px">${t('scoresHidden')}</p>
    <button class="btn gold" data-act="continue" style="min-width:240px">${last ? t('seeResults') : t('nextRound')}</button>
  </div>`;
}

function renderFinal() {
  const g = ui.game;
  const res = results(ui.pack, g);
  const n = g.config.rounds;
  const open = ui.barsOpen;
  const all = open >= n;
  const cols = `grid-template-columns:repeat(${n},1fr)`;
  const rows = res.seats
    .map(
      (s) => `<div class="seatrow"><span class="name">${avatar(s.seat)}${esc(s.name)}</span>
      <div class="cells" style="${cols}">${s.rounds.map((r, k) => `<div class="cell num ${k < open ? 'open' : ''} ${k < open && r.multiplier >= 100 ? 'hot' : ''}">${k < open ? r.score : ''}</div>`).join('')}</div>
      <span class="totalcell num">${all ? s.total.toLocaleString(L()) : '—'}</span></div>`,
    )
    .join('');
  let verdict = '';
  if (all) {
    const w = res.winners;
    verdict = `<h1>${w.length > 1 ? t('tie') : esc(t('wins', { n: seatName(w[0]) }))}</h1>
      <span class="muted">${res.seats.map((s) => `${esc(s.name)} ${Math.round(s.avgAccuracy * 100)}%`).join(' · ')} ${t('avgAcc')}</span>`;
  }
  const human = res.seats.find((s) => s.kind === 'human');
  const places = res.places
    .map((p) => {
      const a = p.accuracy[human.seat] ?? 0;
      return `<span class="place" style="background:color-mix(in srgb, var(--accent) ${Math.round(a * 70)}%, transparent)">${esc(nameOf(p.itemId))} ${all ? Math.round(a * 100) + '%' : ''}</span>`;
    })
    .join('');
  const best = res.best;
  return `${topBar({ mid: t('finalScores'), pause: false })}
  <div class="final">
    <div class="card board">
      <div class="verdict">${verdict}</div>
      ${rows}
      <div class="row" style="margin-top:6px">
        ${all ? `<button class="btn" data-act="home">${t('menu')}</button><button class="btn gold" data-act="again">${t('playAgain')}</button>`
          : `<button class="btn" data-act="openall">${t('revealAll')}</button><button class="btn gold" data-act="opennext">${t('revealNext', { r: open + 1 })}</button>`}
      </div>
    </div>
    <div class="stack">
      ${all && best ? `<div class="card" style="padding:14px"><span class="eyebrow">${t('best')} · ${esc(seatName(best.seat))} · ${esc(nameOf(best.itemId))} · ${Math.round(best.accuracy * 100)}%</span>
        <div style="aspect-ratio:1;max-height:38vh;margin:8px auto 0">${revealSvg({ rings: best.rings, fit: best.fit }, best.itemId, { animate: false })}</div></div>` : ''}
      <div class="card" style="padding:14px"><span class="eyebrow">${t('places')}</span><div class="places" style="margin-top:8px">${places}</div></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- sheets
function renderSheet() {
  const sh = ui.sheet;
  if (!sh) return '';
  let body = '';
  if (sh === 'rules') {
    body = `<h2>${t('howToPlay')}</h2><ol>${t('rules').map((l) => `<li>${esc(l)}</li>`).join('')}</ol>
      <button class="btn gold" data-act="closesheet">${t('close')}</button>`;
  } else if (sh === 'settings' || sh === 'delete') {
    body = `<h2>${t('settings')}</h2>
      <div class="opt"><label>${t('language')}</label></div>
      <div class="seg">${UI_LANGS.map((l) => `<button data-lang="${l}" aria-pressed="${l === L()}">${l.toUpperCase()}</button>`).join('')}</div>
      <div class="opt"><label>${t('theme')}</label><div class="seg" style="min-width:220px">
        <button data-skin="nocturne" aria-pressed="${ui.settings.skin !== 'daylight'}">${t('dark')}</button>
        <button data-skin="daylight" aria-pressed="${ui.settings.skin === 'daylight'}">${t('light')}</button></div></div>
      <div class="opt"><label>${t('sound')}</label><div class="seg" style="min-width:160px">
        <button data-sound="1" aria-pressed="${ui.settings.sound}">${t('on')}</button>
        <button data-sound="0" aria-pressed="${!ui.settings.sound}">${t('off')}</button></div></div>
      ${sh === 'delete'
        ? `<p>${t('deleteAsk')}</p><div class="row"><button class="btn" data-act="settings">${t('cancel')}</button><button class="btn danger" data-act="deleteyes">${t('deleteYes')}</button></div>`
        : `<button class="btn danger" data-act="delete">${t('deleteData')}</button>`}
      ${ui.deletedMsg ? `<p class="muted">${t('deleted')}</p>` : ''}
      <button class="btn gold" data-act="closesheet">${t('close')}</button>`;
  } else if (sh === 'pause') {
    body = `<h2>${t('paused')}</h2>
      <button class="btn gold" data-act="closesheet">${t('resume')}</button>
      <div class="row"><button class="btn" data-act="rules">${t('howToPlay')}</button><button class="btn" data-act="settings">${t('settings')}</button></div>
      <button class="btn danger" data-act="quit">${t('quit')}</button><small class="muted">${t('quitNote')}</small>`;
  } else if (sh === 'setup') body = renderSetup();
  return `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true">${body}</div></div>`;
}

function stepper(key, v) {
  return `<div class="stepper"><button data-step="${key}" data-d="-1" aria-label="−">−</button><span class="v num">${v}</span><button data-step="${key}" data-d="1" aria-label="+">+</button></div>`;
}

function renderSetup() {
  const s = ui.settings;
  const solo = ui.setupMode === 'solo';
  const diffs = ui.pack ? Object.entries(ui.pack.difficulties) : [];
  const poolN = ui.pack ? poolFor(ui.pack, s.difficulty).length : 30;
  s.rounds = Math.min(Math.max(5, s.rounds), Math.min(30, poolN));
  const names = solo
    ? `<div class="opt"><label for="name0">${t('yourName')}</label></div><div class="names" style="grid-template-columns:1fr"><input id="name0" data-name="0" maxlength="16" value="${esc(s.names[0])}" placeholder="${t('playerN', { n: 1 })}"></div>`
    : `<div class="names">${Array.from({ length: s.players }, (_, i) => `<input id="name${i}" data-name="${i}" maxlength="16" value="${esc(s.names[i])}" placeholder="${t('playerN', { n: i + 1 })}" aria-label="${t('playerN', { n: i + 1 })}">`).join('')}</div>`;
  return `<h2>${solo ? t('solo') : t('hotseat')} · ${ui.pack ? esc(ui.pack.title[L()]) : ''}</h2>
    <div class="seg">${diffs.map(([k, d]) => `<button data-diff="${k}" aria-pressed="${k === s.difficulty}">${esc(d.label[L()])}</button>`).join('')}</div>
    ${solo ? '' : `<div class="opt"><label>${t('players')}</label>${stepper('players', s.players)}</div>`}
    ${names}
    <div class="opt"><label>${t('bots')}</label>${stepper(solo ? 'bots' : 'hsBots', solo ? s.bots : s.hsBots)}</div>
    <div class="opt"><label>${t('rounds')}</label>${stepper('rounds', s.rounds)}</div>
    <div class="opt"><label>${t('clueTime')}</label>${stepper('clueSeconds', s.clueSeconds)}</div>
    <div class="opt"><label>${t('drawTime')}</label>${stepper('drawSeconds', s.drawSeconds)}</div>
    <label class="check"><input type="checkbox" id="practice" ${s.practice ? 'checked' : ''}> <span>${t('practice')}</span></label>
    ${s.practice ? `<small class="muted">${t('practiceNote')}</small>` : ''}
    <div class="row"><button class="btn" data-act="closesheet">${t('cancel')}</button><button class="btn gold" data-act="start">${t('start')}</button></div>`;
}

const LIMITS = { bots: [1, 3, 1], hsBots: [0, 2, 1], players: [2, 4, 1], rounds: [5, 30, 1], clueSeconds: [5, 60, 5], drawSeconds: [5, 90, 5] };

// ---------------------------------------------------------------- actions
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
  resetPhase();
  save();
  render();
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
  if (g.phase === 'clue' && turn && turnBefore && turn.clue !== turnBefore.clue) {
    ui.freshClue = true;
    sfx.clue();
  }
  if (g.phase === 'clue' && phaseBefore === 'handoff') {
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
  if (!isPractice(ui.game.config)) {
    ui.record = recordGame(ui.record, res, { packId: ui.pack.id });
    const at = new Date().toISOString().slice(0, 10);
    ui.game.turns.forEach((round, k) =>
      round.forEach((turn) => {
        if (ui.game.config.seats[turn.seat].kind !== 'human') return;
        ui.record = recordDrawing(ui.record, { packId: ui.pack.id, itemId: ui.game.places[k], accuracy: turn.accuracy, rings: turn.rings, name: seatName(turn.seat), at });
      }),
    );
    save();
  }
}

function startReveal() {
  const turn = activeTurn(ui.game);
  ui.reveal = { done: false, burst: true };
  if (reduced()) {
    ui.reveal.done = true;
    setTimeout(() => sfx.stamp(turn.multiplier), 50);
    return;
  }
  sfx.trace();
  const t0 = performance.now();
  const target = Math.round(turn.accuracy * 100);
  const tick = (now) => {
    if (!ui.reveal || ui.reveal.done || ui.game.phase !== 'reveal') return;
    const k = Math.min(1, Math.max(0, (now - t0 - 700) / 700));
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
  if (turn.multiplier >= 100) confetti(turn.multiplier >= 1000 ? 120 : 60);
}

function confetti(n) {
  if (reduced()) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['var(--accent)', 'var(--fg)', 'var(--seat-red)', 'var(--seat-blue)', 'var(--seat-green)'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const x = Math.random() * 100;
    p.style.cssText = `position:absolute;left:${x}%;top:-20px;width:8px;height:14px;border-radius:2px;background:${colors[i % colors.length]}`;
    box.appendChild(p);
    p.animate(
      [
        { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${(Math.random() - 0.5) * 200}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`, opacity: 0.9 },
      ],
      { duration: 1800 + Math.random() * 1400, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
    );
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3800);
}

// ---------------------------------------------------------------- clock
function phaseKey() {
  const g = ui.game;
  if (!g || (g.phase !== 'clue' && g.phase !== 'draw')) return null;
  const turn = activeTurn(g);
  return `${g.round}:${activeSeat(g)}:${g.phase}:${turn.clue}`;
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
    const sec = Math.ceil(c.left);
    if (sec !== c.lastSec) {
      c.lastSec = sec;
      if (sec <= 5 && sec > 0) sfx.tick();
      const r = document.getElementById('rivals');
      if (r && ui.game.phase === 'clue') r.innerHTML = rivalsHtml();
    }
    const frac = Math.max(0, c.left / c.total);
    const bar = document.getElementById(ui.game.phase === 'clue' ? 'cluetimer' : 'drawtimer');
    if (bar) {
      bar.style.width = `${frac * 100}%`;
      bar.classList.toggle('low', c.left <= 5);
    }
    if (c.left <= 0) {
      c.key = null;
      if (ui.game.phase === 'clue') dispatch({ type: 'clueTimeout' });
      else submitDrawing();
    }
  }
  requestAnimationFrame(() => clockLoop(now));
}

// ---------------------------------------------------------------- drawing
let cv;
let cctx;
let cSize = 0;
let drawing = null;

function sizeCanvas() {
  const wrap = document.getElementById('drawwrap');
  cv = document.getElementById('cv');
  if (!wrap || !cv) return;
  const r = wrap.getBoundingClientRect();
  cSize = Math.max(160, Math.floor(Math.min(r.width, r.height) - 4));
  const dpr = window.devicePixelRatio || 1;
  cv.width = cSize * dpr;
  cv.height = cSize * dpr;
  cv.style.width = cv.style.height = `${cSize}px`;
  cctx = cv.getContext('2d');
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint();
}

function paint() {
  if (!cctx) return;
  const css = getComputedStyle(document.documentElement);
  cctx.clearRect(0, 0, cSize, cSize);
  const k = cSize / W;
  if (ui.game.config.practice.faintOutline) {
    const pts = outlineToBox(itemOf(ui.game.places[ui.game.round]).outline, W, 0.15);
    cctx.beginPath();
    pts.forEach(([x, y], i) => (i ? cctx.lineTo(x * k, y * k) : cctx.moveTo(x * k, y * k)));
    cctx.closePath();
    cctx.strokeStyle = css.getPropertyValue('--muted');
    cctx.globalAlpha = 0.25;
    cctx.lineWidth = 2;
    cctx.stroke();
    cctx.globalAlpha = 1;
  }
  cctx.strokeStyle = css.getPropertyValue('--stroke');
  cctx.lineWidth = 3;
  cctx.lineJoin = cctx.lineCap = 'round';
  for (const s of ui.strokes) {
    if (!s.length) continue;
    cctx.beginPath();
    s.forEach(([x, y], i) => (i ? cctx.lineTo(x * k, y * k) : cctx.moveTo(x * k, y * k)));
    if (s.length === 1) cctx.lineTo(s[0][0] * k + 0.1, s[0][1] * k);
    cctx.stroke();
  }
}

function pointFrom(e) {
  const r = cv.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * W];
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
    if (s.length > 8 && Math.hypot(s[0][0] - s.at(-1)[0], s[0][1] - s.at(-1)[1]) < W * 0.05) {
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

// ---------------------------------------------------------------- guessing
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

// ---------------------------------------------------------------- events
function afterRender() {
  const g = ui.game;
  if (g?.phase === 'draw') bindCanvas();
  if (g?.phase === 'clue') {
    const input = document.getElementById('guessinput');
    input.addEventListener('input', () => {
      ui.draft = input.value;
      ui.sel = -1;
      updateSugg();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        ui.sel = Math.min(ui.sugg.length - 1, ui.sel + 1);
        updateSugg();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        ui.sel = Math.max(-1, ui.sel - 1);
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
    document.getElementById('practice')?.addEventListener('change', (e) => {
      ui.settings.practice = e.target.checked;
      save();
      render();
    });
  }
}

$app.addEventListener('click', async (e) => {
  unlockAudio();
  const el = e.target.closest('[data-act],[data-pack],[data-lang],[data-skin],[data-sound],[data-diff],[data-step],[data-pick]');
  if (!el) return;
  const d = el.dataset;
  if (d.pick) return dispatch({ type: 'guess', id: d.pick });
  if (d.pack) {
    ui.settings.packId = d.pack;
    ui.pack = await loadPack(d.pack);
    ui.settings.difficulty = Object.keys(ui.pack.difficulties)[0];
    save();
    return render();
  }
  if (d.lang) {
    ui.settings.lang = d.lang;
    save();
    return render();
  }
  if (d.skin) {
    ui.settings.skin = d.skin;
    save();
    return render();
  }
  if (d.sound) {
    ui.settings.sound = d.sound === '1';
    save();
    return render();
  }
  if (d.diff) {
    ui.settings.difficulty = d.diff;
    save();
    return render();
  }
  if (d.step) {
    const [lo, hi, inc] = LIMITS[d.step];
    let max = hi;
    if (d.step === 'rounds' && ui.pack) max = Math.min(hi, poolFor(ui.pack, ui.settings.difficulty).length);
    if (d.step === 'hsBots') max = Math.min(hi, 4 - ui.settings.players);
    ui.settings[d.step] = Math.min(max, Math.max(lo, ui.settings[d.step] + +d.d * inc));
    if (d.step === 'players') ui.settings.hsBots = Math.min(ui.settings.hsBots, 4 - ui.settings.players);
    save();
    return render();
  }
  switch (d.act) {
    case 'scrim':
      if (e.target === el && ui.sheet !== 'setup') {
        ui.sheet = null;
        render();
      }
      return;
    case 'menu':
      ui.sheet = ui.game ? 'pause' : 'settings';
      return render();
    case 'sound':
      ui.settings.sound = !ui.settings.sound;
      save();
      return render();
    case 'settings':
      ui.deletedMsg = false;
      ui.sheet = 'settings';
      return render();
    case 'rules':
      ui.sheet = 'rules';
      return render();
    case 'closesheet':
      ui.sheet = null;
      return render();
    case 'delete':
      ui.sheet = 'delete';
      return render();
    case 'deleteyes':
      try {
        localStorage.removeItem(STORE);
      } catch {
        /* nothing stored */
      }
      ui.record = emptyRecord();
      ui.settings.names = ['', '', '', ''];
      ui.deletedMsg = true;
      ui.sheet = 'settings';
      return render();
    case 'setup-solo':
    case 'setup-hs':
      ui.setupMode = d.act === 'setup-solo' ? 'solo' : 'hs';
      ui.pack ??= await loadPack(ui.settings.packId);
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
      resetPhase();
      return render();
    case 'ready':
      return dispatch({ type: 'ready' });
    case 'skip':
      return dispatch({ type: 'clueTimeout' });
    case 'guess':
      return submitGuess();
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
      if (ui.barsOpen >= ui.game.config.rounds) celebrate();
      return render();
    case 'openall':
      openAllBars();
      return;
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
    else setTimeout(stepOpen, reduced() ? 0 : 280);
  };
  stepOpen();
}

function celebrate() {
  const res = results(ui.pack, ui.game);
  const humanWon = res.winners.some((i) => ui.game.config.seats[i].kind === 'human');
  setTimeout(() => {
    if (humanWon) {
      sfx.fanfare();
      confetti(140);
    } else sfx.stamp(1);
  }, 250);
}

window.addEventListener('resize', () => {
  if (ui.game?.phase === 'draw') sizeCanvas();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.sheet && ui.sheet !== 'setup') {
    ui.sheet = null;
    render();
  }
});

// ---------------------------------------------------------------- boot
applySkin();
render();
loadPack(ui.settings.packId)
  .then((p) => {
    ui.pack = p;
    if (!p.difficulties[ui.settings.difficulty]) ui.settings.difficulty = Object.keys(p.difficulties)[0];
    if (!ui.game) render();
  })
  .catch((err) => {
    $app.innerHTML = `<div class="center"><h1>Pack failed to load</h1><p class="muted">${esc(err.message)}</p></div>`;
  });
requestAnimationFrame(() => clockLoop(performance.now()));
