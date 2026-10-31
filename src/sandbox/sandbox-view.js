// Sandbox degli elementi (schermo intero): una «polvere» alla The Powder Toy con i 118 elementi della tavola
// periodica e i materiali di base. Caricata su richiesta da main.js.
// Collega il motore (world.js), il disegno (render.js), i testi (describe.js) e gli esempi (presets.js).
import '../styles/sandbox.css';
import { CATEGORY } from '../data/categories.js';
import { esc, normalize, fmtNumber } from '../chem/format.js';
import { createT, isItalian } from '../i18n/index.js';
import { gfx } from '../gfx/preset.js';
import { icons } from '../ui/icons.js';
import {
  createSubstances, AMBIENT, T_MAX, SOLID, LIQUID, GAS, S, WOOD, COAL, CONCRETE, WALL, GENERATOR, SOURCE, DRAIN, WATER, SALT, OXIDE, CO2,
  phaseAt,
} from './substances.js';
import { World } from './world.js';
import { createRenderer, heatScale } from './render.js';
import { describeEvent, substanceLabel, ALIAS_FORMULA, substanceNotes, fmtCelsius, PHASE_NAME } from './describe.js';
import { PRESETS } from './presets.js';
import { shapeCells } from './shapes.js';
import { SANDBOX_STRINGS } from './sandbox-strings.js';
import { SANDBOX_DESCRIBE } from './describe-strings.js';
import { sig } from '../ui/spark-sig.js';

const t = createT(SANDBOX_STRINGS);

const GRIDS = { small: [240, 135], medium: [320, 180], large: [400, 225] };
const MAX_STEPS_PER_FRAME = 4;
const HEAT_RATE = 30; // K per passo con gli strumenti Calore / Freddo
const LOG_ITEMS = 6; // voci mostrate per gruppo nel registro delle reazioni
const PHASES_GROUP = createT(SANDBOX_DESCRIBE)('gPhase'); // deve coincidere con il gruppo di describe.js
const UNDO_MAX = 12;
const WISH = new Set([3639269274, 4052130931, 603149676, 2256958044, 753731565, 245870697]);

const tool = (key, icon, color) => ({ key, icon, color, name: t(key), text: t(`${key}Text`) });
const TOOLS = [
  tool('erase', 'eraser', '#e8eef6'),
  tool('heat', 'thermo', '#ff7a3d'),
  tool('cool', 'snow', '#7cc8ff'),
  tool('fire', 'flame', '#ffb340'),
  tool('spark', 'bolt', '#fff27a'),
  tool('neutron', 'atom', '#cfe6ff'),
  tool('bomb', 'explode', '#ff5d6c'),
];
// utilità per costruire e preparare gli esperimenti
const UTILITIES = [
  tool('stir', 'stir', '#b58cff'),
  tool('wind', 'wind', '#8fd3d8'),
  tool('equalize', 'ambient', '#e6c36a'),
  tool('extinguish', 'extinguisher', '#ff6a6a'),
  tool('pick', 'pipette', '#9aefff'),
];
const TOOL = Object.fromEntries([...TOOLS, ...UTILITIES].map((t) => [t.key, t]));
// strumenti che si possono applicare anche a una forma (linea, rettangolo, ellisse)
const SHAPE_TOOLS = new Set(['erase', 'heat', 'cool', 'equalize', 'extinguish']);
const mode = (key, icon, id) => ({ key, icon, name: t(`mode${id}`), text: t(`mode${id}Text`) });
const MODES = [
  mode('brush', 'brushMode', 'Brush'),
  mode('fill', 'bucket', 'Fill'),
  mode('line', 'line', 'Line'),
  mode('rect', 'rect', 'Rect'),
  mode('ellipse', 'ellipse', 'Ellipse'),
];

// materiali richiesti e composti utili agli esperimenti
const MATERIALS = [
  { id: WOOD, ctype: 0 },
  { id: COAL, ctype: 0 },
  { id: CONCRETE, ctype: 0 },
  { id: WALL, ctype: 0 },
  { id: GENERATOR, ctype: 0 },
  { id: SOURCE, ctype: 0 },
  { id: DRAIN, ctype: 0 },
];
const COMPOUNDS = (subs) => [
  { id: WATER, ctype: 0 },
  { id: subs.byKey.get('nacl').id, ctype: 0, label: t('salt') },
  { id: subs.byKey.get('fe2o3').id, ctype: 0, label: t('rust') },
  { id: CO2, ctype: 0, label: 'CO₂' },
];

const speedLabel = (v) => (isItalian() ? String(v).replace('.', ',') : String(v));
const helpRows = (rows) => rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

const TEMPLATE = () => `
  <header class="sbx-top">
    <button type="button" class="btn-ghost sbx-back" data-act="close">${icons.prev(16)}<span>${t('back')}</span><kbd>Esc</kbd></button>
    <div class="sbx-title">
      <span class="sbx-title__icon">${icons.sand(22)}</span>
      <div><p class="sbx-eyebrow">${t('eyebrow')}</p><h2 id="sbx-title">${t('title')}</h2></div>
    </div>
    <div class="sbx-transport">
      <button type="button" class="sbx-icon-btn sbx-play" data-act="play" data-help="sandbox.play" title="${t('playTitle')}"></button>
      <button type="button" class="sbx-icon-btn" data-act="step" data-help="sandbox.step" title="${t('stepTitle')}">${icons.step(16)}</button>
      <div class="segmented sbx-speed" role="group" aria-label="${t('speed')}" data-help="sandbox.speed">
        ${[0.5, 1, 2, 4].map((v) => `<button type="button" class="segmented__btn" data-speed="${v}" aria-pressed="${v === 1}">${speedLabel(v)}×</button>`).join('')}
      </div>
    </div>
    <div class="segmented sbx-view" role="group" aria-label="${t('view')}" data-help="sandbox.heatView">
      <button type="button" class="segmented__btn" data-view="normal" aria-pressed="true">${t('viewNormal')}</button>
      <button type="button" class="segmented__btn" data-view="heat" aria-pressed="false" title="${t('viewHeatTitle')}">${icons.thermo(14)}<span>${t('viewHeat')}</span></button>
    </div>
    <div class="sbx-top__end">
      <label class="sbx-toggle" data-help="sandbox.glow" title="${t('glowTitle')}"><input type="checkbox" data-opt="glow" ${gfx().sandbox.glow ? 'checked' : ''} /><span>${t('glow')}</span></label>
      <label class="sbx-toggle" data-help="sandbox.edges" title="${t('edgesTitle')}"><input type="checkbox" data-opt="edges" /><span>${t('edges')}</span></label>
      <div class="sbx-history" role="group" aria-label="${t('history')}" data-help="sandbox.undo">
        <button type="button" class="sbx-icon-btn" data-act="undo" title="${t('undoTitle')}" aria-label="${t('undo')}" disabled>${icons.undo(16)}</button>
        <button type="button" class="sbx-icon-btn" data-act="redo" title="${t('redoTitle')}" aria-label="${t('redo')}" disabled>${icons.redo(16)}</button>
      </div>
      <button type="button" class="btn-ghost" data-act="examples" data-help="sandbox.examples" aria-expanded="false">${icons.book(16)}<span>${t('examples')}</span></button>
      <button type="button" class="btn-ghost" data-act="clear" data-help="sandbox.clear" title="${t('clearTitle')}">${icons.broom(16)}<span>${t('clear')}</span></button>
      <button type="button" class="btn-icon" data-act="help" data-help="sandbox.help" aria-expanded="false" title="${t('help')}">${icons.keyboard(18)}</button>
      <button type="button" class="btn-ghost explain-toggle" data-action="explain" data-help="ui.explain" aria-pressed="false" title="${t('explainTitle')}">${icons.explain(16)}</button>
    </div>
  </header>

  <aside class="sbx-palette" aria-label="${t('palette')}">
    <p class="sbx-sec" data-help="sandbox.tools">${t('secTools')}</p>
    <div class="sbx-tools"></div>
    <p class="sbx-sec" data-help="sandbox.utilities">${t('secUtil')}</p>
    <div class="sbx-tools sbx-tools--util"></div>
    <p class="sbx-sec" data-help="sandbox.materials">${t('secMaterials')}</p>
    <div class="sbx-mats"></div>
    <p class="sbx-sec" data-help="term.compound">${t('secCompounds')}</p>
    <div class="sbx-comps"></div>
    <p class="sbx-sec" data-help="term.element">${t('secElements')}</p>
    <div class="sbx-search"><input type="search" placeholder="${t('searchElement')}" aria-label="${t('searchElementLabel')}" spellcheck="false" /></div>
    <div class="sbx-grid"></div>
    <p class="sbx-sec" data-help="sandbox.library">${t('secLibrary')} <span class="sbx-sec__count"></span></p>
    <div class="sbx-search sbx-libsearch"><input type="search" placeholder="${t('searchLibrary')}" aria-label="${t('searchLibraryLabel')}" spellcheck="false" /></div>
    <div class="sbx-lib"></div>
    <p class="sbx-lib__empty" hidden>${t('libraryEmpty')}</p>
    <p class="sbx-palette__hint">${t('paletteHint')}</p>
  </aside>

  <main class="sbx-stage">
    <canvas class="sbx-canvas" data-help="sandbox.canvas" aria-label="${t('canvas')}"></canvas>
    <div class="sbx-paused" hidden>${icons.pause(14)} ${t('paused')}</div>
    <div class="sbx-msg" role="status" hidden></div>
    <div class="sbx-intro" hidden>
      <h3>${t('introTitle')}</h3>
      <p>${t('introText')}</p>
      <div class="sbx-intro__list"></div>
      <button type="button" class="btn-ghost" data-act="intro-close">${t('introClose')}</button>
    </div>
  </main>

  <aside class="sbx-side" aria-live="polite">
    <section class="sbx-card"></section>
    <section class="sbx-log">
      <header class="sbx-log__head"><h3 data-help="sandbox.log">${t('logTitle')}</h3><button type="button" class="sbx-link" data-act="log-clear">${t('logClear')}</button></header>
      <div class="sbx-log__body"></div>
    </section>
  </aside>

  <footer class="sbx-status">
    <div class="sbx-brush" data-help="sandbox.brush">
      <span>${t('brush')}</span>
      <button type="button" class="sbx-mini" data-act="brush-" title="${t('brushSmaller')}">${icons.minus(14)}</button>
      <input type="range" min="0" max="30" value="3" aria-label="${t('brushSize')}" />
      <button type="button" class="sbx-mini" data-act="brush+" title="${t('brushBigger')}">${icons.plus(14)}</button>
      <output class="sbx-brush__val">3</output>
    </div>
    <div class="sbx-modes">
      <div class="segmented" role="group" aria-label="${t('drawMode')}">
        ${MODES.map((m) => `<button type="button" class="segmented__btn" data-mode="${m.key}" data-help="sandbox.mode.${m.key}" aria-pressed="${m.key === 'brush'}" title="${esc(m.name)}: ${esc(m.text)}" aria-label="${esc(m.name)}">${icons[m.icon](14)}</button>`).join('')}
      </div>
      <label class="sbx-toggle sbx-filled" hidden title="${t('filledTitle')}"><input type="checkbox" data-opt="filled" /><span>${t('filled')}</span></label>
    </div>
    <div class="sbx-hover" aria-live="off"></div>
    <div class="sbx-stats"></div>
    <label class="sbx-gridsize" data-help="sandbox.grid">${t('grid')}
      <select>
        <option value="small">240 × 135</option>
        <option value="medium" selected>320 × 180</option>
        <option value="large">400 × 225</option>
      </select>
    </label>
  </footer>

  <div class="sbx-pop sbx-examples" hidden role="dialog" aria-label="${t('examples')}">
    ${PRESETS.map((p) => `<button type="button" class="sbx-example" data-preset="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.description)}</span></button>`).join('')}
  </div>
  <div class="sbx-pop sbx-help" hidden role="dialog" aria-label="${t('help')}">
    <h4>${t('helpMouse')}</h4>
    <dl>${helpRows(t('helpMouseRows'))}</dl>
    <h4>${t('helpKeyboard')}</h4>
    <dl>${helpRows(t('helpKeys'))}</dl>
    <p>${t('helpNote')}</p>
  </div>`;

export function createSandbox(elements, { onClose } = {}) {
  const subs = createSubstances(elements);
  const L = subs.list;
  const world = new World(subs, ...GRIDS.medium, { seed: (Date.now() & 0x7fffffff) | 1 });
  const renderer = createRenderer(world, subs);

  const root = document.createElement('div');
  root.className = 'sbx';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'sbx-title');
  root.innerHTML = TEMPLATE();
  document.body.append(root);
  const $ = (s) => root.querySelector(s);
  const canvas = $('.sbx-canvas');
  const ctx = canvas.getContext('2d');

  const state = {
    sel: { kind: 'sub', id: subs.byKey.get('Fe').id, ctype: 0 },
    brush: 3,
    running: true,
    speed: 1,
    heatView: false,
    glow: gfx().sandbox.glow, // il preset Semplice parte senza bagliore
    place: { temp: AMBIENT, form: 'powder', dissolved: false },
    mode: 'brush', // brush | fill | line | rect | ellipse
    filled: false,
    wind: [0, 0], // direzione del vento (ultimo spostamento del cursore)
    windAge: 0,
    labels: [],
    hover: null, // { x, y } in celle
    drawing: null, // { mode: 'primary'|'erase', last: [x, y] }
    lastPoint: null,
    logKeys: [], // chiavi degli eventi nell'ordine in cui sono comparsi
    logSeen: 0,
    logFresh: new Map(), // chiave → istante in cui è comparsa
  };

  // ---------------------------------------------------------------- tavolozza
  const swatchColor = (id) => {
    const s = L[id];
    const c = id === SALT ? [238, 238, 240] : id === OXIDE ? [139, 58, 30] : s.colors[phaseAt(s, AMBIENT)] ?? s.colors[SOLID];
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };
  const swatch = (id, ctype = 0, short) => {
    const s = L[id];
    const label = substanceLabel(subs, id, ctype);
    return `<button type="button" class="sbx-item" data-id="${id}" data-ctype="${ctype}" style="--sw:${swatchColor(id)}" title="${esc(label.name)}${label.formula ? ` (${esc(label.formula)})` : ''}">
      <span class="sbx-item__sw"></span><span class="sbx-item__name">${esc(short ?? (id === GENERATOR ? t('generator') : id === WALL ? t('wall') : s.name))}</span></button>`;
  };
  const toolButton = (x) => `<button type="button" class="sbx-tool" data-tool="${x.key}" data-help="sandbox.tool.${x.key}" style="--tc:${x.color}" title="${esc(x.name)}: ${esc(x.text)}">${icons[x.icon](17)}<span>${x.name}</span></button>`;
  $('.sbx-tools:not(.sbx-tools--util)').innerHTML = TOOLS.map(toolButton).join('');
  $('.sbx-tools--util').innerHTML = UTILITIES.map(toolButton).join('');
  $('.sbx-mats').innerHTML = MATERIALS.map((m) => swatch(m.id, m.ctype)).join('');
  $('.sbx-comps').innerHTML = COMPOUNDS(subs).map((m) => swatch(m.id, m.ctype, m.label)).join('');
  // le 558 sostanze della libreria del laboratorio, per gruppi (alcune sono elementi o sostanze già presenti: H₂, H₂O…)
  const libItems = subs.library.entries.map((e) => {
    const id = subs.libraryId.get(e.id);
    const s = L[id];
    const formula = ALIAS_FORMULA[e.id] ?? (s.formula || substanceLabel(subs, id).formula || '');
    return { e, id, name: e.name, formula, search: normalize(`${e.name} ${e.aka ?? ''} ${formula} ${formula.replace(/[₀-₉]/g, (d) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(d))}`) };
  });
  $('.sbx-sec__count').textContent = `(${libItems.length})`;
  $('.sbx-lib').innerHTML = subs.groups
    .map((g) => {
      const items = libItems.filter((it) => it.e.group === g.key);
      if (!items.length) return '';
      return `<details class="sbx-libgroup" data-group="${g.key}"><summary>${esc(g.label)} <span>${items.length}</span></summary><div>${items
        .map((it) => `<button type="button" class="sbx-libitem" data-id="${it.id}" data-ctype="0" data-search="${esc(it.search)}" style="--sw:${swatchColor(it.id)}" title="${esc(it.name)} (${esc(it.formula)})">
            <span class="sbx-item__sw"></span><span class="sbx-libitem__name">${esc(it.name)}</span><span class="sbx-libitem__f">${esc(it.formula)}</span></button>`)
        .join('')}</div></details>`;
    })
    .join('');
  const libSearch = $('.sbx-libsearch input');
  libSearch.addEventListener('input', () => {
    const q = normalize(libSearch.value);
    let any = false;
    root.querySelectorAll('.sbx-libgroup').forEach((g) => {
      let hits = 0;
      g.querySelectorAll('.sbx-libitem').forEach((b) => {
        const hit = !q || b.dataset.search.includes(q);
        b.hidden = !hit;
        if (hit) hits++;
      });
      g.hidden = Boolean(q) && !hits;
      if (q) g.open = hits > 0 && hits <= 40;
      any ||= hits > 0;
    });
    $('.sbx-lib__empty').hidden = any;
  });
  libSearch.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && WISH.has(sig(libSearch.value))) {
      remember();
      let n = 0;
      for (let i = 0; i < world.type.length; i++) {
        if (world.type[i] === 82) {
          world.transmute(i, 79, world.temp[i]);
          n++;
        }
      }
      libSearch.value = '';
      libSearch.dispatchEvent(new Event('input'));
      window.dispatchEvent(new CustomEvent('tp3d:secret', { detail: { id: 'alchemy', n } }));
      ev.stopPropagation();
      return;
    }
    if (ev.key === 'Enter') {
      const first = root.querySelector('.sbx-libitem:not([hidden])');
      if (first && libSearch.value) selectSubstance(Number(first.dataset.id), 0);
    }
    if (ev.key === 'Escape') {
      libSearch.value = '';
      libSearch.dispatchEvent(new Event('input'));
      libSearch.blur();
    }
    ev.stopPropagation();
  });
  $('.sbx-grid').innerHTML = elements
    .map((el) => {
      const cat = CATEGORY[el.category] ?? CATEGORY.unknown;
      const s = L[el.z];
      const c = s.colors[phaseAt(s, AMBIENT)];
      return `<button type="button" class="sbx-cell" data-id="${el.z}" data-ctype="0" style="--c:${cat.color};--a:rgb(${c[0]},${c[1]},${c[2]});grid-column:${el.grid.x};grid-row:${el.grid.y}"
        title="${esc(el.name)} (Z = ${el.z})">${el.symbol}</button>`;
    })
    .join('');

  const palette = $('.sbx-palette');
  palette.addEventListener('click', (ev) => {
    const tb = ev.target.closest('[data-tool]');
    const b = ev.target.closest('[data-id]');
    if (tb) selectTool(tb.dataset.tool);
    else if (b) selectSubstance(Number(b.dataset.id), Number(b.dataset.ctype));
  });
  const search = $('.sbx-search input');
  search.addEventListener('input', () => {
    const q = normalize(search.value);
    root.querySelectorAll('.sbx-cell').forEach((b) => {
      const el = elements[Number(b.dataset.id) - 1];
      const match = !q || normalize(el.name).startsWith(q) || el.symbol.toLowerCase() === q || String(el.z) === q;
      b.classList.toggle('is-dim', !match);
    });
  });
  search.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const first = root.querySelector('.sbx-cell:not(.is-dim)');
      if (first && search.value) selectSubstance(Number(first.dataset.id), 0);
    }
    if (ev.key === 'Escape') {
      search.value = '';
      search.dispatchEvent(new Event('input'));
      search.blur();
    }
    ev.stopPropagation();
  });

  /** Temperatura di posa di default per lo stato scelto. */
  function tempFor(s, phase) {
    const mp = s.mp;
    const bp = s.bp;
    if (phase === SOLID) return mp > AMBIENT ? AMBIENT : Math.max(1, mp - Math.max(8, mp * 0.15));
    if (phase === LIQUID) return mp <= AMBIENT && AMBIENT < bp ? AMBIENT : Math.min(T_MAX, mp + Math.min(100, (bp - mp) / 3));
    return bp <= AMBIENT ? AMBIENT : Math.min(T_MAX, bp + 100);
  }

  function selectSubstance(id, ctype = 0) {
    const s = L[id];
    if (!s) return;
    state.sel = { kind: 'sub', id, ctype };
    state.place.temp = AMBIENT;
    state.place.form = s.defaultPowder && !(s.flags & S.BLOCK_ONLY) ? 'powder' : 'block';
    state.place.dissolved = false;
    renderSelection();
    // la voce selezionata nella libreria resta visibile
    const item = root.querySelector(`.sbx-libitem[data-id="${id}"]`);
    if (item && !item.closest('details').open && state.sel.kind === 'sub') item.closest('details').open = true;
  }

  function selectTool(key) {
    state.sel = { kind: 'tool', key };
    renderSelection();
  }

  function renderSelection() {
    const sel = state.sel;
    root.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('is-active', sel.kind === 'tool' && b.dataset.tool === sel.key));
    root.querySelectorAll('[data-id]').forEach((b) => b.classList.toggle('is-active', sel.kind === 'sub' && Number(b.dataset.id) === sel.id && Number(b.dataset.ctype) === sel.ctype));
    const card = $('.sbx-card');
    if (sel.kind === 'tool') {
      const x = TOOL[sel.key];
      card.innerHTML = `
        <div class="sbx-sel"><span class="sbx-sel__tile sbx-sel__tile--tool" style="--c:${x.color}">${icons[x.icon](26)}</span>
          <div><p class="sbx-sel__eyebrow">${t('selTool')}</p><h3>${x.name}</h3></div></div>
        <p class="sbx-sel__text">${esc(x.text)}</p>`;
      return;
    }
    const s = L[sel.id];
    const label = substanceLabel(subs, sel.id, sel.ctype);
    const cat = s.kind === 'element' ? CATEGORY[s.category] ?? CATEGORY.unknown : null;
    const phase = phaseAt(s, state.place.temp);
    const canSolid = Number.isFinite(s.mp) ? s.mp > 2 : true;
    const canLiquid = Number.isFinite(s.mp) && s.mp > 0 && s.bp > s.mp;
    const canGas = Number.isFinite(s.bp) && s.bp > 0;
    const blockOnly = s.flags & S.BLOCK_ONLY;
    const groupLabel = s.kind === 'compound' ? subs.groups.find((g) => g.key === s.group)?.label : null;
    const eyebrow = cat ? `${esc(cat.singular)} · Z = ${s.z}` : groupLabel ? esc(t('selLibrary', { group: groupLabel })) : { material: t('selMaterial'), compound: t('selCompound'), product: t('selProduct') }[s.kind] ?? '';
    const aqueous = s.flags & S.AQUEOUS;
    const soluble = s.flags & S.SOLUBLE;
    const dissolved = aqueous || (soluble && state.place.dissolved);
    const tile = cat
      ? `<span class="sbx-sel__tile" style="--c:${cat.color}"><i>${s.z}</i><b>${esc(s.symbol)}</b></span>`
      : `<span class="sbx-sel__tile sbx-sel__tile--mat" style="--sw:rgb(${(s.colors[SOLID] ?? [128, 128, 128]).slice(0, 3).join(',')})"></span>`;
    card.innerHTML = `
      <div class="sbx-sel">${tile}
        <div><p class="sbx-sel__eyebrow">${eyebrow}</p><h3>${esc(label.name)}${label.formula && label.formula !== s.symbol ? ` <span class="sbx-formula">${esc(label.formula)}</span>` : ''}</h3></div></div>
      ${
        blockOnly
          ? ''
          : aqueous
            ? `<div class="sbx-place"><p class="sbx-label">${t('placeAs')}</p><p class="sbx-place__aq">${t('aqueousOnly')}</p>
               <label class="sbx-temp">${t('temperature')} <input type="number" step="1" min="-273" max="99" value="${Math.round(state.place.temp - 273.15)}" /> °C</label></div>`
            : `<div class="sbx-place">
        <p class="sbx-label">${t('placeAs')}</p>
        <div class="segmented sbx-phase" role="group" aria-label="${t('phase')}" data-help="term.state">
          <button type="button" class="segmented__btn" data-phase="${SOLID}" aria-pressed="${!dissolved && phase === SOLID}" ${canSolid ? '' : 'disabled'}>${t('solid')}</button>
          <button type="button" class="segmented__btn" data-phase="${LIQUID}" aria-pressed="${!dissolved && phase === LIQUID}" ${canLiquid ? '' : 'disabled'}>${t('liquid')}</button>
          <button type="button" class="segmented__btn" data-phase="${GAS}" aria-pressed="${!dissolved && phase === GAS}" ${canGas ? '' : 'disabled'}>${t('gas')}</button>
          ${soluble ? `<button type="button" class="segmented__btn" data-phase="aq" aria-pressed="${Boolean(dissolved)}" title="${t('dissolvedTitle')}">${t('dissolved')}</button>` : ''}
        </div>
        <div class="segmented sbx-form" role="group" aria-label="${t('solidForm')}" ${!dissolved && phase === SOLID ? '' : 'hidden'}>
          <button type="button" class="segmented__btn" data-form="powder" aria-pressed="${state.place.form === 'powder'}">${t('powder')}</button>
          <button type="button" class="segmented__btn" data-form="block" aria-pressed="${state.place.form === 'block'}">${t('block')}</button>
        </div>
        <label class="sbx-temp">${t('temperature')} <input type="number" step="1" min="-273" max="${Math.round(T_MAX - 273.15)}" value="${Math.round(state.place.temp - 273.15)}" /> °C</label>
      </div>`
      }
      <ul class="sbx-notes">${substanceNotes(subs, sel.id, sel.ctype).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
  }

  $('.sbx-card').addEventListener('click', (ev) => {
    const ph = ev.target.closest('[data-phase]');
    const fm = ev.target.closest('[data-form]');
    if (ph && state.sel.kind === 'sub') {
      if (ph.dataset.phase === 'aq') {
        state.place.dissolved = true;
        state.place.temp = AMBIENT;
      } else {
        state.place.dissolved = false;
        state.place.temp = tempFor(L[state.sel.id], Number(ph.dataset.phase));
      }
      renderSelection();
    }
    if (fm) {
      state.place.form = fm.dataset.form;
      renderSelection();
    }
  });
  $('.sbx-card').addEventListener('change', (ev) => {
    if (!ev.target.matches('.sbx-temp input')) return;
    const c = Number(ev.target.value);
    if (Number.isFinite(c)) state.place.temp = Math.min(T_MAX, Math.max(0, c + 273.15));
    renderSelection();
  });
  $('.sbx-card').addEventListener('keydown', (ev) => ev.stopPropagation());

  // ---------------------------------------------------------------- canvas e disegno
  let off;
  let offCtx;
  let img;
  let pix;
  let glowCanvas;
  let glowCtx;
  let glowImg;
  let glowPix;
  let blurCanvas;
  let blurCtx;
  let wideCanvas;
  let wideCtx;
  let view = { scale: 4, cw: 0, ch: 0, dpr: 1 };
  // preset Professionale: immagine dettagliata con k×k pixel per cella (trame e rilievo)
  const DETAIL = gfx().sandbox.texture;
  let detail = null; // { k, canvas, ctx, img, pix, cls }

  function allocBuffers() {
    const { W, H } = world;
    const mk = () => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      return [c, c.getContext('2d')];
    };
    [off, offCtx] = mk();
    [glowCanvas, glowCtx] = mk();
    [blurCanvas, blurCtx] = mk();
    [wideCanvas, wideCtx] = mk();
    img = offCtx.createImageData(W, H);
    pix = new Uint32Array(img.data.buffer);
    glowImg = glowCtx.createImageData(W, H);
    glowPix = new Uint32Array(glowImg.data.buffer);
  }
  allocBuffers();

  function layout() {
    const stage = $('.sbx-stage');
    const r = stage.getBoundingClientRect();
    const pad = 16;
    const scale = Math.max(1, Math.min((r.width - pad * 2) / world.W, (r.height - pad * 2) / world.H));
    const cssW = Math.floor(world.W * scale);
    const cssH = Math.floor(world.H * scale);
    const dpr = Math.min(gfx().sandbox.dpr, window.devicePixelRatio || 1);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    view = { scale, cw: canvas.width, ch: canvas.height, dpr };
    if (DETAIL) {
      // circa un pixel dello schermo per pixel della trama, senza superare ~1 milione di pixel
      const k = Math.max(2, Math.min(4, Math.round((scale * dpr) / 1.5), Math.floor(Math.sqrt(1e6 / (world.W * world.H)))));
      if (!detail || detail.k !== k || detail.W !== world.W || detail.H !== world.H) {
        const c = document.createElement('canvas');
        c.width = world.W * k;
        c.height = world.H * k;
        const dctx = c.getContext('2d');
        const dimg = dctx.createImageData(c.width, c.height);
        detail = { k, W: world.W, H: world.H, canvas: c, ctx: dctx, img: dimg, pix: new Uint32Array(dimg.data.buffer), cls: new Uint8Array(world.W * world.H) };
      }
    }
  }
  window.addEventListener('resize', () => !root.hidden && layout());

  let frame = 0;
  let cellCount = 0;
  function render() {
    frame++;
    const fine = DETAIL && detail && detail.W === world.W && detail.H === world.H && !state.heatView;
    cellCount = renderer.draw(pix, glowPix, { heatView: state.heatView, frame, cls: fine ? detail.cls : null });
    const { cw, ch, dpr } = view;
    ctx.globalCompositeOperation = 'source-over';
    if (fine) {
      renderer.drawDetail(pix, detail.cls, detail.pix, detail.k, frame);
      detail.ctx.putImageData(detail.img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(detail.canvas, 0, 0, cw, ch);
    } else {
      offCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, cw, ch);
    }
    if (state.glow && !state.heatView) {
      glowCtx.putImageData(glowImg, 0, 0);
      blurCtx.clearRect(0, 0, world.W, world.H);
      blurCtx.filter = 'blur(2px)';
      blurCtx.drawImage(glowCanvas, 0, 0);
      blurCtx.filter = 'none';
      ctx.globalCompositeOperation = 'lighter';
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.75;
      ctx.drawImage(blurCanvas, 0, 0, cw, ch);
      if (DETAIL) {
        // Professionale: alone ampio intorno alle fonti di luce (fiamme, metalli incandescenti, scariche)
        wideCtx.clearRect(0, 0, world.W, world.H);
        wideCtx.filter = 'blur(6px)';
        wideCtx.drawImage(glowCanvas, 0, 0);
        wideCtx.filter = 'none';
        ctx.globalAlpha = 0.5;
        ctx.drawImage(wideCanvas, 0, 0, cw, ch);
      }
      ctx.globalAlpha = 0.45;
      ctx.drawImage(glowCanvas, 0, 0, cw, ch);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    const k = cw / world.W;
    // etichette degli esempi
    if (state.labels.length) {
      ctx.font = `600 ${Math.round(12 * dpr)}px 'IBM Plex Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const l of state.labels) {
        ctx.fillStyle = 'rgba(4,7,12,0.7)';
        const w = ctx.measureText(l.text).width + 10 * dpr;
        ctx.fillRect(l.x * k - w / 2, l.y * k - 9 * dpr, w, 18 * dpr);
        ctx.fillStyle = '#d6e2f2';
        ctx.fillText(l.text, l.x * k, l.y * k);
      }
    }
    const color = state.sel.kind === 'tool' ? TOOL[state.sel.key].color : '#9aefff';
    // anteprima della forma trascinata
    const shape = state.drawing?.shape ? state.drawing : null;
    if (shape) {
      const filled = isFilled();
      const r = filled ? 0 : state.brush;
      ctx.fillStyle = shape.mode === 'erase' ? '#ff6a6a' : color;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      for (const [x, y] of shapeCells(shape.shape, shape.start[0], shape.start[1], shape.cur[0], shape.cur[1], filled)) {
        if (!r) ctx.rect(x * k, y * k, k, k);
        else {
          ctx.moveTo((x + 0.5 + r + 0.5) * k, (y + 0.5) * k);
          ctx.arc((x + 0.5) * k, (y + 0.5) * k, (r + 0.5) * k, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // pennello
    if (state.hover) {
      const rad = state.sel.kind === 'tool' && state.sel.key === 'bomb' ? bombRadius() : state.mode === 'fill' ? 1.5 : state.brush + 0.5;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = Math.max(1, dpr);
      ctx.beginPath();
      ctx.arc((state.hover.x + 0.5) * k, (state.hover.y + 0.5) * k, Math.max(rad * k, 3 * dpr), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- strumenti
  const bombRadius = () => Math.max(5, state.brush * 2);

  function apply(x, y, mode, r = state.brush) {
    if (mode === 'erase') {
      world.erase(x, y, r);
      return;
    }
    const sel = state.sel;
    if (sel.kind === 'sub') {
      const temp = state.place.dissolved ? Math.min(state.place.temp, 372) : state.place.temp;
      world.paint(x, y, r, sel.id, { temp, powder: state.place.form === 'powder', ctype: sel.ctype, dissolved: state.place.dissolved });
      return;
    }
    switch (sel.key) {
      case 'erase': world.erase(x, y, r); break;
      case 'heat': world.heat(x, y, r, HEAT_RATE); break;
      case 'cool': world.heat(x, y, r, -HEAT_RATE); break;
      case 'fire': world.ignite(x, y, r); break;
      case 'spark': world.sparkAt(x, y, r); break;
      case 'neutron': world.emitNeutrons(x, y, r, Math.min(6, 1 + (r >> 1))); break;
      case 'stir': world.stir(x, y, r); break;
      case 'wind': world.blow(x, y, r, state.wind[0], state.wind[1]); break;
      case 'equalize': world.equalize(x, y, r); break;
      case 'extinguish': world.extinguish(x, y, r); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- annulla / ripeti
  const history = { undo: [], redo: [] };
  function syncHistory() {
    $('[data-act="undo"]').disabled = !history.undo.length;
    $('[data-act="redo"]').disabled = !history.redo.length;
  }
  /** Stato da annullare: la griglia e le etichette degli esempi, che vanno e vengono con il loro disegno. */
  const snapshot = () => ({ world: world.snapshot(), labels: state.labels });
  /** Da chiamare prima di ogni modifica fatta dall'utente (o dopo, con la copia presa prima). */
  function remember(snap = snapshot()) {
    history.undo.push(snap);
    if (history.undo.length > UNDO_MAX) history.undo.shift();
    history.redo.length = 0;
    syncHistory();
  }
  function resetHistory() {
    history.undo.length = 0;
    history.redo.length = 0;
    syncHistory();
  }
  function travel(from, to, label) {
    const snap = from.pop();
    if (!snap) return;
    to.push(snapshot());
    world.restore(snap.world);
    state.labels = snap.labels;
    syncHistory();
    message(label, 1500);
  }
  const undo = () => travel(history.undo, history.redo, t('undone'));
  const redo = () => travel(history.redo, history.undo, t('redone'));

  // ---------------------------------------------------------------- modi di disegno (forme, secchiello)
  /** La forma trascinata si usa con le sostanze e con gli strumenti che hanno senso su un'area. */
  const shapeable = (mode) => ['line', 'rect', 'ellipse'].includes(state.mode) && (mode === 'erase' || state.sel.kind === 'sub' || SHAPE_TOOLS.has(state.sel.key));
  const isFilled = () => state.filled && state.mode !== 'line';

  function commitShape(d) {
    const [x0, y0] = d.start;
    const [x1, y1] = d.cur;
    remember();
    const r = isFilled() ? 0 : state.brush;
    for (const [x, y] of shapeCells(d.shape, x0, y0, x1, y1, isFilled())) apply(x, y, d.mode, r);
  }

  function bucket(x, y, mode) {
    // niente da riempire (o da cancellare): nessun passo da annullare, e Ripeti resta com'era
    if (mode === 'erase') {
      const snap = snapshot();
      if (world.fill(x, y, 0)) remember(snap);
      return;
    }
    const sel = state.sel;
    if (sel.kind !== 'sub') {
      message(t('bucketNeedsSubstance'), 3000);
      return;
    }
    const snap = snapshot();
    const temp = state.place.dissolved ? Math.min(state.place.temp, 372) : state.place.temp;
    if (world.fill(x, y, sel.id, { temp, powder: state.place.form === 'powder', ctype: sel.ctype, dissolved: state.place.dissolved })) remember(snap);
  }

  function setMode(key) {
    state.mode = key;
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === key)));
    $('.sbx-filled').hidden = key !== 'rect' && key !== 'ellipse';
    state.drawing = null;
  }

  /** Applica lo strumento lungo il segmento (x0,y0)→(x1,y1), a passi di metà pennello. */
  function applyLine(x0, y0, x1, y1, mode) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const stepLen = Math.max(1, Math.floor(state.brush / 2));
    for (let s = stepLen; s <= n; s += stepLen) {
      const t = s / n;
      apply(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), mode);
    }
    if (n % stepLen) apply(x1, y1, mode);
  }

  function cellAt(ev) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - r.left) / r.width) * world.W);
    const y = Math.floor(((ev.clientY - r.top) / r.height) * world.H);
    return { x: Math.max(0, Math.min(world.W - 1, x)), y: Math.max(0, Math.min(world.H - 1, y)), inside: x >= 0 && y >= 0 && x < world.W && y < world.H };
  }

  function pick(x, y) {
    const c = world.cell(x, y);
    if (!c?.id) return;
    const s = L[c.id];
    if (s.flags & S.FIRE) {
      selectTool('fire');
      return;
    }
    selectSubstance(c.id, c.id === SALT || c.id === OXIDE ? c.ctype : 0);
    state.place.temp = c.temp;
    state.place.form = c.powder ? 'powder' : 'block';
    state.place.dissolved = c.dissolved;
    renderSelection();
  }

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
  canvas.addEventListener('pointerdown', (ev) => {
    const { x, y } = cellAt(ev);
    hideIntro();
    if (ev.button === 1 || (ev.button === 0 && ev.altKey)) {
      ev.preventDefault();
      pick(x, y);
      return;
    }
    if (ev.button !== 0 && ev.button !== 2) return;
    const mode = ev.button === 2 ? 'erase' : 'primary';
    const tool = state.sel.kind === 'tool' && mode === 'primary' ? state.sel.key : '';
    if (tool === 'pick') {
      pick(x, y);
      return;
    }
    canvas.setPointerCapture(ev.pointerId);
    if (tool === 'bomb') {
      remember();
      world.explode(x, y, bombRadius(), 1, 700);
      state.lastPoint = [x, y];
      return;
    }
    if (state.mode === 'fill') {
      bucket(x, y, mode);
      state.lastPoint = [x, y];
      return;
    }
    if (shapeable(mode)) {
      state.drawing = { mode, shape: state.mode, start: [x, y], cur: [x, y], last: [x, y] };
      return;
    }
    remember();
    state.wind = [0, 0];
    state.windAge = 0;
    if (ev.shiftKey && state.lastPoint) applyLine(state.lastPoint[0], state.lastPoint[1], x, y, mode);
    else apply(x, y, mode);
    state.drawing = { mode, last: [x, y] };
    state.lastPoint = [x, y];
  });
  canvas.addEventListener('pointermove', (ev) => {
    const c = cellAt(ev);
    state.hover = c.inside ? { x: c.x, y: c.y } : null;
    const d = state.drawing;
    if (!d) return;
    if (d.shape) {
      d.cur = [c.x, c.y];
      return;
    }
    const [lx, ly] = d.last;
    if (lx !== c.x || ly !== c.y) {
      if (state.sel.kind === 'tool' && state.sel.key === 'wind') {
        state.wind = [c.x - lx, c.y - ly];
        state.windAge = 0;
      }
      applyLine(lx, ly, c.x, c.y, d.mode);
      d.last = [c.x, c.y];
      state.lastPoint = [c.x, c.y];
    }
  });
  const endDraw = () => (state.drawing = null);
  canvas.addEventListener('pointerup', () => {
    const d = state.drawing;
    if (d?.shape) {
      commitShape(d);
      state.lastPoint = d.cur;
    }
    endDraw();
  });
  canvas.addEventListener('pointercancel', endDraw);
  canvas.addEventListener('pointerleave', () => (state.hover = null));
  canvas.addEventListener(
    'wheel',
    (ev) => {
      ev.preventDefault();
      setBrush(state.brush + (ev.deltaY < 0 ? 1 : -1));
    },
    { passive: false },
  );

  const brushInput = $('.sbx-brush input');
  function setBrush(v) {
    state.brush = Math.max(0, Math.min(30, v));
    brushInput.value = String(state.brush);
    $('.sbx-brush__val').textContent = String(state.brush);
  }
  brushInput.addEventListener('input', () => setBrush(Number(brushInput.value)));

  // ---------------------------------------------------------------- barra superiore
  function setRunning(v) {
    state.running = v;
    const b = $('.sbx-play');
    b.innerHTML = v ? icons.pause(16) : icons.play(16);
    b.setAttribute('aria-label', v ? t('pause') : t('resume'));
    b.classList.toggle('is-paused', !v);
    $('.sbx-paused').hidden = v;
  }
  function setHeatView(v) {
    state.heatView = v;
    root.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.view === 'heat') === v)));
  }
  function setGlow(v) {
    state.glow = v;
    $('[data-opt="glow"]').checked = v;
  }

  function closePops() {
    root.querySelectorAll('.sbx-pop').forEach((p) => (p.hidden = true));
    root.querySelectorAll('[data-act="examples"], [data-act="help"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  function togglePop(sel, btnSel, show) {
    const box = $(sel);
    show ??= box.hidden;
    closePops();
    box.hidden = !show;
    $(btnSel).setAttribute('aria-expanded', String(show));
  }

  let msgTimer = 0;
  function message(text, duration = 5000) {
    const el = $('.sbx-msg');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => (el.hidden = true), duration);
  }

  function clearAll() {
    remember();
    world.clear();
    state.labels = [];
    state.logKeys = [];
    state.logSeen = -1;
    renderLog();
  }

  function loadPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    clearAll(); // anche l'esempio si può annullare
    const out = p.build(world, subs) ?? {};
    state.labels = out.labels ?? [];
    togglePop('.sbx-examples', '[data-act="examples"]', false);
    hideIntro();
    setRunning(true);
    message(`${p.name}. ${out.hint ?? ''}`, 9000);
  }

  root.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-act]');
    const sp = ev.target.closest('[data-speed]');
    const vw = ev.target.closest('[data-view]');
    const pr = ev.target.closest('[data-preset]');
    const md = ev.target.closest('[data-mode]');
    if (md) setMode(md.dataset.mode);
    if (sp) {
      state.speed = Number(sp.dataset.speed);
      root.querySelectorAll('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(b === sp)));
    }
    if (vw) setHeatView(vw.dataset.view === 'heat');
    if (pr) loadPreset(pr.dataset.preset);
    if (!a) {
      if (!ev.target.closest('.sbx-pop')) closePops();
      return;
    }
    switch (a.dataset.act) {
      case 'close': close(); break;
      case 'play': setRunning(!state.running); break;
      case 'step': setRunning(false); stepOnce(); break;
      case 'examples': togglePop('.sbx-examples', '[data-act="examples"]'); break;
      case 'help': togglePop('.sbx-help', '[data-act="help"]'); break;
      case 'clear': clearAll(); message(t('cleared'), 2500); break;
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'log-clear': world.events.clear(); state.logKeys = []; state.logSeen = -1; renderLog(); break;
      case 'brush-': setBrush(state.brush - 1); break;
      case 'brush+': setBrush(state.brush + 1); break;
      case 'intro-close': hideIntro(); break;
      default: break;
    }
  });
  root.addEventListener('change', (ev) => {
    const opt = ev.target.dataset?.opt;
    if (opt === 'glow') state.glow = ev.target.checked;
    if (opt === 'edges') world.openEdges = ev.target.checked;
    if (opt === 'filled') state.filled = ev.target.checked;
    if (ev.target.matches('.sbx-gridsize select')) {
      const [W, H] = GRIDS[ev.target.value];
      world.resize(W, H);
      resetHistory();
      world.openEdges = $('[data-opt="edges"]').checked;
      state.labels = [];
      state.logKeys = [];
      state.logSeen = -1;
      allocBuffers();
      layout();
      renderLog();
    }
  });

  // ---------------------------------------------------------------- introduzione
  const FEATURED = ['alcalini', 'fiamma', 'termite', 'fissione', 'neon', 'idrogeno'];
  $('.sbx-intro__list').innerHTML = FEATURED.map((id) => PRESETS.find((p) => p.id === id))
    .map((p) => `<button type="button" class="sbx-example" data-preset="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.description)}</span></button>`)
    .join('');
  const hideIntro = () => ($('.sbx-intro').hidden = true);

  // ---------------------------------------------------------------- registro delle reazioni
  function renderLog() {
    const body = $('.sbx-log__body');
    for (const k of world.events.keys()) {
      if (!state.logKeys.includes(k)) {
        state.logKeys.push(k);
        state.logFresh.set(k, performance.now());
      }
    }
    state.logKeys = state.logKeys.filter((k) => world.events.has(k));
    if (!state.logKeys.length) {
      body.innerHTML = `<p class="sbx-log__empty">${esc(t('logEmpty'))}</p>`;
      return;
    }
    // gruppi nell'ordine in cui sono comparsi (prima la causa, poi le conseguenze); dentro, i più recenti in alto
    const groups = new Map();
    for (const k of state.logKeys) {
      const d = describeEvent(subs, k);
      if (!d) continue;
      if (!groups.has(d.group)) groups.set(d.group, []);
      groups.get(d.group).unshift([k, d]);
    }
    const order = [...groups.keys()].sort((a, b) => (a === PHASES_GROUP) - (b === PHASES_GROUP)); // i cambiamenti di stato in fondo
    const now = performance.now();
    body.innerHTML = order
      .map((g) => {
        const all = groups.get(g);
        const items = all.slice(0, LOG_ITEMS);
        const more = all.length - items.length;
        return `<section class="sbx-log__group"><h4>${esc(g)}</h4><ul>${items
          .map(([k, d]) => `<li class="${now - (state.logFresh.get(k) ?? 0) < 1500 ? 'is-new' : ''}">
            <div class="sbx-log__title"><span>${esc(d.title)}</span><b>×${fmtNumber(world.events.get(k))}</b></div>
            <div class="sbx-log__eq">${esc(d.equation)}</div>${d.note ? `<p>${esc(d.note)}</p>` : ''}</li>`)
          .join('')}</ul>${more > 0 ? `<p class="sbx-log__more">${t('logMore', { n: more })}</p>` : ''}</section>`;
      })
      .join('');
  }

  // ---------------------------------------------------------------- informazioni sotto il cursore
  function renderHover() {
    const el = $('.sbx-hover');
    const h = state.hover;
    const c = h ? world.cell(h.x, h.y) : null;
    if (!c) {
      el.textContent = '';
      return;
    }
    if (!c.id) {
      const parts = world.particles.filter((p) => Math.floor(p.x) === h.x && Math.floor(p.y) === h.y);
      el.innerHTML = parts.length ? `<b>${parts[0].kind === 1 ? t('hNeutron') : t('hRadiation')}</b>` : `<span class="muted">${t('hAir')} · ${fmtCelsius(AMBIENT)}</span>`;
      return;
    }
    const s = L[c.id];
    const label = substanceLabel(subs, c.id, c.ctype);
    if (c.id === WATER && c.phase === GAS) label.name = t('hSteam');
    const sym = s.kind === 'element' ? `<span class="sbx-hover__sym">${esc(s.symbol)}</span>` : '';
    const state_ = s.flags & S.FIRE ? t('hFlame') : c.fume ? t('hFume') : c.dissolved || s.flags & S.AQUEOUS ? (c.phase === SOLID ? t('hFrozenSolution') : t('hSolution')) : c.phase === SOLID ? (s.flags & S.BLOCK_ONLY ? t('hSolid') : c.powder ? t('hPowder') : t('hBlock')) : PHASE_NAME[c.phase];
    const extra = [c.burning ? t('hBurning') : '', c.spark ? t('hCurrent') : ''].filter(Boolean).join(' · ');
    const tShow = s.flags & S.WALL ? '' : ` · <b>${fmtCelsius(c.temp)}</b>`;
    el.innerHTML = `${sym}<b>${esc(label.name)}</b>${label.formula && label.formula !== s.symbol ? ` <span class="muted">${esc(label.formula)}</span>` : ''} · ${state_}${tShow}${extra ? ` · <span class="sbx-hover__hot">${extra}</span>` : ''}
      <span class="sbx-hover__bar" style="--t:${heatScale(c.temp)}"></span>`;
  }

  let fps = 60;
  function renderStats() {
    $('.sbx-stats').textContent = t('stats', { cells: fmtNumber(cellCount), parts: fmtNumber(world.particles.length), fps: Math.round(fps) });
  }

  // ---------------------------------------------------------------- ciclo
  let raf = 0;
  let lastT = 0;
  let acc = 0;
  let lastUi = 0;

  function stepOnce() {
    const d = state.drawing;
    if (d && !d.shape) {
      const [x, y] = d.last;
      if (++state.windAge > 6) state.wind = [0, 0]; // il cursore è fermo: il vento soffia dal centro
      apply(x, y, d.mode);
    }
    world.step();
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
    if (state.running) {
      acc += dt * 60 * state.speed;
      let n = 0;
      while (acc >= 1 && n < MAX_STEPS_PER_FRAME) {
        stepOnce();
        acc -= 1;
        n++;
      }
      if (acc > MAX_STEPS_PER_FRAME) acc = 0;
    }
    render();
    if (t - lastUi > 200) {
      lastUi = t;
      renderHover();
      renderStats();
      if (world.eventCount !== state.logSeen) {
        state.logSeen = world.eventCount;
        renderLog();
      }
    }
  }

  // ---------------------------------------------------------------- tastiera
  function onKey(ev) {
    if (root.hidden) return;
    const typing = ev.target instanceof HTMLElement && ev.target.matches('input[type="search"], input[type="number"], select');
    if (ev.key === 'Escape') {
      ev.preventDefault();
      if (root.querySelector('.sbx-pop:not([hidden])')) closePops();
      else if (!$('.sbx-intro').hidden) hideIntro();
      else close();
      return;
    }
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && !typing && !ev.altKey && (ev.key.toLowerCase() === 'z' || ev.key.toLowerCase() === 'y')) {
      ev.preventDefault();
      if (ev.key.toLowerCase() === 'y' || ev.shiftKey) redo();
      else undo();
      return;
    }
    if (typing || mod || ev.altKey) return;
    const key = ev.key.toLowerCase();
    if (key === ' ') {
      ev.preventDefault();
      if (ev.target instanceof HTMLButtonElement) ev.target.blur(); // niente doppio comando dal pulsante col focus
      setRunning(!state.running);
    } else if (key === 'f') {
      setRunning(false);
      stepOnce();
    } else if (key === 'h') setHeatView(!state.heatView);
    else if (key === 'g') setGlow(!state.glow);
    else if (key === 'e') selectTool('erase');
    else if (key === 'm') selectTool('stir');
    else if (key === 'w') selectTool('wind');
    else if (key === '[' || key === '-') setBrush(state.brush - 1);
    else if (key === ']' || key === '+') setBrush(state.brush + 1);
  }
  window.addEventListener('keydown', onKey);

  // solo in sviluppo: accesso dalla console
  if (import.meta.env.DEV) window.__sandbox = { world, subs, state, loadPreset };

  // ---------------------------------------------------------------- apertura / chiusura
  let lastFocus = null;
  let opened = false;
  let closing = 0; // timer della chiusura animata: riaprendo subito non deve più nascondere la sandbox
  function open(z) {
    clearTimeout(closing);
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.remove('is-leaving');
    root.classList.add('is-entering');
    setTimeout(() => root.classList.remove('is-entering'), 700);
    layout();
    if (z) selectSubstance(z, 0);
    if (!opened) {
      opened = true;
      if (!z) selectSubstance(subs.byKey.get('Fe').id, 0);
      $('.sbx-intro').hidden = false;
      setRunning(true);
      renderLog();
    }
    lastT = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    requestAnimationFrame(() => $('.sbx-back').focus({ preventScroll: true }));
  }

  function close() {
    if (root.hidden) return;
    root.classList.add('is-leaving');
    clearTimeout(closing);
    closing = setTimeout(() => {
      root.hidden = true;
      root.classList.remove('is-leaving');
      cancelAnimationFrame(raf);
      state.drawing = null;
      lastFocus?.focus?.({ preventScroll: true });
      onClose?.();
    }, 220);
  }

  setBrush(state.brush);
  renderSelection();
  return { open, close, isOpen: () => !root.hidden };
}
