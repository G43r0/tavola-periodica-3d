// Simulatore di laboratorio (schermo intero): menu, HUD, finestre e comandi. Caricato su richiesta da main.js;
// Rapier e la scena si preparano alla prima apertura. La logica del gioco è in game.js.
import * as THREE from 'three';
import '../styles/game.css';
import { createT, locale } from '../i18n/index.js';
import { gfx } from '../gfx/preset.js';
import { esc, normalize } from '../chem/format.js';
import { icons } from '../ui/icons.js';
import { loadPhysics } from './physics.js';
import { LabGame, FOV } from './game.js';
import { ORDERS } from './orders.js';
import { SHELF, CABINET } from './reagents.js';
import { reagentLook, FAMILIES, FAMILY_ORDER } from './stock.js';
import { isClick } from './controls.js';
import { S } from '../sandbox/substances.js';
import { GAME_STRINGS } from './game-strings.js';
import { loadNotebook, notebookPages, percent } from './notebook.js';
import { TUTORIAL, illustration } from './tutorial.js';

const t = createT(GAME_STRINGS);
const SAVE_KEY = 'tp3d.game';
const HUD_HZ = 10;

function loadSave() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(SAVE_KEY) || 'null') ?? {};
  } catch {
    return {};
  }
}
function storeSave(data) {
  try {
    globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* il salvataggio non è disponibile: i progressi valgono fino alla chiusura */
  }
}

const rows = (list) => list.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
const stars = (n) => Array.from({ length: 5 }, (_, i) => `<span class="gm-star ${n >= i + 1 ? 'is-full' : n >= i + 0.5 ? 'is-half' : ''}">★</span>`).join('');

/** Mouse disegnato, con evidenziato il tasto sinistro (l), destro (r) o la rotella (w). */
const mouseIcon = (part) => `<svg class="gm-mouse" viewBox="0 0 14 20" width="14" height="20" aria-hidden="true"><rect x="1" y="1" width="12" height="18" rx="6"/><path d="M1 8h12M7 1v7" class="gm-mouse__line"/>${
  part === 'l' ? '<path d="M7 1.5A5.5 5.5 0 0 0 1.5 7v.5H7z" class="gm-mouse__on"/>' : part === 'r' ? '<path d="M7 1.5A5.5 5.5 0 0 1 12.5 7v.5H7z" class="gm-mouse__on"/>' : part === 'w' ? '<rect x="5.8" y="2.8" width="2.4" height="4.2" rx="1.2" class="gm-mouse__on"/>' : ''
}</svg>`;
/** Frecce accanto al mouse nella legenda: movimento in su e in giù (versare, alzare) o di lato (ruotare). */
const ARROWS = { mouse: '↕', mousex: '↔' };
const DROP = '<svg class="gm-drop" viewBox="0 0 10 14" width="9" height="12" aria-hidden="true"><path d="M5 .8C3.4 3.4 1 6.2 1 8.9a4 4 0 0 0 8 0C9 6.2 6.6 3.4 5 .8z"/></svg>';

const TEMPLATE = () => `
  <div class="gm-stage"></div>
  <div class="gm-hud" hidden>
    <div class="gm-cross"></div>
    <section class="gm-order" data-help="ui.game"></section>
    <div class="gm-top">
      <div class="gm-money" title="${t('moneyTitle')}"></div>
      <div class="gm-view"></div>
      <button type="button" class="gm-iconbtn" data-act="pause" title="${t('pauseTitle')}">${icons.pause(16)}</button>
    </div>
    <div class="gm-pop gm-pop--looked" hidden></div>
    <div class="gm-pop gm-pop--held" hidden></div>
    <ol class="gm-legend" aria-label="${t('legendTitle')}"></ol>
    <div class="gm-toasts" aria-live="polite"></div>
    <div class="gm-alarm" hidden></div>
    <div class="gm-tilt" hidden><span></span></div>
    <div class="gm-charge" hidden aria-hidden="true"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9155"/><circle class="gm-charge__fg" cx="18" cy="18" r="15.9155" pathLength="100"/></svg></div>
    <div class="gm-reactions"></div>
  </div>
  <div class="gm-overlay gm-loading" hidden><div class="gm-spinner"></div><p>${t('loading')}</p></div>
  <div class="gm-overlay gm-menu" hidden></div>
  <div class="gm-overlay gm-dialog" hidden></div>`;

/**
 * @param {object[]} elements
 * @param {{onClose?: Function, onOpenLab?: (reaction: string, onClose: Function) => void}} [opts] onOpenLab: apre una
 *   reazione del quaderno nel laboratorio molecolare, sopra il simulatore (onClose quando lo si chiude)
 */
export function createGame(elements, { onClose, onOpenLab } = {}) {
  const root = document.createElement('div');
  root.className = 'gm';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', t('title'));
  root.innerHTML = TEMPLATE();
  document.body.append(root);
  const $ = (s) => root.querySelector(s);
  const stage = $('.gm-stage');
  const hud = $('.gm-hud');

  let game = null;
  let renderer = null;
  let raf = 0;
  let lastT = 0;
  let hudAcc = 0;
  let state = 'menu'; // menu | play | dialog | pause
  // tasti del mouse premuti: per distinguere un clic da un trascinamento (come in Cooking Simulator il sinistro posa con
  // un clic e versa trascinando, il destro annulla o rimette a posto con un clic e ruota trascinando)
  let lmb = null; // { moved, done, pour }
  let rmb = null; // { moved, dx, dy }
  let save = loadSave();
  let chemMode = save.chemMode ?? 'real';
  let showInfo = true;
  let showLegend = save.legend !== false;
  let fov = Math.max(FOV.min, Math.min(FOV.max, Number(save.fov) || FOV.default));
  const notebook = loadNotebook(save.notebook);
  let nbGroup = null; // gruppo aperto nel quaderno
  let nbTab = 'tutorial'; // scheda del quaderno: tutorial o reazioni scoperte
  let tutPage = 0; // pagina del tutorial
  let labAbove = false; // il laboratorio molecolare è aperto sopra il simulatore
  const pressed = new Set(); // tasti premuti (id della legenda): la riga corrispondente si illumina
  const pops = { looked: null, held: null }; // finestrelle accanto agli oggetti (elemento, misure)

  // ---------------------------------------------------------------- avvio
  async function boot() {
    $('.gm-loading').hidden = false;
    const R = await loadPhysics();
    const G = gfx();
    renderer = new THREE.WebGLRenderer({ antialias: G.antialias, powerPreference: 'high-performance' });
    renderer.setPixelRatio(G.pixelRatio(window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // tone mapping neutro in tutti i preset: conserva tinta e saturazione, quindi i colori veri delle soluzioni
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    if (G.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    }
    stage.append(renderer.domElement);
    game = new LabGame(renderer, R, elements, { t, onEvent });
    game.setFov(fov);
    game.notebook = notebook;
    if (import.meta.env?.DEV) window.__game = game;
    layout();
    $('.gm-loading').hidden = true;
  }

  function layout() {
    if (!renderer) return;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    game.resize(w, h);
  }
  window.addEventListener('resize', () => !root.hidden && layout());

  // ---------------------------------------------------------------- eventi del gioco
  function onEvent(type, data) {
    if (type === 'toast') toast(data.text, data.kind);
    else if (type === 'result') showResult(data);
    else if (type === 'order') showOrderIntro(data);
    else if (type === 'answers') showAnswers(data);
    else if (type === 'catalog') showCatalog();
    else if (type === 'notebook') showNotebook('play');
    else if (type === 'careerEnd') showCareerEnd(data);
    else if (type === 'reaction') {
      reactionNote(data);
      if (data.isNew) {
        save.notebook = notebook;
        storeSave(save);
      }
    }
    else if (type === 'alert' && data.kind === 'splash') toast(t('splash'), 'danger', 6000);
  }

  function toast(text, kind = 'info', ms = 3600) {
    const box = $('.gm-toasts');
    const el = document.createElement('div');
    el.className = `gm-toast gm-toast--${kind}`;
    el.textContent = text;
    box.append(el);
    while (box.children.length > 4) box.firstElementChild.remove();
    setTimeout(() => el.classList.add('is-out'), ms);
    setTimeout(() => el.remove(), ms + 400);
  }

  /** ΔH° con il segno vero (−, +) e le unità. */
  const kj = (v) => `${v < 0 ? '−' : '+'}${game.fmt(Math.abs(v), Math.abs(v) < 100 ? 1 : 0)} kJ`;
  /** Che cosa si vede (bolle, precipitato…) come etichette brevi. */
  const tagsHtml = (tags = []) => (tags.length ? `<span class="gm-tags">${tags.map((k) => `<i class="gm-tag gm-tag--${k}">${esc(t(`tag_${k}`))}</i>`).join('')}</span>` : '');

  /** Avviso di una reazione osservata: equazione con gli stati fisici, ΔH°, cosa si vede; «nuova nel quaderno» la prima volta. */
  function reactionNote({ equation, dH, tags, isNew }) {
    const box = $('.gm-reactions');
    const el = document.createElement('div');
    el.className = `gm-rx${isNew ? ' is-new' : ''}`;
    el.innerHTML = `<span class="gm-rx__kind">${isNew ? t('rxNew') : t('reactionLabel')}</span> <span class="gm-rx__eq">${esc(equation)}</span>${dH !== null && dH !== undefined ? ` <small class="gm-rx__dh">ΔH° ${kj(dH)}</small>` : ''}${tagsHtml(tags)}${isNew ? `<small class="gm-rx__hint">${t('rxNewHint')}</small>` : ''}`;
    box.prepend(el);
    while (box.children.length > 3) box.lastElementChild.remove();
    const ms = isNew ? 9000 : 7000;
    setTimeout(() => el.classList.add('is-out'), ms);
    setTimeout(() => el.remove(), ms + 500);
  }

  // ---------------------------------------------------------------- stato del gioco e puntatore
  const locked = () => document.pointerLockElement === renderer?.domElement;
  function lock() {
    if (!renderer || game.player.mode !== 'walk') return;
    try {
      const p = renderer.domElement.requestPointerLock?.();
      p?.catch?.(() => {});
    } catch {
      /* il blocco del puntatore non è disponibile: si guarda trascinando */
    }
  }
  function unlock() {
    if (locked()) document.exitPointerLock?.();
  }

  function setState(s) {
    state = s;
    hud.hidden = s === 'menu';
    $('.gm-menu').hidden = s !== 'menu';
    $('.gm-dialog').hidden = s !== 'dialog' && s !== 'pause';
    if (s !== 'play') {
      unlock();
      pressed.clear();
      game?.player.keys.clear();
      releaseHands();
    }
  }

  function play() {
    setState('play');
    lock();
  }

  document.addEventListener('pointerlockchange', () => {
    if (root.hidden || !game) return;
    if (!locked() && state === 'play' && game.player.mode === 'walk') showPause();
  });

  // ---------------------------------------------------------------- menu principale
  function showMenu() {
    setState('menu');
    const career = save.career ?? null;
    const done = career ? career.index : 0;
    $('.gm-menu').innerHTML = `
      <div class="gm-menu__card">
        <p class="gm-eyebrow">${t('eyebrow')}</p>
        <h2>${t('title')}</h2>
        <p class="gm-lead">${t('menuLead')}</p>
        <div class="gm-modes">
          <button type="button" class="gm-big" data-act="career">
            <b>${career && done < ORDERS.length ? t('careerContinue') : t('careerStart')}</b>
            <span>${career ? t('careerProgress', { n: Math.min(done + 1, ORDERS.length), total: ORDERS.length, money: fmtMoney(career.money ?? 0) }) : t('careerText')}</span>
          </button>
          <button type="button" class="gm-big" data-act="free"><b>${t('freeStart')}</b><span>${t('freeText')}</span></button>
        </div>
        ${career ? `<button type="button" class="gm-link" data-act="career-reset">${t('careerReset')}</button>` : ''}
        <fieldset class="gm-chem">
          <legend>${t('chemLegend')}</legend>
          <label><input type="radio" name="gm-chem" value="real" ${chemMode === 'real' ? 'checked' : ''}/><span><b>${t('chemReal')}</b><small>${t('chemRealText')}</small></span></label>
          <label><input type="radio" name="gm-chem" value="simple" ${chemMode === 'simple' ? 'checked' : ''}/><span><b>${t('chemSimple')}</b><small>${t('chemSimpleText')}</small></span></label>
        </fieldset>
        ${fovHtml()}
        <div class="gm-menu__foot">
          <button type="button" class="btn-ghost" data-act="help">${icons.keyboard(16)}<span>${t('controls')}</span></button>
          <button type="button" class="btn-ghost" data-act="close">${icons.prev(16)}<span>${t('back')}</span></button>
        </div>
        <p class="gm-note">${t('prototypeNote')}</p>
      </div>`;
  }

  /** Cursore del campo visivo (menu principale e pausa). */
  const fovHtml = () => `<label class="gm-fov" title="${t('fovTitle')}"><span>${t('fov')}</span>
    <input type="range" name="gm-fov" min="${FOV.min}" max="${FOV.max}" step="1" value="${fov}"/><output>${fov}°</output></label>`;

  const fmtMoney = (v) => `${(game?.fmt ?? ((n, d) => n.toFixed(d)))(v, 2)} €`;

  function startCareer(reset = false) {
    if (reset || !save.career || save.career.index >= ORDERS.length) save.career = { index: 0, money: 0, stars: [] };
    storeSave(save);
    game.startCareer(chemMode, save.career.index, save.career.money);
  }

  function startFree() {
    game.startFree(chemMode);
    showDialog(`
      <h3>${t('freeTitle')}</h3>
      <p>${t('freeIntro')}</p>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="play">${t('start')}</button></div>`);
  }

  // ---------------------------------------------------------------- finestre
  function showDialog(html, cls = '') {
    setState('dialog');
    const d = $('.gm-dialog');
    d.innerHTML = `<div class="gm-dialog__card ${cls}">${html}</div>`;
    d.querySelector('button.gm-primary')?.focus({ preventScroll: true });
  }

  function showOrderIntro({ index, def }) {
    const brief = t(`${def.id}Brief${chemMode === 'simple' ? 'Simple' : ''}`);
    const steps = t(`${def.id}Board`);
    showDialog(`
      <p class="gm-eyebrow">${t('orderN', { n: index + 1, title: '' }).replace(/[:·—-]\s*$/, '')} / ${ORDERS.length}</p>
      <h3>${t(`${def.id}Title`)}</h3>
      <p class="gm-teacher">${icons.book(16)} ${brief}</p>
      <ul class="gm-steps" aria-label="${t('boardLabel')}">${(Array.isArray(steps) ? steps : [steps]).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="gm-small">${t('orderPay', { pay: fmtMoney(def.pay), min: Math.round(def.par / 60) })}</p>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="play">${t('start')}</button></div>`);
  }

  function showResult(r) {
    save.career ??= { index: 0, money: 0, stars: [] };
    save.career.stars[r.index] = Math.max(save.career.stars[r.index] ?? 0, r.stars);
    save.career.index = Math.max(save.career.index, r.index + 1);
    save.career.money = r.money;
    storeSave(save);
    const mark = (ok) => (ok === true ? 'ok' : ok === 'warn' ? 'warn' : 'bad');
    const lines = r.lines.map((l) => `<li class="gm-line gm-line--${mark(l.ok)}">${esc(t(l.key, formatParams(l.p)))}</li>`).join('');
    showDialog(`
      <p class="gm-eyebrow">${t('resultEyebrow', { n: r.index + 1 })}</p>
      <h3>${t(`${r.def.id}Title`)}</h3>
      <div class="gm-stars" aria-label="${t('starsLabel', { n: r.stars })}">${stars(r.stars)}</div>
      <ul class="gm-lines">${lines}</ul>
      <dl class="gm-bill">
        ${rows([
          [t('billQuality'), `${Math.round(r.quality * 100)} %`],
          [t('billSafety'), `${Math.round(r.safety * 100)} %${r.mess ? ` · ${t('billMess', { n: r.mess })}` : ''}${r.incidents ? ` · ${t('billIncidents', { n: r.incidents })}` : ''}`],
          [t('billTime'), `${fmtTime(r.elapsed)} / ${fmtTime(r.def.par)}`],
          [t('billPay'), `+ ${fmtMoney(r.earned)}`],
          [t('billCosts'), `− ${fmtMoney(r.reagents)}${r.fines ? ` (${t('billFines')}: ${fmtMoney(r.fines)})` : ''}`],
          [t('billTotal'), `<b>${fmtMoney(r.money)}</b>`],
        ])}
      </dl>
      ${r.def.answers ? '' : `<p class="gm-small">${t('resultCleanup')}</p>`}
      <div class="gm-actions">
        <button type="button" class="btn-ghost" data-act="menu">${t('toMenu')}</button>
        ${r.last ? `<button type="button" class="gm-primary" data-act="career-end">${t('finish')}</button>` : `<button type="button" class="gm-primary" data-act="next">${t('nextOrder')}</button>`}
      </div>`, 'gm-result');
  }

  function showCareerEnd({ money }) {
    const total = (save.career?.stars ?? []).reduce((a, b) => a + (b || 0), 0);
    showDialog(`
      <h3>${t('careerEndTitle')}</h3>
      <div class="gm-stars">${stars(total / ORDERS.length)}</div>
      <p>${t('careerEndText', { stars: total, max: ORDERS.length * 5, money: fmtMoney(money) })}</p>
      <p class="gm-small">${t('careerEndNext')}</p>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="keep-playing">${t('keepPlaying')}</button><button type="button" class="gm-primary" data-act="menu">${t('toMenu')}</button></div>`);
  }

  function showAnswers({ count, metals }) {
    const names = Object.fromEntries(metals.map((m) => [m, game.chem.sub(game.chem.id(m)).name]));
    showDialog(`
      <h3>${t('answersTitle')}</h3>
      <p>${t('answersText')}</p>
      <form class="gm-answers">
        ${Array.from({ length: count }, (_, i) => `<label>${t('sampleName', { s: 'ABC'[i] })}
          <select name="s${i}"><option value="">—</option>${metals.map((m) => `<option value="${m}">${esc(names[m])} (${m})</option>`).join('')}</select></label>`).join('')}
      </form>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="play">${t('notYet')}</button><button type="button" class="gm-primary" data-act="submit-answers">${t('deliver')}</button></div>`);
  }

  function showCatalog() {
    const lib = game.chem.subs.library.entries
      .map((e) => {
        const sid = game.chem.subs.libraryId.get(e.id);
        const s = game.chem.sub(sid);
        if (!s || s.flags & S.AQUEOUS) return null;
        const st = s.kind === 'element' ? (s.mp > 295 ? 'solid' : s.bp > 295 ? 'liquid' : 'gas') : s.state25;
        return { key: e.id, sid, name: s.name, formula: s.formula || s.symbol, st, soluble: game.chem.solubility(sid, 295) > 0.5 };
      })
      .filter((x) => x && x.st !== 'gas');
    const metals = game.chem.subs.elements.filter((el) => el.Z < 84 && game.chem.sub(el.Z).mp > 295 && !['P', 'As', 'Se'].includes(el.symbol)).map((el) => ({ key: el.symbol, sid: el.Z, name: game.chem.sub(el.Z).name, formula: el.symbol, st: 'solid', soluble: false }));
    const all = [...lib, ...metals];
    const glass = ['beaker100', 'beaker250', 'flask250', 'cylinder100', 'crucible', 'dish', 'spatula', 'loop'];
    showDialog(`
      <h3>${t('catalogTitle')}</h3>
      <div class="gm-cat-glass">${glass.map((k) => `<button type="button" class="btn-ghost" data-glass="${k}">${t(`item_${k}`)}</button>`).join('')}</div>
      <div class="gm-cat-ready">${readyHtml()}</div>
      <input type="search" class="gm-search" placeholder="${t('catalogSearch')}" aria-label="${t('catalogSearch')}" spellcheck="false"/>
      <div class="gm-cat-list"></div>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="play">${t('done')}</button></div>`, 'gm-catalog');
    const list = $('.gm-cat-list');
    const render = (q) => {
      const nq = normalize(q || '');
      const hits = all.filter((x) => !nq || normalize(`${x.name} ${x.formula}`).includes(nq)).slice(0, 60);
      list.innerHTML = hits
        .map((x) => `<div class="gm-cat-row"><span><b>${esc(x.name)}</b> <code>${esc(x.formula)}</code></span><span class="gm-cat-btns">
          ${x.st === 'solid' ? `<button type="button" data-spawn="${esc(x.key)}" data-form="solid">${t('formSolid')}</button>` : ''}
          ${x.st === 'liquid' ? `<button type="button" data-spawn="${esc(x.key)}" data-form="liquid">${t('formLiquid')}</button>` : ''}
          ${x.soluble ? `<button type="button" data-spawn="${esc(x.key)}" data-form="sol01">0,1 M</button><button type="button" data-spawn="${esc(x.key)}" data-form="sol1">1 M</button>` : ''}
        </span></div>`)
        .join('');
    };
    render('');
    $('.gm-search').addEventListener('input', (e) => render(e.target.value));
  }

  /**
   * Scaffale e armadio della scuola, divisi per famiglia (con il colore del tappo): un clic mette il reagente sul
   * bancone B.
   */
  function readyHtml() {
    const all = { ...SHELF, ...CABINET };
    const fams = new Map();
    for (const [k, r] of Object.entries(all)) {
      const f = reagentLook(game.chem, r).family;
      // sali e altri inorganici hanno lo stesso tappo: una sola riga
      const row = FAMILY_ORDER.find((g) => FAMILIES[g] === FAMILIES[f]);
      if (!fams.has(row)) fams.set(row, []);
      fams.get(row).push(k);
    }
    return FAMILY_ORDER.filter((f) => fams.has(f)).map((f) => `<div class="gm-cat-fam"><span class="gm-cat-cap" style="background:${FAMILIES[f]}" title="${esc(t(`legend_${f}`))}"></span>
      ${fams.get(f).sort((a, b) => readyName(a).localeCompare(readyName(b))).map((k) => `<button type="button" class="btn-ghost" data-ready="${k}">${esc(readyName(k))}</button>`).join('')}</div>`).join('');
  }

  function readyName(k) {
    const r = SHELF[k] ?? CABINET[k];
    const c = game.chem;
    if (r.water) return t('distilledWater');
    if (r.indicator) return c.name(r.indicator);
    const key = r.solute ?? r.solid ?? r.liquid;
    return `${c.formula(c.id(key)) || c.name(c.id(key))}${r.molar ? ` ${String(r.molar).replace('.', ',')} M` : ''}`;
  }

  function showPause() {
    if (state === 'menu') return;
    setState('pause');
    const d = $('.gm-dialog');
    d.innerHTML = `<div class="gm-dialog__card gm-pause">
      <h3>${t('paused')}</h3>
      <div class="gm-stack">
        <button type="button" class="gm-primary" data-act="play">${t('resume')}</button>
        <button type="button" class="btn-ghost" data-act="help">${icons.keyboard(16)}<span>${t('controls')}</span></button>
        ${game.free ? '' : `<button type="button" class="btn-ghost" data-act="restart-order">${t('restartOrder')}</button>`}
        <button type="button" class="btn-ghost" data-act="menu">${t('toMenu')}</button>
        <button type="button" class="btn-ghost" data-act="close">${t('backToTable')}</button>
      </div>
      ${fovHtml()}</div>`;
    d.querySelector('.gm-primary').focus({ preventScroll: true });
  }

  /**
   * Quaderno di laboratorio: i 14 gruppi del catalogo con la percentuale scoperta e, per il gruppo scelto, le pagine:
   * quelle scoperte con equazione, ΔH°, cosa si è visto e il collegamento al laboratorio molecolare; le altre coperte
   * (con il sottogruppo come indizio) o, se il simulatore non le sa fare, con il motivo.
   */
  function showNotebook(back = 'play') {
    const tabs = `<div class="gm-nb__tabs" role="tablist">${['tutorial', 'reactions'].map((k) => `<button type="button" role="tab" aria-selected="${nbTab === k}" class="gm-nb__tab ${nbTab === k ? 'is-on' : ''}" data-nb-tab="${k}">${t(k === 'tutorial' ? 'nbTabTutorial' : 'nbTabReactions')}</button>`).join('')}</div>`;
    const body = nbTab === 'tutorial' ? tutorialHtml() : reactionsHtml();
    showDialog(`
      <h3>${t('notebookTitle')}</h3>
      ${tabs}${body}
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="${back}">${t('done')}</button></div>`, 'gm-notebook');
    $('.gm-notebook').dataset.help = 'ui.gameNotebook';
    const list = $('.gm-nb__pages');
    if (list) list.scrollTop = 0;
  }

  /** Tutorial: l'elenco delle pagine e la pagina aperta, con l'illustrazione e i passi numerati. */
  function tutorialHtml() {
    const id = TUTORIAL[tutPage];
    const nav = TUTORIAL.map((k, i) => `<button type="button" class="gm-nb__group ${i === tutPage ? 'is-on' : ''}" data-tut-page="${i}"><span>${i + 1}. ${esc(t(`tut_${k}_title`))}</span></button>`).join('');
    const steps = t(`tut_${id}_steps`);
    return `<div class="gm-nb">
        <nav class="gm-nb__groups" aria-label="${t('nbTabTutorial')}">${nav}</nav>
        <section class="gm-nb__pages gm-tut"><h4>${esc(t(`tut_${id}_title`))}</h4>
          <figure class="gm-tut__fig">${illustration(id, (w) => t(`tutw_${w}`))}</figure>
          <ol class="gm-tut__steps">${(Array.isArray(steps) ? steps : [steps]).map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
          <div class="gm-tut__nav"><button type="button" class="btn-ghost" data-tut-step="-1" ${tutPage === 0 ? 'disabled' : ''}>${t('tutPrev')}</button>
            <small>${t('tutPage', { n: tutPage + 1, total: TUTORIAL.length })}</small>
            <button type="button" class="btn-ghost" data-tut-step="1" ${tutPage === TUTORIAL.length - 1 ? 'disabled' : ''}>${t('tutNext')}</button></div>
        </section>
      </div>`;
  }

  /** Reazioni scoperte: i 14 gruppi con la percentuale e le pagine del gruppo scelto. */
  function reactionsHtml() {
    const nb = notebookPages(game.chem, notebook);
    nbGroup ??= (nb.groups.find((g) => g.found) ?? nb.groups[0]).key;
    const g = nb.groups.find((x) => x.key === nbGroup) ?? nb.groups[0];
    const groups = nb.groups.map((x) => `<button type="button" class="gm-nb__group ${x.key === g.key ? 'is-on' : ''}" data-nb-group="${x.key}">
        <span>${esc(x.label)}</span><small>${x.found} / ${x.doable}</small><i style="--p:${percent(x.found, x.doable)}%"></i></button>`).join('');
    // scoperte prima, con tutti i dettagli; le altre raggruppate per sottogruppo (quante restano e, per quelle che il
    // simulatore non sa fare, il motivo)
    const found = g.pages.filter((p) => p.found);
    const hidden = new Map();
    for (const p of g.pages) {
      if (p.found) continue;
      const k = p.r.sub ?? '';
      const e = hidden.get(k) ?? { open: 0, off: new Map() };
      if (p.doable) e.open++;
      else {
        const why = p.rx?.why ?? 'other';
        e.off.set(why, (e.off.get(why) ?? 0) + 1);
      }
      hidden.set(k, e);
    }
    const hiddenRows = [...hidden].map(([sub, e]) => `<li class="gm-nb__page ${e.open ? '' : 'is-off'}"><p class="gm-nb__eq">? + ? → ?${e.open ? ` <small>${t('nbHidden', { n: e.open })}</small>` : ''}</p>
      <p class="gm-nb__meta">${esc(sub)}${[...e.off].map(([why, n]) => ` · ${esc(t('nbOffCount', { n, why: t(`nbWhy_${why}`) }))}`).join('')}</p></li>`);
    const page = (p) => {
      const e = notebook.rx[p.id];
      const sig = game.signals(p.rx, e.aq);
      const when = new Date(e.first).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
      return `<li class="gm-nb__page is-found">
        ${p.r.name ? `<b>${esc(p.r.name)}</b>` : ''}<p class="gm-nb__eq">${esc(equationOf(p.rx, e.aq))}</p>
        <p class="gm-nb__meta">${sig.dH !== null ? `ΔH° ${kj(sig.dH)} · ` : ''}${esc(t(e.mode === 'career' ? 'nbCareer' : 'nbFree', { date: when }))}${p.r.condText ? ` · ${esc(p.r.condText)}` : ''}</p>
        ${tagsHtml(e.tags)}
        ${p.r.desc ? `<p class="gm-nb__desc">${esc(p.r.desc)}</p>` : ''}
        ${onOpenLab ? `<button type="button" class="gm-link" data-nb-lab="${esc(p.id)}">${t('nbOpenLab')}</button>` : ''}
      </li>`;
    };
    return `<p class="gm-nb__total">${t('nbTotal', { found: nb.found, doable: nb.doable, total: nb.total, p: percent(nb.found, nb.doable) })}</p>
      <div class="gm-nb">
        <nav class="gm-nb__groups" aria-label="${t('nbGroups')}">${groups}</nav>
        <section class="gm-nb__pages"><h4>${esc(g.label)} <small>${t('nbGroupCount', { found: g.found, doable: g.doable, total: g.total })}</small></h4>
          ${g.found ? '' : `<p class="gm-nb__empty">${t('nbEmpty')}</p>`}
          <ol>${found.map(page).join('')}${hiddenRows.join('')}</ol></section>
      </div>`;
  }
  const equationOf = (rx, aq) => game.equationText(rx, aq);

  function showHelp() {
    const prev = state;
    showDialog(`
      <h3>${t('controls')}</h3>
      <p class="gm-help__note">${t('helpNote')}</p>
      <div class="gm-help">
        <div><h4>${t('helpWalk')}</h4><dl>${rows(t('helpWalkRows'))}</dl></div>
        <div><h4>${t('helpBench')}</h4><dl>${rows(t('helpBenchRows'))}</dl><h4>${t('helpTools')}</h4><dl>${rows(t('helpToolsRows'))}</dl></div>
      </div>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="${prev === 'menu' ? 'menu' : 'play'}">${t('ok')}</button></div>`, 'gm-helpcard');
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function formatParams(p = {}) {
    const out = {};
    for (const [k, v] of Object.entries(p)) {
      if (typeof v !== 'number') out[k] = v;
      else if (k === 'value' || k === 'target') out[k] = game.fmt(v, Math.abs(v) < 1 ? 3 : Math.abs(v) < 10 ? 2 : 1);
      else out[k] = game.fmt(v, 0);
    }
    return out;
  }

  // ---------------------------------------------------------------- clic nelle finestre e nei menu
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'close') close();
    else if (act === 'career') startCareer();
    else if (act === 'career-reset') {
      save.career = null;
      storeSave(save);
      showMenu();
    } else if (act === 'free') startFree();
    else if (act === 'help') showHelp();
    else if (act === 'menu') showMenu();
    else if (act === 'play' || act === 'keep-playing') play();
    else if (act === 'pause') showPause();
    else if (act === 'next') game.nextOrder();
    else if (act === 'career-end') game.nextOrder();
    else if (act === 'restart-order') {
      game.clearRoom();
      game.startOrder(game.order?.index ?? 0);
    } else if (act === 'submit-answers') {
      const form = $('.gm-answers');
      const answers = {};
      form.querySelectorAll('select').forEach((s, i) => (answers[i] = s.value || null));
      game.submitAnswers(answers);
    } else if (b.dataset.nbGroup) {
      nbGroup = b.dataset.nbGroup;
      showNotebook($('.gm-notebook .gm-primary')?.dataset.act);
    } else if (b.dataset.nbTab) {
      nbTab = b.dataset.nbTab;
      showNotebook($('.gm-notebook .gm-primary')?.dataset.act);
    } else if (b.dataset.tutPage !== undefined || b.dataset.tutStep !== undefined) {
      tutPage = Math.max(0, Math.min(TUTORIAL.length - 1, b.dataset.tutPage !== undefined ? Number(b.dataset.tutPage) : tutPage + Number(b.dataset.tutStep)));
      showNotebook($('.gm-notebook .gm-primary')?.dataset.act);
    } else if (b.dataset.nbLab && onOpenLab) {
      labAbove = true;
      onOpenLab(b.dataset.nbLab, () => {
        labAbove = false;
      });
    } else if (b.dataset.glass) {
      const k = b.dataset.glass;
      if (['spatula', 'loop'].includes(k)) game.spawnTool(k, 'benchB');
      else game.spawnGlass(k);
      toast(t('spawned', { name: t(`item_${k}`) }), 'ok');
    } else if (b.dataset.ready) {
      game.spawnReagent(b.dataset.ready, 'benchB');
      toast(t('spawned', { name: readyName(b.dataset.ready) }), 'ok');
    } else if (b.dataset.spawn) {
      const key = b.dataset.spawn;
      const form = b.dataset.form;
      // contenitore, tappo ed etichetta li sceglie stock.js
      const r = form === 'solid' ? { solid: key } : form === 'liquid' ? { liquid: key } : { solute: key, molar: form === 'sol1' ? 1 : 0.1 };
      const item = game.spawnReagent(null, 'benchB', r);
      toast(t('spawned', { name: item.name }), 'ok');
    }
  });
  root.addEventListener('input', (ev) => {
    if (ev.target.name !== 'gm-fov') return;
    fov = Number(ev.target.value);
    game?.setFov(fov);
    ev.target.nextElementSibling.textContent = `${fov}°`;
  });
  root.addEventListener('change', (ev) => {
    if (ev.target.name === 'gm-fov') {
      save.fov = fov;
      storeSave(save);
    }
    if (ev.target.name === 'gm-chem') {
      chemMode = ev.target.value;
      save.chemMode = chemMode;
      storeSave(save);
    }
  });

  // ---------------------------------------------------------------- input
  const typing = (e) => e.target instanceof HTMLElement && e.target.matches('input, select, textarea');
  function onKey(ev, down) {
    if (root.hidden || !game || labAbove) return;
    if (typing(ev)) return;
    if (down && ev.key === 'Escape') {
      ev.preventDefault();
      if (state === 'play') showPause();
      else if (state === 'pause' || state === 'dialog') {
        if ($('.gm-dialog .gm-primary')?.dataset.act === 'play' || state === 'pause') play();
      } else if (state === 'menu') close();
      return;
    }
    if (state !== 'play') return;
    const code = ev.code;
    const id = keyId(code);
    if (id) {
      if (down) pressed.add(id);
      else pressed.delete(id);
    }
    // movimento come in Cooking Simulator: Spazio corre, Ctrl accovaccia, Maiusc tenuto è la manipolazione precisa
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space', 'ControlLeft', 'ControlRight'].includes(code)) {
      // nella vista del bancone A e D cambiano postazione; con un oggetto in mano lo ruotano (game.js)
      if (game.player.mode === 'bench' && !game.held && down && (code === 'KeyA' || code === 'ArrowLeft')) game.station(-1);
      else if (game.player.mode === 'bench' && !game.held && down && (code === 'KeyD' || code === 'ArrowRight')) game.station(1);
      if (down) game.player.keys.add(code);
      else game.player.keys.delete(code);
      if ((code === 'ShiftLeft' || code === 'ShiftRight') && !ev.repeat) game.setPrecise(down);
      ev.preventDefault();
      return;
    }
    // E: pulire e usare gli strumenti (tenuto, l'estintore spruzza)
    if (code === 'KeyE') {
      if (!ev.repeat) game.use(down, ev.shiftKey);
      ev.preventDefault();
      return;
    }
    if (!down) return;
    if (code === 'Tab') {
      ev.preventDefault();
      game.toggleView();
      if (game.player.mode === 'walk') lock();
      else unlock();
    } else if (code === 'KeyI') showInfo = !showInfo;
    else if (code === 'KeyL') {
      showLegend = !showLegend;
      save.legend = showLegend;
      storeSave(save);
      lastLegendHtml = null;
      if (!showLegend) toast(t('legendHidden'));
    }
    else if (code === 'KeyH') showHelp();
    else if (code === 'KeyN') showNotebook();
    else if (code === 'KeyF') {
      // fps per controllare le prestazioni
      fpsShow = !fpsShow;
    }
  }
  let fpsShow = false;
  const keydown = (e) => onKey(e, true);
  const keyup = (e) => onKey(e, false);
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', () => {
    game?.player.keys.clear();
    pressed.clear();
    releaseHands();
  });
  /** Tasti tenuti che la finestra non vedrà più rilasciare: niente versamento, precisione, acqua, carica né rotazione. */
  function releaseHands() {
    lmb = null;
    rmb = null;
    if (!game) return;
    game.setPour(false);
    game.setPrecise(false);
    game.setWater(false);
    game.endRotate();
    game.charge = null;
  }
  /** Id della legenda per un tasto (controls.js, KEY_IDS). */
  function keyId(code) {
    if (code === 'KeyE') return 'e';
    if (code === 'Tab') return 'tab';
    if (code === 'KeyH') return 'h';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'shift';
    if ((game?.player.mode === 'bench' || game?.held) && ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(code)) return 'ad';
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) return 'wasd';
    return null;
  }

  // mouse come in Cooking Simulator: sinistro prende, usa e posa (trascinando con un recipiente versa; nella precisione
  // alza), destro ruota trascinando (un clic annulla la rotazione o rimette a posto), tasto centrale lancia
  stage.addEventListener('mousedown', (ev) => {
    if (state !== 'play') return;
    if (game.player.mode === 'walk' && !locked()) {
      lock();
      return;
    }
    if (ev.button === 0) {
      pressed.add('lmb');
      lmb = { moved: 0, done: false, pour: false };
      if (game.filling) {
        game.setWater(true);
        lmb.done = true;
      } else if (!game.held || (!game.held.def.container && !game.precise)) {
        // prendere, usare un elemento fisso o posare uno strumento: subito, al clic
        game.primary();
        lmb.done = true;
      }
    } else if (ev.button === 1) {
      ev.preventDefault();
      pressed.add('mmb');
      game.middleDown();
    } else if (ev.button === 2) {
      pressed.add('rmb');
      rmb = { moved: 0, dx: 0, dy: 0 };
      game.startRotate();
    }
  });
  window.addEventListener('mouseup', (ev) => {
    if (ev.button === 0 && lmb) {
      pressed.delete('lmb');
      const l = lmb;
      lmb = null;
      if (state !== 'play' || !game) return;
      if (game.filling) game.setWater(false);
      else if (l.pour) game.setPour(false);
      else if (!l.done && isClick(l.moved)) game.primary(); // un clic con il recipiente: posa (o riempi al lavandino)
    } else if (ev.button === 1) {
      pressed.delete('mmb');
      if (state === 'play') game?.throwHeld();
    } else if (ev.button === 2 && rmb) {
      pressed.delete('rmb');
      const r = rmb;
      rmb = null;
      if (!game) return;
      game.endRotate();
      if (state === 'play' && isClick(r.moved)) game.secondary();
    }
  });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  stage.addEventListener('mousemove', (ev) => {
    if (state !== 'play' || !game) return;
    // Chromium a volte manda un salto enorme subito dopo il blocco del puntatore: si ignora
    const jump = Math.abs(ev.movementX) > 250 || Math.abs(ev.movementY) > 250;
    const dx = jump ? 0 : ev.movementX;
    const dy = jump ? 0 : ev.movementY;
    const walk = game.player.mode === 'walk';
    // destro tenuto con un oggetto in mano: il mouse lo ruota (lo sguardo e, nella vista del bancone, il punto di presa
    // restano fermi). La rotazione parte oltre i 4 pixel, così un clic non gira l'oggetto prima di annullare
    if (rmb && game.held) {
      rmb.moved += Math.abs(dx) + Math.abs(dy);
      rmb.dx += dx;
      rmb.dy += dy;
      if (!isClick(rmb.moved)) {
        game.rotateBy(rmb.dx, rmb.dy);
        rmb.dx = 0;
        rmb.dy = 0;
      }
      return;
    }
    const r = stage.getBoundingClientRect();
    game.setMouse(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    if (jump) return;
    if (lmb && game.held && !game.filling) {
      lmb.moved += Math.abs(dx) + Math.abs(dy);
      // nella manipolazione precisa sinistro + mouse alza e abbassa l'oggetto
      if (game.precise) {
        game.preciseLift(dy);
        return;
      }
      // con un recipiente, sinistro tenuto + mouse: in su inclina (versa), in giù raddrizza; di lato si continua a
      // girare lo sguardo, a metà velocità, per correggere la mira
      if (game.held.def.container && !lmb.done && !isClick(lmb.moved)) {
        if (!lmb.pour) {
          lmb.pour = true;
          game.setPour(true);
        }
        game.tiltBy(-dy * (walk ? 1 : 1.4));
        if (walk && locked()) game.player.look(dx * 0.5, 0);
        return;
      }
    }
    if (game.precise) game.preciseMove(dx, dy);
    else if (walk && locked()) game.player.look(dx, dy);
  });
  stage.addEventListener('wheel', (ev) => {
    if (state !== 'play') return;
    ev.preventDefault();
    game.wheel(ev.deltaY);
  }, { passive: false });

  // ---------------------------------------------------------------- HUD
  const fmtSec = (s) => fmtTime(Math.max(0, s));

  /** Contenuto di una finestrella: in mano (mL e «Versando» in grande) o guardato (nome nella fascia e contenuto). */
  function popHtml(info, kind) {
    const meta = [info.temp, info.ph].filter(Boolean).map(esc).join(' · ');
    const rowsList = info.rows.slice(0, 3);
    const more = info.rows.length - rowsList.length;
    const rowsHtml = rowsList.map((r) => `<li><span>${esc(r.label)}${r.formula ? ` <code>${esc(r.formula)}</code>` : ''}</span><b>${esc(r.value)}</b></li>`).join('') + (more > 0 ? `<li class="gm-pop__more"><span>+${more}</span></li>` : '');
    const strip = info.swatch ? `<div class="gm-strip"><span style="background:${info.swatch}"></span><div class="gm-scale">${info.scale.map((c, i) => `<i style="background:${c}" title="pH ${i}">${i}</i>`).join('')}</div></div>` : '';
    const notes = info.notes.slice(0, 2).map((n) => `<p class="gm-pop__note">${esc(n)}</p>`).join('');
    // reazioni appena avvenute nel contenitore e, se non succede niente, perché
    const rx = (info.reactions ?? []).map((r) => `<p class="gm-pop__rx ${r.live ? 'is-live' : ''}"><span class="gm-pop__eq">${esc(r.eq)}</span>${r.dH !== null ? `<small>ΔH° ${kj(r.dH)}</small>` : ''}${tagsHtml(r.tags)}</p>`).join('');
    const why = info.why ? `<div class="gm-pop__why"><b>${t('whyTitle')}</b> ${esc(info.why.text)}${info.why.eq ? `<span class="gm-pop__eq">${esc(info.why.eq)}</span>` : ''}</div>` : '';
    if (kind === 'held') {
      const status = info.status ? `<small class="gm-pop__status ${info.spilling ? 'is-bad' : ''}">${esc(info.status)}${chemMode === 'simple' && info.pouring > 0.2 ? ` · ${t('pourRate', { ml: game.fmt(info.pouring, info.pouring < 10 ? 1 : 0) })}` : ''}</small>` : '';
      const big = info.volume ? `<div class="gm-pop__big">${DROP}<b>${esc(info.volume)}</b></div>` : info.readout ? `<div class="gm-pop__big gm-pop__big--read"><b>${esc(info.readout)}</b></div>` : '';
      return `${big}${status}<p class="gm-pop__name"><span class="gm-swatch" style="background:${info.color ?? 'transparent'}"></span>${esc(info.name)}</p>${rowsHtml ? `<ul>${rowsHtml}</ul>` : ''}${meta ? `<p class="gm-pop__meta">${meta}</p>` : ''}${strip}${rx}${info.volume ? '' : notes}`;
    }
    const vol = info.volume ? `<p class="gm-pop__vol">${DROP}<b>${esc(info.volume)}</b>${meta ? ` <span>· ${meta}</span>` : ''}</p>` : info.readout ? `<p class="gm-pop__vol"><b>${esc(info.readout)}</b></p>` : meta ? `<p class="gm-pop__meta">${meta}</p>` : '';
    return `<header class="${info.hot ? 'is-hot' : ''} ${info.on ? 'is-on' : ''}"><span class="gm-swatch" style="background:${info.color ?? 'transparent'}"></span><h4>${esc(info.name)}</h4></header>
      <div class="gm-pop__body">${vol}${rowsHtml ? `<ul>${rowsHtml}</ul>` : ''}${strip}${rx}${notes}${why}</div>`;
  }

  function renderPop(kind, info) {
    const el = $(`.gm-pop--${kind}`);
    if (!info || !showInfo) {
      el.hidden = true;
      pops[kind] = null;
      return;
    }
    const html = popHtml(info, kind);
    if (el.hidden || el.lastHtml !== html) {
      el.innerHTML = html;
      el.lastHtml = html;
      el.hidden = false;
    }
    pops[kind] = { el, w: el.offsetWidth, h: el.offsetHeight };
  }

  /** Tasti di una riga della legenda: mouse disegnato per i tasti del mouse, tasti della tastiera per gli altri. */
  function keyHtml(k) {
    const label = t(`key_${k}`);
    if (k === 'lmb' || k === 'rmb') return `<span class="gm-key" title="${esc(label)}">${mouseIcon(k[0])}</span>`;
    if (k === 'wheel' || k === 'mmb') return `<span class="gm-key" title="${esc(label)}">${mouseIcon('w')}</span>`;
    if (k === 'mouse' || k === 'mousex') return `<span class="gm-key" title="${esc(label)}">${mouseIcon('')}<b class="gm-arrows">${ARROWS[k]}</b></span>`;
    return label.split(/\s+\/\s+|\s+/).map((c) => `<kbd>${esc(c)}</kbd>`).join('');
  }

  let lastLegendHtml = null;
  let legendBox = null;
  /** Legenda in basso a destra, piccola come in Cooking Simulator: icona del tasto e azione, senza riquadro. */
  function renderLegend(rowsList) {
    const html = showLegend
      ? rowsList.map((r) => {
        // «tasto + mouse»: un solo mouse disegnato, con le frecce del movimento accanto
        const keys = r.keys.map((k) => (ARROWS[k] && r.keys.length > 1 ? `<b class="gm-arrows">${ARROWS[k]}</b>` : keyHtml(k))).join('');
        return `<li class="${r.off ? 'is-off' : ''} ${r.keys.some((k) => pressed.has(k)) ? 'is-down' : ''}"><span class="gm-keys">${keys}</span><span>${esc(t(r.key, r.params ?? undefined))}</span></li>`;
      }).join('')
      : '';
    if (html !== lastLegendHtml) {
      lastLegendHtml = html;
      const el = $('.gm-legend');
      el.innerHTML = html;
      el.hidden = !html;
    }
    const r = $('.gm-legend').getBoundingClientRect();
    legendBox = r.width ? r : null;
  }

  /**
   * Posiziona le finestrelle a ogni fotogramma accanto all'oggetto (quella di ciò che si guarda a sinistra, quella
   * dell'oggetto in mano a destra), dentro lo schermo e senza coprire la legenda né sovrapporsi tra loro.
   */
  const _p = new THREE.Vector3();
  function placePops() {
    if (!game || (!pops.looked && !pops.held)) return;
    const a = game.popupAnchors();
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const box = {};
    for (const kind of ['looked', 'held']) {
      const pop = pops[kind];
      if (!pop) continue;
      const anchor = a[kind];
      if (anchor) _p.copy(anchor).project(a.camera);
      const behind = !anchor || _p.z > 1;
      let x = behind ? W - pop.w - 16 : ((_p.x + 1) / 2) * W;
      let y = behind ? H * 0.6 : ((1 - _p.y) / 2) * H;
      if (!behind) x = kind === 'looked' ? x - pop.w - 26 : x + 26;
      y -= pop.h / 2;
      x = Math.max(12, Math.min(W - pop.w - 12, x));
      y = Math.max(64, Math.min(H - pop.h - 12, y));
      if (legendBox && x + pop.w > legendBox.left - 10 && y + pop.h > legendBox.top - 10) y = Math.max(64, legendBox.top - 10 - pop.h);
      box[kind] = { x, y, w: pop.w, h: pop.h };
    }
    const l = box.looked;
    const h = box.held;
    if (l && h && h.x < l.x + l.w + 8 && h.x + h.w + 8 > l.x && h.y < l.y + l.h + 8 && h.y + h.h + 8 > l.y) {
      // si toccano: quella dell'oggetto in mano va sotto (o sopra, se sotto non c'è spazio)
      h.y = l.y + l.h + 8 + h.h < H - 12 ? l.y + l.h + 8 : Math.max(12, l.y - h.h - 8);
    }
    for (const kind of ['looked', 'held']) if (box[kind]) pops[kind].el.style.transform = `translate3d(${Math.round(box[kind].x)}px, ${Math.round(box[kind].y)}px, 0)`;
  }

  let lastOrderHtml = '';
  let fps = 0;
  function renderHud() {
    const h = game.hud();
    renderLegend(h.legend);
    $('.gm-cross').hidden = h.mode !== 'walk';
    $('.gm-money').innerHTML = h.free ? `<span>${t('freeShort')}</span>` : `<span>${fmtMoney(h.money)}</span>`;
    $('.gm-view').innerHTML = `${h.mode === 'walk' ? t('viewWalk') : t('viewBench', { station: t(`station_${h.station}`) })}${fpsShow ? ` · ${fps} fps` : ''}`;
    let orderHtml = '';
    if (h.order) {
      const late = h.order.elapsed > h.order.par;
      orderHtml = `<header><span>${t('orderShort', { n: h.order.n })}</span><b class="${late ? 'is-late' : ''}">${fmtSec(h.order.elapsed)}</b></header>
        <h4>${esc(h.order.title)}</h4>
        <ol>${h.order.steps.map((s) => `<li class="${s.done ? 'is-done' : ''}">${esc(s.text)}</li>`).join('')}</ol>`;
    } else if (h.free) orderHtml = `<h4>${t('freeTitle')}</h4><p>${t('freeHud')}</p>`;
    if (orderHtml !== lastOrderHtml) {
      $('.gm-order').innerHTML = orderHtml;
      lastOrderHtml = orderHtml;
    }
    $('.gm-order').hidden = !orderHtml;
    renderPop('looked', h.looked);
    renderPop('held', h.held);
    const alarm = $('.gm-alarm');
    const alarmText = h.splash ? t('splashHud', { s: h.splash }) : h.alarm ? t(`alarm_${h.alarm}`) : '';
    alarm.hidden = !alarmText;
    alarm.textContent = alarmText;
    const tilt = $('.gm-tilt');
    tilt.hidden = !(h.tilt > 0.02);
    tilt.firstElementChild.style.transform = `rotate(${(h.tilt * 180) / Math.PI}deg)`;
  }

  /** Anello attorno al mirino che si riempie mentre si carica il lancio (Q o tasto centrale tenuto). */
  let chargeShown = -1;
  function drawCharge() {
    const c = state === 'play' && game.held && game.charge !== null ? Math.min(1, game.time - game.charge) : 0;
    const pct = Math.round(c * 100);
    if (pct === chargeShown) return;
    chargeShown = pct;
    const el = $('.gm-charge');
    el.hidden = !pct;
    el.querySelector('.gm-charge__fg').style.strokeDasharray = `${pct} 100`;
    el.classList.toggle('is-full', pct >= 100);
  }

  // ---------------------------------------------------------------- ciclo
  let frames = 0;
  let fpsT = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    if (!game) return;
    if (state === 'play' || state === 'dialog') game.update(state === 'play' ? dt : 0, { blocked: state !== 'play' });
    game.render();
    if (state !== 'menu') {
      placePops();
      drawCharge();
    }
    hudAcc += dt;
    frames++;
    fpsT += dt;
    if (fpsT > 1) {
      fps = Math.round(frames / fpsT);
      frames = 0;
      fpsT = 0;
    }
    if (hudAcc > 1 / HUD_HZ && state !== 'menu') {
      hudAcc = 0;
      renderHud();
    }
  }

  // ---------------------------------------------------------------- apertura / chiusura
  let lastFocus = null;
  async function open() {
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.add('is-entering');
    setTimeout(() => root.classList.remove('is-entering'), 600);
    if (!game) {
      try {
        await boot();
      } catch (err) {
        console.error(err);
        $('.gm-loading').innerHTML = `<p>${t('loadError')}</p><button type="button" class="btn-ghost" data-act="close">${t('back')}</button>`;
        return;
      }
      showMenu();
    } else if (state === 'play') showPause();
    layout();
    lastT = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function close() {
    if (root.hidden) return;
    unlock();
    if (state === 'play') setState('pause');
    root.classList.add('is-leaving');
    setTimeout(() => {
      root.hidden = true;
      root.classList.remove('is-leaving');
      cancelAnimationFrame(raf);
      lastFocus?.focus?.({ preventScroll: true });
      onClose?.();
    }, 200);
  }

  return { open, close, isOpen: () => !root.hidden };
}
