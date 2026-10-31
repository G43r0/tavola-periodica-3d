// Laboratorio molecolare (schermo intero). Caricato su richiesta da main.js.
// Collega il motore chimico (chem/), la scena 3D (bench-scene.js), la tavolozza e la scheda della molecola.
import '../styles/lab.css';
import { CATEGORY } from '../data/categories.js';
import { MOLECULES, MOLECULE_GROUPS } from './data/molecules.js';
import { createLabElements, TIER, ionicRadius } from './chem/elements-lab.js';
import { Bench } from './chem/molecule.js';
import { analyzeLewis } from './chem/lewis.js';
import { checkBond, checkOrder, bondCharacter, ORDER_NAME, Art } from './chem/bonding.js';
import { createRelaxer, initialLayout, vsepr } from './chem/geometry.js';
import { createLibraryIndex, covalentParts, displayFormula, chargeText, formulaKey, normalizeName, subscript, signature } from './chem/identify.js';
import { combine, entryBonds, entryEnergy, ionicDecomposition } from './chem/combine.js';
import { parseFormula, looksLikeSmiles, splitFormulaList, speciesAtoms, speciesAtomCount } from './chem/formula.js';
import { parseSmiles } from './chem/smiles.js';
import { ionName, ionicCompoundName, binaryCovalentName, linearAlkaneName } from './chem/naming.js';
import { createBenchScene } from './bench-scene.js';
import { createPalette } from './palette.js';
import { unitPanelHtml, summaryHtml } from './molecule-panel.js';
import { REACTIONS } from './data/reactions.js';
import { speciesInfo, reactionEnthalpy } from './chem/reactions.js';
import { planReactions, diagnose, modelReaction, graphBondEnergy, reactionDH } from './chem/simulate.js';
import { bondEnergy } from './chem/bond-energy.js';
import { reactionListHtml, reactionResultsHtml, reactionGroupBodyHtml, reactionCardHtml, reactionTitle, equationHtml, equationText, stepEquation, simulationReportHtml, MAX_COEF } from './reaction-panel.js';
import { esc, fmtNumber } from '../chem/format.js';
import { icons } from '../ui/icons.js';
import { createT } from '../i18n/index.js';
import { LAB_STRINGS } from './lab-strings.js';

const tr = createT(LAB_STRINGS);
const MAX_ATOMS = 150;
const MAX_SIM_ROUNDS = 8;
// elementi il cui stato standard è una molecola (H₂, N₂, O₂, alogeni): un loro atomo isolato non ha ΔHf° = 0
const MOLECULAR_ELEMENTS = new Set([1, 7, 8, 9, 17, 35, 53]);
/** Nome in minuscolo dentro una frase, senza toccare i numeri romani: "Cloruro di ferro(III)" → "cloruro di ferro(III)". */
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const PALETTE_W = 318;
const PANEL_W = 356;

const TEMPLATE = () => `
  <div class="lab-stage" data-help="lab.bench"></div>
  <header class="lab-top">
    <button type="button" class="btn-ghost lab-back" data-act="close">${icons.prev(16)}<span>${tr('back')}</span><kbd>Esc</kbd></button>
    <div class="lab-title">
      <span class="lab-title__icon">${icons.flask(22)}</span>
      <div><p class="lab-eyebrow">${tr('eyebrow')}</p><h2 id="lab-title">${tr('title')}</h2></div>
    </div>
    <div class="segmented lab-modes" role="group" aria-label="${tr('tool')}">
      <button type="button" class="segmented__btn" data-mode="move" data-help="lab.move" aria-pressed="true" title="${tr('moveTitle')}">${icons.move(15)}<span>${tr('move')}</span></button>
      <button type="button" class="segmented__btn" data-mode="bond" data-help="lab.bond" aria-pressed="false" title="${tr('bondTitle')}">${icons.link(15)}<span>${tr('bond')}</span></button>
      <button type="button" class="segmented__btn" data-mode="cut" data-help="lab.cut" aria-pressed="false" title="${tr('cutTitle')}">${icons.scissors(15)}<span>${tr('cut')}</span></button>
    </div>
    <div class="lab-top__end">
      <button type="button" class="btn-ghost lab-formula-toggle" data-act="formula" data-help="lab.formula" aria-expanded="false" title="${tr('formulaTitle')}">${icons.clipboard(16)}<span>${tr('formula')}</span></button>
      <button type="button" class="btn-ghost lab-rx-toggle" data-act="reactions" data-help="lab.reactions" aria-pressed="false" title="${tr('reactionsTitle')}">${icons.flask(16)}<span>${tr('reactions')}</span></button>
      <button type="button" class="btn-ghost" data-act="examples" data-help="lab.examples" aria-expanded="false">${icons.book(16)}<span>${tr('examples')}</span></button>
      <label class="lab-toggle" data-help="lab.labels"><input type="checkbox" data-opt="labels" checked /><span>${tr('labels')}</span></label>
      <label class="lab-toggle" data-help="term.lonePair"><input type="checkbox" data-opt="lone" checked /><span>${tr('lone')}</span></label>
      <button type="button" class="btn-ghost explain-toggle" data-action="explain" data-help="ui.explain" aria-pressed="false" title="F1">${icons.explain(16)}</button>
    </div>
  </header>
  <aside class="lab-palette" aria-label="${tr('elements')}"></aside>
  <aside class="lab-panel" aria-live="polite"></aside>
  <div class="lab-dock" role="toolbar" aria-label="${tr('actions')}">
    <button type="button" class="lab-act lab-act--primary" data-act="combine" data-help="lab.combine" title="${tr('combineTitle')}">${icons.merge(18)}<span>${tr('combine')}</span></button>
    <button type="button" class="lab-act lab-act--sim" data-act="simulate" data-help="lab.simulate" title="${tr('simulateTitle')}">${icons.bolt(18)}<span>${tr('simulate')}</span></button>
    <button type="button" class="lab-act" data-act="separate" data-help="lab.separate" title="${tr('separateTitle')}">${icons.split(18)}<span>${tr('separate')}</span></button>
    <button type="button" class="lab-act" data-act="ions" data-help="term.ion" hidden title="${tr('ionsTitle')}">${icons.split(18)}<span>${tr('ions')}</span></button>
    <span class="lab-dock__sep"></span>
    <button type="button" class="lab-act lab-act--icon" data-act="add-e" data-help="lab.charge" title="${tr('addETitle')}">${icons.plus(16)}<span>e⁻</span></button>
    <button type="button" class="lab-act lab-act--icon" data-act="remove-e" data-help="lab.charge" title="${tr('removeETitle')}">${icons.minus(16)}<span>e⁻</span></button>
    <span class="lab-dock__sep"></span>
    <button type="button" class="lab-act lab-act--icon" data-act="delete" data-help="lab.delete" title="${tr('deleteTitle')}">${icons.trash(17)}</button>
    <button type="button" class="lab-act lab-act--icon" data-act="clear" data-help="lab.clear" title="${tr('clearTitle')}">${icons.broom(17)}</button>
    <button type="button" class="lab-act lab-act--icon" data-act="undo" data-help="lab.undo" title="${tr('undoTitle')}">${icons.undo(17)}</button>
    <button type="button" class="lab-act lab-act--icon" data-act="redo" data-help="lab.undo" title="${tr('redoTitle')}">${icons.redo(17)}</button>
  </div>
  <div class="lab-examples" hidden role="dialog" aria-label="${tr('examplesLabel')}">
    <div class="lex-search"><input type="search" placeholder="${tr('examplesSearch', { n: MOLECULES.length })}" aria-label="${tr('examplesSearchLabel')}" spellcheck="false" /></div>
    ${MOLECULE_GROUPS.map(
      (g) => `<section data-group="${g.key}"><h4>${g.label}</h4><div>${MOLECULES.filter((m) => m.group === g.key)
        .map((m) => `<button type="button" class="chip-btn" data-example="${m.id}">${esc(m.name)}</button>`)
        .join('')}</div></section>`,
    ).join('')}
    <p class="lex-empty" hidden>${tr('examplesEmpty')}</p>
  </div>
  <div class="lab-formula" hidden role="dialog" aria-labelledby="lf-title">
    <form class="lf-form" autocomplete="off">
      <label class="lf-title" id="lf-title" for="lf-input">${tr('lfTitle')}</label>
      <div class="lf-row">
        <input id="lf-input" class="lf-input" type="text" spellcheck="false" autocapitalize="off"
          placeholder="${tr('lfPlaceholder')}" />
        <button type="submit" class="lab-act lab-act--primary" data-lf="build" title="${tr('buildTitle')}">${icons.merge(16)}<span>${tr('build')}</span></button>
        <button type="button" class="lab-act" data-lf="atoms" title="${tr('atomsOnlyTitle')}">${tr('atomsOnly')}</button>
      </div>
    </form>
    <div class="lf-preview" aria-live="polite"></div>
    <div class="lf-foot">
      <div class="lf-examples">${['H2O', 'H2SO4', 'Ca(OH)2', 'C6H12O6', 'CuSO4·5H2O', 'NH4+', '2 H2 + O2', 'KMnO4', 'C8H10N4O2', 'CCO']
        .map((f) => `<button type="button" class="chip-btn" data-lf-example="${esc(f)}">${esc(f)}</button>`)
        .join('')}</div>
    </div>
    <p class="lf-help">${tr('lfHelp')}</p>
  </div>
  <div class="lab-msg" role="status" hidden></div>
  <div class="lab-tip" hidden></div>`;

export function createLab(elements, { onClose }) {
  const lab = createLabElements(elements, CATEGORY);
  const library = createLibraryIndex(lab, MOLECULES);
  const bench = new Bench();

  const root = document.createElement('div');
  root.className = 'lab';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'lab-title');
  root.innerHTML = TEMPLATE();
  document.body.append(root);
  const $ = (s) => root.querySelector(s);
  const panel = $('.lab-panel');

  const state = {
    mode: 'move',
    selected: new Set(), // atomi "àncora": sono selezionate le unità che li contengono
    pending: null, // primo atomo scelto con lo strumento Lega
    units: [],
    unitOfAtom: new Map(),
    relaxers: new Map(),
    alternatives: new Map(), // chiave unità → isomeri proposti da Combina
    opts: { labels: true, lone: true },
    rx: { open: false, current: null, practice: false, coeffs: null, query: '', groups: new Set() },
    anim: null, // animazione di una reazione in corso
    starting: null, // reagenti appena messi sul banco: timer della partenza dell'animazione
    sim: null, // ultima «Simula reazione»: passi, molecole avanzate, diagnosi
  };
  /** Reazione (anche in partenza) o simulazione in corso: il banco non si modifica. */
  const busy = () => Boolean(state.anim || state.starting) || state.sim?.status === 'running';

  // reazioni caricate: specie con formula da mostrare, coefficienti ed entalpia
  const reactions = REACTIONS.map((r) => {
    const load = (list) =>
      list.map(([, key]) => {
        const sp = speciesInfo(lab, library, elements, key);
        sp.display = sp.formula ?? (sp.element ? sp.formula : displayFormula(lab, sp.atoms, 0, { ionic: sp.ionic }));
        return sp;
      });
    const re = { r, reactants: load(r.reactants), products: load(r.products), rc: r.reactants.map(([c]) => c), pc: r.products.map(([c]) => c) };
    re.enthalpy = reactionEnthalpy(lab, re.reactants, re.products, re.rc, re.pc);
    return re;
  });
  const reactionById = new Map(reactions.map((re) => [re.r.id, re]));
  const history = { past: [], future: [] };

  // ---------------------------------------------------------------- scena
  let scene;
  try {
    scene = createBenchScene($('.lab-stage'), {
      lab,
      bench,
      mode: () => state.mode,
      tipEl: $('.lab-tip'),
      radiusOf,
      chargeLabel,
      loneOf,
      unitOf: (id) => state.unitOfAtom.get(id)?.ids ?? [id],
      translate,
      previewBond,
      hoverHtml,
      onDragEnd,
      onClickAtom,
      onClickBond,
      onRightClickBond: (id) => breakBond(id),
      onClickEmpty: () => {
        if (state.pending) setPending(null);
        else select([]);
      },
      onDropElement: (z, p) => addAtom(z, p),
    });
  } catch (err) {
    console.error(err);
    $('.lab-stage').innerHTML = `<p class="lab-error">${tr('noWebgl')}</p>`;
    return { open: () => (root.hidden = false), close: () => (root.hidden = true), isOpen: () => !root.hidden };
  }
  const { engine } = scene;

  createPalette($('.lab-palette'), elements, lab, { onPick: (z) => addAtom(z) });

  // ---------------------------------------------------------------- analisi delle unità
  function radiusOf(id) {
    const a = bench.atoms.get(id);
    const info = lab.get(a.z);
    const la = state.unitOfAtom.get(id)?.lewisByAtom.get(id);
    const isIon = la && la.formalCharge !== 0 && bench.covalentValence(id) === 0;
    const r = (isIon && ionicRadius(info, la.formalCharge)) || info.rCov;
    return Math.min(0.2 + 0.27 * (r / 100), 0.8);
  }

  function chargeLabel(id) {
    const la = state.unitOfAtom.get(id)?.lewisByAtom.get(id);
    if (!la || !la.formalCharge) return '';
    const q = la.formalCharge;
    return q > 0 ? (q === 1 ? '+' : `${q}+`) : q === -1 ? '−' : `${-q}−`;
  }

  function loneOf(id) {
    const u = state.unitOfAtom.get(id);
    if (!u) return null;
    const r = state.relaxers.get(u.key);
    return r?.relaxer.lone[u.ids.indexOf(id)] ?? null;
  }

  function analyze() {
    state.unitOfAtom.clear();
    state.units = bench.components(true).map((ids) => {
      const desc = bench.describe(ids);
      const frags = covalentParts(desc.atoms, desc.bonds);
      const lewisAtoms = new Array(ids.length);
      const lewisFrags = [];
      let invalid = null;
      for (const f of frags) {
        const lw = analyzeLewis(lab, f.atoms, f.bonds);
        lewisFrags.push(lw);
        if (lw.invalid) invalid = lw.invalid;
        f.indices.forEach((ui, k) => (lewisAtoms[ui] = lw.atoms[k]));
      }
      const charge = desc.atoms.reduce((s, a) => s + a.charge, 0);
      const ionic = desc.ionic.length > 0;
      const ident = library.identify(desc.atoms, desc.bonds);
      const formula = (ident.exact || ident.byFormula) && ident.entry.formula
        ? ident.entry.formula + chargeText(charge)
        : ionic ? ionicFormula(frags) + chargeText(charge) : displayFormula(lab, desc.atoms, charge, { ionic });
      const tier = Math.max(...desc.atoms.map((a) => lab.get(a.z).tier));
      let generatedName = null;
      if (!ident.entry && !ionic && !charge && ids.length > 1 && frags.length === 1) {
        // molecola binaria non in libreria: nome sistematico (es. pentacloruro di fosforo)
        const counts = new Map();
        for (const a of desc.atoms) counts.set(lab.get(a.z), (counts.get(lab.get(a.z)) || 0) + 1);
        generatedName = binaryCovalentName(counts) ?? linearAlkaneName(desc.atoms, desc.bonds);
      } else if (!ident.exact && ionic) {
        generatedName = ionicCompoundName(
          frags.map((f) => {
            const id = f.atoms.length > 1 ? library.identify(f.atoms, f.bonds) : null;
            return { info: f.atoms.length === 1 ? lab.get(f.atoms[0].z) : null, charge: f.charge, libraryName: id?.exact ? id.entry.name : null };
          }),
        );
      } else if (!ident.exact && ids.length === 1 && charge) {
        const info = lab.get(desc.atoms[0].z);
        generatedName = tr('ionName', { name: ionName(info, charge) });
      }
      const u = {
        key: ids.join(','),
        ids,
        desc,
        frags,
        lewisAtoms,
        lewisFrags,
        lewisByAtom: new Map(ids.map((id, i) => [id, lewisAtoms[i]])),
        invalid,
        charge,
        ionic,
        ident,
        formula,
        tier,
        unverified: tier !== TIER.MAIN,
        generatedName,
        vs: vsepr(lab, desc, { atoms: lewisAtoms }),
        positions: ids.map((id) => bench.atoms.get(id).pos),
      };
      u.label = ident.entry
        ? `${ident.entry.name}${ident.exact ? '' : ident.byFormula ? tr('fromFormula') : tr('otherStructure')}`
        : generatedName ?? (ids.length === 1 ? tr('atomOf', { name: lab.get(desc.atoms[0].z).name.toLowerCase() }) : tr('notInLibrary'));
      for (const id of ids) state.unitOfAtom.set(id, u);
      return u;
    });
  }

  /** Formula di un composto ionico scritta per ioni: Fe₂(SO₄)₃, (NH₄)₂SO₄, KAl(SO₄)₂. */
  function ionicFormula(frags) {
    const groups = new Map();
    for (const f of frags) {
      const multi = f.atoms.length > 1;
      const id = multi ? library.identify(f.atoms, f.bonds) : null;
      const text = multi ? (id?.exact && id.entry.formula) || displayFormula(lab, f.atoms, 0) : lab.get(f.atoms[0].z).symbol;
      const g = groups.get(text) ?? { text, multi, n: 0, charge: f.charge, z: f.atoms[0].z };
      g.n++;
      groups.set(text, g);
    }
    // prima i cationi (gli ioni poliatomici come NH₄⁺ in testa, poi i metalli per carica crescente), poi gli anioni
    const list = [...groups.values()].sort((a, b) => (b.charge > 0) - (a.charge > 0) || (a.charge > 0 && b.charge > 0 ? b.multi - a.multi || a.charge - b.charge : 0));
    return list.map((g) => (g.n === 1 ? g.text : g.multi ? `(${g.text})${subscript(g.n)}` : `${g.text}${subscript(g.n)}`)).join('');
  }

  /** Un rilassatore per unità; si ricrea quando cambiano legami o cariche. */
  function syncRelaxers() {
    const next = new Map();
    for (const u of state.units) {
      const sig = `${u.key}|${u.desc.bonds.map((b) => `${b.i}-${b.j}-${b.order}`).join(',')}|${u.desc.ionic.map((b) => `${b.i}-${b.j}-${b.transfer}`).join(',')}|${u.desc.atoms.map((a) => a.charge).join(',')}|${u.ident.exact ? u.ident.entry.id : ''}`;
      let r = state.relaxers.get(u.key);
      if (!r || r.sig !== sig) {
        const positions = u.ids.map((id) => [...bench.atoms.get(id).pos]);
        const relaxer = createRelaxer(lab, u.desc, u.lewisAtoms, positions, u.ident.exact ? u.ident.entry.geo : null);
        r = { sig, relaxer, ids: u.ids, active: true, steps: 0 };
      }
      u.lone = r.relaxer.lone;
      next.set(u.key, r);
    }
    state.relaxers = next;
  }

  function refresh({ panel: renderP = true } = {}) {
    analyze();
    syncRelaxers();
    scene.rebuild();
    scene.setSelection(selectedAtomIds());
    scene.setPending(state.pending);
    if (renderP) renderPanel();
    updateDock();
  }

  // ---------------------------------------------------------------- rilassamento continuo
  const centroid = (pts) => {
    const c = [0, 0, 0];
    for (const p of pts) for (let k = 0; k < 3; k++) c[k] += p[k] / pts.length;
    return c;
  };
  engine.add((dt) => {
    if (state.anim) {
      stepAnimation(dt);
      return;
    }
    let settledSelected = false;
    for (const [key, r] of state.relaxers) {
      if (!r.active || scene.isDragging()) continue;
      const atomsNow = r.ids.map((id) => bench.atoms.get(id));
      if (atomsNow.some((a) => !a)) continue;
      const before = centroid(atomsNow.map((a) => a.pos));
      atomsNow.forEach((a, k) => (r.relaxer.pos[k] = [...a.pos]));
      const moved = r.relaxer.run(r.steps < 120 ? 8 : 4);
      const after = centroid(r.relaxer.pos);
      atomsNow.forEach((a, k) => {
        for (let c = 0; c < 3; c++) a.pos[c] = r.relaxer.pos[k][c] + before[c] - after[c];
      });
      r.steps += 4;
      if ((moved < 1.5e-4 && r.steps > 80) || r.steps > 4000) {
        r.active = false;
        if (selectedUnits().some((u) => u.key === key)) settledSelected = true;
      }
    }
    separateUnits();
    if (settledSelected) renderPanel(); // angoli e lunghezze finali
  });

  /** Le unità non devono compenetrarsi: si allontanano dolcemente. */
  function separateUnits() {
    if (scene.isDragging() || state.units.length < 2 || state.units.length > 60) return;
    const info = state.units.map((u) => {
      const c = centroid(u.positions);
      const r = Math.max(0.5, ...u.positions.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]))) + 0.55;
      return { u, c, r };
    });
    for (let i = 0; i < info.length; i++) {
      for (let j = i + 1; j < info.length; j++) {
        const A = info[i];
        const B = info[j];
        const d = [B.c[0] - A.c[0], B.c[1] - A.c[1], B.c[2] - A.c[2]];
        const l = Math.hypot(...d) || 1e-3;
        const overlap = A.r + B.r - l;
        if (overlap <= 0) continue;
        const push = Math.min(overlap, 0.08) / 2;
        const dir = l < 1e-2 ? [1, 0, 0] : d.map((x) => x / l);
        for (const p of A.u.positions) for (let k = 0; k < 3; k++) p[k] -= dir[k] * push;
        for (const p of B.u.positions) for (let k = 0; k < 3; k++) p[k] += dir[k] * push;
      }
    }
  }

  // ---------------------------------------------------------------- cronologia
  function act(fn) {
    if (busy()) {
      message(tr('waitReaction'), 'info', 2000);
      return false;
    }
    const snap = bench.snapshot();
    const ok = fn();
    if (ok === false) return false;
    history.past.push(snap);
    if (history.past.length > 120) history.past.shift();
    history.future = [];
    state.sim = null; // il banco è cambiato: il resoconto della simulazione non vale più
    refresh();
    return true;
  }
  function undo() {
    if (busy()) return message(tr('waitReaction'), 'info', 2000);
    if (!history.past.length) return message(tr('nothingUndo'), 'info');
    history.future.push(bench.snapshot());
    bench.restore(history.past.pop());
    state.sim = null;
    cleanSelection();
    refresh();
  }
  function redo() {
    if (busy()) return message(tr('waitReaction'), 'info', 2000);
    if (!history.future.length) return message(tr('nothingRedo'), 'info');
    history.past.push(bench.snapshot());
    bench.restore(history.future.pop());
    state.sim = null;
    cleanSelection();
    refresh();
  }
  function cleanSelection() {
    state.selected = new Set([...state.selected].filter((id) => bench.atoms.has(id)));
    if (state.pending && !bench.atoms.has(state.pending)) state.pending = null;
  }

  // ---------------------------------------------------------------- selezione
  const selectedUnits = () => {
    const seen = new Set();
    const out = [];
    for (const id of state.selected) {
      const u = state.unitOfAtom.get(id);
      if (u && !seen.has(u.key)) {
        seen.add(u.key);
        out.push(u);
      }
    }
    return out;
  };
  const selectedAtomIds = () => selectedUnits().flatMap((u) => u.ids);

  function select(ids, { add = false } = {}) {
    if (add) {
      for (const id of ids) {
        const u = state.unitOfAtom.get(id);
        const already = selectedUnits().find((s) => s.key === u?.key);
        if (already) for (const x of already.ids) state.selected.delete(x);
        else state.selected.add(id);
      }
    } else state.selected = new Set(ids.slice(0, 1));
    scene.setSelection(selectedAtomIds());
    renderPanel();
    updateDock();
  }

  function setPending(id) {
    state.pending = id;
    scene.setPending(id);
  }

  // ---------------------------------------------------------------- scheda
  function renderPanel() {
    $('[data-act="reactions"]').setAttribute('aria-pressed', String(state.rx.open));
    if (state.rx.open) return renderReactions();
    const sel = selectedUnits();
    const scroll = panel.scrollTop;
    if (sel.length === 1) {
      panel.innerHTML = unitPanelHtml(lab, sel[0], { alternatives: state.alternatives.get(sel[0].key) ?? [] });
      panel.scrollTop = scroll;
    } else if (sel.length > 1) {
      panel.innerHTML = `${summaryHtml(sel)}<p class="mp-note">${tr('selectedUnits', { n: sel.length })}</p>`;
    } else {
      panel.innerHTML = summaryHtml(state.units);
    }
    if (state.sim && sel.length !== 1) {
      panel.insertAdjacentHTML('afterbegin', simulationReportHtml(state.sim));
      panel.scrollTop = state.sim.status === 'running' ? 0 : scroll;
    }
    // reazioni possibili con le molecole presenti
    const ready = matchReactions().filter((m) => m.missing.length === 0);
    if (ready.length && sel.length !== 1) {
      panel.insertAdjacentHTML(
        'beforeend',
        `<section class="mp-sec rx-suggest"><h4>${tr('possibleOnBench')}</h4>${ready
          .slice(0, 4)
          .map((m) => `<button type="button" class="rx-item" data-reaction="${m.re.r.id}">${m.re.r.name ? `<b>${esc(m.re.r.name)}</b>` : ''}${equationHtml(m.re)}</button>`)
          .join('')}</section>`,
      );
    }
  }

  function updateDock() {
    const sel = selectedUnits();
    const has = sel.length > 0;
    $('[data-act="separate"]').disabled = !sel.some((u) => u.ids.length > 1);
    $('[data-act="ions"]').hidden = !(sel.length === 1 && sel[0].ionic);
    for (const k of ['add-e', 'remove-e']) $(`[data-act="${k}"]`).disabled = sel.length !== 1;
    $('[data-act="delete"]').disabled = !has;
    $('[data-act="clear"]').disabled = bench.atoms.size === 0;
    $('[data-act="simulate"]').disabled = state.units.length < 2;
    $('[data-act="undo"]').disabled = !history.past.length;
    $('[data-act="redo"]').disabled = !history.future.length;
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    root.classList.toggle('mode-cut', state.mode === 'cut');
    root.classList.toggle('is-reacting', busy());
    root.classList.toggle('mode-bond', state.mode === 'bond');
  }

  // ---------------------------------------------------------------- messaggi
  let msgTimer = null;
  function message(html, kind = 'ok', duration = 5200) {
    const el = $('.lab-msg');
    el.innerHTML = html;
    el.className = `lab-msg is-${kind}`;
    el.hidden = false;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => (el.hidden = true), duration);
  }

  // ---------------------------------------------------------------- azioni sugli atomi
  function addAtom(z, pos = null) {
    if (bench.atoms.size >= MAX_ATOMS) return message(tr('maxAtoms', { max: MAX_ATOMS }), 'bad');
    let id;
    act(() => {
      id = bench.addAtom(z, pos ?? scene.freeSpot(1.7));
    });
    select([id]);
    const info = lab.get(z);
    if (info.tier === TIER.UNKNOWN) message(tr('unknownChem', { name: esc(info.name) }), 'warn');
  }

  function translate(ids, delta) {
    for (const id of ids) {
      const a = bench.atoms.get(id);
      if (a) for (let k = 0; k < 3; k++) a.pos[k] += delta[k];
    }
  }

  function bondCheckText(r, a, b) {
    const A = lab.get(bench.atoms.get(a).z);
    const B = lab.get(bench.atoms.get(b).z);
    if (!r.ok) return `<b>${A.symbol}–${B.symbol}</b>: ${esc(r.reason)}`;
    if (r.kind === 'ionic') {
      const D = lab.get(bench.atoms.get(r.donor).z);
      const C = r.donor === a ? B : A;
      return tr('ionicBond', { donor: esc(Art(D).toLowerCase()), n: r.transfer, toVowel: C.z === 9 || /^[aeiou]/i.test(C.name), acceptor: esc(C.name.toLowerCase()), den: fmtNumber(r.character.dEN, 2, 2) });
    }
    return `${tr('bondKind', { type: esc(r.character.type) })} ${A.symbol}–${B.symbol}${r.character.dEN != null ? ` (ΔEN ${fmtNumber(r.character.dEN, 2, 2)})` : ''}${r.warning ? `<br><small>${esc(r.warning)}</small>` : ''}`;
  }

  function previewBond(a, b) {
    const r = checkBond(bench, lab, a, b);
    return { ok: r.ok, html: bondCheckText(r, a, b) };
  }

  function bond(a, b) {
    const r = checkBond(bench, lab, a, b);
    if (!r.ok) {
      message(bondCheckText(r, a, b), 'bad');
      return false;
    }
    act(() => {
      if (r.kind === 'ionic') {
        const existing = bench.bondBetween(a, b);
        if (existing?.ionic) existing.transfer += r.transfer;
        else bench.addBond(a, b, { ionic: true, transfer: r.transfer, donor: r.donor });
      } else bench.addBond(a, b, { order: 1 });
    });
    select([a]);
    const u = state.unitOfAtom.get(a);
    const done = u.ident.exact ? tr('youMade', { name: esc(lowerFirst(u.ident.entry.name)), formula: esc(u.formula) }) : '';
    if (u.ident.exact) window.dispatchEvent(new CustomEvent('tp3d:molecule', { detail: { id: u.ident.entry.id } }));
    message(`${bondCheckText(r, a, b)}${done}`, r.warning ? 'warn' : 'ok');
    return true;
  }

  function onDragEnd(atomId, targetId) {
    if (targetId) bond(atomId, targetId);
    else {
      // lo spostamento non entra nella cronologia; si riattiva il rilassamento dell'unità
      const u = state.unitOfAtom.get(atomId);
      const r = u && state.relaxers.get(u.key);
      if (r) {
        r.active = true;
        r.steps = Math.max(r.steps, 100);
      }
    }
  }

  function onClickAtom(id, ev) {
    if (state.mode === 'bond') {
      if (!state.pending) {
        setPending(id);
        message(tr('secondAtom'), 'info', 3500);
      } else if (state.pending === id) setPending(null);
      else {
        const first = state.pending;
        setPending(null);
        bond(first, id);
      }
      return;
    }
    if (state.mode === 'cut') {
      message(tr('cutHint'), 'info', 3000);
      return;
    }
    select([id], { add: ev.ctrlKey || ev.metaKey || ev.shiftKey });
  }

  function onClickBond(bondId) {
    if (state.mode === 'cut') breakBond(bondId);
    else cycleOrder(bondId);
  }

  function cycleOrder(bondId) {
    const b = bench.bonds.get(bondId);
    if (!b) return;
    if (b.ionic) return message(tr('ionicNoOrder'), 'info');
    const seq = [b.order + 1, b.order + 2, b.order + 3].map((o) => ((o - 1) % 3) + 1).filter((o) => o !== b.order);
    let firstFail = null;
    for (const o of seq) {
      const r = checkOrder(bench, lab, bondId, o);
      if (r.ok) {
        act(() => {
          bench.bonds.get(bondId).order = o;
        });
        const A = lab.get(bench.atoms.get(b.a).z).symbol;
        const B = lab.get(bench.atoms.get(b.b).z).symbol;
        const u = state.unitOfAtom.get(b.a);
        const done = u.ident.exact ? ` · <b>${esc(u.ident.entry.name)}</b> (${esc(u.formula)})` : '';
        message(`${tr('bondOrder', { a: A, b: B, order: ORDER_NAME[o] })}${done}`, 'ok', 3000);
        select([b.a]);
        return;
      }
      firstFail ??= r.reason;
    }
    message(esc(firstFail ?? tr('orderFixed')), 'bad');
  }

  function breakBond(bondId) {
    const b = bench.bonds.get(bondId);
    if (!b) return;
    const A = lab.get(bench.atoms.get(b.a).z);
    const B = lab.get(bench.atoms.get(b.b).z);
    act(() => {
      if (b.ionic) {
        // gli elettroni trasferiti restano all'anione: si separano due ioni
        const acceptor = b.donor === b.a ? b.b : b.a;
        bench.atoms.get(acceptor).extra += b.transfer;
        bench.atoms.get(b.donor).extra -= b.transfer;
      }
      bench.removeBond(bondId);
      // piccola separazione
      const pa = bench.atoms.get(b.a).pos;
      const pb = bench.atoms.get(b.b).pos;
      const d = [0, 1, 2].map((k) => pb[k] - pa[k]);
      const l = Math.hypot(...d) || 1;
      const unitB = bench.unitOf(b.b);
      if (!unitB.includes(b.a)) translate(unitB, d.map((x) => (x / l) * 0.9));
    });
    message(
      b.ionic ? tr('ionicBroken', { a: A.symbol, b: B.symbol }) : tr('bondBroken', { a: A.symbol, b: B.symbol, single: b.order === 1 }),
      'ok',
    );
  }

  // ---------------------------------------------------------------- Combina, Separa, cariche
  function placeUnits(groups, center) {
    // dispone le nuove unità affiancate attorno al centro, con la geometria iniziale calcolata
    const right = [engine.camera.matrixWorld.elements[0], engine.camera.matrixWorld.elements[1], engine.camera.matrixWorld.elements[2]];
    const spacing = 3.4;
    groups.forEach((ids, g) => {
      const off = (g - (groups.length - 1) / 2) * spacing;
      const c = center.map((x, k) => x + right[k] * off);
      const layout = initialLayout(lab, bench.describe(ids), c, ids[0]);
      ids.forEach((id, k) => {
        const a = bench.atoms.get(id);
        for (let q = 0; q < 3; q++) a.pos[q] = layout[k][q];
      });
    });
  }

  function combineAction() {
    // le unità selezionate, se insieme hanno almeno 2 atomi; altrimenti tutti gli atomi liberi
    let units = selectedUnits();
    if (units.reduce((s, u) => s + u.ids.length, 0) < 2) units = state.units.filter((u) => u.ids.length === 1);
    const ids = units.flatMap((u) => u.ids);
    if (ids.length < 2) {
      return message(tr('combineHint'), 'info');
    }
    const zs = ids.map((id) => bench.atoms.get(id).z);
    const r = combine(lab, library, zs);
    if (!r.ok) return message(esc(r.message), 'bad');
    const center = centroid(ids.map((id) => bench.atoms.get(id).pos));
    const energyBefore = bondsEnergy(bench.bondsWithin(ids).map((b) => ({ a: b.a, b: b.b, order: b.order, ionic: b.ionic })));
    const energyAfter = bondsEnergy(r.bonds.map((b) => ({ a: ids[b.i], b: ids[b.j], order: b.order, ionic: b.ionic })));
    act(() => {
      for (const b of bench.bondsWithin(ids)) bench.removeBond(b.id);
      for (const id of ids) bench.atoms.get(id).extra = 0;
      for (const b of r.bonds) {
        if (b.ionic) bench.addBond(ids[b.i], ids[b.j], { ionic: true, transfer: b.transfer, donor: ids[b.donor] });
        else bench.addBond(ids[b.i], ids[b.j], { order: b.order });
      }
      const set = new Set(ids);
      const groups = bench.components(true).filter((c) => set.has(c[0]));
      placeUnits(groups, center);
    });
    const made = [...new Set(ids.map((id) => state.unitOfAtom.get(id)))];
    state.alternatives.clear();
    if (r.alternatives?.length && made.length === 1) state.alternatives.set(made[0].key, r.alternatives);
    state.selected = new Set(made.map((u) => u.ids[0]));
    scene.setSelection(selectedAtomIds());
    renderPanel();
    updateDock();
    const counts = new Map();
    for (const u of made) {
      const name = u.ident.exact ? `${lowerFirst(u.ident.entry.name)} (${u.formula})` : u.generatedName ? `${lowerFirst(u.generatedName)} (${u.formula})` : u.formula;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    const list = [...counts].map(([n, c]) => `${c > 1 ? `${c} × ` : ''}<b>${esc(n)}</b>`).join(', ');
    const radical = r.unpaired ? ` · ${tr('unpaired', { n: r.unpaired })}` : '';
    if (bench.atoms.size <= 40) scene.frameAll(1);
    let energy = '';
    if (energyBefore != null && energyAfter != null && Math.abs(energyBefore - energyAfter) > 1) {
      const dH = energyBefore - energyAfter;
      energy = energyBefore === 0
        ? `<br><small>${tr('energyFromAtoms', { kj: fmtNumber(Math.round(-dH), 0) })}</small>`
        : `<br><small>${tr('energyDelta', { sign: dH > 0 ? '+' : '−', kj: fmtNumber(Math.abs(Math.round(dH)), 0), release: dH < 0 })}</small>`;
    }
    message(`${tr('formed', { n: made.length })}: ${list}${radical}${r.alternatives?.length ? tr('seeIsomers') : ''}${energy}`, r.unpaired ? 'warn' : 'ok', 7000);
    for (const u of made) if (u.ident.exact) window.dispatchEvent(new CustomEvent('tp3d:molecule', { detail: { id: u.ident.entry.id } }));
  }

  function separate({ ions = false } = {}) {
    const units = selectedUnits().filter((u) => (ions ? u.ionic : u.ids.length > 1));
    if (!units.length) return message(ions ? tr('selectIonic') : tr('selectMolecule'), 'info');
    act(() => {
      for (const u of units) {
        const c = centroid(u.ids.map((id) => bench.atoms.get(id).pos));
        for (const b of bench.bondsWithin(u.ids)) {
          if (ions && !b.ionic) continue;
          if (ions) {
            const acceptor = b.donor === b.a ? b.b : b.a;
            bench.atoms.get(acceptor).extra += b.transfer;
            bench.atoms.get(b.donor).extra -= b.transfer;
          }
          bench.removeBond(b.id);
        }
        if (!ions) for (const id of u.ids) bench.atoms.get(id).extra = 0;
        // allontana i pezzi dal centro
        const pieces = bench.components(true).filter((p) => u.ids.includes(p[0]));
        pieces.forEach((p, k) => {
          const pc = centroid(p.map((id) => bench.atoms.get(id).pos));
          let d = [pc[0] - c[0], pc[1] - c[1], pc[2] - c[2]];
          let l = Math.hypot(...d);
          if (l < 0.2) {
            const ang = (k / pieces.length) * Math.PI * 2;
            d = [Math.cos(ang), Math.sin(ang), 0.3];
            l = Math.hypot(...d);
          }
          translate(p, d.map((x) => (x / l) * (1.4 + 0.25 * pieces.length)));
        });
      }
    });
    state.alternatives.clear();
    message(
      ions ? tr('ionsSeparated') : tr('atomsSeparated'),
      'ok',
    );
  }

  function changeCharge(delta) {
    const [u] = selectedUnits();
    if (!u) return;
    // aggiungere: sull'atomo più elettronegativo con un elettrone spaiato o un ottetto incompleto;
    // togliere: sull'atomo meno elettronegativo con un elettrone spaiato o una coppia solitaria
    const cand = u.ids.map((id, i) => ({ id, la: u.lewisAtoms[i], info: lab.get(u.desc.atoms[i].z) }));
    const en = (c) => c.info.en ?? 0;
    let pick;
    if (delta > 0) {
      pick = cand.filter((c) => c.la.unpaired).sort((a, b) => en(b) - en(a))[0]
        ?? cand.filter((c) => c.la.incomplete).sort((a, b) => en(b) - en(a))[0]
        ?? [...cand].sort((a, b) => en(b) - en(a))[0];
    } else {
      pick = cand.filter((c) => c.la.unpaired).sort((a, b) => en(a) - en(b))[0]
        ?? cand.filter((c) => c.la.lone > 0 && c.info.tier === TIER.MAIN).sort((a, b) => en(a) - en(b))[0]
        ?? [...cand].sort((a, b) => en(a) - en(b))[0];
    }
    const lw = u.lewisFrags.reduce((s, f) => s + f.electrons, 0);
    if (delta < 0 && lw <= 0) return message(tr('noMoreElectrons'), 'bad');
    act(() => {
      bench.atoms.get(pick.id).extra += delta > 0 ? 1 : -1;
    });
    const nu = state.unitOfAtom.get(pick.id);
    const name = nu.ident.exact ? ` · <b>${esc(nu.ident.entry.name)}</b>` : '';
    message(tr('chargeChanged', { add: delta > 0, sym: esc(pick.info.symbol), q: nu.charge ? `${nu.charge > 0 ? '+' : '−'}${Math.abs(nu.charge)}` : '0', name }), 'ok');
  }

  function deleteSelected() {
    const ids = selectedAtomIds();
    if (!ids.length) return;
    act(() => ids.forEach((id) => bench.removeAtom(id)));
    state.selected.clear();
    refresh();
  }

  function clearBench() {
    if (!bench.atoms.size) return;
    act(() => bench.clear());
    state.selected.clear();
    state.alternatives.clear();
    refresh();
    message(tr('cleared'), 'info');
  }

  /** Mette sul banco una specie (voce della libreria o "el:X") centrata in `center`; restituisce gli id. */
  function placeSpecies(key, center) {
    if (key.startsWith('el:')) return [bench.addAtom(lab.bySymbol.get(key.slice(3)).z, center)];
    return placeGraph(library.get(key), center);
  }

  /** Mette sul banco un grafo {graph, ionic, charge} (voce della libreria o SMILES) centrato in `center`. */
  function placeGraph(item, center) {
    const g = item.graph;
    const ids = g.atoms.map((a) => bench.addAtom(a.z, center));
    for (const b of entryBonds(lab, item)) {
      if (b.ionic) bench.addBond(ids[b.i], ids[b.j], { ionic: true, transfer: b.transfer, donor: ids[b.donor] });
      else bench.addBond(ids[b.i], ids[b.j], { order: b.order });
    }
    if (!item.ionic && item.charge) {
      const k = g.atoms.findIndex((a) => Math.sign(a.charge) === Math.sign(item.charge));
      bench.atoms.get(ids[Math.max(0, k)]).extra = -item.charge;
    }
    if (ids.length > 1) placeUnits([ids], center);
    return ids;
  }

  /** Somma delle energie di legame (kJ/mol) di un insieme di legami covalenti; null se ci sono legami ionici o valori mancanti. */
  function bondsEnergy(list) {
    let total = 0;
    for (const b of list) {
      if (b.ionic) return null;
      const e = bondEnergy(lab.get(bench.atoms.get(b.a).z), lab.get(bench.atoms.get(b.b).z), b.order).kj;
      if (e == null) return null;
      total += e;
    }
    return total;
  }

  /** Costruisce sul banco una voce della libreria. */
  function buildEntry(entry, { at = null, replace = null } = {}) {
    const lib = library.get(entry.id);
    const g = lib.graph;
    if (bench.atoms.size + g.atoms.length > MAX_ATOMS) return message(tr('maxAtoms', { max: MAX_ATOMS }), 'bad');
    let ids;
    act(() => {
      let center = at;
      if (replace) {
        center = centroid(replace.map((id) => bench.atoms.get(id).pos));
        replace.forEach((id) => bench.removeAtom(id));
      }
      center ??= scene.freeSpot(2.6 + Math.cbrt(g.atoms.length));
      ids = placeGraph(lib, center);
    });
    state.selected = new Set([ids[0]]);
    refresh();
    scene.frameAll(1.1);
    message(tr('built', { name: esc(entry.name) }), 'ok', 3000);
    window.dispatchEvent(new CustomEvent('tp3d:molecule', { detail: { id: entry.id } }));
    return ids;
  }

  // ---------------------------------------------------------------- formula scritta o incollata
  const formulaBox = $('.lab-formula');
  const formulaInput = $('.lf-input');
  const isSymbol = (sym) => lab.bySymbol.has(sym);
  const massOf = (counts) => [...counts].reduce((t, [sym, n]) => t + lab.bySymbol.get(sym).mass * n, 0);
  const subHtml = (f) => esc(f).replace(/([₀-₉]+)/g, '<span class="sub">$1</span>');

  /** Voci della libreria con questa formula (la più stabile per prima, come fa Combina). */
  function libraryCandidates(atoms, charge) {
    return library
      .byFormula(formulaKey(lab, atoms, charge))
      .map((e) => ({ e, energy: entryEnergy(lab, e) }))
      .sort((a, b) => b.energy - a.energy)
      .map((x) => x.e);
  }

  /** Una specie letta dalla formula → cosa costruire. */
  function resolveSpecies(sp) {
    if (sp.parts) return { coef: sp.coef, sp, hydrate: sp.parts.map(resolveSpecies) };
    // oltre il limite del banco l'elenco degli atomi non serve: basta il numero, per l'avviso «Troppi atomi»
    const atoms = speciesAtoms(sp, (sym) => lab.bySymbol.get(sym).z, MAX_ATOMS);
    if (!atoms) return { coef: sp.coef, sp, atoms: null, size: speciesAtomCount(sp), entry: null, alternatives: [] };
    const [entry, ...alternatives] = libraryCandidates(atoms, sp.charge);
    return { coef: sp.coef, sp, atoms, size: atoms.length, entry: entry ?? null, alternatives };
  }

  /** Testo → nome della libreria, formula o SMILES. */
  function interpret(text) {
    const t = text.trim();
    if (!t) return { kind: 'empty' };
    const named = library.byName(t);
    if (named.exact) return { kind: 'name', entry: named.exact, suggestions: named.matches };
    const smiles = () => {
      try {
        const graph = parseSmiles(t, lab.bySymbol);
        if (!graph.atoms.length) return null;
        const ident = library.identify(graph.atoms, graph.bonds);
        const charge = graph.atoms.reduce((q, a) => q + a.charge, 0);
        return { kind: 'smiles', item: { graph, ionic: t.includes('.'), charge }, entry: ident.exact ? ident.entry : null };
      } catch {
        return null;
      }
    };
    if (looksLikeSmiles(t)) {
      const r = smiles();
      if (r) return r;
    }
    const f = parseFormula(t, isSymbol);
    if (f.ok) {
      const only = f.species.length === 1 ? f.species[0] : null;
      if (only?.suspicious && !only.parts) {
        const r = smiles();
        if (r) return r;
      }
      return { kind: 'formula', items: f.species.map(resolveSpecies), note: f.note };
    }
    if (!looksLikeSmiles(t)) {
      const r = smiles();
      if (r) return r;
    }
    // elenco misto di nomi e formule: «P4O10 + saccarosio», «2 acqua + NaCl»
    const list = splitFormulaList(t);
    if (list.parts.length > 1) {
      const items = list.parts.map((part) => {
        const m = part.match(/^(\d+)\s*(.+)$/);
        const coef = m ? Number(m[1]) : 1;
        const rest = m ? m[2] : part;
        const entry = library.byName(rest).exact;
        if (entry) {
          const g = library.get(entry.id).graph;
          const counts = new Map();
          for (const a of g.atoms) counts.set(lab.get(a.z).symbol, (counts.get(lab.get(a.z).symbol) || 0) + 1);
          const pretty = entry.formula ?? displayFormula(lab, g.atoms, 0, { ionic: library.get(entry.id).ionic });
          return { coef, entry, alternatives: [], atoms: g.atoms.map((a) => ({ z: a.z, charge: 0 })), sp: { coef, counts, charge: 0, pretty } };
        }
        const pf = parseFormula(part, isSymbol);
        return pf.ok && pf.species.length === 1 ? resolveSpecies(pf.species[0]) : { error: `«${part}»: ${pf.ok ? tr('writeOne') : pf.error}` };
      });
      const bad = items.find((x) => x.error);
      if (!bad) return { kind: 'formula', items, note: list.note };
      return { kind: 'error', error: bad.error, suggestions: named.matches };
    }
    return { kind: 'error', error: f.error, suggestions: named.matches };
  }

  /** Elenco piatto di ciò che va costruito: [{count, entry | item | atoms}]. */
  function buildJobs(res, { atomsOnly = false } = {}) {
    const jobs = [];
    const fromItem = (it, mult) => {
      if (it.hydrate) {
        for (const h of it.hydrate) fromItem(h, mult * it.coef);
        return;
      }
      const count = it.coef * mult;
      if (it.entry && !atomsOnly) jobs.push({ count, entry: it.entry });
      else jobs.push({ count, atoms: it.atoms, size: it.size, charge: it.sp.charge, sp: it.sp, free: atomsOnly });
    };
    if (res.kind === 'name') {
      if (atomsOnly) jobs.push({ count: 1, item: library.get(res.entry.id), free: true });
      else jobs.push({ count: 1, entry: res.entry });
    } else if (res.kind === 'smiles') {
      jobs.push(res.entry && !atomsOnly ? { count: 1, entry: res.entry } : { count: 1, item: res.item, free: atomsOnly });
    } else if (res.kind === 'formula') res.items.forEach((it) => fromItem(it, 1));
    return jobs;
  }

  const jobSize = (j) => (j.entry ? library.get(j.entry.id).graph.atoms.length : j.item ? j.item.graph.atoms.length : j.size ?? j.atoms.length);

  /** Descrizione di una specie letta dalla formula (per l'anteprima). */
  function speciesLabel(x) {
    const n = [...x.sp.counts.values()].reduce((a, b) => a + b, 0);
    if (x.entry) {
      const alt = x.alternatives.length;
      return `<b>${esc(x.entry.name)}</b>${alt ? tr('isomers', { n: alt }) : ''}`;
    }
    if (n === 1) {
      const info = lab.bySymbol.get([...x.sp.counts.keys()][0]);
      return x.sp.charge ? tr('ion', { name: esc(ionName(info, x.sp.charge)) }) : tr('atomOf', { name: esc(info.name.toLowerCase()) });
    }
    if (x.sp.charge) return `<span class="lf-warn">${tr('ionNotInLibrary')}</span>`;
    const salt = x.atoms && ionicDecomposition(lab, library, x.atoms.map((a) => a.z));
    if (salt) {
      // es. «Solfato di ferro(III)» (2 Fe³⁺ + 3 SO₄²⁻)
      const parts = covalentParts(salt.graph.atoms, salt.graph.bonds).map((f) => {
        const id = f.atoms.length > 1 ? library.identify(f.atoms, f.bonds) : null;
        return {
          info: f.atoms.length === 1 ? lab.get(f.atoms[0].z) : null,
          charge: f.charge,
          libraryName: id?.exact ? id.entry.name : null,
          text: (id?.exact && id.entry.formula ? id.entry.formula : displayFormula(lab, f.atoms, 0)) + chargeText(f.charge),
        };
      });
      const ions = new Map();
      for (const q of parts) ions.set(q.text, (ions.get(q.text) || 0) + 1);
      const name = ionicCompoundName(parts);
      return `<b>${esc(name ?? tr('ionicCompound'))}</b> <small>(${[...ions].map(([t, c]) => `${c > 1 ? `${c} ` : ''}${esc(t)}`).join(' + ')}, ${tr('generatedName')})</small>`;
    }
    return `<span class="lf-warn">${tr('combineWillTry')}</span>`;
  }

  function renderFormulaPreview() {
    const box = $('.lf-preview');
    const buildBtn = $('[data-lf="build"]');
    const atomsBtn = $('[data-lf="atoms"]');
    const res = interpret(formulaInput.value);
    const chips = (list) =>
      list.length ? `<div class="lf-suggest">${list.map((e) => `<button type="button" class="chip-btn" data-lf-entry="${e.id}">${esc(e.name)}</button>`).join('')}</div>` : '';
    const disable = (v) => {
      buildBtn.disabled = v;
      atomsBtn.disabled = v;
    };
    if (res.kind === 'empty') {
      box.innerHTML = '';
      disable(true);
      return;
    }
    if (res.kind === 'error') {
      const sugg = res.suggestions ?? [];
      box.innerHTML = sugg.length
        ? `<p class="lf-line">${tr('sameName')}</p>${chips(sugg)}`
        : `<p class="lf-line is-bad">${esc(res.error)}</p>`;
      disable(true);
      return;
    }
    const jobs = buildJobs(res);
    const total = jobs.reduce((t, j) => t + j.count * jobSize(j), 0);
    const over = bench.atoms.size + total > MAX_ATOMS;
    const lines = [];
    let counts = null;
    if (res.kind === 'name') {
      const lib = library.get(res.entry.id);
      lines.push(`<p class="lf-line"><b>${esc(res.entry.name)}</b> <span class="lf-f">${subHtml(res.entry.formula ?? displayFormula(lab, lib.graph.atoms, 0, { ionic: lib.ionic }))}</span> <small>${tr('inLibrary')}</small></p>`);
      if (res.suggestions.length) lines.push(`<p class="lf-sub">${tr('similarNames')}</p>${chips(res.suggestions.slice(0, 6))}`);
      counts = new Map();
      for (const a of lib.graph.atoms) counts.set(lab.get(a.z).symbol, (counts.get(lab.get(a.z).symbol) || 0) + 1);
    } else if (res.kind === 'smiles') {
      const g = res.item.graph;
      const f = displayFormula(lab, g.atoms, res.item.charge, { ionic: res.item.ionic });
      lines.push(`<p class="lf-line">${tr('smilesLine', { f: subHtml(f), n: g.atoms.length, entry: res.entry ? esc(res.entry.name) : null })}</p>`);
      counts = new Map();
      for (const a of g.atoms) counts.set(lab.get(a.z).symbol, (counts.get(lab.get(a.z).symbol) || 0) + 1);
    } else {
      for (const it of res.items) {
        const descr = it.hydrate ? it.hydrate.map((x) => `${x.coef > 1 ? `${x.coef} × ` : ''}${speciesLabel(x)}`) : [speciesLabel(it)];
        lines.push(`<p class="lf-line">${it.coef > 1 ? `<b class="lf-coef">${it.coef}</b>` : ''}<span class="lf-f">${subHtml(it.sp.pretty)}</span> → ${descr.join(' + ')}
          <small class="lf-mass">${fmtNumber(massOf(it.sp.counts), 3)} g/mol</small></p>`);
      }
      if (res.items.length === 1) counts = res.items[0].sp.counts;
      if (res.items.some((it) => it.sp.monoGuess)) lines.push(`<p class="lf-sub">${tr('chargeDigits')}</p>`);
      if (res.note === 'equation') lines.push(`<p class="lf-sub">${tr('equationNote')}</p>`);
    }
    if (counts && counts.size > 1) {
      const mass = massOf(counts);
      lines.push(`<div class="lf-comp" aria-label="${tr('composition')}">${[...counts]
        .map(([sym, n]) => {
          const info = lab.bySymbol.get(sym);
          const pct = (100 * info.mass * n) / mass;
          return `<span><b>${sym}</b>${n > 1 ? `<small>×${n}</small>` : ''} ${fmtNumber(pct, 2, 2)} %<i style="--w:${pct.toFixed(1)}%;--c:${info.color}"></i></span>`;
        })
        .join('')}</div>`);
    }
    if (over) lines.push(`<p class="lf-line is-bad">${tr('tooManyAtoms', { total, max: MAX_ATOMS, full: bench.atoms.size > 0 })}</p>`);
    box.innerHTML = lines.join('');
    disable(over);
  }

  /** Atomi liberi disposti in cerchio attorno a `center`. */
  function placeFreeAtoms(zs, center) {
    const m = engine.camera.matrixWorld.elements;
    const right = [m[0], m[1], m[2]];
    const up = [m[4], m[5], m[6]];
    const r = zs.length === 1 ? 0 : 0.75 + 0.22 * zs.length;
    return zs.map((z, k) => {
      const ang = (k / zs.length) * Math.PI * 2;
      return bench.addAtom(z, center.map((c, q) => c + (right[q] * Math.cos(ang) + up[q] * Math.sin(ang)) * r));
    });
  }

  /** Costruisce sul banco ciò che è scritto nella finestra Formula. */
  function buildFromFormula({ atomsOnly = false } = {}) {
    const res = interpret(formulaInput.value);
    if (res.kind === 'empty') return;
    if (res.kind === 'error') return message(esc(res.error), 'bad');
    const jobs = buildJobs(res, { atomsOnly });
    const total = jobs.reduce((t, j) => t + j.count * jobSize(j), 0);
    if (bench.atoms.size + total > MAX_ATOMS) return message(tr('maxAtomsBuild', { max: MAX_ATOMS }), 'bad');
    const made = [];
    const notes = new Set();
    const ok = act(() => {
      for (const job of jobs) {
        for (let n = 0; n < job.count; n++) {
          const center = scene.freeSpot(2.2 + Math.cbrt(jobSize(job)) * 0.9);
          if (job.entry) {
            made.push(placeGraph(library.get(job.entry.id), center));
            continue;
          }
          if (job.item) {
            made.push(job.free ? placeFreeAtoms(job.item.graph.atoms.map((a) => a.z), center) : placeGraph(job.item, center));
            continue;
          }
          const zs = job.atoms.map((a) => a.z);
          if (zs.length === 1) {
            made.push([bench.addAtom(zs[0], center, -job.charge)]);
            continue;
          }
          const ids = placeFreeAtoms(zs, center);
          made.push(ids);
          if (job.free) continue;
          if (job.charge) {
            // ione poliatomico sconosciuto: la carica va sull'atomo più (−) o meno (+) elettronegativo
            const en = (id) => lab.get(bench.atoms.get(id).z).en ?? 0;
            const pick = [...ids].sort((a, b) => (job.charge < 0 ? en(b) - en(a) : en(a) - en(b)))[0];
            bench.atoms.get(pick).extra = -job.charge;
            notes.add(tr('ionToBond'));
            continue;
          }
          const r = combine(lab, library, zs);
          if (!r.ok) {
            notes.add(tr('atomsStayFree', { f: esc(job.sp.pretty), msg: esc(r.message) }));
            continue;
          }
          for (const b of r.bonds) {
            if (b.ionic) bench.addBond(ids[b.i], ids[b.j], { ionic: true, transfer: b.transfer, donor: ids[b.donor] });
            else bench.addBond(ids[b.i], ids[b.j], { order: b.order });
          }
          const set = new Set(ids);
          placeUnits(bench.components(true).filter((c) => set.has(c[0])), center);
          notes.add(
            r.source === 'ions'
              ? tr('fromIons')
              : r.source === 'alkane'
                ? tr('linearAlkane')
                : r.unpaired
                  ? tr('radicalLeft')
                  : r.source === 'library'
                    ? ''
                    : tr('proposed'),
          );
        }
      }
    });
    if (!ok) return;
    toggleFormula(false);
    state.alternatives.clear();
    const first = made.find((ids) => ids.length);
    state.selected = new Set(first ? [first[0]] : []);
    refresh();
    // isomeri proposti, come dopo Combina
    const only = res.kind === 'formula' && res.items.length === 1 && !res.items[0].hydrate ? res.items[0] : null;
    if (only?.alternatives?.length && made.length === 1 && !atomsOnly) {
      const u = state.unitOfAtom.get(made[0][0]);
      if (u) {
        state.alternatives.set(u.key, only.alternatives);
        renderPanel();
      }
    }
    scene.frameAll(1);
    const counts = new Map();
    for (const ids of made) {
      const u = state.unitOfAtom.get(ids[0]);
      if (!u) continue;
      const name = u.ident.entry ? lowerFirst(u.ident.entry.name) : u.generatedName && lowerFirst(u.generatedName);
      const label = atomsOnly ? tr('atomsToLink', { n: ids.length }) : name ? `${name} (${u.formula})` : u.formula;
      if (!atomsOnly && u.ident.exact) window.dispatchEvent(new CustomEvent('tp3d:molecule', { detail: { id: u.ident.entry.id } }));
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    const list = [...counts].map(([k, c]) => `${c > 1 ? `${c} × ` : ''}<b>${esc(k)}</b>`).join(', ');
    notes.delete('');
    message(`${atomsOnly ? tr('onBench') : tr('builtList')}: ${list}${notes.size ? `<br><small>${[...notes].join(' ')}</small>` : ''}`, notes.size ? 'warn' : 'ok', 7000);
    formulaInput.value = '';
  }

  function toggleFormula(force, text = null) {
    const show = force ?? formulaBox.hidden;
    formulaBox.hidden = !show;
    $('[data-act="formula"]').setAttribute('aria-expanded', String(show));
    if (!show) return;
    toggleExamples(false);
    if (text != null) formulaInput.value = text;
    renderFormulaPreview();
    requestAnimationFrame(() => {
      formulaInput.focus();
      formulaInput.select();
    });
  }

  formulaInput.addEventListener('input', renderFormulaPreview);
  formulaInput.addEventListener('keydown', (ev) => {
    ev.stopPropagation(); // le lettere non sono scorciatoie mentre si scrive
    if (ev.key === 'Escape') {
      ev.preventDefault();
      toggleFormula(false);
    }
  });
  $('.lf-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    buildFromFormula();
  });
  formulaBox.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.lfExample) {
      formulaInput.value = b.dataset.lfExample;
      renderFormulaPreview();
      formulaInput.focus();
    } else if (b.dataset.lfEntry) {
      formulaInput.value = library.get(b.dataset.lfEntry).name;
      renderFormulaPreview();
      formulaInput.focus();
    } else if (b.dataset.lf === 'atoms') buildFromFormula({ atomsOnly: true });
  });

  // incollare sul banco (fuori dai campi di testo) apre la finestra con il testo incollato
  window.addEventListener('paste', (ev) => {
    if (root.hidden) return;
    const t = ev.target;
    if (t instanceof HTMLElement && t.matches('input, textarea, [contenteditable]')) return;
    const text = ev.clipboardData?.getData('text')?.trim();
    if (!text) return;
    ev.preventDefault();
    toggleFormula(true, text.slice(0, 300));
  });

  // ---------------------------------------------------------------- reazioni
  /** Specie di un'unità: id della molecola della libreria o "el:X" per un atomo neutro isolato; null se nessuna. */
  function speciesKey(u) {
    if (u.charge !== 0) return null;
    if (u.ident.exact) return u.ident.entry.id;
    if (u.ids.length === 1) return `el:${lab.get(u.desc.atoms[0].z).symbol}`;
    return null;
  }

  /** Unità raggruppate per specie: chiave → unità. */
  function speciesOf(units) {
    const m = new Map();
    for (const u of units) {
      const key = speciesKey(u);
      if (!key) continue;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(u);
    }
    return m;
  }

  /** Unità del banco che corrispondono a una specie (molecola della libreria o atomo neutro isolato). */
  function benchSpecies() {
    // prima le unità selezionate
    const sel = new Set(selectedUnits().map((u) => u.key));
    return speciesOf([...state.units].sort((a, b) => sel.has(b.key) - sel.has(a.key)));
  }

  function matchReactions() {
    const have = benchSpecies();
    if (!have.size) return [];
    return reactions
      .map((re) => {
        if (!re.r.reactants.some(([, k]) => have.has(k))) return null;
        const missing = re.r.reactants
          .map(([c, k], i) => ({ count: c - (have.get(k)?.length ?? 0), display: re.reactants[i].display }))
          .filter((x) => x.count > 0);
        return { re, missing };
      })
      .filter(Boolean)
      .sort((a, b) => a.missing.reduce((t, x) => t + x.count, 0) - b.missing.reduce((t, x) => t + x.count, 0));
  }

  function availableUnits(re) {
    const have = benchSpecies();
    const groups = [];
    for (const [c, k] of re.r.reactants) {
      const list = have.get(k) ?? [];
      if (list.length < c) return null;
      groups.push(...list.slice(0, c).map((u) => u.ids));
    }
    return groups;
  }

  /** Atomi dei reagenti di una reazione (coefficienti compresi): serve a sapere se stanno sul banco. */
  const reactantAtoms = (re) => re.reactants.reduce((t, s, i) => t + s.atoms.length * re.rc[i], 0);

  function renderReactions() {
    const scroll = panel.scrollTop;
    if (!state.rx.current) {
      panel.innerHTML = reactionListHtml(reactions, matchReactions(), { query: state.rx.query, open: state.rx.groups });
    } else {
      const re = reactionById.get(state.rx.current);
      panel.innerHTML = reactionCardHtml(lab, re, { practice: state.rx.practice, coeffs: state.rx.coeffs, available: Boolean(availableUnits(re)), atoms: reactantAtoms(re), maxAtoms: MAX_ATOMS });
    }
    panel.scrollTop = scroll;
    $('[data-act="reactions"]').setAttribute('aria-pressed', String(state.rx.open));
  }

  function openReaction(id) {
    state.rx.open = true;
    state.rx.current = id;
    state.rx.practice = false;
    const re = reactionById.get(id);
    state.rx.coeffs = re ? { r: re.rc.map(() => 1), p: re.pc.map(() => 1) } : null;
    panel.scrollTop = 0;
    renderPanel();
  }

  function toggleReactions(force) {
    state.rx.open = force ?? !state.rx.open;
    if (!state.rx.open) state.rx.current = null;
    renderPanel();
  }

  /** Crea i reagenti sul banco, in fila nel primo spazio libero; restituisce i gruppi di atomi. */
  function prepareReactants(re) {
    const count = re.r.reactants.reduce((t, [c]) => t + c, 0);
    const size = reactantAtoms(re);
    if (bench.atoms.size + size > MAX_ATOMS) {
      message(size > MAX_ATOMS ? tr('tooBigBench', { size, max: MAX_ATOMS }) : tr('clearFirst', { max: MAX_ATOMS }), 'bad');
      return null;
    }
    const groups = [];
    act(() => {
      const center = scene.freeSpot(2.2 + count * 0.9);
      const right = [engine.camera.matrixWorld.elements[0], engine.camera.matrixWorld.elements[1], engine.camera.matrixWorld.elements[2]];
      let k = 0;
      re.r.reactants.forEach(([c, key]) => {
        for (let n = 0; n < c; n++, k++) {
          const off = (k - (count - 1) / 2) * 2.4;
          groups.push(placeSpecies(key, center.map((x, q) => x + right[q] * off)));
        }
      });
    });
    scene.frameAll(0.8);
    return groups;
  }

  function runReaction(id) {
    const re = reactionById.get(id);
    if (!re) return;
    if (busy()) return message(tr('waitReaction'), 'info', 2000);
    let groups = availableUnits(re);
    if (!groups) {
      groups = prepareReactants(re);
      if (!groups) return;
      message(tr('reactantsReady'), 'info', 1500);
      // fino alla partenza il banco resta fermo: un Annulla o un'altra reazione lascerebbero l'animazione senza reagenti
      state.starting = setTimeout(() => {
        state.starting = null;
        startAnimation(re, groups);
        updateDock();
      }, 900);
      updateDock();
      return;
    }
    startAnimation(re, groups);
  }

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const pairKey = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const bondKey = (b) => `${pairKey(b.a, b.b)}:${b.ionic ? 'i' : b.order}`;
  // tempi di un evento (s): avvicinamento e urto → rottura dei legami → nuovi legami → prodotti al loro posto
  const T_BREAK = 0.9;
  const T_SWAP = 1.8;
  const T_END = 3.3;
  const T_BOUNCE = 1.8; // urto non efficace: le molecole si avvicinano e tornano indietro

  /** Posizioni dei prodotti attorno a `center` nel piano della vista: in fila, o su più file se sono tanti. */
  function slotsAround(center, n, spacing = 2.6) {
    const m = engine.camera.matrixWorld.elements;
    const right = [m[0], m[1], m[2]];
    const up = [m[4], m[5], m[6]];
    const cols = n <= 4 ? n : Math.ceil(Math.sqrt(n * 1.6));
    const rows = Math.ceil(n / cols);
    return Array.from({ length: n }, (_, k) => {
      const row = Math.floor(k / cols);
      const inRow = row === rows - 1 ? n - row * cols : cols;
      const x = ((k % cols) - (inRow - 1) / 2) * spacing;
      const y = ((rows - 1) / 2 - row) * spacing * 0.85;
      return center.map((c, q) => c + right[q] * x + up[q] * y);
    });
  }

  /** Evento di animazione: i legami tra gli atomi `ids` diventano `newBonds` e gli atomi vanno in `targets`. */
  function reactionEvent(groups, ids, center, newBonds, targets, dH) {
    const oldBonds = bench.bondsWithin(ids);
    const newKeys = new Set(newBonds.map(bondKey));
    return {
      kind: 'react',
      groups,
      ids,
      center,
      newBonds,
      targets,
      dH,
      breaking: oldBonds.filter((b) => !newKeys.has(bondKey(b))),
      oldKeys: new Set(oldBonds.map(bondKey)),
    };
  }

  /** Un'istanza di una reazione della libreria: dove andrà ogni atomo, quali legami si rompono e quali si formano. */
  function libraryEvent(re, groups) {
    const ids = groups.flat().filter((id) => bench.atoms.has(id));
    if (!ids.length) return null;
    const center = centroid(ids.map((id) => bench.atoms.get(id).pos));
    // istanze dei prodotti con la loro disposizione
    const instances = [];
    re.r.products.forEach(([c, key], pi) => {
      for (let n = 0; n < c; n++) instances.push({ key, sp: re.products[pi] });
    });
    const places = slotsAround(center, instances.length);
    const plan = instances.map((inst, k) => {
      const sp = inst.sp;
      const bonds = sp.element ? [] : entryBonds(lab, library.get(inst.key));
      const desc = {
        atoms: sp.atoms.map((a) => ({ z: a.z, charge: a.charge || 0 })),
        bonds: bonds.filter((b) => !b.ionic),
        ionic: bonds.filter((b) => b.ionic).map((b) => ({ i: b.i, j: b.j, transfer: b.transfer, donor: b.donor })),
      };
      const layout = sp.atoms.length > 1 ? initialLayout(lab, desc, places[k], k + 1) : [places[k]];
      return { inst, bonds, layout, atomIds: [] };
    });
    // ogni atomo dei prodotti prende l'atomo dello stesso elemento più vicino tra quelli dei reagenti
    const pool = new Map();
    for (const id of ids) {
      const z = bench.atoms.get(id).z;
      if (!pool.has(z)) pool.set(z, []);
      pool.get(z).push(id);
    }
    const slots = [];
    plan.forEach((p, pi) => p.inst.sp.atoms.forEach((a, ai) => slots.push({ pi, ai, z: a.z, pos: p.layout[ai] })));
    const pairs = [];
    for (const sl of slots) {
      for (const id of pool.get(sl.z) ?? []) {
        const pos = bench.atoms.get(id).pos;
        pairs.push({ sl, id, d: Math.hypot(pos[0] - sl.pos[0], pos[1] - sl.pos[1], pos[2] - sl.pos[2]) });
      }
    }
    pairs.sort((a, b) => a.d - b.d);
    const used = new Set();
    const filled = new Set();
    for (const p of pairs) {
      const sk = `${p.sl.pi}:${p.sl.ai}`;
      if (used.has(p.id) || filled.has(sk)) continue;
      used.add(p.id);
      filled.add(sk);
      plan[p.sl.pi].atomIds[p.sl.ai] = p.id;
    }
    if (filled.size !== slots.length) return null;

    const newBonds = [];
    for (const p of plan) {
      for (const b of p.bonds) {
        const a = p.atomIds[b.i];
        const c = p.atomIds[b.j];
        newBonds.push(b.ionic ? { a, b: c, ionic: true, transfer: b.transfer, donor: p.atomIds[b.donor] } : { a, b: c, order: b.order });
      }
    }
    const targets = new Map();
    plan.forEach((p) => p.atomIds.forEach((id, k) => targets.set(id, p.layout[k])));
    return reactionEvent(groups, ids, center, newBonds, targets, reactionDH(re));
  }

  /** Reazione prevista dal modello: gli atomi dei gruppi si legano con `bonds` (indici sugli atomi dei gruppi, come da combine). */
  function modelEvent(groups, bonds, dH) {
    const ids = groups.flat();
    const center = centroid(ids.map((id) => bench.atoms.get(id).pos));
    const newBonds = bonds.map((b) =>
      b.ionic ? { a: ids[b.i], b: ids[b.j], ionic: true, transfer: b.transfer, donor: ids[b.donor] } : { a: ids[b.i], b: ids[b.j], order: b.order },
    );
    // molecole dei prodotti (componenti connesse) disposte attorno al centro
    const parent = ids.map((_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (const b of bonds) parent[find(b.i)] = find(b.j);
    const parts = new Map();
    ids.forEach((_, i) => parts.set(find(i), [...(parts.get(find(i)) ?? []), i]));
    const list = [...parts.values()];
    const places = slotsAround(center, list.length);
    const targets = new Map();
    list.forEach((idx, k) => {
      const local = new Map(idx.map((v, n) => [v, n]));
      const inner = bonds.filter((b) => local.has(b.i));
      const charge = idx.map(() => 0);
      for (const b of inner.filter((x) => x.ionic)) {
        charge[local.get(b.donor)] += b.transfer;
        charge[local.get(b.donor === b.i ? b.j : b.i)] -= b.transfer;
      }
      const desc = {
        atoms: idx.map((i, n) => ({ z: bench.atoms.get(ids[i]).z, charge: charge[n] })),
        bonds: inner.filter((b) => !b.ionic).map((b) => ({ i: local.get(b.i), j: local.get(b.j), order: b.order })),
        ionic: inner.filter((b) => b.ionic).map((b) => ({ i: local.get(b.i), j: local.get(b.j), transfer: b.transfer, donor: local.get(b.donor) })),
      };
      const layout = idx.length > 1 ? initialLayout(lab, desc, places[k], k + 1) : [places[k]];
      idx.forEach((i, n) => targets.set(ids[i], layout[n]));
    });
    return reactionEvent(groups, ids, center, newBonds, targets, dH);
  }

  /** Urto non efficace: le molecole si avvicinano e rimbalzano. */
  function bounceEvent(groups) {
    const ids = groups.flat();
    return { kind: 'bounce', groups, ids, center: centroid(ids.map((id) => bench.atoms.get(id).pos)) };
  }

  /**
   * Avvia gli eventi in parallelo, ciascuno con un piccolo ritardo (urti successivi).
   * @param {{spectators?:number[][], say?:{start?:string, break?:string, form?:string}, onDone?:Function}} opts
   *   spectators: molecole che non reagiscono (solo agitazione termica); say: messaggi delle fasi
   */
  function startAnim(events, { spectators = [], say = {}, onDone = null } = {}) {
    const wobble = () => [0, 1, 2].map(() => ({ w: 7 + Math.random() * 6, p: Math.random() * Math.PI * 2 }));
    const startOf = (ids) => new Map(ids.map((id) => [id, [...bench.atoms.get(id).pos]]));
    events.forEach((ev, n) => {
      ev.delay = n * Math.min(0.3, 1.5 / events.length);
      ev.phase = 'approach';
      ev.start = startOf(ev.ids);
      ev.wobble = ev.groups.map(wobble);
      // ogni gruppo si avvicina al centro fino a toccare gli altri (non oltre)
      ev.shifts = ev.groups.map((g) => {
        const pts = g.map((id) => bench.atoms.get(id).pos);
        const gc = centroid(pts);
        const d = ev.center.map((x, q) => x - gc[q]);
        const dist = Math.hypot(...d);
        const reach = Math.max(...pts.map((p) => Math.hypot(p[0] - gc[0], p[1] - gc[1], p[2] - gc[2]))) + 0.55;
        return d.map((x) => (dist > reach ? (x * (dist - reach)) / dist : 0));
      });
    });
    state.anim = {
      t: 0,
      events,
      say,
      onDone,
      highlight: new Map(),
      spectators: spectators.map((ids) => ({ ids, start: startOf(ids), wobble: wobble() })),
      end: Math.max(...events.map((ev) => ev.delay + (ev.kind === 'bounce' ? T_BOUNCE : T_END))),
    };
    scene.setBondHighlight(new Map());
    if (say.start) message(say.start, 'info', 2600);
    updateDock();
  }

  /** Pianifica l'animazione di una reazione della libreria con i reagenti già sul banco. */
  function startAnimation(re, groups) {
    if (busy()) return;
    const ev = libraryEvent(re, groups);
    if (!ev) return message(tr('atomsMismatch'), 'bad');
    // cronologia: si potrà annullare l'intera reazione
    history.past.push(bench.snapshot());
    history.future = [];
    state.alternatives.clear();
    state.sim = null;
    startAnim([ev], {
      say: {
        start: tr('approach', { title: esc(reactionTitle(re)) }),
        break: tr('breakBonds'),
        form: tr('formBonds'),
      },
      onDone: () => {
        state.selected = new Set(ev.ids.slice(0, 1));
        refresh();
        const dH = re.enthalpy.formation.value;
        const energy = dH == null ? '' : ` · ΔH° = <b>${dH > 0 ? '+' : '−'}${fmtNumber(Math.abs(dH), 1, 1)} kJ</b> (${dH < 0 ? tr('exoShort') : tr('endoShort')})`;
        message(tr('done', { title: esc(reactionTitle(re)), energy }), 'ok', 7000);
        window.dispatchEvent(new CustomEvent('tp3d:reaction', { detail: { id: re.r.id } }));
      },
    });
  }

  const wobbleAt = (wv, t, amp) => wv.map((o) => Math.sin(o.w * t + o.p) * amp);
  function placeGroup(ev, gi, offset) {
    for (const id of ev.groups[gi]) {
      const a = bench.atoms.get(id);
      const s0 = ev.start.get(id);
      if (a) for (let q = 0; q < 3; q++) a.pos[q] = s0[q] + offset[q];
    }
  }

  function stepAnimation(dt) {
    const A = state.anim;
    A.t += Math.min(dt, 0.05);
    let swapped = false;
    let lit = false;
    for (const ev of A.events) {
      const t = A.t - ev.delay;
      if (t < 0 || ev.done) continue;
      if (ev.kind === 'bounce') {
        const k = Math.sin(Math.PI * Math.min(1, t / T_BOUNCE));
        ev.groups.forEach((g, gi) => {
          const w = wobbleAt(ev.wobble[gi], t, 0.1 * (1 - k));
          placeGroup(ev, gi, ev.shifts[gi].map((x, q) => x * k * 0.9 + w[q]));
        });
        if (t >= T_BOUNCE / 2 && ev.phase === 'approach') {
          ev.phase = 'hit';
          scene.flash(ev.center, 0xc9d8f0, 1.3);
        }
        if (t >= T_BOUNCE) {
          ev.groups.forEach((g, gi) => placeGroup(ev, gi, [0, 0, 0]));
          ev.done = true;
        }
        continue;
      }
      if (t < T_BREAK) {
        // avvicinamento con agitazione termica che si smorza all'urto
        const k = ease(t / T_BREAK);
        ev.groups.forEach((g, gi) => {
          const w = wobbleAt(ev.wobble[gi], t, 0.12 * (1 - k));
          placeGroup(ev, gi, ev.shifts[gi].map((x, q) => x * k + w[q]));
        });
        continue;
      }
      if (ev.phase === 'approach') {
        ev.phase = 'break';
        ev.groups.forEach((g, gi) => placeGroup(ev, gi, ev.shifts[gi]));
        for (const b of ev.breaking) A.highlight.set(b.id, 'break');
        lit = true;
        scene.flash(ev.center, 0xfff1c4, 1.2);
        if (ev === A.events[0] && A.say.break && ev.breaking.length) message(A.say.break, 'warn', 2000);
      }
      if (t < T_SWAP) continue;
      if (ev.phase === 'break') {
        ev.phase = 'form';
        for (const b of bench.bondsWithin(ev.ids)) {
          A.highlight.delete(b.id);
          bench.removeBond(b.id);
        }
        for (const id of ev.ids) bench.atoms.get(id).extra = 0;
        for (const b of ev.newBonds) {
          const id = b.ionic ? bench.addBond(b.a, b.b, { ionic: true, transfer: b.transfer, donor: b.donor }) : bench.addBond(b.a, b.b, { order: b.order });
          if (!ev.oldKeys.has(bondKey(b))) A.highlight.set(id, 'form');
        }
        ev.from = new Map(ev.ids.map((id) => [id, [...bench.atoms.get(id).pos]]));
        swapped = lit = true;
        // energia liberata (arancione) o assorbita (azzurro)
        const exo = ev.dH == null || ev.dH < 0;
        scene.flash(ev.center, exo ? 0xffa64d : 0x5cb6ff, exo ? 2.4 : 1.6);
        if (ev.dH != null) {
          // sopra le molecole, nella direzione «su» della vista
          const m = engine.camera.matrixWorld.elements;
          const at = ev.center.map((c, q) => c + m[4 + q] * 1.4);
          scene.floatText(at, `${ev.dH < 0 ? '−' : '+'}${fmtNumber(Math.abs(Math.round(ev.dH)), 0)} kJ`, exo ? 'is-exo' : 'is-endo');
        }
        if (ev === A.events[0] && A.say.form) message(A.say.form, 'ok', 2200);
      }
      const k = ease(Math.min(1, (t - T_SWAP) / (T_END - T_SWAP)));
      for (const id of ev.ids) {
        const a = bench.atoms.get(id);
        const f0 = ev.from.get(id);
        const t0 = ev.targets.get(id);
        for (let q = 0; q < 3; q++) a.pos[q] = f0[q] + (t0[q] - f0[q]) * k;
      }
      if (t >= T_END) ev.done = true;
    }
    // le molecole che non reagiscono si agitano e poi tornano al loro posto
    const env = Math.sin(Math.PI * Math.min(1, A.t / A.end));
    for (const s of A.spectators) {
      const w = wobbleAt(s.wobble, A.t, 0.1 * env);
      for (const id of s.ids) {
        const a = bench.atoms.get(id);
        const s0 = s.start.get(id);
        if (a) for (let q = 0; q < 3; q++) a.pos[q] = s0[q] + w[q];
      }
    }
    if (swapped) {
      analyze();
      syncRelaxers();
    }
    if (lit) scene.setBondHighlight(new Map(A.highlight)); // ricostruisce anche la scena
    if (A.t < A.end) return;
    // fine
    for (const s of A.spectators) {
      for (const id of s.ids) {
        const a = bench.atoms.get(id);
        if (a) a.pos = [...s.start.get(id)];
      }
    }
    state.anim = null;
    refresh();
    setTimeout(() => {
      if (!state.anim) scene.setBondHighlight(new Map());
    }, 1600);
    A.onDone?.();
  }

  // ---------------------------------------------------------------- «Simula reazione»
  // Le molecole sul banco (o quelle selezionate) si agitano e si urtano. A ogni passo avviene la reazione
  // scelta da planReactions (libreria) o, in mancanza, da modelReaction (sintesi per addizione); i prodotti
  // possono reagire nel passo successivo. Se non succede nulla, le molecole rimbalzano e il resoconto spiega perché.

  /** Unità che partecipano alla simulazione: quelle che contengono i suoi atomi. */
  const simUnits = (sim) => state.units.filter((u) => u.ids.some((id) => sim.atoms.has(id)));
  const countList = (list) => {
    const m = new Map();
    for (const d of list) m.set(d, (m.get(d) || 0) + 1);
    return [...m].map(([display, count]) => ({ display, count }));
  };

  function simulate({ energy = false, atoms = null } = {}) {
    if (busy()) return message(tr('waitReaction'), 'info', 2000);
    let units = atoms ? state.units.filter((u) => u.ids.some((id) => atoms.has(id))) : selectedUnits();
    if (!atoms && units.length < 2) units = state.units;
    if (units.length < 2) {
      return message(tr('needTwo'), 'info', 5000);
    }
    if (units.length > 60) return message(tr('tooManyMolecules'), 'bad');
    history.past.push(bench.snapshot()); // Ctrl+Z annulla l'intera simulazione
    if (history.past.length > 120) history.past.shift();
    history.future = [];
    state.alternatives.clear();
    state.rx.open = false;
    state.rx.current = null;
    state.selected.clear();
    scene.setSelection([]);
    const sim = { energy, atoms: new Set(units.flatMap((u) => u.ids)), rounds: 0, steps: [], executed: [], reacted: new Set(), status: 'running', leftover: [], diag: null };
    state.sim = sim;
    renderPanel();
    updateDock();
    message(tr('simStart', { energy, n: units.length }), 'info', 2400);
    nextRound(sim);
  }

  function nextRound(sim) {
    if (state.sim !== sim || sim.status !== 'running') return;
    try {
      const units = simUnits(sim);
      if (sim.rounds < MAX_SIM_ROUNDS && (libraryRound(sim, units) || modelRound(sim, units))) return;
      finishSimulation(sim, units);
    } catch (err) {
      console.error(err);
      state.sim = null;
      state.anim = null;
      refresh();
      message(tr('simError'), 'bad');
    }
  }

  /**
   * Per ogni istanza della reazione, le molecole dei reagenti vicine tra loro sul banco.
   * @param {[string, number][]} req specie e numero di molecole per istanza
   * @param {Map<string, object[]>} pool unità disponibili per specie (quelle scelte vengono tolte)
   */
  function assignGroups(req, pool, times) {
    const out = [];
    for (let n = 0; n < times; n++) {
      const groups = [];
      let center = null;
      for (const [key, c] of req) {
        for (let m = 0; m < c; m++) {
          const list = pool.get(key);
          if (!list?.length) return out;
          let pick = 0;
          if (center) {
            let best = Infinity;
            list.forEach((u, i) => {
              const p = centroid(u.positions);
              const d = Math.hypot(p[0] - center[0], p[1] - center[1], p[2] - center[2]);
              if (d < best) [best, pick] = [d, i];
            });
          }
          groups.push(list.splice(pick, 1)[0].ids);
          center = centroid(groups.flat().map((id) => bench.atoms.get(id).pos));
        }
      }
      out.push(groups);
    }
    return out;
  }

  /**
   * Un passo con le reazioni della libreria: tutte quelle che le molecole presenti possono fare subito
   * avvengono insieme (i prodotti reagiranno nel passo successivo). false se nessuna è possibile.
   */
  function libraryRound(sim, units) {
    const species = speciesOf(units);
    if (!species.size) return false;
    const inventory = new Map([...species].map(([k, list]) => [k, list.length]));
    const now = planReactions(inventory, reactions, { energy: sim.energy, exclude: sim.executed }).steps.filter((s) => s.onlyOrig);
    const pool = new Map([...species].map(([k, list]) => [k, [...list]]));
    const events = [];
    const records = [];
    for (const { re, times } of now) {
      const list = assignGroups(re.r.reactants.map(([c, k]) => [k, c]), pool, times)
        .map((groups) => libraryEvent(re, groups))
        .filter(Boolean);
      if (!list.length) continue;
      events.push(...list);
      records.push({ kind: 'library', re, times: list.length, dH: reactionDH(re) });
    }
    if (!events.length) return false;
    const [first] = records;
    const exo = records.every((r) => r.dH < 0);
    runRound(sim, events, {
      records,
      executed: records.map((r) => r.re),
      say: {
        start: records.length === 1
          ? `${tr('step', { n: sim.rounds + 1 })} · <b>${esc(reactionTitle(first.re))}</b>${first.times > 1 ? tr('timesN', { n: first.times }) : ''}: ${esc(equationText(first.re))}`
          : `${tr('step', { n: sim.rounds + 1 })} · ${tr('together', { n: records.length })}: ${records.map((r) => `<b>${esc(reactionTitle(r.re))}</b>`).join(', ')}`,
        break: tr('effectiveBreak'),
        form: tr('formRelease', { exo }),
      },
    });
    return true;
  }

  /** Un passo previsto dal modello (sintesi per addizione); false se nessuna coppia o terna reagisce. */
  function modelRound(sim, units) {
    const groups = new Map();
    for (const u of units) {
      if (u.charge !== 0 || u.invalid) continue;
      let key = speciesKey(u);
      let hf = null;
      if (key?.startsWith('el:')) hf = MOLECULAR_ELEMENTS.has(u.desc.atoms[0].z) ? null : 0;
      else if (key) hf = u.ident.entry.hf ?? null;
      else if (!u.ionic) key = `x:${formulaKey(lab, u.desc.atoms, 0)}:${signature(u.desc.atoms, u.desc.bonds)}`;
      if (!key) continue;
      if (!groups.has(key)) {
        const bondKj = u.ionic ? null : graphBondEnergy(lab, u.desc.atoms, u.desc.bonds, { tabulated: true });
        groups.set(key, { key, units: [], zs: u.desc.atoms.map((a) => a.z), hf, bondKj });
      }
      groups.get(key).units.push(u);
    }
    const species = [...groups.values()].map((g) => ({ ...g, count: g.units.length }));
    const best = modelReaction(lab, library, species, reactions);
    if (!best) return false;
    const req = [...new Set(best.keys)].map((k) => [k, best.keys.filter((x) => x === k).length]);
    const times = Math.min(...req.map(([k, m]) => Math.floor(groups.get(k).units.length / m)));
    const instances = assignGroups(req, new Map([...groups].map(([k, g]) => [k, [...g.units]])), times);
    const events = [];
    for (const g of instances) {
      const r = combine(lab, library, g.flat().map((id) => bench.atoms.get(id).z));
      if (r.ok && r.source === 'library' && r.entry.id === best.product.entry.id) events.push(modelEvent(g, r.bonds, best.dH));
    }
    if (!events.length) return false;
    const entry = best.product.entry;
    const productFormula = entry.formula ?? displayFormula(lab, entry.graph.atoms, 0, { ionic: entry.ionic });
    const reactants = countList(instances[0].map((g) => state.unitOfAtom.get(g[0]).formula));
    const record = { kind: 'model', product: best.product, productFormula, reactants, dH: best.dH, method: best.method, times: events.length };
    runRound(sim, events, {
      records: [record],
      say: {
        start: `${tr('step', { n: sim.rounds + 1 })} · ${tr('modelPredicts', { eq: esc(equationText(stepEquation(record)).split(' → ')[0]), name: esc(lowerFirst(entry.name)) })}`,
        break: tr('effectiveBreak'),
        form: tr('modelForms', { name: esc(lowerFirst(entry.name)) }),
      },
    });
    return true;
  }

  function runRound(sim, events, { records, executed = [], say }) {
    const used = new Set(events.flatMap((ev) => ev.ids));
    const spectators = simUnits(sim)
      .filter((u) => !u.ids.some((id) => used.has(id)))
      .map((u) => u.ids);
    for (const id of used) sim.reacted.add(id);
    startAnim(events, {
      spectators,
      say,
      onDone: () => {
        sim.rounds++;
        sim.steps.push(...records);
        sim.executed.push(...executed);
        renderPanel();
        // breve pausa: i prodotti assumono la loro forma prima dell'urto successivo
        setTimeout(() => nextRound(sim), 700);
      },
    });
  }

  function finishSimulation(sim, units) {
    if (!sim.steps.length) {
      // nessuna reazione: urti non efficaci, le molecole rimbalzano
      sim.diag = diagnose(new Map([...speciesOf(units)].map(([k, list]) => [k, list.length])), reactions, { energy: sim.energy });
      startAnim([bounceEvent(units.map((u) => u.ids))], {
        say: { start: tr('collide') },
        onDone: () => {
          history.past.pop(); // il banco non è cambiato: niente da annullare
          sim.status = 'none';
          updateDock();
          renderPanel();
          const hint = sim.diag.missing[0];
          const text = hint
            ? tr('lacks', { title: esc(reactionTitle(hint.re)), n: hint.lack.reduce((t, x) => t + x.count, 0), list: esc(hint.lack.map((x) => `${x.count > 1 ? `${x.count} ` : ''}${x.display}`).join(', ')) })
            : sim.diag.endothermic.length
              ? tr('endoPossible')
              : '';
          message(tr('noReaction', { text }), 'warn', 7000);
        },
      });
      return;
    }
    sim.status = 'done';
    sim.leftover = countList(units.filter((u) => !u.ids.some((id) => sim.reacted.has(id))).map((u) => u.formula));
    state.selected.clear();
    refresh();
    if (bench.atoms.size <= 60) scene.frameAll(1);
    const eq = sim.steps.map((s) => `${esc(equationText(stepEquation(s)))}${s.times > 1 ? ` (× ${s.times})` : ''}`).join(' · ');
    const dH = sim.steps.reduce((t, s) => t + s.dH * s.times, 0);
    const left = sim.leftover.length ? `<br><small>${tr('didNotReact', { list: esc(sim.leftover.map((x) => `${x.count > 1 ? `${x.count} ` : ''}${x.display}`).join(', ')) })}</small>` : '';
    message(tr('simDone', { rounds: sim.rounds, eq, sign: dH < 0 ? '≈ −' : '≈ +', kj: fmtNumber(Math.abs(Math.round(dH)), 0), exo: dH < 0, left }), 'ok', 9000);
    for (const s of sim.steps) if (s.kind === 'library') window.dispatchEvent(new CustomEvent('tp3d:reaction', { detail: { id: s.re.r.id } }));
  }

  /** Aggiunge i reagenti che mancano a una reazione «quasi pronta» e ripete la simulazione. */
  function addMissingAndSimulate(id) {
    const prev = state.sim;
    const m = prev?.diag?.missing.find((x) => x.re.r.id === id);
    if (!m) return;
    const size = m.lack.reduce((t, x) => t + x.count * (x.key.startsWith('el:') ? 1 : library.get(x.key).graph.atoms.length), 0);
    if (bench.atoms.size + size > MAX_ATOMS) return message(tr('maxAtoms', { max: MAX_ATOMS }), 'bad');
    const atoms = new Set(prev.atoms);
    const ok = act(() => {
      for (const x of m.lack) {
        for (let n = 0; n < x.count; n++) for (const a of placeSpecies(x.key, scene.freeSpot(2.4))) atoms.add(a);
      }
    });
    if (ok) simulate({ energy: prev.energy, atoms });
  }

  // ---------------------------------------------------------------- testi al passaggio del puntatore
  function hoverHtml(hit) {
    if (hit.atomId) {
      const a = bench.atoms.get(hit.atomId);
      const info = lab.get(a.z);
      const la = state.unitOfAtom.get(hit.atomId)?.lewisByAtom.get(hit.atomId);
      const parts = [`<b>${info.symbol}</b> ${esc(info.name.toLowerCase())}`];
      if (la) {
        if (la.formalCharge) parts.push(tr('charge', { q: chargeLabel(hit.atomId) }));
        if (la.lonePairs) parts.push(tr('lonePairs', { n: la.lonePairs }));
        if (la.unpaired) parts.push(tr('unpairedOne', { n: la.unpaired }));
      }
      const hint = state.mode === 'bond' ? tr('clickToBond') : state.mode === 'move' ? tr('dragToBond') : '';
      return `${parts.join(' · ')}${hint ? `<br><small>${hint}</small>` : ''}`;
    }
    const b = bench.bonds.get(hit.bondId);
    if (!b) return null;
    const A = lab.get(bench.atoms.get(b.a).z);
    const B = lab.get(bench.atoms.get(b.b).z);
    const ch = bondCharacter(A, B);
    const what = b.ionic ? tr('ionicBondShort') : tr('bondShort', { order: ORDER_NAME[b.order], type: ch.type });
    const hint = state.mode === 'cut' ? tr('clickToBreak') : b.ionic ? tr('rightToSeparate') : tr('clickOrder');
    return `<b>${A.symbol}${b.ionic ? '···' : '–'}${B.symbol}</b> ${what}<br><small>${hint}</small>`;
  }

  // ---------------------------------------------------------------- eventi UI
  root.addEventListener('click', (ev) => {
    const t = ev.target.closest('button');
    if (!t) {
      if (!ev.target.closest('.lab-examples') && !$('.lab-examples').hidden && !ev.target.closest('[data-act="examples"]')) toggleExamples(false);
      if (!ev.target.closest('.lab-formula') && !formulaBox.hidden && !ev.target.closest('[data-act="formula"]')) toggleFormula(false);
      return;
    }
    if (t.dataset.mode) setMode(t.dataset.mode);
    if (t.dataset.example) {
      toggleExamples(false);
      buildEntry(MOLECULES.find((m) => m.id === t.dataset.example));
    }
    if (t.dataset.reaction) openReaction(t.dataset.reaction);
    if (t.dataset.simAdd) addMissingAndSimulate(t.dataset.simAdd);
    if (t.dataset.rxTab) {
      state.rx.practice = t.dataset.rxTab === 'practice';
      renderPanel();
    }
    if (t.dataset.coef) {
      const [side, i, d] = t.dataset.coef.split(':');
      const arr = state.rx.coeffs[side];
      arr[Number(i)] = Math.min(MAX_COEF, Math.max(1, arr[Number(i)] + Number(d)));
      renderPanel();
    }
    if (t.dataset.unit) {
      const u = state.units.find((x) => x.key === t.dataset.unit);
      if (u) select([u.ids[0]], { add: ev.ctrlKey || ev.metaKey });
    }
    if (t.dataset.alt) {
      const [u] = selectedUnits();
      const alt = MOLECULES.find((m) => m.id === t.dataset.alt);
      if (u && alt) {
        const others = (state.alternatives.get(u.key) ?? []).filter((e) => e.id !== alt.id);
        const ids = buildEntry(alt, { replace: u.ids });
        const nu = ids && state.unitOfAtom.get(ids[0]);
        if (nu && u.ident.exact) state.alternatives.set(nu.key, [library.get(u.ident.entry.id), ...others]);
        renderPanel();
      }
    }
    switch (t.dataset.act) {
      case 'close': close(); break;
      case 'deselect': select([]); break;
      case 'combine': combineAction(); break;
      case 'simulate': simulate(); break;
      case 'sim-energy': simulate({ energy: true, atoms: state.sim?.atoms }); break;
      case 'sim-close': state.sim = null; renderPanel(); break;
      case 'separate': separate(); break;
      case 'ions': separate({ ions: true }); break;
      case 'add-e': changeCharge(+1); break;
      case 'remove-e': changeCharge(-1); break;
      case 'delete': deleteSelected(); break;
      case 'clear': clearBench(); break;
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'examples': toggleExamples(); break;
      case 'formula': toggleFormula(); break;
      case 'reactions': toggleReactions(); break;
      case 'rx-list': state.rx.current = null; renderPanel(); break;
      case 'rx-run': runReaction(state.rx.current); break;
      case 'rx-prepare': {
        const re = reactionById.get(state.rx.current);
        if (re && prepareReactants(re)) message(tr('reactantsOnBench'), 'info', 3000);
        break;
      }
      case 'rx-solution': {
        const re = reactionById.get(state.rx.current);
        state.rx.coeffs = { r: [...re.rc], p: [...re.pc] };
        renderPanel();
        break;
      }
    }
  });

  // ricerca tra le reazioni e gruppi del catalogo (si disegnano solo le voci dei gruppi aperti)
  panel.addEventListener('input', (ev) => {
    if (!ev.target.matches('[data-rx-search]')) return;
    state.rx.query = ev.target.value;
    const searching = ev.target.value.trim() !== '';
    panel.querySelectorAll('.rx-group--bench, .rx-group--near').forEach((el) => (el.hidden = searching));
    panel.querySelector('.rx-results').innerHTML = reactionResultsHtml(reactions, { query: state.rx.query, open: state.rx.groups });
  });
  panel.addEventListener('toggle', (ev) => {
    const key = ev.target.dataset?.rxGroup;
    if (!key) return;
    if (ev.target.open) state.rx.groups.add(key);
    else state.rx.groups.delete(key);
    const body = ev.target.querySelector('.rx-fold__body');
    if (ev.target.open && !body.children.length) body.innerHTML = reactionGroupBodyHtml(reactions.filter((re) => re.r.group === key));
  }, true);

  root.addEventListener('change', (ev) => {
    const k = ev.target.dataset.opt;
    if (!k) return;
    state.opts[k] = ev.target.checked;
    scene.setOptions(state.opts);
  });

  function toggleExamples(force) {
    const box = $('.lab-examples');
    const show = force ?? box.hidden;
    box.hidden = !show;
    $('[data-act="examples"]').setAttribute('aria-expanded', String(show));
    if (show) {
      toggleFormula(false);
      requestAnimationFrame(() => box.querySelector('.lex-search input').focus({ preventScroll: true }));
    }
  }

  // ricerca tra gli esempi (nome, nome alternativo o formula)
  $('.lex-search input').addEventListener('input', (ev) => {
    const q = normalizeName(ev.target.value);
    const box = $('.lab-examples');
    let any = false;
    box.querySelectorAll('[data-example]').forEach((b) => {
      const e = library.get(b.dataset.example);
      const f = (e.formula ?? '') + ' ' + formulaKey(lab, e.graph.atoms, 0);
      const hit = !q || normalizeName(`${e.name} ${e.aka ?? ''}`).includes(q) || normalizeName(f.replace(/[₀-₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c))).includes(q);
      b.hidden = !hit;
      any ||= hit;
    });
    box.querySelectorAll('section[data-group]').forEach((sec) => (sec.hidden = !sec.querySelector('[data-example]:not([hidden])')));
    box.querySelector('.lex-empty').hidden = any;
  });
  $('.lex-search input').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const first = $('.lab-examples [data-example]:not([hidden])');
      if (first) first.click();
    }
  });

  function setMode(mode) {
    state.mode = mode;
    setPending(null);
    updateDock();
    const hints = { move: tr('hintMove'), bond: tr('hintBond'), cut: tr('hintCut') };
    message(hints[mode], 'info', 3000);
  }

  function onKey(ev) {
    if (root.hidden) return;
    const typing = ev.target instanceof HTMLElement && ev.target.matches('input[type="search"], input[type="text"], textarea');
    const key = ev.key.toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && key === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) redo();
      else undo();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && key === 'y') {
      ev.preventDefault();
      redo();
      return;
    }
    if (ev.key === 'Escape') {
      ev.preventDefault();
      if (!formulaBox.hidden) toggleFormula(false);
      else if (!$('.lab-examples').hidden) toggleExamples(false);
      else if (state.rx.open && state.rx.current) {
        state.rx.current = null;
        renderPanel();
      } else if (state.rx.open) toggleReactions(false);
      else if (state.pending) setPending(null);
      else if (state.mode !== 'move') setMode('move');
      else if (state.selected.size) select([]);
      else close();
      return;
    }
    if (typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      ev.preventDefault();
      deleteSelected();
    } else if (key === 'c') combineAction();
    else if (key === 'r') simulate();
    else if (key === 's') separate();
    else if (key === 'v') setMode('move');
    else if (key === 'b') setMode('bond');
    else if (key === 'x') setMode('cut');
    else if (key === 'f') {
      ev.preventDefault();
      toggleFormula(true);
    }
  }
  window.addEventListener('keydown', onKey);

  function layout() {
    const wide = window.innerWidth > 980;
    engine.setInsets(wide ? PALETTE_W : 0, wide ? PANEL_W : 0);
  }
  window.addEventListener('resize', () => !root.hidden && layout());

  // solo in sviluppo: accesso dalla console per i test
  if (import.meta.env.DEV) window.__lab = { bench, lab, library, state, scene, addAtom, bond, combineAction, buildEntry, select, separate, cycleOrder, breakBond, changeCharge, undo, redo, reactions, openReaction, runReaction, matchReactions, interpret, buildFromFormula, toggleFormula, simulate };

  // ---------------------------------------------------------------- apertura / chiusura
  let lastFocus = null;
  let closeHook = null;
  let closing = 0; // timer della chiusura animata: riaprendo subito non deve più nascondere il laboratorio
  /**
   * @param {number} [z] elemento da mettere sul banco
   * @param {{reaction?: string, above?: boolean, onClose?: Function}} [opts] reaction: scheda da aprire; above: sopra il
   *   simulatore di laboratorio (dal suo quaderno); onClose: chiamata quando si chiude
   */
  function open(z, opts = {}) {
    if (closing) {
      // riaperto durante la chiusura: chi l'aveva aperto prima viene comunque avvisato
      clearTimeout(closing);
      closing = 0;
      closeHook?.();
    }
    lastFocus = document.activeElement;
    root.classList.toggle('is-above', Boolean(opts.above));
    closeHook = opts.onClose ?? null;
    root.hidden = false;
    root.classList.remove('is-leaving');
    root.classList.add('is-entering');
    setTimeout(() => root.classList.remove('is-entering'), 800);
    layout();
    engine.resetQuality();
    engine.start();
    refresh();
    if (z) addAtom(z);
    if (opts.reaction && reactionById.has(opts.reaction)) openReaction(opts.reaction);
    requestAnimationFrame(() => $('.lab-back').focus({ preventScroll: true }));
  }

  function close() {
    if (root.hidden) return;
    root.classList.add('is-leaving');
    clearTimeout(closing);
    closing = setTimeout(() => {
      closing = 0;
      root.hidden = true;
      root.classList.remove('is-leaving');
      engine.stop();
      lastFocus?.focus?.({ preventScroll: true });
      onClose?.();
      closeHook?.();
      closeHook = null;
    }, 240);
  }

  return { open, close, isOpen: () => !root.hidden };
}
