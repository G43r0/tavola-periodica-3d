// Simulatore di laboratorio (schermo intero): menu, HUD, finestre e comandi. Caricato su richiesta da main.js;
// Rapier e la scena si preparano alla prima apertura. La logica del gioco è in game.js.
import * as THREE from 'three';
import '../styles/game.css';
import { createT, locale, pick } from '../i18n/index.js';
import { gfx } from '../gfx/preset.js';
import { esc, normalize, fmtNumber } from '../chem/format.js';
import { icons } from '../ui/icons.js';
import { loadPhysics } from './physics.js';
import { LabGame, FOV } from './game.js';
import { CHAPTERS, EXERCISES, EXERCISE_BY_ID, EXTRAS, CHALLENGES, CHALLENGE_BY_ID, MEDALS, chapterExercises, chapterState, exerciseOpen, nextExercise, reputation, repTitle, recordResult, recordChallenge, challengeOpen, reportCard, SHOP, canBuy, buy, passed, newCareer, bookUnlocks, lineParams, answerNumber } from './career.js';
import { migrate, activeProfile, addProfile, renameProfile, deleteProfile, selectProfile, updateActive, newer, freeProfileName } from './save.js';
import { SHELF, CABINET } from './reagents.js';
import { reagentLook, FAMILIES, FAMILY_ORDER } from './stock.js';
import { isClick, POUR_HOLD_MS } from './controls.js';
import { GAME_STRINGS } from './game-strings.js';
import { loadNotebook, notebookPages, percent } from './notebook.js';
import { TUTORIAL, illustration } from './tutorial.js';
import { storeIndex } from './book.js';
import { createBookView } from './book-view.js';
import { TOOL_PAGES, TECHNIQUE_PAGES, SAFETY_PAGES } from './data/book-pages.js';
import { GameAudio } from './audio/audio.js';
import { GameRenderer } from './game-render.js';

const t = createT(GAME_STRINGS);
const SAVE_KEY = 'tp3d.game';
const HUD_HZ = 10;

// Salvataggi (save.js): in localStorage e, nell'app Electron, anche nel file dei dati dell'utente (il più recente vince)
function readLocal() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(SAVE_KEY) || 'null');
  } catch {
    return null;
  }
}
function writeLocal(data) {
  try {
    globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* il salvataggio non è disponibile: i progressi valgono fino alla chiusura */
  }
}
/** Il salvataggio nel file dell'app Electron, se c'è (già nella versione nuova). */
async function readDesktop() {
  try {
    const text = await globalThis.window?.desktop?.gameSave?.read();
    return text ? migrate(JSON.parse(text), undefined, (n) => t('profileDefault', { n })) : null;
  } catch {
    return null;
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
    <aside class="gm-recipe" hidden aria-live="polite"></aside>
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
  let view = null; // GameRenderer: occlusione ambientale (Professionale) e qualità adattiva
  let audio = null; // GameAudio: i suoni CC0 di Freesound
  let raf = 0;
  let lastT = 0;
  let hudAcc = 0;
  let state = 'menu'; // menu | play | dialog | pause
  // tasti del mouse premuti: per distinguere un clic da un tasto tenuto (come in Cooking Simulator il sinistro posa con
  // un clic e versa tenuto, il destro annulla o rimette a posto con un clic e inclina trascinando)
  let lmb = null; // { moved, done, pour, t }
  let rmb = null; // { moved, dy }
  const profileName = (n) => t('profileDefault', { n });
  let save = migrate(readLocal(), undefined, profileName);
  let chemMode = save.settings.chemMode;
  let showInfo = true;
  let showLegend = save.settings.legend;
  let fov = Math.max(FOV.min, Math.min(FOV.max, Number(save.settings.fov) || FOV.default));
  let volume = save.settings.volume;
  let muted = save.settings.muted;
  let shake = save.settings.shake;
  let notebook = loadNotebook(activeProfile(save).notebook);
  /** Scrive il salvataggio (con l'ora, per scegliere il più recente tra il file dell'app e localStorage). */
  function storeSave() {
    save = { ...save, savedAt: new Date().toISOString() };
    writeLocal(save);
    try {
      globalThis.window?.desktop?.gameSave?.write(JSON.stringify(save));
    } catch {
      /* niente file: resta localStorage */
    }
  }
  const profile = () => activeProfile(save);
  const career = () => profile().career;
  /** Aggiorna la Carriera del profilo attivo (e il gioco, se è nella Carriera). */
  function setCareer(c) {
    save = updateActive(save, { career: c });
    storeSave();
    if (game?.mode === 'career') game.setCareer(c);
  }
  /** Cambia profilo: Carriera e quaderno sono suoi. */
  function useProfile(next) {
    save = next;
    notebook = loadNotebook(profile().notebook);
    if (game) game.notebook = notebook;
    storeSave();
  }
  let nbGroup = null; // gruppo aperto nel quaderno
  let nbTab = 'tutorial'; // scheda del quaderno: tutorial o reazioni scoperte
  let tutPage = 0; // pagina del tutorial
  let labAbove = false; // il laboratorio molecolare è aperto sopra il simulatore
  let bookView = null; // lettore del libro «Come si fa» (book-view.js)
  const pressed = new Set(); // tasti premuti (id della legenda): la riga corrispondente si illumina
  const pops = { looked: null, held: null }; // finestrelle accanto agli oggetti (elemento, misure)

  // ---------------------------------------------------------------- avvio
  async function boot() {
    $('.gm-loading').hidden = false;
    const [R, file] = await Promise.all([loadPhysics(), readDesktop()]);
    if (file && newer(save, file) === file) {
      save = file;
      chemMode = save.settings.chemMode;
      showLegend = save.settings.legend;
      fov = Math.max(FOV.min, Math.min(FOV.max, Number(save.settings.fov) || FOV.default));
      ({ volume, muted, shake } = save.settings);
      notebook = loadNotebook(profile().notebook);
    }
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
    game.shakeOn = shake;
    audio = new GameAudio({ volume, muted });
    game.audio = audio;
    view = new GameRenderer(renderer, game, G, { onStep: () => toast(t('qualityDown'), 'info', 5000) });
    game.notebook = notebook;
    bookView = createBookView({ game, t, kj, canOpenLab: () => Boolean(onOpenLab) });
    if (import.meta.env?.DEV) Object.assign(window, { __game: game, __view: view });
    layout();
    $('.gm-loading').hidden = true;
  }

  function layout() {
    if (!renderer) return;
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    view.setSize(w, h);
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
    else if (type === 'report') showReport(data);
    else if (type === 'catalog') showCatalog(data);
    else if (type === 'notebook') showNotebook('play');
    else if (type === 'book') showBook();
    else if (type === 'follow') renderFollow();
    else if (type === 'reaction') {
      reactionNote(data);
      if (data.isNew) {
        save = updateActive(save, { notebook });
        storeSave();
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
    if (s === 'menu') audio?.suspend();
    else audio?.resume();
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
    const c = career();
    const done = EXERCISES.filter((e) => passed(c, e.id)).length;
    const started = Object.keys(c.results ?? {}).length > 0;
    const rep = reputation(c);
    $('.gm-menu').innerHTML = `
      <div class="gm-menu__card">
        <p class="gm-eyebrow">${t('eyebrow')}</p>
        <h2>${t('title')}</h2>
        <p class="gm-lead">${t('menuLead')}</p>
        <p class="gm-profile">${icons.book(14)} <span>${t('profileLabel')}</span> <b>${esc(profile().name)}</b>
          <button type="button" class="gm-link" data-act="profiles">${t('profileChange')}</button></p>
        <div class="gm-modes">
          <button type="button" class="gm-big" data-act="career">
            <b>${started ? t('careerContinue') : t('careerStart')}</b>
            <span>${started ? t('careerProgress', { n: done, total: EXERCISES.length, rep, title: t(`rep_${repTitle(rep)}`), money: fmtMoney(c.money ?? 0) }) : t('careerText')}</span>
          </button>
          <button type="button" class="gm-big" data-act="free"><b>${t('freeStart')}</b><span>${t('freeText')}</span></button>
        </div>
        ${started ? `<button type="button" class="gm-link" data-act="career-reset">${t('careerReset')}</button>` : ''}
        <fieldset class="gm-chem">
          <legend>${t('chemLegend')}</legend>
          <label><input type="radio" name="gm-chem" value="real" ${chemMode === 'real' ? 'checked' : ''}/><span><b>${t('chemReal')}</b><small>${t('chemRealText')}</small></span></label>
          <label><input type="radio" name="gm-chem" value="simple" ${chemMode === 'simple' ? 'checked' : ''}/><span><b>${t('chemSimple')}</b><small>${t('chemSimpleText')}</small></span></label>
        </fieldset>
        ${settingsHtml()}
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
  /** Impostazioni del menu e della pausa: campo visivo, volume dell'audio (M: muto) e scossa della camera. */
  const settingsHtml = () => `${fovHtml()}
    <label class="gm-fov" title="${t('volumeTitle')}"><span>${t('volume')}</span>
      <input type="range" name="gm-vol" min="0" max="100" step="5" value="${Math.round(volume * 100)}"/><output>${muted ? t('mutedShort') : `${Math.round(volume * 100)} %`}</output></label>
    <label class="gm-check"><input type="checkbox" name="gm-shake" ${shake ? 'checked' : ''}/><span>${t('shakeLabel')}</span></label>`;

  const fmtMoney = (v) => `${(game?.fmt ?? ((n, d) => n.toFixed(d)))(v, 2)} €`;

  // ---------------------------------------------------------------- profili
  function showProfiles(editing = null) {
    const rows = save.profiles.map((p) => {
      const rep = reputation(p.career);
      const done = EXERCISES.filter((e) => passed(p.career, e.id)).length;
      const on = p.id === save.active;
      const name = editing === p.id
        ? `<input class="gm-search gm-profile__name" data-profile-name="${esc(p.id)}" value="${esc(p.name)}" maxlength="24" aria-label="${esc(t('profileRename'))}" spellcheck="false"/>`
        : `<b>${esc(p.name)}</b>`;
      return `<li class="gm-profile__row ${on ? 'is-on' : ''}">
        <span class="gm-profile__who">${name}<small>${esc(t('profileStats', { n: done, total: EXERCISES.length, rep, money: fmtMoney(p.career.money ?? 0) }))}</small></span>
        <span class="gm-profile__btns">
          ${editing === p.id ? `<button type="button" class="btn-ghost" data-profile-save="${esc(p.id)}">${t('profileSave')}</button>` : `<button type="button" class="btn-ghost" data-profile-edit="${esc(p.id)}">${t('profileRename')}</button>`}
          ${save.profiles.length > 1 ? `<button type="button" class="btn-ghost" data-profile-del="${esc(p.id)}">${t('profileDelete')}</button>` : ''}
          ${on ? `<span class="gm-small">${t('profileActive')}</span>` : `<button type="button" class="gm-primary" data-profile-use="${esc(p.id)}">${t('profileUse')}</button>`}
        </span></li>`;
    }).join('');
    showDialog(`
      <h3>${t('profilesTitle')}</h3>
      <p class="gm-small">${t('profilesText')}</p>
      <ul class="gm-profiles">${rows}</ul>
      <div class="gm-actions">
        ${save.profiles.length < 8 ? `<button type="button" class="btn-ghost" data-act="profile-new">${icons.plus(14)}<span>${t('profileNew')}</span></button>` : ''}
        <button type="button" class="gm-primary" data-act="menu">${t('done')}</button></div>`, 'gm-profiles-card');
    const nameInput = $('[data-profile-name]');
    // Invio conferma il nome come il pulsante Salva
    nameInput?.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      $(`[data-profile-save="${CSS.escape(nameInput.dataset.profileName)}"]`)?.click();
    });
    nameInput?.focus();
  }

  /** Conferma prima di eliminare un profilo: Carriera, soldi e quaderno si perdono per sempre. */
  function showProfileDelete(id) {
    const p = save.profiles.find((x) => x.id === id);
    if (!p) return showProfiles();
    showDialog(`
      <h3>${t('profileDeleteTitle')}</h3>
      <p>${t('profileDeleteText', { name: esc(p.name) })}</p>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="profiles">${t('cancel')}</button><button type="button" class="gm-primary gm-danger" data-profile-del-yes="${esc(id)}">${t('profileDeleteYes')}</button></div>`);
  }

  // ---------------------------------------------------------------- Carriera
  /** Mappa dei capitoli: reputazione, soldi, esercitazioni con le stelle, negozio e libro. */
  function showMap() {
    const c = career();
    const rep = reputation(c);
    const next = nextExercise(c);
    const chapters = CHAPTERS.map((ch) => {
      const stt = chapterState(c, ch.id);
      const list = chapterExercises(ch.id);
      let note = '';
      if (stt === 'soon') note = t('chSoon');
      else if (stt === 'locked') {
        let prev = ch.id - 1;
        while (prev > 0 && !chapterExercises(prev).length) prev--;
        note = list.length && !chapterExercises(prev).every((e) => passed(c, e.id)) ? t('chLockedPrev', { n: prev }) : t('chLockedRep', { rep: ch.rep });
      } else note = t('chProgress', { n: list.filter((e) => passed(c, e.id)).length, total: list.length });
      const exs = list.map((e) => {
        const res = c.results?.[e.id];
        const open = exerciseOpen(c, e.id);
        const mark = res?.mark !== undefined ? `<small class="gm-mark">${t('examMark')} ${fmtMark(res.mark)}</small>` : '';
        return `<button type="button" class="gm-ex ${passed(c, e.id) ? 'is-passed' : ''} ${e.exam ? 'is-exam' : ''}" data-ex="${e.id}" ${open ? '' : 'disabled'}>
          <span>${esc(t(`${e.id}Title`))}</span><span class="gm-ex__stars">${mark}${res ? stars(res.stars) : open ? `<small>${t('exNew')}</small>` : ''}</span></button>`;
      }).join('');
      return `<li class="gm-ch is-${stt}">
        <div class="gm-ch__head"><b>${t('chapterN', { n: ch.id })} · ${esc(t(`chapter${ch.id}Title`))}</b><small>${esc(note)}</small></div>
        <p class="gm-ch__text">${esc(t(`chapter${ch.id}Text`))}</p>
        ${exs ? `<div class="gm-ch__ex">${exs}</div>` : ''}</li>`;
    }).join('');
    const extras = EXTRAS.map((e) => {
      const res = c.results?.[e.id];
      const open = exerciseOpen(c, e.id);
      const note = open ? t('extraFrom', { who: t(`giver_${e.extra.giver}`) }) : t('extraLocked', { n: e.chapter, rep: e.extra.rep });
      return `<button type="button" class="gm-ex gm-ex--extra ${passed(c, e.id) ? 'is-passed' : ''}" data-ex="${e.id}" ${open ? '' : 'disabled'}>
        <span>${esc(t(`${e.id}Title`))}<small>${esc(note)}</small></span><span class="gm-ex__stars">${res ? stars(res.stars) : open ? `<small>${t('exNew')}</small>` : ''}</span></button>`;
    }).join('');
    const challenges = CHALLENGES.map((ch) => {
      const open = challengeOpen(c, ch);
      const r = c.challenges?.[ch.id];
      const medal = r?.medal ?? 0;
      const title = t(`${ch.ex}Title`);
      const note = open
        ? `${t('challengeLimits', { gold: fmtTime(ch.gold), silver: fmtTime(ch.silver), bronze: fmtTime(ch.bronze) })}${r?.best ? ` · ${t('challengeBest', { time: fmtTime(r.best) })}` : ''}`
        : t('challengeLocked', { title });
      return `<button type="button" class="gm-ex gm-ex--challenge" data-ch="${ch.id}" ${open ? '' : 'disabled'}>
        <span>${esc(title)}<small>${esc(note)}</small></span>${medal ? `<span class="gm-medal gm-medal--${MEDALS[medal]}">${esc(t(`medal_${MEDALS[medal]}`))}</span>` : ''}</button>`;
    }).join('');
    const extraBlock = `<details class="gm-more"><summary>${t('extraTitle')}</summary><p class="gm-ch__text">${t('extraText')}</p><div class="gm-ch__ex">${extras}</div></details>
      <details class="gm-more"><summary>${t('challengeTitle')}</summary><p class="gm-ch__text">${t('challengeText')}</p><div class="gm-ch__ex">${challenges}</div></details>`;
    showDialog(`
      <div class="gm-map__top">
        <div><p class="gm-eyebrow">${esc(profile().name)}</p><h3>${t('mapTitle')}</h3></div>
        <div class="gm-rep" title="${esc(t('repHelp'))}"><span>${t('repLabel')}: <b>${esc(t(`rep_${repTitle(rep)}`))}</b></span><i style="--p:${rep}%"></i><small>${rep} / 100</small></div>
        <div class="gm-map__money"><span>${t('moneyLabel')}</span><b>${fmtMoney(c.money ?? 0)}</b></div>
      </div>
      <ol class="gm-chapters">${chapters}</ol>
      ${extraBlock}
      <div class="gm-actions">
        <button type="button" class="btn-ghost" data-act="menu">${t('toMenu')}</button>
        <button type="button" class="btn-ghost" data-act="report-card">${t('reportCardBtn')}</button>
        <button type="button" class="btn-ghost" data-act="shop">${t('shopTitle')}</button>
        <button type="button" class="btn-ghost" data-act="map-book">${icons.book(14)}<span>${t('bookTitle')}</span></button>
        ${next ? `<button type="button" class="gm-primary" data-ex="${next.id}">${t('mapNext', { title: t(`${next.id}Title`) })}</button>` : ''}
      </div>`, 'gm-map');
    $('.gm-map').dataset.help = 'ui.gameCareer';
  }

  /** Comincia un'esercitazione. fresh: la stanza si svuota (dalla mappa); dal resoconto, il banco resta com'è. */
  function startExercise(id, fresh = true, challenge = null) {
    if (!exerciseOpen(career(), id)) return;
    if (challenge && !challengeOpen(career(), CHALLENGE_BY_ID.get(challenge))) return;
    game.startCareer(chemMode, id, career(), { fresh, challenge });
  }

  /** Voto di una verifica: 8, 8,5. */
  const fmtMark = (m) => (Number.isInteger(m) ? String(m) : m.toFixed(1).replace('.', locale().startsWith('it') ? ',' : '.'));

  /** Pagella: i voti delle verifiche di ogni capitolo, la media e il giudizio dell'insegnante. */
  function showReportCard() {
    const card = reportCard(career());
    const rows = card.rows.map((r) => `<tr>
      <th>${t('rcChapter', { n: r.chapter })} · ${esc(t(`chapter${r.chapter}Title`))}</th>
      <td>${r.marks.map((m) => (m.mark === null ? `<span class="gm-rc__todo">${t('rcNotTaken')}</span>` : `<b>${fmtMark(m.mark)}</b>`)).join(' · ')}</td></tr>`).join('');
    showDialog(`
      <p class="gm-eyebrow">${esc(profile().name)}</p>
      <h3>${t('reportCardTitle')}</h3>
      <p class="gm-small">${t('reportCardText')}</p>
      <table class="gm-rc"><tbody>${rows}</tbody></table>
      <p class="gm-rc__avg">${t('rcAverage')}: <b>${card.average === null ? '—' : fmtMark(Math.round(card.average * 10) / 10)}</b></p>
      <p class="gm-rc__verdict is-${card.verdict}">${t(`rcVerdict_${card.verdict}`)}</p>
      ${card.judgement ? `<p class="gm-small">${t(`judge_${card.judgement}`)}</p>` : ''}
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="map">${t('mapTitle')}</button></div>`, 'gm-rccard');
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

  /** Pagine del libro indicate dall'insegnante (pulsanti che aprono il libro su quella pagina). */
  function bookRefs(ex) {
    const label = (p) => {
      const [kind, id] = p.split(':');
      const list = kind === 'tool' ? TOOL_PAGES : kind === 'tech' ? TECHNIQUE_PAGES : SAFETY_PAGES;
      const page = list.find((x) => x.id === id);
      return page ? pick(page).title : p;
    };
    return (ex.book ?? []).map((p) => `<button type="button" class="gm-chip" data-bk-open="${esc(p)}">${icons.book(12)} ${esc(label(p))}</button>`).join('');
  }

  function showOrderIntro({ ex, challenge }) {
    const list = chapterExercises(ex.chapter);
    const steps = ex.steps.map((st) => t(st.key, game.stepParams(ex)));
    const where = ex.extra ? t('extraFrom', { who: t(`giver_${ex.extra.giver}`) }) : `${t('chapterN', { n: ex.chapter })} · ${t(`chapter${ex.chapter}Title`)} · ${list.indexOf(ex) + 1} / ${list.length}`;
    showDialog(`
      <p class="gm-eyebrow">${esc(where)}</p>
      <h3>${t(`${ex.id}Title`)}</h3>
      ${challenge ? `<p class="gm-note">${t('challengeIntro', { gold: fmtTime(challenge.gold), silver: fmtTime(challenge.silver), bronze: fmtTime(challenge.bronze) })}</p>` : ''}
      ${ex.exam ? `<p class="gm-note">${t('examIntro')}</p>` : ''}
      <p class="gm-teacher">${icons.book(16)} ${game.briefText(ex)}</p>
      <ol class="gm-steps gm-steps--numbered" aria-label="${t('boardLabel')}">${steps.map((x, i) => `<li>${i + 1}. ${esc(x)}</li>`).join('')}</ol>
      ${ex.book?.length ? `<p class="gm-bookrefs"><span>${t('introBook')}</span>${bookRefs(ex)}</p>` : ''}
      <p class="gm-small">${t('orderPay', { pay: fmtMoney(ex.pay), min: Math.max(1, Math.round(ex.par / 60)) })}</p>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="map">${t('mapTitle')}</button><button type="button" class="gm-primary" data-act="play">${t('start')}</button></div>`);
  }

  /** Testo di un'opzione della relazione o di una risposta: «@chiave» è un testo tradotto, il resto si mostra così. */
  const optText = (o) => (o.startsWith('@') ? t(o.slice(1)) : o);

  /** Relazione di laboratorio: due o tre domande sul perché; le risposte giuste danno stelle in più. */
  function showReport({ ex, questions }) {
    const qs = questions.map((q, i) => `<fieldset class="gm-rq"><legend>${i + 1}. ${esc(t(q.q))}</legend>
      ${q.opts.map((o, k) => `<label><input type="radio" name="rq${i}" value="${k}"/><span>${esc(optText(o))}</span></label>`).join('')}</fieldset>`).join('');
    showDialog(`
      <p class="gm-eyebrow">${esc(t(`${ex.id}Title`))}</p>
      <h3>${t('reportTitle')}</h3>
      <p class="gm-small">${t('reportText')}</p>
      <form class="gm-report">${qs}</form>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="report-skip">${t('reportSkip')}</button><button type="button" class="gm-primary" data-act="report-submit">${t('reportSubmit')}</button></div>`, 'gm-reportcard');
  }

  function showResult(r) {
    const before = career();
    const repBefore = reputation(before);
    let next = recordResult(before, r.id, { stars: r.stars, report: r.report.right, money: r.money, incidents: r.incidents, quality: r.quality });
    if (r.challenge) next = recordChallenge(next, r.challenge.id, { medal: r.challenge.medal, elapsed: r.challenge.elapsed });
    setCareer(next);
    const repAfter = reputation(next);
    const mark = (ok) => (ok === true ? 'ok' : ok === 'warn' ? 'warn' : 'bad');
    const lines = r.lines.map((l) => `<li class="gm-line gm-line--${mark(l.ok)}">${esc(lineText(l))}</li>`).join('');
    const rq = r.report.total ? r.report.questions.map((q, i) => {
      const ok = r.report.answers[i] === q.right;
      return `<li class="gm-line gm-line--${ok ? 'ok' : 'bad'}">${esc(t(q.q))} — ${esc(optText(q.opts[q.right]))}</li>`;
    }).join('') : '';
    const following = nextExercise(next);
    const repDelta = repAfter - repBefore;
    const ch = r.challenge;
    const medalName = ch ? t(`medal_${MEDALS[ch.medal]}`) : '';
    const where = r.ex.extra ? t('extraFrom', { who: t(`giver_${r.ex.extra.giver}`) }) : `${t('chapterN', { n: r.ex.chapter })} · ${t(`chapter${r.ex.chapter}Title`)}`;
    showDialog(`
      <p class="gm-eyebrow">${esc(where)}</p>
      <h3>${t(`${r.ex.id}Title`)}</h3>
      <div class="gm-stars" aria-label="${t('starsLabel', { n: r.stars })}">${stars(r.stars)}</div>
      ${r.mark !== null ? `<p class="gm-markline">${t('examMarkLine', { mark: fmtMark(r.mark) })}${next.results[r.id].mark > r.mark ? ` <small>(${t('examBest', { mark: fmtMark(next.results[r.id].mark) })})</small>` : ''}</p>` : ''}
      ${ch ? `<p class="gm-markline gm-medal--${MEDALS[ch.medal]}">${ch.medal ? t('challengeResult', { medal: medalName, time: fmtTime(ch.elapsed) }) : t('challengeNoMedal', { bronze: fmtTime(CHALLENGE_BY_ID.get(ch.id).bronze) })}${ch.bonus ? ` <small>${t('challengeBonus', { money: fmtMoney(ch.bonus) })}</small>` : ''}</p>` : ''}
      ${r.stars > r.base ? `<p class="gm-small">${t('reportBonus', { n: game.fmt(r.stars - r.base, 1) })}</p>` : ''}
      <ul class="gm-lines">${lines}</ul>
      ${rq ? `<h4 class="gm-sub">${t('reportTitle')}: ${r.report.right} / ${r.report.total}</h4><ul class="gm-lines">${rq}</ul>` : ''}
      <dl class="gm-bill">
        ${rows([
          [t('billQuality'), `${Math.round(r.quality * 100)} %`],
          [t('billSafety'), `${Math.round(r.safety * 100)} %${r.mess ? ` · ${t('billMess', { n: r.mess })}` : ''}${r.incidents ? ` · ${t('billIncidents', { n: r.incidents })}` : ''}`],
          [t('billTime'), `${fmtTime(r.elapsed)} / ${fmtTime(r.ex.par)}`],
          [t('billPay'), `+ ${fmtMoney(r.earned)}`],
          [t('billCosts'), `− ${fmtMoney(r.reagents)}${r.fines ? ` (${t('billFines')}: ${fmtMoney(r.fines)})` : ''}`],
          [t('billTotal'), `<b>${fmtMoney(r.money)}</b>`],
          [t('repLabel'), `${repAfter} / 100${repDelta ? ` (${repDelta > 0 ? '+' : '−'}${Math.abs(repDelta)})` : ''} · ${esc(t(`rep_${repTitle(repAfter)}`))}`],
        ])}
      </dl>
      ${r.stars < 2 ? `<p class="gm-small">${t('resultRetry')}</p>` : r.ex.deliver === 'answers' ? '' : `<p class="gm-small">${t('resultCleanup')}</p>`}
      <div class="gm-actions">
        <button type="button" class="btn-ghost" data-act="map">${t('mapTitle')}</button>
        <button type="button" class="btn-ghost" data-ex-retry="${r.id}" ${ch ? `data-ex-challenge="${ch.id}"` : ''}>${t('retry')}</button>
        ${following ? `<button type="button" class="gm-primary" data-ex-next="${following.id}">${t('nextOrder')}</button>` : `<button type="button" class="gm-primary" data-act="keep-playing">${t('keepPlaying')}</button>`}
      </div>`, 'gm-result');
  }

  /** Riga del resoconto: i numeri formattati; per le risposte, il nome della risposta data e di quella giusta. */
  function lineText(l) {
    const p = { ...(l.p ?? {}) };
    if (l.key === 'evSampleAns' || l.key === 'evAnswerNum') {
      const ex = EXERCISE_BY_ID.get(p.ex);
      p.answer = answerLabel(ex, p.answer);
      p.right = answerLabel(ex, p.right);
    }
    return t(l.key, formatParams(p));
  }

  /** Nome di una risposta: il testo tradotto (ans_<valore>), il nome dell'elemento (saggio alla fiamma) o il numero. */
  function answerLabel(ex, v) {
    if (v === null || v === undefined || v === '' || v === '—') return '—';
    if (ex?.answers?.type === 'number') {
      const n = answerNumber(v);
      return Number.isFinite(n) ? `${game.fmt(n, 2)} ${ex.answers.unit}` : '—';
    }
    if (ex?.answers?.options === 'flame') return `${game.chem.sub(game.chem.id(v))?.name ?? v} (${v})`;
    return t(`ans_${v}`);
  }

  /** Risposte: un menu per ogni campione (a scelta) o un numero. */
  function showAnswers({ ex, count, options }) {
    const a = ex.answers;
    const field = (i) => (a.type === 'number'
      ? `<label>${count > 1 ? t('sampleName', { s: 'ABCDE'[i] }) : t(`${ex.id}Question`)}
          <span class="gm-answer__num"><input type="text" inputmode="decimal" name="s${i}" autocomplete="off" spellcheck="false"/> <span>${esc(a.unit)}</span></span></label>`
      : `<label>${t('sampleName', { s: 'ABCDE'[i] })}
          <select name="s${i}"><option value="">—</option>${options.map((o) => `<option value="${esc(o)}">${esc(answerLabel(ex, o))}</option>`).join('')}</select></label>`);
    showDialog(`
      <h3>${t('answersTitle')}</h3>
      <p>${t(`${ex.id}AnswersText`) !== `${ex.id}AnswersText` ? t(`${ex.id}AnswersText`) : t('answersText')}</p>
      <form class="gm-answers">${Array.from({ length: count }, (_, i) => field(i)).join('')}</form>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="play">${t('notYet')}</button><button type="button" class="gm-primary" data-act="submit-answers">${t('deliver')}</button></div>`);
    $('.gm-answers input, .gm-answers select')?.focus();
  }

  /** Negozio: migliorie del laboratorio da comprare con i soldi della Carriera. */
  function showShop(back = 'map') {
    const c = career();
    const items = SHOP.map((x) => {
      const owned = (c.owned ?? []).includes(x.id);
      return `<li class="gm-shop__row ${owned ? 'is-owned' : ''}"><span><b>${esc(t(`shop_${x.id}`))}</b><small>${esc(t(`shop_${x.id}Text`))}</small></span>
        <span class="gm-shop__buy">${owned ? `<span class="gm-small">${t('shopOwned')}</span>` : `<button type="button" class="gm-primary" data-buy="${x.id}" ${canBuy(c, x.id) ? '' : 'disabled'}>${fmtMoney(x.price)}</button>`}</span></li>`;
    }).join('');
    showDialog(`
      <h3>${t('shopTitle')}</h3>
      <p class="gm-small">${t('shopText', { money: fmtMoney(c.money ?? 0) })}</p>
      <ul class="gm-shop">${items}</ul>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="${back}">${t('done')}</button></div>`, 'gm-shopcard');
  }

  /** Conferma prima di ricominciare la Carriera del profilo. */
  function showResetConfirm() {
    showDialog(`
      <h3>${t('careerResetTitle')}</h3>
      <p>${t('careerResetText', { name: esc(profile().name) })}</p>
      <div class="gm-actions"><button type="button" class="btn-ghost" data-act="menu">${t('cancel')}</button><button type="button" class="gm-primary gm-danger" data-act="career-reset-yes">${t('careerResetYes')}</button></div>`);
  }

  function showCatalog({ cabinet = false } = {}) {
    // nella Carriera, con la chiave dell'armadio (negozio): solo vetreria, scaffale e armadio della scuola
    if (cabinet) {
      const glass = ['beaker100', 'beaker250', 'flask250', 'cylinder100'];
      showDialog(`
        <h3>${t('cabinetTitle')}</h3>
        <p class="gm-small">${t('cabinetText')}</p>
        <div class="gm-cat-glass">${glass.map((k) => `<button type="button" class="btn-ghost" data-glass="${k}">${t(`item_${k}`)}</button>`).join('')}</div>
        <div class="gm-cat-ready">${readyHtml()}</div>
        <div class="gm-actions"><button type="button" class="gm-primary" data-act="play">${t('done')}</button></div>`, 'gm-catalog');
      return;
    }
    // le stesse forme che usano le ricette del libro (book.js): sostanze della libreria e metalli in pezzi
    const all = [...storeIndex(game.chem)].map(([sid, e]) => {
      const s = game.chem.sub(sid);
      return { key: e.key, sid, name: s.name, formula: s.formula || s.symbol, st: e.st, soluble: e.soluble };
    });
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
          ${x.soluble ? `<button type="button" data-spawn="${esc(x.key)}" data-form="sol01">${fmtNumber(0.1)} M</button><button type="button" data-spawn="${esc(x.key)}" data-form="sol1">1 M</button>` : ''}
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
    return `${c.formula(c.id(key)) || c.name(c.id(key))}${r.molar ? ` ${fmtNumber(r.molar)} M` : ''}`;
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
        <button type="button" class="btn-ghost" data-act="book">${icons.book(16)}<span>${t('pauseBook')}</span> <kbd>B</kbd></button>
        ${game.free ? '' : `<button type="button" class="btn-ghost" data-act="restart-order">${t('restartOrder')}</button>`}
        <button type="button" class="btn-ghost" data-act="menu">${t('toMenu')}</button>
        <button type="button" class="btn-ghost" data-act="close">${t('backToTable')}</button>
      </div>
      ${settingsHtml()}</div>`;
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
        ${game.book.byId.has(p.id) ? `<button type="button" class="gm-link" data-bk-open="recipe:${esc(p.id)}">${t('bookTitle')} →</button>` : ''}
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

  // ---------------------------------------------------------------- libro «Come si fa»
  /** Apre il libro (o una sua pagina: 'recipe:<id>', 'element:<z>'), come finestra sopra il gioco. */
  /** Libro «Come si fa». back: dove torna «Fatto» (il gioco, o la mappa della Carriera, con le pagine del profilo). */
  function showBook(target = null, back = 'play') {
    if (!bookView) return;
    if (back === 'map') game.bookLocks = bookUnlocks(career());
    if (target) bookView.open(target);
    showDialog(`<h3>${t('bookTitle')}</h3><div class="gm-bk__body"></div>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="${back}">${t('done')}</button></div>`, 'gm-book');
    $('.gm-book').dataset.help = 'ui.gameBook';
    renderBook();
  }

  function renderBook() {
    const body = $('.gm-bk__body');
    if (!body) return;
    body.innerHTML = bookView.html();
    body.querySelector('.gm-bk__main')?.scrollTo?.(0, 0);
  }

  /** Clic dentro il libro: navigazione, «Prepara sul banco», «Segui la ricetta», laboratorio molecolare. */
  function bookClick(b) {
    if (bookView.click(b)) {
      renderBook();
      return true;
    }
    const d = b.dataset;
    if (d.bkPrepare) {
      const recipe = game.book.byId.get(d.bkPrepare);
      const list = game.prepareRecipe(recipe);
      game.followRecipe(recipe.id);
      toast(t('bkPrepared', { list: list.join(', ') }), 'ok', 6000);
      play();
      return true;
    }
    if (d.bkFollow) {
      if (game.follow?.recipe.id === d.bkFollow) game.stopFollow();
      else game.followRecipe(d.bkFollow);
      play();
      return true;
    }
    if (d.bkLab && onOpenLab) {
      labAbove = true;
      onOpenLab(d.bkLab, () => {
        labAbove = false;
      });
      return true;
    }
    return false;
  }

  /** Riquadro della ricetta seguita: i passi, spuntati quando il gioco li riconosce, con quello di adesso evidenziato. */
  function renderFollow() {
    const box = $('.gm-recipe');
    const f = game?.follow;
    if (!f) {
      box.hidden = true;
      return;
    }
    const r = f.recipe;
    const now = f.done.findIndex((d) => !d);
    box.innerHTML = `<header><b>${esc(t('bkPanelTitle'))}</b> <span>${esc(bookView.recipeTitle(r))}</span>
        <button type="button" class="gm-recipe__x" data-act="stop-follow" title="${esc(t('bkStopFollow'))}">×</button></header>
      <ol>${r.steps.map((step, i) => `<li class="${f.done[i] ? 'is-done' : i === now ? 'is-now' : ''}">${esc(bookView.stepText(r, step))}</li>`).join('')}</ol>
      <footer>${esc(f.complete ? t('bkPanelDone') : t('bkPanelOpen'))}</footer>`;
    box.hidden = false;
    box.querySelector('.is-now')?.scrollIntoView?.({ block: 'nearest' });
  }

  function showHelp() {
    const prev = state;
    showDialog(`
      <h3>${t('controls')}</h3>
      <p class="gm-help__note">${t('helpNote')}</p>
      <div class="gm-help">
        <div><h4>${t('helpWalk')}</h4><dl>${rows(t('helpWalkRows'))}</dl></div>
        <div><h4>${t('helpBench')}</h4><dl>${rows(t('helpBenchRows'))}</dl><h4>${t('helpTools')}</h4><dl>${rows([...t('helpToolsRows'), t('helpAudioRow')])}</dl></div>
      </div>
      <div class="gm-actions"><button type="button" class="gm-primary" data-act="${prev === 'menu' ? 'menu' : 'play'}">${t('ok')}</button></div>`, 'gm-helpcard');
  }

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const formatParams = (p) => lineParams(p, (n, d) => game.fmt(n, d));

  // ---------------------------------------------------------------- clic nelle finestre e nei menu
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (state !== 'menu') audio?.resume();
    audio?.play('click', null, { gain: 0.45 });
    if (b.closest('.gm-book') && bookClick(b)) return;
    const act = b.dataset.act;
    if (act === 'close') close();
    else if (act === 'book') showBook();
    else if (act === 'stop-follow') game.stopFollow();
    else if (b.dataset.bkOpen) showBook(b.dataset.bkOpen);
    else if (act === 'career' || act === 'map') showMap();
    else if (act === 'career-reset') showResetConfirm();
    else if (act === 'career-reset-yes') {
      save = updateActive(save, { career: newCareer() });
      storeSave();
      showMenu();
    } else if (act === 'profiles') showProfiles();
    else if (act === 'profile-new') {
      const next = addProfile(save, freeProfileName(save.profiles, profileName));
      if (next) useProfile(next);
      showProfiles(next ? profile().id : null);
    } else if (b.dataset.profileUse) {
      useProfile(selectProfile(save, b.dataset.profileUse));
      showProfiles();
    } else if (b.dataset.profileEdit) showProfiles(b.dataset.profileEdit);
    else if (b.dataset.profileSave) {
      const input = $(`[data-profile-name="${b.dataset.profileSave}"]`);
      save = renameProfile(save, b.dataset.profileSave, input?.value ?? '');
      storeSave();
      showProfiles();
    } else if (b.dataset.profileDel) showProfileDelete(b.dataset.profileDel);
    else if (b.dataset.profileDelYes) {
      useProfile(deleteProfile(save, b.dataset.profileDelYes));
      showProfiles();
    } else if (act === 'shop') showShop();
    else if (b.dataset.buy) {
      const next = buy(career(), b.dataset.buy);
      if (next) {
        setCareer(next);
        toast(t('shopBought', { name: t(`shop_${b.dataset.buy}`) }), 'ok');
      }
      showShop();
    } else if (act === 'map-book') showBook(null, 'map');
    else if (b.dataset.ch) startExercise(CHALLENGE_BY_ID.get(b.dataset.ch)?.ex, true, b.dataset.ch);
    else if (act === 'report-card') showReportCard();
    else if (b.dataset.ex) startExercise(b.dataset.ex, true);
    else if (b.dataset.exRetry) startExercise(b.dataset.exRetry, false, b.dataset.exChallenge || null);
    else if (b.dataset.exNext) startExercise(b.dataset.exNext, false);
    else if (act === 'report-submit' || act === 'report-skip') {
      const answers = [];
      if (act === 'report-submit') $('.gm-report')?.querySelectorAll('fieldset').forEach((f, i) => {
        const v = f.querySelector('input:checked')?.value;
        answers[i] = v === undefined ? -1 : Number(v);
      });
      game.finishReport(answers);
    } else if (act === 'free') startFree();
    else if (act === 'help') showHelp();
    else if (act === 'menu') showMenu();
    else if (act === 'play' || act === 'keep-playing') play();
    else if (act === 'pause') showPause();
    else if (act === 'restart-order') {
      if (game.order) startExercise(game.order.id, true, game.order.challenge?.id ?? null);
    } else if (act === 'submit-answers') {
      const form = $('.gm-answers');
      const answers = {};
      form.querySelectorAll('select, input').forEach((s, i) => (answers[i] = s.value || null));
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
    if (ev.target.matches?.('[data-bk-search]')) {
      bookView.state.query = ev.target.value;
      const box = $('.gm-bk__results');
      if (box) box.innerHTML = bookView.results();
      return;
    }
    if (ev.target.name === 'gm-vol') {
      volume = Number(ev.target.value) / 100;
      muted = false;
      audio?.setMuted(false);
      audio?.setVolume(volume);
      ev.target.nextElementSibling.textContent = `${Math.round(volume * 100)} %`;
      return;
    }
    if (ev.target.name !== 'gm-fov') return;
    fov = Number(ev.target.value);
    game?.setFov(fov);
    ev.target.nextElementSibling.textContent = `${fov}°`;
  });
  root.addEventListener('change', (ev) => {
    if (ev.target.matches?.('[data-bk-shelf]')) {
      bookView.state.shelfOnly = ev.target.checked;
      renderBook();
      return;
    }
    if (ev.target.name === 'gm-fov') {
      save = { ...save, settings: { ...save.settings, fov } };
      storeSave();
    }
    if (ev.target.name === 'gm-vol') {
      audio?.resume();
      audio?.play('ping', null, { gain: 0.7 });
      save = { ...save, settings: { ...save.settings, volume, muted } };
      storeSave();
    }
    if (ev.target.name === 'gm-shake') {
      shake = ev.target.checked;
      if (game) game.shakeOn = shake;
      save = { ...save, settings: { ...save.settings, shake } };
      storeSave();
    }
    if (ev.target.name === 'gm-chem') {
      chemMode = ev.target.value;
      save = { ...save, settings: { ...save.settings, chemMode } };
      storeSave();
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
      save = { ...save, settings: { ...save.settings, legend: showLegend } };
      storeSave();
      lastLegendHtml = null;
      if (!showLegend) toast(t('legendHidden'));
    }
    else if (code === 'KeyH') showHelp();
    else if (code === 'KeyM') {
      muted = !muted;
      audio?.setMuted(muted);
      save = { ...save, settings: { ...save.settings, muted } };
      storeSave();
      toast(t(muted ? 'audioOff' : 'audioOn'));
    }
    else if (code === 'KeyN') showNotebook();
    else if (code === 'KeyB') showBook();
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

  // mouse come in Cooking Simulator: sinistro prende, usa e posa (tenuto con un recipiente versa; nella precisione
  // alza), destro inclina trascinando (un clic annulla la rotazione o rimette a posto), tasto centrale lancia
  stage.addEventListener('mousedown', (ev) => {
    if (state !== 'play') return;
    if (game.player.mode === 'walk' && !locked()) {
      lock();
      return;
    }
    if (ev.button === 0) {
      pressed.add('lmb');
      lmb = { moved: 0, done: false, pour: false, t: performance.now() };
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
      rmb = { moved: 0, dy: 0 };
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
    // destro tenuto con un oggetto in mano: il mouse, in su e in giù, lo inclina e basta (lo sguardo e, nella vista del
    // bancone, il punto di presa restano fermi). Parte oltre i 4 pixel, così un clic non lo inclina prima di annullare
    if (rmb && game.held) {
      rmb.moved += Math.abs(dx) + Math.abs(dy);
      rmb.dy += dy;
      if (!isClick(rmb.moved)) {
        game.tiltHeld(rmb.dy);
        rmb.dy = 0;
      }
      return;
    }
    if (lmb && game.held && !game.filling) lmb.moved += Math.abs(dx) + Math.abs(dy);
    // sinistro tenuto con un recipiente: si versa (si inclina da solo); il mouse in su versa di più, in giù di meno. Di
    // lato, in prima persona, lo sguardo gira a metà velocità per correggere la mira; nella vista del bancone il punto di
    // presa resta fermo, così il recipiente non scappa da quello in cui si versa
    if (lmb && canPour() && (lmb.pour || !isClick(lmb.moved))) {
      if (!lmb.pour) startPour();
      game.pourMore(dy * (walk ? 1 : 1.4));
      if (walk && locked()) game.player.look(dx * 0.5, 0);
      return;
    }
    const r = stage.getBoundingClientRect();
    game.setMouse(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    if (jump) return;
    // nella manipolazione precisa sinistro + mouse alza e abbassa l'oggetto
    if (lmb && game.held && game.precise && !game.filling) {
      game.preciseLift(dy);
      return;
    }
    if (game.precise) game.preciseMove(dx, dy);
    else if (walk && locked()) game.player.look(dx, dy);
  });
  /** Con il sinistro si versa: un recipiente in mano, fuori dalla manipolazione precisa e dal rubinetto. */
  function canPour() {
    return Boolean(game?.held?.def.container) && !game.precise && !game.filling && !lmb?.done;
  }
  function startPour() {
    lmb.pour = true;
    game.setPour(true);
  }

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
      // sfida a tempo: il conto alla rovescia fino all'oro; poi il tempo che passa
      const clock = h.order.challenge && !late ? t('challengeLeft', { time: fmtSec(h.order.par - h.order.elapsed) }) : fmtSec(h.order.elapsed);
      const tag = h.order.challenge ? `${t('challengeShort')} · ` : h.order.exam ? `${t('examLabel')} · ` : '';
      orderHtml = `<header><span>${tag}${t('orderShort', { n: h.order.n, ch: h.order.chapter })}</span><b class="${late ? 'is-late' : ''}">${clock}</b></header>
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
    // sinistro tenuto fermo con un recipiente in mano: dopo un attimo comincia a versare (un clic, invece, lo posa)
    if (state === 'play' && lmb && !lmb.pour && canPour() && isClick(lmb.moved) && now - lmb.t > POUR_HOLD_MS) startPour();
    if (state === 'play' || state === 'dialog') game.update(state === 'play' ? dt : 0, { blocked: state !== 'play' });
    else audio?.loops([]); // pausa e menu: il laboratorio tace
    view.render();
    if (state === 'play') view.sample(dt);
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
  let booting = null; // avvio in corso: un secondo clic durante il caricamento non deve creare un altro renderer
  let closing = 0; // timer della chiusura animata: riaprendo subito non deve più nascondere il simulatore
  async function open() {
    clearTimeout(closing);
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.remove('is-leaving');
    root.classList.add('is-entering');
    setTimeout(() => root.classList.remove('is-entering'), 600);
    if (!game) {
      try {
        await (booting ??= boot());
      } catch (err) {
        booting = null;
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
    audio?.suspend();
    if (state === 'play') setState('pause');
    root.classList.add('is-leaving');
    clearTimeout(closing);
    closing = setTimeout(() => {
      root.hidden = true;
      root.classList.remove('is-leaving');
      cancelAnimationFrame(raf);
      lastFocus?.focus?.({ preventScroll: true });
      onClose?.();
    }, 200);
  }

  return { open, close, isOpen: () => !root.hidden };
}
