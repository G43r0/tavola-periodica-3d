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
import { createLibraryIndex, covalentParts, displayFormula, chargeText, formulaKey, normalizeName, subscript } from './chem/identify.js';
import { combine, entryBonds, entryEnergy, ionicDecomposition } from './chem/combine.js';
import { parseFormula, looksLikeSmiles, splitFormulaList } from './chem/formula.js';
import { parseSmiles } from './chem/smiles.js';
import { ionName, ionicCompoundName, binaryCovalentName, linearAlkaneName } from './chem/naming.js';
import { createBenchScene } from './bench-scene.js';
import { createPalette } from './palette.js';
import { unitPanelHtml, summaryHtml } from './molecule-panel.js';
import { REACTIONS } from './data/reactions.js';
import { speciesInfo, reactionEnthalpy } from './chem/reactions.js';
import { bondEnergy } from './chem/bond-energy.js';
import { reactionListHtml, reactionCardHtml, equationHtml } from './reaction-panel.js';
import { esc, fmtNumber } from '../chem/format.js';
import { icons } from '../ui/icons.js';

const MAX_ATOMS = 150;
/** Nome in minuscolo dentro una frase, senza toccare i numeri romani: "Cloruro di ferro(III)" → "cloruro di ferro(III)". */
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const PALETTE_W = 318;
const PANEL_W = 356;

const TEMPLATE = `
  <div class="lab-stage"></div>
  <header class="lab-top">
    <button type="button" class="btn-ghost lab-back" data-act="close">${icons.prev(16)}<span>Tavola periodica</span><kbd>Esc</kbd></button>
    <div class="lab-title">
      <span class="lab-title__icon">${icons.flask(22)}</span>
      <div><p class="lab-eyebrow">Simulatore</p><h2 id="lab-title">Laboratorio molecolare</h2></div>
    </div>
    <div class="segmented lab-modes" role="group" aria-label="Strumento">
      <button type="button" class="segmented__btn" data-mode="move" aria-pressed="true" title="Sposta: trascina gli atomi; avvicinali per legarli (V)">${icons.move(15)}<span>Sposta</span></button>
      <button type="button" class="segmented__btn" data-mode="bond" aria-pressed="false" title="Lega: clic su due atomi, anche della stessa molecola (B)">${icons.link(15)}<span>Lega</span></button>
      <button type="button" class="segmented__btn" data-mode="cut" aria-pressed="false" title="Forbici: clic su un legame per romperlo (X)">${icons.scissors(15)}<span>Forbici</span></button>
    </div>
    <div class="lab-top__end">
      <button type="button" class="btn-ghost lab-formula-toggle" data-act="formula" aria-expanded="false" title="Scrivi o incolla una formula, un nome o uno SMILES e costruiscila sul banco (F, oppure Ctrl+V sul banco)">${icons.clipboard(16)}<span>Formula</span></button>
      <button type="button" class="btn-ghost lab-rx-toggle" data-act="reactions" aria-pressed="false" title="Reazioni chimiche: equazioni, bilanciamento, energia, animazione">${icons.flask(16)}<span>Reazioni</span></button>
      <button type="button" class="btn-ghost" data-act="examples" aria-expanded="false">${icons.book(16)}<span>Esempi</span></button>
      <label class="lab-toggle"><input type="checkbox" data-opt="labels" checked /><span>Etichette</span></label>
      <label class="lab-toggle"><input type="checkbox" data-opt="lone" checked /><span>Coppie solitarie</span></label>
    </div>
  </header>
  <aside class="lab-palette" aria-label="Elementi"></aside>
  <aside class="lab-panel" aria-live="polite"></aside>
  <div class="lab-dock" role="toolbar" aria-label="Azioni">
    <button type="button" class="lab-act lab-act--primary" data-act="combine" title="Combina gli atomi selezionati (o tutti gli atomi liberi) nella struttura più stabile (C)">${icons.merge(18)}<span>Combina</span></button>
    <button type="button" class="lab-act" data-act="separate" title="Separa la molecola selezionata in atomi (S)">${icons.split(18)}<span>Separa</span></button>
    <button type="button" class="lab-act" data-act="ions" hidden title="Separa il composto ionico nei suoi ioni">${icons.split(18)}<span>In ioni</span></button>
    <span class="lab-dock__sep"></span>
    <button type="button" class="lab-act lab-act--icon" data-act="add-e" title="Aggiungi un elettrone alla molecola selezionata (diventa uno ione negativo)">${icons.plus(16)}<span>e⁻</span></button>
    <button type="button" class="lab-act lab-act--icon" data-act="remove-e" title="Togli un elettrone alla molecola selezionata (diventa uno ione positivo)">${icons.minus(16)}<span>e⁻</span></button>
    <span class="lab-dock__sep"></span>
    <button type="button" class="lab-act lab-act--icon" data-act="delete" title="Elimina la selezione (Canc)">${icons.trash(17)}</button>
    <button type="button" class="lab-act lab-act--icon" data-act="clear" title="Svuota il banco">${icons.broom(17)}</button>
    <button type="button" class="lab-act lab-act--icon" data-act="undo" title="Annulla (Ctrl+Z)">${icons.undo(17)}</button>
    <button type="button" class="lab-act lab-act--icon" data-act="redo" title="Ripeti (Ctrl+Y)">${icons.redo(17)}</button>
  </div>
  <div class="lab-examples" hidden role="dialog" aria-label="Esempi di molecole">
    <div class="lex-search"><input type="search" placeholder="Cerca tra ${MOLECULES.length} sostanze (nome o formula)…" aria-label="Cerca un esempio" spellcheck="false" /></div>
    ${MOLECULE_GROUPS.map(
      (g) => `<section data-group="${g.key}"><h4>${g.label}</h4><div>${MOLECULES.filter((m) => m.group === g.key)
        .map((m) => `<button type="button" class="chip-btn" data-example="${m.id}">${esc(m.name)}</button>`)
        .join('')}</div></section>`,
    ).join('')}
    <p class="lex-empty" hidden>Nessun esempio trovato: prova con <b>Formula</b>, che costruisce anche le sostanze non in libreria.</p>
  </div>
  <div class="lab-formula" hidden role="dialog" aria-labelledby="lf-title">
    <form class="lf-form" autocomplete="off">
      <label class="lf-title" id="lf-title" for="lf-input">Formula, nome o SMILES</label>
      <div class="lf-row">
        <input id="lf-input" class="lf-input" type="text" spellcheck="false" autocapitalize="off"
          placeholder="es. H2SO4 · Ca(OH)2 · CuSO4·5H2O · 2 H2 + O2 · acqua" />
        <button type="submit" class="lab-act lab-act--primary" data-lf="build" title="Costruisci la sostanza sul banco (Invio)">${icons.merge(16)}<span>Costruisci</span></button>
        <button type="button" class="lab-act" data-lf="atoms" title="Metti sul banco solo gli atomi, senza legami: li colleghi tu">Solo atomi</button>
      </div>
    </form>
    <div class="lf-preview" aria-live="polite"></div>
    <div class="lf-foot">
      <div class="lf-examples">${['H2O', 'H2SO4', 'Ca(OH)2', 'C6H12O6', 'CuSO4·5H2O', 'NH4+', '2 H2 + O2', 'KMnO4', 'C8H10N4O2', 'CCO']
        .map((f) => `<button type="button" class="chip-btn" data-lf-example="${esc(f)}">${esc(f)}</button>`)
        .join('')}</div>
    </div>
    <p class="lf-help">Maiuscole e minuscole contano: <b>Co</b> è il cobalto, <b>CO</b> il monossido di carbonio.
      Cariche: <code>NH4+</code>, <code>SO4^2-</code>; idrati: <code>CuSO4·5H2O</code>; più sostanze: <code>2 H2 + O2</code>.
      Puoi anche premere <kbd>Ctrl</kbd>+<kbd>V</kbd> direttamente sul banco.</p>
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
  root.innerHTML = TEMPLATE;
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
    rx: { open: false, current: null, practice: false, coeffs: null },
    anim: null, // animazione di una reazione in corso
  };

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
    $('.lab-stage').innerHTML = '<p class="lab-error">Impossibile avviare la grafica 3D (WebGL non disponibile).</p>';
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
        generatedName = `Ione ${ionName(info, charge)}`;
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
        ? `${ident.entry.name}${ident.exact ? '' : ident.byFormula ? ' (dalla formula)' : ' (struttura diversa)'}`
        : generatedName ?? (ids.length === 1 ? `atomo di ${lab.get(desc.atoms[0].z).name.toLowerCase()}` : 'non in libreria');
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
    if (state.anim) {
      message('Attendi la fine della reazione.', 'info', 2000);
      return false;
    }
    const snap = bench.snapshot();
    const ok = fn();
    if (ok === false) return false;
    history.past.push(snap);
    if (history.past.length > 120) history.past.shift();
    history.future = [];
    refresh();
    return true;
  }
  function undo() {
    if (!history.past.length) return message('Niente da annullare.', 'info');
    history.future.push(bench.snapshot());
    bench.restore(history.past.pop());
    cleanSelection();
    refresh();
  }
  function redo() {
    if (!history.future.length) return message('Niente da ripetere.', 'info');
    history.past.push(bench.snapshot());
    bench.restore(history.future.pop());
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
    if (state.rx.open) return renderReactions();
    const sel = selectedUnits();
    const scroll = panel.scrollTop;
    if (sel.length === 1) {
      panel.innerHTML = unitPanelHtml(lab, sel[0], { alternatives: state.alternatives.get(sel[0].key) ?? [] });
      panel.scrollTop = scroll;
    } else if (sel.length > 1) {
      panel.innerHTML = `${summaryHtml(sel)}<p class="mp-note">${sel.length} unità selezionate: premi <b>Combina</b> per riunirne gli atomi in una nuova struttura.</p>`;
    } else {
      panel.innerHTML = summaryHtml(state.units);
    }
    // reazioni possibili con le molecole presenti
    const ready = matchReactions().filter((m) => m.missing.length === 0);
    if (ready.length && sel.length !== 1) {
      panel.insertAdjacentHTML(
        'beforeend',
        `<section class="mp-sec rx-suggest"><h4>Reazioni possibili sul banco</h4>${ready
          .slice(0, 4)
          .map((m) => `<button type="button" class="rx-item" data-reaction="${m.re.r.id}"><b>${esc(m.re.r.name)}</b>${equationHtml(m.re)}</button>`)
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
    $('[data-act="undo"]').disabled = !history.past.length;
    $('[data-act="redo"]').disabled = !history.future.length;
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    root.classList.toggle('mode-cut', state.mode === 'cut');
    root.classList.toggle('is-reacting', Boolean(state.anim));
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
    if (bench.atoms.size >= MAX_ATOMS) return message(`Il banco può contenere al massimo ${MAX_ATOMS} atomi.`, 'bad');
    let id;
    act(() => {
      id = bench.addAtom(z, pos ?? scene.freeSpot(1.7));
    });
    select([id]);
    const info = lab.get(z);
    if (info.tier === TIER.UNKNOWN) message(`${esc(info.name)}: chimica sconosciuta, i legami che formerai sono ipotetici.`, 'warn');
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
      return `<b>Legame ionico</b>: ${esc(Art(D).toLowerCase())} cede ${r.transfer} elettron${r.transfer === 1 ? 'e' : 'i'} ${C.z === 9 || /^[aeiou]/i.test(C.name) ? 'all\'' : 'al '}${esc(C.name.toLowerCase())} (ΔEN ${r.character.dEN.toFixed(2).replace('.', ',')})`;
    }
    return `<b>Legame ${esc(r.character.type)}</b> ${A.symbol}–${B.symbol}${r.character.dEN != null ? ` (ΔEN ${r.character.dEN.toFixed(2).replace('.', ',')})` : ''}${r.warning ? `<br><small>${esc(r.warning)}</small>` : ''}`;
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
    const done = u.ident.exact ? ` · hai formato <b>${esc(lowerFirst(u.ident.entry.name))}</b> (${esc(u.formula)})!` : '';
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
        message('Ora scegli il secondo atomo (anche della stessa molecola, per chiudere un anello).', 'info', 3500);
      } else if (state.pending === id) setPending(null);
      else {
        const first = state.pending;
        setPending(null);
        bond(first, id);
      }
      return;
    }
    if (state.mode === 'cut') {
      message('Con le forbici fai clic su un <b>legame</b> per romperlo.', 'info', 3000);
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
    if (b.ionic) return message('Un legame ionico non ha un ordine: è l\'attrazione tra ioni di carica opposta.', 'info');
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
        message(`Legame ${A}–${B} ${ORDER_NAME[o]}${done}`, 'ok', 3000);
        select([b.a]);
        return;
      }
      firstFail ??= r.reason;
    }
    message(esc(firstFail ?? 'Ordine di legame non modificabile.'), 'bad');
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
      b.ionic
        ? `Legame ionico rotto: restano gli ioni ${A.symbol} e ${B.symbol} con le loro cariche.`
        : `Legame ${A.symbol}–${B.symbol} rotto: ogni atomo riprende ${b.order === 1 ? 'il suo elettrone' : 'i suoi elettroni'} (rottura omolitica).`,
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
      return message('Seleziona le molecole da combinare (Ctrl+clic) oppure metti sul banco almeno due atomi liberi.', 'info');
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
    const radical = r.unpaired ? ` · ${r.unpaired === 1 ? 'resta 1 elettrone spaiato' : `restano ${r.unpaired} elettroni spaiati`}` : '';
    if (bench.atoms.size <= 40) scene.frameAll(1);
    let energy = '';
    if (energyBefore != null && energyAfter != null && Math.abs(energyBefore - energyAfter) > 1) {
      const dH = energyBefore - energyAfter;
      energy = energyBefore === 0
        ? `<br><small>Formando i legami da atomi isolati si liberano ≈ ${fmtNumber(Math.round(-dH), 0)} kJ/mol (energie di legame medie).</small>`
        : `<br><small>ΔH ≈ ${dH > 0 ? '+' : '−'}${fmtNumber(Math.abs(Math.round(dH)), 0)} kJ/mol (legami rotti − legami formati, energie medie): ${dH < 0 ? 'si libera' : 'si assorbe'} energia.</small>`;
    }
    message(`${made.length === 1 ? 'Formato' : 'Formati'}: ${list}${radical}${r.alternatives?.length ? ' · vedi gli altri isomeri nella scheda' : ''}${energy}`, r.unpaired ? 'warn' : 'ok', 7000);
  }

  function separate({ ions = false } = {}) {
    const units = selectedUnits().filter((u) => (ions ? u.ionic : u.ids.length > 1));
    if (!units.length) return message(ions ? 'Seleziona un composto ionico.' : 'Seleziona una molecola da separare.', 'info');
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
      ions
        ? 'Ioni separati: ognuno conserva la sua carica (il metallo ha ceduto elettroni, il non metallo li ha acquistati).'
        : 'Molecola separata in atomi: ogni atomo riprende i suoi elettroni di valenza; quelli con elettroni spaiati sono radicali.',
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
    if (delta < 0 && lw <= 0) return message('Non ci sono più elettroni da togliere.', 'bad');
    act(() => {
      bench.atoms.get(pick.id).extra += delta > 0 ? 1 : -1;
    });
    const nu = state.unitOfAtom.get(pick.id);
    const name = nu.ident.exact ? ` · <b>${esc(nu.ident.entry.name)}</b>` : '';
    message(`${delta > 0 ? 'Aggiunto' : 'Tolto'} un elettrone (${esc(pick.info.symbol)}): carica totale ${nu.charge ? `${nu.charge > 0 ? '+' : '−'}${Math.abs(nu.charge)}` : '0'}${name}`, 'ok');
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
    message('Banco svuotato (Ctrl+Z per annullare).', 'info');
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
    if (bench.atoms.size + g.atoms.length > MAX_ATOMS) return message(`Il banco può contenere al massimo ${MAX_ATOMS} atomi.`, 'bad');
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
    message(`Costruito: <b>${esc(entry.name)}</b>`, 'ok', 3000);
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
    const atoms = [];
    for (const [sym, n] of sp.counts) for (let k = 0; k < n; k++) atoms.push({ z: lab.bySymbol.get(sym).z, charge: 0 });
    const [entry, ...alternatives] = libraryCandidates(atoms, sp.charge);
    return { coef: sp.coef, sp, atoms, entry: entry ?? null, alternatives };
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
        return pf.ok && pf.species.length === 1 ? resolveSpecies(pf.species[0]) : { error: `«${part}»: ${pf.ok ? 'scrivi una sostanza alla volta' : pf.error}` };
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
      else jobs.push({ count, atoms: it.atoms, charge: it.sp.charge, sp: it.sp, free: atomsOnly });
    };
    if (res.kind === 'name') {
      if (atomsOnly) jobs.push({ count: 1, item: library.get(res.entry.id), free: true });
      else jobs.push({ count: 1, entry: res.entry });
    } else if (res.kind === 'smiles') {
      jobs.push(res.entry && !atomsOnly ? { count: 1, entry: res.entry } : { count: 1, item: res.item, free: atomsOnly });
    } else if (res.kind === 'formula') res.items.forEach((it) => fromItem(it, 1));
    return jobs;
  }

  const jobSize = (j) => (j.entry ? library.get(j.entry.id).graph.atoms.length : j.item ? j.item.graph.atoms.length : j.atoms.length);

  /** Descrizione di una specie letta dalla formula (per l'anteprima). */
  function speciesLabel(x) {
    const n = [...x.sp.counts.values()].reduce((a, b) => a + b, 0);
    if (x.entry) {
      const alt = x.alternatives.length;
      return `<b>${esc(x.entry.name)}</b>${alt ? ` <small>(+${alt} isomer${alt === 1 ? 'o' : 'i'})</small>` : ''}`;
    }
    if (n === 1) {
      const info = lab.bySymbol.get([...x.sp.counts.keys()][0]);
      return x.sp.charge ? `ione ${esc(ionName(info, x.sp.charge))}` : `atomo di ${esc(info.name.toLowerCase())}`;
    }
    if (x.sp.charge) return '<span class="lf-warn">ione non in libreria: atomi da collegare a mano</span>';
    const salt = ionicDecomposition(lab, library, x.atoms.map((a) => a.z));
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
      return `<b>${esc(name ?? 'composto ionico')}</b> <small>(${[...ions].map(([t, c]) => `${c > 1 ? `${c} ` : ''}${esc(t)}`).join(' + ')}, nome generato)</small>`;
    }
    return '<span class="lf-warn">non in libreria: Combina cercherà la struttura più stabile</span>';
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
        ? `<p class="lf-line">Sostanze con questo nome:</p>${chips(sugg)}`
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
      lines.push(`<p class="lf-line"><b>${esc(res.entry.name)}</b> <span class="lf-f">${subHtml(res.entry.formula ?? displayFormula(lab, lib.graph.atoms, 0, { ionic: lib.ionic }))}</span> <small>in libreria</small></p>`);
      if (res.suggestions.length) lines.push(`<p class="lf-sub">Nomi simili:</p>${chips(res.suggestions.slice(0, 6))}`);
      counts = new Map();
      for (const a of lib.graph.atoms) counts.set(lab.get(a.z).symbol, (counts.get(lab.get(a.z).symbol) || 0) + 1);
    } else if (res.kind === 'smiles') {
      const g = res.item.graph;
      const f = displayFormula(lab, g.atoms, res.item.charge, { ionic: res.item.ionic });
      lines.push(`<p class="lf-line">SMILES: <span class="lf-f">${subHtml(f)}</span>, ${g.atoms.length} atomi → ${res.entry ? `<b>${esc(res.entry.name)}</b> <small>in libreria</small>` : 'non in libreria: costruita così come è scritta'}</p>`);
      counts = new Map();
      for (const a of g.atoms) counts.set(lab.get(a.z).symbol, (counts.get(lab.get(a.z).symbol) || 0) + 1);
    } else {
      for (const it of res.items) {
        const descr = it.hydrate ? it.hydrate.map((x) => `${x.coef > 1 ? `${x.coef} × ` : ''}${speciesLabel(x)}`) : [speciesLabel(it)];
        lines.push(`<p class="lf-line">${it.coef > 1 ? `<b class="lf-coef">${it.coef}</b>` : ''}<span class="lf-f">${subHtml(it.sp.pretty)}</span> → ${descr.join(' + ')}
          <small class="lf-mass">${fmtNumber(massOf(it.sp.counts), 3)} g/mol</small></p>`);
      }
      if (res.items.length === 1) counts = res.items[0].sp.counts;
      if (res.items.some((it) => it.sp.monoGuess)) lines.push('<p class="lf-sub">In «Fe3+» e «O2-» le cifre prima del segno sono lette come carica dello ione.</p>');
      if (res.note === 'equation') lines.push('<p class="lf-sub">È un\'equazione: costruisco i reagenti (lato sinistro). Per le reazioni guidate apri <b>Reazioni</b>.</p>');
    }
    if (counts && counts.size > 1) {
      const mass = massOf(counts);
      lines.push(`<div class="lf-comp" aria-label="Composizione percentuale in massa">${[...counts]
        .map(([sym, n]) => {
          const info = lab.bySymbol.get(sym);
          const pct = (100 * info.mass * n) / mass;
          return `<span><b>${sym}</b>${n > 1 ? `<small>×${n}</small>` : ''} ${fmtNumber(pct, 2, 2)} %<i style="--w:${pct.toFixed(1)}%;--c:${info.color}"></i></span>`;
        })
        .join('')}</div>`);
    }
    if (over) lines.push(`<p class="lf-line is-bad">Troppi atomi (${total}): il banco ne contiene al massimo ${MAX_ATOMS}${bench.atoms.size ? '; svuotalo prima' : ''}.</p>`);
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
    if (bench.atoms.size + total > MAX_ATOMS) return message(`Il banco può contenere al massimo ${MAX_ATOMS} atomi: svuotalo o costruisci meno molecole.`, 'bad');
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
            notes.add('Ione non in libreria: collega gli atomi con lo strumento Lega.');
            continue;
          }
          const r = combine(lab, library, zs);
          if (!r.ok) {
            notes.add(`${esc(job.sp.pretty)}: ${esc(r.message)} Gli atomi restano liberi sul banco.`);
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
              ? 'Non in libreria: composto ionico ricavato dalle cariche degli ioni (nome generato).'
              : r.source === 'alkane'
                ? 'Costruito come alcano a catena lineare: esistono anche isomeri ramificati.'
                : r.unpaired
                  ? 'Struttura proposta da Combina: restano elettroni spaiati (radicale).'
                  : r.source === 'library'
                    ? ''
                    : 'Non in libreria: struttura proposta da Combina (massima energia di legame), da verificare.',
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
      const label = atomsOnly ? `${ids.length} atom${ids.length === 1 ? 'o' : 'i'} da collegare` : name ? `${name} (${u.formula})` : u.formula;
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    const list = [...counts].map(([k, c]) => `${c > 1 ? `${c} × ` : ''}<b>${esc(k)}</b>`).join(', ');
    notes.delete('');
    message(`${atomsOnly ? 'Sul banco' : 'Costruito'}: ${list}${notes.size ? `<br><small>${[...notes].join(' ')}</small>` : ''}`, notes.size ? 'warn' : 'ok', 7000);
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
  /** Unità del banco che corrispondono a una specie (molecola della libreria o atomo neutro isolato). */
  function benchSpecies() {
    const m = new Map();
    const sel = new Set(selectedUnits().map((u) => u.key));
    // prima le unità selezionate
    const units = [...state.units].sort((a, b) => sel.has(b.key) - sel.has(a.key));
    for (const u of units) {
      let key = null;
      if (u.ident.exact && u.charge === 0) key = u.ident.entry.id;
      else if (u.ids.length === 1 && u.charge === 0) key = `el:${lab.get(u.desc.atoms[0].z).symbol}`;
      if (!key) continue;
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(u);
    }
    return m;
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

  function renderReactions() {
    const scroll = panel.scrollTop;
    if (!state.rx.current) {
      panel.innerHTML = reactionListHtml(reactions, matchReactions());
    } else {
      const re = reactionById.get(state.rx.current);
      panel.innerHTML = reactionCardHtml(lab, re, { practice: state.rx.practice, coeffs: state.rx.coeffs, available: Boolean(availableUnits(re)) });
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
    const size = re.reactants.reduce((t, s) => t + s.atoms.length * 1, 0);
    if (bench.atoms.size + size * 1 > MAX_ATOMS) {
      message(`Il banco può contenere al massimo ${MAX_ATOMS} atomi: svuotalo prima.`, 'bad');
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
    if (!re || state.anim) return;
    let groups = availableUnits(re);
    if (!groups) {
      groups = prepareReactants(re);
      if (!groups) return;
      message('Reagenti pronti: la reazione parte…', 'info', 1500);
      setTimeout(() => startAnimation(re, groups), 900);
      return;
    }
    startAnimation(re, groups);
  }

  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const pairKey = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);

  /** Pianifica l'animazione: dove andrà ogni atomo, quali legami si rompono e quali si formano. */
  function startAnimation(re, groups) {
    const ids = groups.flat().filter((id) => bench.atoms.has(id));
    if (!ids.length) return;
    const center = centroid(ids.map((id) => bench.atoms.get(id).pos));
    const right = [engine.camera.matrixWorld.elements[0], engine.camera.matrixWorld.elements[1], engine.camera.matrixWorld.elements[2]];
    // istanze dei prodotti con la loro disposizione
    const instances = [];
    re.r.products.forEach(([c, key], pi) => {
      for (let n = 0; n < c; n++) instances.push({ key, sp: re.products[pi] });
    });
    const plan = [];
    instances.forEach((inst, k) => {
      const off = (k - (instances.length - 1) / 2) * 2.6;
      const c = center.map((x, q) => x + right[q] * off);
      const sp = inst.sp;
      const bonds = sp.element ? [] : entryBonds(lab, library.get(inst.key));
      const desc = {
        atoms: sp.atoms.map((a) => ({ z: a.z, charge: a.charge || 0 })),
        bonds: bonds.filter((b) => !b.ionic),
        ionic: bonds.filter((b) => b.ionic).map((b) => ({ i: b.i, j: b.j, transfer: b.transfer, donor: b.donor })),
      };
      const layout = sp.atoms.length > 1 ? initialLayout(lab, desc, c, k + 1) : [c];
      plan.push({ inst, bonds, layout, atomIds: [] });
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
    if (filled.size !== slots.length) return message('Gli atomi dei reagenti non corrispondono ai prodotti.', 'bad');

    const newBonds = [];
    for (const p of plan) {
      for (const b of p.bonds) {
        const a = p.atomIds[b.i];
        const c = p.atomIds[b.j];
        newBonds.push(b.ionic ? { a, b: c, ionic: true, transfer: b.transfer, donor: p.atomIds[b.donor] } : { a, b: c, order: b.order });
      }
    }
    const oldBonds = bench.bondsWithin(ids);
    const newKeys = new Set(newBonds.map((b) => `${pairKey(b.a, b.b)}:${b.ionic ? 'i' : b.order}`));
    const oldKeys = new Set(oldBonds.map((b) => `${pairKey(b.a, b.b)}:${b.ionic ? 'i' : b.order}`));
    const breaking = oldBonds.filter((b) => !newKeys.has(`${pairKey(b.a, b.b)}:${b.ionic ? 'i' : b.order}`));
    const targets = new Map();
    plan.forEach((p) => p.atomIds.forEach((id, k) => targets.set(id, p.layout[k])));

    // cronologia: si potrà annullare l'intera reazione
    history.past.push(bench.snapshot());
    history.future = [];
    state.alternatives.clear();
    const groupCentroids = groups.map((g) => centroid(g.map((id) => bench.atoms.get(id).pos)));
    state.anim = {
      re,
      t: 0,
      ids,
      groups,
      start: new Map(ids.map((id) => [id, [...bench.atoms.get(id).pos]])),
      groupCentroids,
      center,
      targets,
      breaking,
      newBonds,
      oldKeys,
      phase: 'approach',
    };
    scene.setBondHighlight(new Map());
    message(`<b>${esc(re.r.name)}</b>: le molecole si avvicinano e si urtano…`, 'info', 2500);
    updateDock();
  }

  function stepAnimation(dt) {
    const A = state.anim;
    A.t += Math.min(dt, 0.05);
    const T_BREAK = 0.9;
    const T_SWAP = 1.8;
    const T_END = 3.3;
    if (A.t < T_BREAK) {
      const k = ease(A.t / T_BREAK) * 0.4;
      A.groups.forEach((g, gi) => {
        const gc = A.groupCentroids[gi];
        for (const id of g) {
          const a = bench.atoms.get(id);
          const s0 = A.start.get(id);
          for (let q = 0; q < 3; q++) a.pos[q] = s0[q] + (A.center[q] - gc[q]) * k;
        }
      });
      return;
    }
    if (A.phase === 'approach') {
      A.phase = 'break';
      scene.setBondHighlight(new Map(A.breaking.map((b) => [b.id, 'break'])));
      if (A.breaking.length) message('Si <b>rompono</b> i legami dei reagenti (in rosso): serve energia.', 'warn', 2000);
    }
    if (A.t < T_SWAP) return;
    if (A.phase === 'break') {
      A.phase = 'form';
      for (const b of bench.bondsWithin(A.ids)) bench.removeBond(b.id);
      for (const id of A.ids) bench.atoms.get(id).extra = 0;
      const formed = new Map();
      for (const b of A.newBonds) {
        const id = b.ionic ? bench.addBond(b.a, b.b, { ionic: true, transfer: b.transfer, donor: b.donor }) : bench.addBond(b.a, b.b, { order: b.order });
        if (!A.oldKeys.has(`${pairKey(b.a, b.b)}:${b.ionic ? 'i' : b.order}`)) formed.set(id, 'form');
      }
      A.from = new Map(A.ids.map((id) => [id, [...bench.atoms.get(id).pos]]));
      analyze();
      syncRelaxers();
      scene.rebuild();
      scene.setBondHighlight(formed);
      message('Si <b>formano</b> i nuovi legami dei prodotti (in verde): si libera energia.', 'ok', 2000);
    }
    const k = ease(Math.min(1, (A.t - T_SWAP) / (T_END - T_SWAP)));
    for (const id of A.ids) {
      const a = bench.atoms.get(id);
      const f0 = A.from.get(id);
      const t0 = A.targets.get(id);
      for (let q = 0; q < 3; q++) a.pos[q] = f0[q] + (t0[q] - f0[q]) * k;
    }
    if (A.t < T_END) return;
    // fine
    state.anim = null;
    const re = A.re;
    state.selected = new Set(A.ids.slice(0, 1));
    refresh();
    setTimeout(() => {
      if (!state.anim) scene.setBondHighlight(new Map());
    }, 1600);
    const dH = re.enthalpy.formation.value;
    const energy = dH == null ? '' : ` · ΔH° = <b>${dH > 0 ? '+' : '−'}${fmtNumber(Math.abs(dH), 1, 1)} kJ</b> (${dH < 0 ? 'esotermica: libera calore' : 'endotermica: assorbe energia'})`;
    message(`Reazione completata: <b>${esc(re.r.name)}</b>${energy}`, 'ok', 7000);
    renderPanel();
  }

  // ---------------------------------------------------------------- testi al passaggio del puntatore
  function hoverHtml(hit) {
    if (hit.atomId) {
      const a = bench.atoms.get(hit.atomId);
      const info = lab.get(a.z);
      const la = state.unitOfAtom.get(hit.atomId)?.lewisByAtom.get(hit.atomId);
      const parts = [`<b>${info.symbol}</b> ${esc(info.name.toLowerCase())}`];
      if (la) {
        if (la.formalCharge) parts.push(`carica ${chargeLabel(hit.atomId)}`);
        if (la.lonePairs) parts.push(`${la.lonePairs} coppi${la.lonePairs === 1 ? 'a' : 'e'} solitari${la.lonePairs === 1 ? 'a' : 'e'}`);
        if (la.unpaired) parts.push(`${la.unpaired} elettrone spaiato`);
      }
      const hint = state.mode === 'bond' ? 'clic per legarlo' : state.mode === 'move' ? 'trascina vicino a un altro atomo per legarli' : '';
      return `${parts.join(' · ')}${hint ? `<br><small>${hint}</small>` : ''}`;
    }
    const b = bench.bonds.get(hit.bondId);
    if (!b) return null;
    const A = lab.get(bench.atoms.get(b.a).z);
    const B = lab.get(bench.atoms.get(b.b).z);
    const ch = bondCharacter(A, B);
    const what = b.ionic ? 'legame ionico' : `legame ${ORDER_NAME[b.order]} · ${ch.type}`;
    const hint = state.mode === 'cut' ? 'clic per romperlo' : b.ionic ? 'tasto destro per separare gli ioni' : 'clic: cambia ordine · tasto destro: rompi';
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
    if (t.dataset.rxTab) {
      state.rx.practice = t.dataset.rxTab === 'practice';
      renderPanel();
    }
    if (t.dataset.coef) {
      const [side, i, d] = t.dataset.coef.split(':');
      const arr = state.rx.coeffs[side];
      arr[Number(i)] = Math.min(20, Math.max(1, arr[Number(i)] + Number(d)));
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
        if (re && prepareReactants(re)) message('Reagenti sul banco: premi «Avvia la reazione».', 'info', 3000);
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
    const hints = {
      move: 'Sposta: trascina un atomo vicino a un altro per legarli; clic su un legame per cambiarne l\'ordine.',
      bond: 'Lega: fai clic su due atomi (anche della stessa molecola, per chiudere un anello).',
      cut: 'Forbici: fai clic su un legame per romperlo.',
    };
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
  if (import.meta.env.DEV) window.__lab = { bench, lab, library, state, scene, addAtom, bond, combineAction, buildEntry, select, separate, cycleOrder, breakBond, changeCharge, undo, redo, reactions, openReaction, runReaction, matchReactions, interpret, buildFromFormula, toggleFormula };

  // ---------------------------------------------------------------- apertura / chiusura
  let lastFocus = null;
  function open(z) {
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.remove('is-leaving');
    root.classList.add('is-entering');
    setTimeout(() => root.classList.remove('is-entering'), 800);
    layout();
    engine.resetQuality();
    engine.start();
    refresh();
    if (z) addAtom(z);
    requestAnimationFrame(() => $('.lab-back').focus({ preventScroll: true }));
  }

  function close() {
    if (root.hidden) return;
    root.classList.add('is-leaving');
    setTimeout(() => {
      root.hidden = true;
      root.classList.remove('is-leaving');
      engine.stop();
      lastFocus?.focus?.({ preventScroll: true });
      onClose?.();
    }, 240);
  }

  return { open, close, isOpen: () => !root.hidden };
}
