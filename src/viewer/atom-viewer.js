// Visualizzatore 3D dell'atomo (schermo intero). Caricato su richiesta da main.js.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import '../styles/viewer.css';

import { Engine } from './engine.js';
import { Nucleus } from './nucleus.js';
import { BohrModel, shellRadii, ELECTRON_R } from './bohr-model.js';
import { OrbitalClouds, ORBITAL_COLORS } from './orbital-clouds.js';
import { QuarkView } from './quark-view.js';
import { SelectionMarker } from './selection-marker.js';
import { particleHtml, quarkTooltip } from './particle-panel.js';
import { nucleusRadius, NUCLEON_R } from './packing.js';
import { electronList, orbitalOccupancy, isValence, orbitalHtml } from '../chem/quantum-numbers.js';
import { L_LETTERS } from '../chem/electron-config.js';
import { CATEGORY } from '../data/categories.js';
import { esc, fmtNumber, fmtAbundance, isotopeNotation } from '../chem/format.js';
import { icons } from '../ui/icons.js';
import { createT } from '../i18n/index.js';

const t = createT({
  it: {
    back: 'Tavola periodica',
    prev: 'Elemento precedente',
    next: 'Elemento successivo',
    models: 'Modello atomico',
    bohr: 'Modello di Bohr',
    bohrTitle: 'Modello di Bohr (B)',
    quantum: 'Modello quantistico',
    quantumTitle: 'Modello quantistico (Q)',
    panel: 'Mostra o nascondi i controlli',
    controls: 'Controlli del visualizzatore',
    isotope: 'Isotopo',
    chooseIsotope: 'Seleziona isotopo',
    nucleus: 'Nucleo',
    explode: 'Esplodi il nucleo',
    implode: 'Ricompatta il nucleo',
    animation: 'Animazione',
    speed: 'Velocità dell\'animazione',
    show: 'Mostra',
    labels: 'Etichette',
    shells: 'Gusci elettronici',
    orbitals: 'Orbitali',
    axes: 'Assi x · y · z',
    occupied: 'Orbitali occupati',
    last: 'Ultimo',
    lastTitle: 'Ultimo sottolivello riempito (regola di Madelung)',
    valence: 'Valenza',
    valenceTitle: 'Guscio esterno e sottolivelli d/f incompleti',
    all: 'Tutti',
    none: 'Nessuno',
    psiLegend: 'colore chiaro: ψ &gt; 0 · scuro: ψ &lt; 0',
    orbitalNote: 'Forme esatte (soluzioni dell\'atomo di idrogeno), riempimento secondo la regola di Hund. Le dimensioni sono compresse per mostrare insieme tutti i gusci.',
    protons: 'Protoni',
    neutrons: 'Neutroni',
    electrons: 'Elettroni',
    hint: '<b>Clic su una particella</b> per analizzarla · trascina per ruotare · rotella per lo zoom · tasto destro per spostare',
    busy: 'Calcolo degli orbitali…',
    noWebgl: 'Impossibile avviare la grafica 3D (WebGL non disponibile su questo computer).',
    yearsShort: ' a',
    isoTitle: '{name}-{label}: {n} neutroni',
    stable: 'Stabile',
    radioactive: 'Radioattivo',
    orbitalTitle: (p) => `Orbitale ${p.name}: ${p.n} elettron${p.n === 1 ? 'e' : 'i'}`,
    subTitle: 'Tutti gli orbitali {label}',
    nucleusLabel: '<b>Nucleo</b> {p} p⁺ · {n} n⁰',
    scaleDefault: 'Scala non reale: il nucleo è circa 100 000 volte più piccolo dell\'atomo.',
    scale: (p) => `Scala non reale: nell'atomo di ${p.name} il nucleo (raggio ≈ ${p.rNuc} fm) è circa ${p.ratio} volte più piccolo dell'atomo (≈ ${p.rAtom} pm). Se il nucleo fosse una biglia di 1 cm, l'atomo sarebbe largo circa ${p.size}.`,
    pause: 'Pausa (barra spaziatrice)',
    play: 'Riproduci (barra spaziatrice)',
    clickToAnalyse: 'Clic per analizzarlo',
    tipProton: '<b class="p">Protone</b> p⁺ · carica +1 · quark uud',
    tipNeutron: '<b class="n">Neutrone</b> n⁰ · carica 0 · quark udd',
    tipElectron: (p) => `<b class="e">Elettrone</b> e⁻ · guscio ${p.shell} (n = ${p.n}) · orbitale ${p.orbital}`,
    tipQn: 'numeri quantici',
    fps: '{fps} fps · qualità {q}',
    quality: ['bassa', 'media', 'alta'],
  },
  en: {
    back: 'Periodic table',
    prev: 'Previous element',
    next: 'Next element',
    models: 'Atomic model',
    bohr: 'Bohr model',
    bohrTitle: 'Bohr model (B)',
    quantum: 'Quantum model',
    quantumTitle: 'Quantum model (Q)',
    panel: 'Show or hide the controls',
    controls: 'Viewer controls',
    isotope: 'Isotope',
    chooseIsotope: 'Choose isotope',
    nucleus: 'Nucleus',
    explode: 'Explode the nucleus',
    implode: 'Pack the nucleus back',
    animation: 'Animation',
    speed: 'Animation speed',
    show: 'Show',
    labels: 'Labels',
    shells: 'Electron shells',
    orbitals: 'Orbitals',
    axes: 'Axes x · y · z',
    occupied: 'Occupied orbitals',
    last: 'Last',
    lastTitle: 'Last filled subshell (Madelung rule)',
    valence: 'Valence',
    valenceTitle: 'Outer shell and incomplete d/f subshells',
    all: 'All',
    none: 'None',
    psiLegend: 'light colour: ψ &gt; 0 · dark: ψ &lt; 0',
    orbitalNote: 'Exact shapes (solutions of the hydrogen atom), filled according to Hund\'s rule. Sizes are compressed to show all the shells together.',
    protons: 'Protons',
    neutrons: 'Neutrons',
    electrons: 'Electrons',
    hint: '<b>Click a particle</b> to analyse it · drag to rotate · wheel to zoom · right button to pan',
    busy: 'Computing the orbitals…',
    noWebgl: 'Could not start 3D graphics (WebGL is not available on this computer).',
    yearsShort: ' y',
    isoTitle: '{name}-{label}: {n} neutrons',
    stable: 'Stable',
    radioactive: 'Radioactive',
    orbitalTitle: (p) => `Orbital ${p.name}: ${p.n} electron${p.n === 1 ? '' : 's'}`,
    subTitle: 'All the {label} orbitals',
    nucleusLabel: '<b>Nucleus</b> {p} p⁺ · {n} n⁰',
    scaleDefault: 'Not to scale: the nucleus is about 100,000 times smaller than the atom.',
    scale: (p) => `Not to scale: in the ${p.name} atom the nucleus (radius ≈ ${p.rNuc} fm) is about ${p.ratio} times smaller than the atom (≈ ${p.rAtom} pm). If the nucleus were a 1 cm marble, the atom would be about ${p.size} across.`,
    pause: 'Pause (space bar)',
    play: 'Play (space bar)',
    clickToAnalyse: 'Click to analyse it',
    tipProton: '<b class="p">Proton</b> p⁺ · charge +1 · quarks uud',
    tipNeutron: '<b class="n">Neutron</b> n⁰ · charge 0 · quarks udd',
    tipElectron: (p) => `<b class="e">Electron</b> e⁻ · shell ${p.shell} (n = ${p.n}) · orbital ${p.orbital}`,
    tipQn: 'quantum numbers',
    fps: '{fps} fps · {q} quality',
    quality: ['low', 'medium', 'high'],
  },
  eli6: {
    bohr: 'Elettroni sui cerchi',
    bohrTitle: 'Modello di Bohr (B): gli elettroni girano su cerchi, come pianeti',
    quantum: 'Elettroni come nuvole',
    quantumTitle: 'Modello quantistico (Q): gli elettroni sono nuvole intorno al nucleo',
    isotope: 'Versione (isotopo)',
    nucleus: 'Il centro dell\'atomo',
    explode: 'Apri il nucleo',
    implode: 'Richiudi il nucleo',
    shells: 'Cerchi degli elettroni',
    orbitals: 'Nuvole degli elettroni',
    occupied: 'Nuvole con elettroni',
    lastTitle: 'L\'ultima nuvola riempita',
    valenceTitle: 'Le nuvole più esterne: quelle che servono per legarsi agli altri atomi',
    psiLegend: 'due colori: le due «metà» della nuvola',
    orbitalNote: 'Ogni nuvola mostra dove è facile trovare un elettrone: dove è più fitta, è più probabile che sia lì. Una nuvola può ospitare al massimo 2 elettroni.',
    hint: '<b>Clicca un pallino</b> per sapere cos\'è · trascina per girare l\'atomo · rotella per avvicinarti',
    radioactive: 'Radioattivo (si trasforma)',
    scaleDefault: 'Attenzione: le misure non sono vere. Il nucleo è circa 100 000 volte più piccolo dell\'atomo.',
    scale: (p) => `Attenzione: le misure non sono vere. Se il nucleo dell'atomo di ${p.name} fosse una biglia di 1 cm, l'atomo intero sarebbe largo circa ${p.size}: quasi tutto l'atomo è vuoto!`,
    clickToAnalyse: 'Clicca per sapere tutto',
    tipProton: '<b class="p">Protone</b> · ha carica positiva (+) · sta nel nucleo',
    tipNeutron: '<b class="n">Neutrone</b> · non ha carica · sta nel nucleo e tiene unito il nucleo',
    tipElectron: (p) => `<b class="e">Elettrone</b> · ha carica negativa (−) · gira nel cerchio ${p.shell}, il numero ${p.n} partendo dal centro`,
  },
});

const PANEL_W = 316;
const PARTICLE_W = 372; // scheda della particella (larghezza + margini)
const MADELUNG = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];

/** Ultimo sottolivello occupato nell'ordine di riempimento (elettrone "differenziante"). */
const lastSubshell = (occupancy) =>
  occupancy.reduce((best, s) => (MADELUNG.indexOf(s.label) > MADELUNG.indexOf(best.label) ? s : best));
const SPIN = { 1: '↑', 2: '↑↓' };

const TEMPLATE = () => `
  <div class="av-stage" data-help="viewer.stage"></div>
  <div class="av-vignette" aria-hidden="true"></div>

  <header class="av-top">
    <button type="button" class="btn-ghost av-back" data-act="close">${icons.prev(16)}<span>${t('back')}</span><kbd>Esc</kbd></button>
    <div class="av-title">
      <div class="av-tile"><span class="av-tile__z"></span><span class="av-tile__sym"></span></div>
      <div class="av-title__text">
        <p class="av-eyebrow"></p>
        <h2 class="av-name" id="av-name"></h2>
      </div>
      <div class="av-elnav">
        <button type="button" class="btn-icon" data-act="prev" title="${t('prev')}">${icons.prev(17)}</button>
        <button type="button" class="btn-icon" data-act="next" title="${t('next')}">${icons.next(17)}</button>
      </div>
    </div>
    <div class="segmented av-modes" role="group" aria-label="${t('models')}">
      <button type="button" class="segmented__btn" data-mode="bohr" data-help="term.bohrModel" aria-pressed="true" title="${t('bohrTitle')}">${t('bohr')}</button>
      <button type="button" class="segmented__btn" data-mode="quantum" data-help="term.quantumModel" aria-pressed="false" title="${t('quantumTitle')}">${t('quantum')}</button>
    </div>
    <button type="button" class="btn-icon av-panel-toggle" data-act="panel" title="${t('panel')}" aria-expanded="true">${icons.sliders(18)}</button>
  </header>

  <aside class="av-panel" aria-label="${t('controls')}">
    <section class="av-sec" data-help="term.isotope">
      <h3>${t('isotope')}</h3>
      <div class="av-isotopes" role="group" aria-label="${t('chooseIsotope')}"></div>
      <p class="av-iso-info" aria-live="polite"></p>
    </section>

    <section class="av-sec">
      <h3>${t('nucleus')}</h3>
      <button type="button" class="av-btn" data-act="explode" data-help="viewer.explode" aria-pressed="false">${icons.explode(17)}<span>${t('explode')}</span><kbd>E</kbd></button>
    </section>

    <section class="av-sec">
      <h3>${t('animation')}</h3>
      <div class="av-anim" data-help="viewer.animation">
        <button type="button" class="btn-icon av-play" data-act="play" title="${t('pause')}"></button>
        <input class="av-speed" type="range" min="0.1" max="3" step="0.05" value="1" aria-label="${t('speed')}" />
        <output class="av-speed-val">${fmtNumber(1, 1, 1)}×</output>
      </div>
    </section>

    <section class="av-sec">
      <h3>${t('show')}</h3>
      <div class="av-switches">
        ${[
          ['labels', t('labels'), 'L', 'viewer.labels'],
          ['shells', t('shells'), '', 'term.shell'],
          ['orbitals', t('orbitals'), '', 'term.orbital'],
          ['axes', t('axes'), '', 'viewer.axes'],
        ]
          .map(
            ([k, label, key, help]) => `<label class="switch" data-help="${help}"><input type="checkbox" data-show="${k}" /><span class="switch__track"></span><span>${label}</span>${key ? `<kbd>${key}</kbd>` : ''}</label>`,
          )
          .join('')}
      </div>
    </section>

    <section class="av-sec av-orbitals" hidden>
      <h3 data-help="term.orbital">${t('occupied')}</h3>
      <div class="av-orb-actions">
        <button type="button" class="chip-btn" data-preset="last" title="${t('lastTitle')}">${t('last')}</button>
        <button type="button" class="chip-btn" data-preset="valence" data-help="term.valence" title="${t('valenceTitle')}">${t('valence')}</button>
        <button type="button" class="chip-btn" data-preset="all">${t('all')}</button>
        <button type="button" class="chip-btn" data-preset="none">${t('none')}</button>
      </div>
      <div class="av-orb-list"></div>
      <div class="av-orb-legend">
        ${['s', 'p', 'd', 'f'].map((t, l) => `<span><i style="--a:${ORBITAL_COLORS[l][0]};--b:${ORBITAL_COLORS[l][1]}"></i>${t}</span>`).join('')}
        <small>${t('psiLegend')}</small>
      </div>
      <p class="av-note">${t('orbitalNote')}</p>
    </section>
  </aside>

  <aside class="av-particle" aria-labelledby="pp-title" hidden></aside>

  <div class="av-bottom">
    <div class="av-legend">
      <span data-help="term.proton"><i class="dot dot--p"></i>${t('protons')} <b class="av-count-p"></b></span>
      <span data-help="term.neutron"><i class="dot dot--n"></i>${t('neutrons')} <b class="av-count-n"></b></span>
      <span data-help="term.electron"><i class="dot dot--e"></i>${t('electrons')} <b class="av-count-e"></b></span>
    </div>
    <p class="av-scale">${icons.warn(15)}<span></span></p>
  </div>

  <p class="av-hint">${t('hint')}</p>
  <div class="av-tip" role="tooltip" hidden></div>
  <div class="av-busy" hidden><span class="spinner"></span>${t('busy')}</div>
  <div class="av-fps" hidden></div>
  <div class="av-error" hidden></div>`;

export function createAtomViewer(elements, { onClose }) {
  const byZ = new Map(elements.map((e) => [e.z, e]));
  const root = document.createElement('div');
  root.className = 'atom-view';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'av-name');
  root.innerHTML = TEMPLATE();
  document.body.append(root);

  const $ = (sel) => root.querySelector(sel);
  const stage = $('.av-stage');
  const tip = $('.av-tip');

  let engine;
  try {
    engine = new Engine(stage);
  } catch (err) {
    console.error(err);
    $('.av-error').hidden = false;
    $('.av-error').textContent = t('noWebgl');
    return { open: () => (root.hidden = false), close: () => (root.hidden = true), isOpen: () => !root.hidden };
  }

  const nucleus = new Nucleus(engine.scene);
  const bohr = new BohrModel(engine.scene);
  const clouds = new OrbitalClouds(engine.scene);
  const quarks = new QuarkView(nucleus.group);
  const marker = new SelectionMarker(engine.scene);
  const particlePanel = $('.av-particle');

  const nucleusLabelEl = document.createElement('div');
  nucleusLabelEl.className = 'label3d label3d--nucleus';
  const nucleusLabel = new CSS2DObject(nucleusLabelEl);
  engine.scene.add(nucleusLabel);

  const state = {
    z: null,
    el: null,
    neutrons: 0,
    mode: 'bohr',
    exploded: false,
    playing: true,
    speed: 1,
    show: { labels: true, shells: true, orbitals: false, axes: false },
    panel: window.innerWidth > 900,
    time: 0,
    wall: 0, // tempo reale (non si ferma con la pausa)
    sel: null, // particella selezionata: { kind, particle } oppure { kind: 'electron', index }
    selGetter: null,
    quarkFade: 0,
    quarkView: false,
  };

  // ------------------------------------------------------------ costruzione della scena
  function build(z, { intro = true } = {}) {
    const el = byZ.get(z);
    setHover(null);
    clearSelection({ fly: false });
    state.z = z;
    state.el = el;
    state.exploded = false;
    const main = el.isotopes.find((i) => i.main);
    state.neutrons = main.neutrons;
    state.isotopes = el.isotopes.filter((i) => !i.isomer);
    const maxN = Math.max(...state.isotopes.map((i) => i.neutrons));

    nucleus.build(z, state.neutrons, maxN, { intro });
    nucleus.setExploded(false);
    state.electrons = electronList(z);
    state.occupancy = orbitalOccupancy(z);
    state.radii = shellRadii(el.shells.length, nucleusRadius(z + maxN));
    bohr.build(state.electrons, state.radii);
    clouds.build(state.occupancy, state.radii);

    const maxShell = Math.max(...state.occupancy.map((s) => s.n));
    state.valence = state.occupancy.filter((s) => isValence(s, maxShell)).flatMap((s) => s.orbitals.map((o) => o.id));
    state.last = lastSubshell(state.occupancy).orbitals.map((o) => o.id);
    if (state.mode === 'quantum') applyPreset('last');

    renderHeader();
    renderIsotopes();
    renderOrbitalList();
    applyVisibility();
    updateCounts();
  }

  function outerRadius() {
    return Math.max(bohr.outerRadius, nucleus.radius) + 0.6;
  }

  function introCamera() {
    const fit = engine.fitDistance(outerRadius());
    const dir = new THREE.Vector3(0.42, 0.36, 1).normalize();
    engine.controls.target.set(0, 0, 0);
    engine.camera.position.copy(dir.clone().multiplyScalar(fit * 2.6)).add(new THREE.Vector3(fit * 0.6, fit * 0.4, 0));
    engine.flyTo(dir.multiplyScalar(fit), new THREE.Vector3(), 1.9);
  }

  // ------------------------------------------------------------ intestazione e pannello
  function renderHeader() {
    const el = state.el;
    const cat = CATEGORY[el.category];
    root.style.setProperty('--c', cat.color);
    $('.av-tile__z').textContent = el.z;
    $('.av-tile__sym').textContent = el.symbol;
    $('.av-eyebrow').textContent = `${cat.singular} · Z = ${el.z}`;
    $('.av-name').textContent = el.name;
  }

  function isoShort(iso) {
    if (iso.abundance !== null) return fmtAbundance(iso);
    if (iso.halfLife) return `t½ ${iso.halfLife.text.replace(/ (anni|years)$/, t('yearsShort'))}`;
    return '';
  }

  function renderIsotopes() {
    const { el } = state;
    $('.av-isotopes').innerHTML = state.isotopes
      .map(
        (iso) => `<button type="button" class="iso-chip ${iso.stable ? '' : 'is-radio'}" data-n="${iso.neutrons}" aria-pressed="${iso.neutrons === state.neutrons}"
            title="${esc(t('isoTitle', { name: el.name, label: iso.label, n: iso.neutrons }))}">
            <b>${isotopeNotation(iso, esc(el.symbol))}</b><small>${esc(isoShort(iso))}</small></button>`,
      )
      .join('');
    renderIsotopeInfo();
  }

  function renderIsotopeInfo() {
    const { el } = state;
    const iso = state.isotopes.find((i) => i.neutrons === state.neutrons);
    root.querySelectorAll('.iso-chip').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.n) === state.neutrons)));
    const stability = iso.stable
      ? `<span class="badge badge--stable">${t('stable')}</span>`
      : `<span class="badge badge--radio">${t('radioactive')}</span> t½ ${esc(iso.halfLife.text)}${iso.decay.length ? ` · ${iso.decay.map((d) => d.symbol).join(' / ')}` : ''}`;
    $('.av-iso-info').innerHTML = `
      <span class="eq"><b class="p">${el.z}</b> p⁺ + <b class="n">${iso.neutrons}</b> n⁰ = A <b>${iso.massNumber}</b></span>
      <span>${stability}</span>`;
  }

  function renderOrbitalList() {
    $('.av-orb-list').innerHTML = state.occupancy
      .map((sub) => {
        const color = ORBITAL_COLORS[sub.l][0];
        const chips = sub.orbitals
          .map(
            (o) => `<button type="button" class="orb-chip" data-orb="${o.id}" aria-pressed="${clouds.isOn(o.id)}" style="--oc:${color}"
                title="${esc(t('orbitalTitle', { name: `${sub.n}${o.html.replace(/<[^>]+>/g, '') || 's'}`, n: o.electrons }))}">
                ${sub.l === 0 ? `${sub.n}s` : o.html}<span class="spins">${SPIN[o.electrons]}</span></button>`,
          )
          .join('');
        return `<div class="orb-row">
            <button type="button" class="orb-sub" data-sub="${sub.label}" style="--oc:${color}" title="${esc(t('subTitle', { label: sub.label }))}">
              ${sub.label}<sup>${sub.electrons}</sup></button>
            <div class="orb-chips">${chips}</div></div>`;
      })
      .join('');
  }

  function syncOrbitalChips() {
    const focus = selectedOrbitalId();
    root.querySelectorAll('.orb-chip').forEach((b) => {
      b.setAttribute('aria-pressed', String(clouds.isOn(b.dataset.orb)));
      b.classList.toggle('is-focus', b.dataset.orb === focus);
    });
  }

  function applyPreset(preset) {
    const sets = { all: clouds.ids, valence: state.valence, last: state.last, none: [] };
    const on = new Set(sets[preset]);
    for (const id of clouds.ids) clouds.setOrbital(id, on.has(id));
    syncOrbitalChips();
  }

  function updateCounts() {
    $('.av-count-p').textContent = state.el.z;
    $('.av-count-n').textContent = state.neutrons;
    $('.av-count-e').textContent = state.el.z;
    nucleusLabelEl.innerHTML = t('nucleusLabel', { p: state.el.z, n: state.neutrons });
    renderScaleNote();
  }

  /** Nota sulla scala, calcolata per l'elemento: raggio nucleare ≈ 1,2 fm · A^⅓. */
  function renderScaleNote() {
    const { el } = state;
    const A = el.z + state.neutrons;
    const rNucFm = el.z === 1 && A === 1 ? 0.84 : 1.2 * Math.cbrt(A);
    const rAtomPm = el.vdwRadiusPm ?? el.covalentRadiusPm;
    let text = t('scaleDefault');
    if (rAtomPm) {
      const ratio = (rAtomPm * 1000) / rNucFm;
      const rounded = Math.round(ratio / 1000) * 1000;
      const meters = ratio / 100;
      const size = meters >= 1000 ? `${fmtNumber(meters / 1000, 1)} km` : `${fmtNumber(Math.round(meters / 10) * 10, 0)} m`;
      text = t('scale', { name: el.name.toLowerCase(), rNuc: fmtNumber(rNucFm, 1), ratio: fmtNumber(rounded, 0), rAtom: rAtomPm, size });
    }
    $('.av-scale span').textContent = text;
  }

  // ------------------------------------------------------------ visibilità e modalità
  function applyVisibility() {
    const { show, mode, exploded } = state;
    const nucleonSelected = Boolean(state.sel) && state.sel.kind !== 'electron';
    const focusNucleus = exploded || nucleonSelected; // l'attenzione è sul nucleo: gusci e orbitali si attenuano
    bohr.setElectronsVisible(mode === 'bohr');
    bohr.setRingsVisible(show.shells);
    bohr.setLabelsVisible(show.labels);
    bohr.setDimmed(focusNucleus);
    clouds.master.target = show.orbitals ? (focusNucleus ? 0.12 : 1) : 0;
    clouds.setAxesVisible(show.axes && !focusNucleus);
    nucleusLabel.visible = show.labels && !nucleonSelected;
    quarks.setLabelsVisible(show.labels);
    // nel modello quantistico il nucleo si rimpicciolisce per non coprire gli orbitali interni
    nucleus.setDisplayScale(mode === 'quantum' && !exploded && !nucleonSelected ? 0.32 : 1);

    root.querySelectorAll('[data-show]').forEach((cb) => (cb.checked = show[cb.dataset.show]));
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    $('.av-orbitals').hidden = !show.orbitals;
    const ex = $('[data-act="explode"]');
    ex.setAttribute('aria-pressed', String(exploded));
    ex.querySelector('span').textContent = exploded ? t('implode') : t('explode');
    const play = $('.av-play');
    play.innerHTML = state.playing ? icons.pause(18) : icons.play(18);
    play.title = state.playing ? t('pause') : t('play');
    root.classList.toggle('is-quantum', mode === 'quantum');
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode === 'quantum') {
      Object.assign(state.show, { shells: false, orbitals: true, axes: true });
      if (!clouds.ids.some((id) => clouds.isOn(id))) applyPreset('last');
    } else {
      Object.assign(state.show, { shells: true, orbitals: false, axes: false });
    }
    applyVisibility();
    if (state.sel?.kind === 'electron') {
      // nel modello quantistico l'elettrone non ha una posizione: si mostra il suo orbitale
      if (mode === 'quantum') {
        engine.unfollow();
        flyOverview();
        const id = selectedOrbitalId();
        if (!clouds.isOn(id)) clouds.setOrbital(id, true);
        syncOrbitalChips();
      } else {
        focusSelection();
      }
      renderParticle();
    }
  }

  function setExploded(on) {
    state.exploded = on;
    nucleus.setExploded(on);
    applyVisibility();
    // con un nucleone selezionato la camera continua a seguirlo
    if (state.sel && state.sel.kind !== 'electron') return;
    const target = on ? nucleus.radius * 1.15 : outerRadius();
    engine.flyToDistance(engine.fitDistance(target), new THREE.Vector3(), 1.1);
  }

  function setNeutrons(n) {
    if (n === state.neutrons) return;
    state.neutrons = n;
    nucleus.setNeutrons(n);
    renderIsotopeInfo();
    updateCounts();
    // il neutrone selezionato potrebbe essere uscito dal nucleo
    if (state.sel && state.sel.kind !== 'electron' && !nucleus.contains(state.sel.particle)) clearSelection();
    else renderParticle();
  }

  function setPanel(open) {
    state.panel = open;
    root.classList.toggle('panel-closed', !open);
    $('[data-act="panel"]').setAttribute('aria-expanded', String(open));
    updateInsets();
  }

  /** Spazio occupato dai pannelli: la scena si centra nella parte libera. */
  function updateInsets() {
    const wide = window.innerWidth > 900;
    const left = state.sel && wide ? PARTICLE_W : 0;
    const right = state.panel && wide ? PANEL_W : 0;
    root.style.setProperty('--pp', `${left}px`);
    engine.setInsets(left, right);
  }

  // la compensazione del pannello dipende dalla larghezza della finestra
  window.addEventListener('resize', () => {
    if (!root.hidden) setPanel(state.panel);
  });

  // ------------------------------------------------------------ eventi UI
  root.addEventListener('click', (ev) => {
    const t = ev.target.closest('button');
    if (!t) return;
    if (t.dataset.mode) setMode(t.dataset.mode);
    if (t.dataset.n) setNeutrons(Number(t.dataset.n));
    if (t.dataset.preset) applyPreset(t.dataset.preset);
    if (t.dataset.orb) {
      clouds.setOrbital(t.dataset.orb, !clouds.isOn(t.dataset.orb));
      syncOrbitalChips();
    }
    if (t.dataset.sub) {
      const sub = state.occupancy.find((s) => s.label === t.dataset.sub);
      const allOn = sub.orbitals.every((o) => clouds.isOn(o.id));
      sub.orbitals.forEach((o) => clouds.setOrbital(o.id, !allOn));
      syncOrbitalChips();
    }
    switch (t.dataset.act) {
      case 'deselect': clearSelection(); break;
      case 'quarks':
        if (state.sel && state.sel.kind !== 'electron') focusSelection(state.quarkView ? nucleonDistance() : quarkDistance());
        break;
      case 'show-orbital': {
        const id = selectedOrbitalId();
        setMode('quantum');
        for (const oid of clouds.ids) clouds.setOrbital(oid, oid === id);
        syncOrbitalChips();
        break;
      }
      case 'bohr-follow': setMode('bohr'); break;
      case 'close': close(); break;
      case 'prev': switchElement(state.z === 1 ? 118 : state.z - 1); break;
      case 'next': switchElement(state.z === 118 ? 1 : state.z + 1); break;
      case 'explode': setExploded(!state.exploded); break;
      case 'play': state.playing = !state.playing; applyVisibility(); break;
      case 'panel': setPanel(!state.panel); break;
    }
  });

  root.addEventListener('change', (ev) => {
    const k = ev.target.dataset.show;
    if (!k) return;
    state.show[k] = ev.target.checked;
    applyVisibility();
  });

  const speed = $('.av-speed');
  speed.addEventListener('input', () => {
    state.speed = Number(speed.value);
    $('.av-speed-val').textContent = `${fmtNumber(state.speed, 1, 1)}×`;
  });

  function switchElement(z) {
    build(z, { intro: true });
    engine.flyToDistance(engine.fitDistance(outerRadius()), new THREE.Vector3(), 1.2);
  }

  // ------------------------------------------------------------ selezione con il puntatore (raycasting)
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pointer = { inside: false, dirty: false, x: 0, y: 0 };
  let frame = 0;

  const canvas = engine.renderer.domElement;
  function trackPointer(ev) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    pointer.x = ev.clientX - r.left;
    pointer.y = ev.clientY - r.top;
    pointer.inside = true;
    pointer.dirty = true;
  }
  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerleave', () => {
    pointer.inside = false;
    setHover(null);
  });

  // clic (senza trascinamento) su una particella → analisi
  let down = null;
  canvas.addEventListener('pointerdown', (ev) => {
    down = ev.button === 0 ? { x: ev.clientX, y: ev.clientY, t: performance.now() } : null;
  });
  canvas.addEventListener('pointerup', (ev) => {
    if (!down || ev.button !== 0) return;
    const click = Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 5 && performance.now() - down.t < 600;
    down = null;
    if (!click) return;
    trackPointer(ev); // il punto del clic (anche senza movimenti precedenti, es. tocco)
    pick();
    const h = hovered;
    if (!h) return;
    if (h.kind === 'electron') {
      if (state.sel?.kind !== 'electron' || state.sel.index !== h.index) select('electron', h.index);
    } else if (h.kind === 'proton' || h.kind === 'neutron') {
      const p = nucleus.particleAt(h.mesh, h.index);
      if (p && p !== state.sel?.particle) select(h.kind, p);
    }
  });

  function pick() {
    raycaster.setFromCamera(ndc, engine.camera);
    const targets = [...nucleus.meshes];
    if (bohr.mesh?.visible && state.mode === 'bohr') targets.push(bohr.mesh);
    if (state.quarkFade > 0.4) targets.push(...quarks.meshes);
    const hit = raycaster
      .intersectObjects(targets, false)
      .find((h) => h.object.userData.kind === 'quark' || (h.instanceId !== undefined && !isHiddenNucleon(h)));
    if (!hit) return setHover(null);
    const kind = hit.object.userData.kind;
    setHover({ kind, index: kind === 'quark' ? hit.object.userData.index : hit.instanceId, mesh: hit.object });
  }

  /** Il nucleone selezionato, durante la vista dei quark, non è più "solido". */
  function isHiddenNucleon(h) {
    return state.quarkFade > 0.4 && h.object.userData.kind !== 'electron' && nucleus.particleAt(h.object, h.instanceId) === state.sel?.particle;
  }

  let hovered = null;
  function setHover(h) {
    const same = h && hovered && h.kind === hovered.kind && h.index === hovered.index && h.mesh === hovered.mesh;
    if (!same) {
      const nucleon = h && (h.kind === 'proton' || h.kind === 'neutron');
      nucleus.setHighlight(nucleon ? { mesh: h.mesh, index: h.index } : null);
      bohr.setHighlight(h && h.kind === 'electron' ? h.index : -1);
      hovered = h;
    }
    canvas.style.cursor = h ? 'pointer' : '';
    if (!h) {
      tip.hidden = true;
      return;
    }
    tip.innerHTML = tooltipHtml(h);
    tip.hidden = false;
    tip.style.transform = `translate(${pointer.x + 16}px, ${pointer.y + 14}px)`;
  }

  function tooltipHtml(h) {
    if (h.kind === 'quark') return quarkTooltip(quarks.quarkInfo(h.index));
    const selected = h.kind === 'electron'
      ? state.sel?.kind === 'electron' && state.sel.index === h.index
      : Boolean(state.sel?.particle) && nucleus.particleAt(h.mesh, h.index) === state.sel.particle;
    const hint = selected ? '' : `<br><small>${t('clickToAnalyse')}</small>`;
    if (h.kind === 'proton') return `${t('tipProton')}${hint}`;
    if (h.kind === 'neutron') return `${t('tipNeutron')}${hint}`;
    const e = state.electrons[h.index];
    return `${t('tipElectron', { shell: e.shell, n: e.n, orbital: orbitalHtml(e.n, e.l, e.ml) })}
      <br><small>${t('tipQn')}: n = ${e.n}, l = ${e.l}, m<sub>l</sub> = ${e.ml}, m<sub>s</sub> = ${e.ms > 0 ? '+½' : '−½'}</small>${hint}`;
  }

  // ------------------------------------------------------------ analisi delle particelle
  const _markerPos = new THREE.Vector3();
  const nucleonDistance = () => engine.fitDistance(1.9);
  const quarkDistance = () => engine.fitDistance(0.62);
  const electronDistance = () => engine.fitDistance(1.6);

  /** Funzione che restituisce la posizione attuale della particella selezionata (o null). */
  function selectionGetter() {
    const sel = state.sel;
    if (sel.kind === 'electron') {
      return (out) => (state.mode === 'bohr' && sel.index < state.electrons.length ? bohr.electronPosition(sel.index, state.time, out) : null);
    }
    return (out) => (nucleus.contains(sel.particle) ? nucleus.worldPosition(sel.particle, out) : null);
  }

  function selectedOrbitalId() {
    if (state.sel?.kind !== 'electron') return null;
    const e = state.electrons[state.sel.index];
    return e.l === 0 ? `${e.n}s` : `${e.n}${L_LETTERS[e.l]}-${e.orbitalKey}`;
  }

  function flyOverview(duration = 1.2) {
    const r = state.exploded ? nucleus.radius * 1.15 : outerRadius();
    engine.flyToDistance(engine.fitDistance(r), new THREE.Vector3(), duration);
  }

  /** Porta la camera sulla particella selezionata e la segue. */
  function focusSelection(distance) {
    const nucleon = state.sel.kind !== 'electron';
    engine.controls.minDistance = nucleon ? 0.7 : 1.0;
    if (!nucleon && state.mode !== 'bohr') {
      engine.unfollow();
      flyOverview();
      return;
    }
    engine.focus(state.selGetter, distance ?? (nucleon ? nucleonDistance() : electronDistance()), { smooth: nucleon ? 7 : 0 });
  }

  function select(kind, ref) {
    const nucleon = kind !== 'electron';
    state.sel = nucleon ? { kind, particle: ref } : { kind, index: ref };
    state.selGetter = selectionGetter();
    state.quarkView = false;
    nucleus.setSelected(nucleon ? ref : null);
    bohr.setSelected(nucleon ? -1 : ref);
    if (nucleon) quarks.setKind(kind);
    marker.show(kind, nucleon ? NUCLEON_R * 1.55 : ELECTRON_R * 2.4);
    setHover(null);
    root.classList.add('has-particle');
    root.classList.remove('is-quark-view');
    particlePanel.hidden = false;
    window.dispatchEvent(new CustomEvent('tp3d:particle', { detail: { kind } }));
    renderParticle();
    particlePanel.scrollTop = 0;
    updateInsets();
    applyVisibility();
    syncOrbitalChips();
    focusSelection();
  }

  function clearSelection({ fly = true } = {}) {
    if (!state.sel) return;
    state.sel = null;
    state.selGetter = null;
    state.quarkView = false;
    state.quarkFade = 0;
    nucleus.setSelected(null);
    nucleus.setInnerFade(0);
    nucleus.setDim(0);
    bohr.setSelected(-1);
    quarks.setFade(0);
    marker.hide();
    engine.unfollow();
    engine.controls.minDistance = 1.5;
    particlePanel.hidden = true;
    root.classList.remove('has-particle', 'is-quark-view');
    updateInsets();
    applyVisibility();
    syncOrbitalChips();
    if (fly) flyOverview();
  }

  function renderParticle() {
    const sel = state.sel;
    if (!sel) return;
    const scroll = particlePanel.scrollTop;
    particlePanel.innerHTML = particleHtml(
      { kind: sel.kind, index: sel.index },
      {
        el: state.el,
        iso: state.isotopes.find((i) => i.neutrons === state.neutrons),
        isotopes: state.isotopes,
        electrons: state.electrons,
        occupancy: state.occupancy,
        mode: state.mode,
        byZ,
        quarkView: state.quarkView,
      },
    );
    particlePanel.scrollTop = scroll;
  }

  /** Vista dei quark: compare quando la camera si avvicina al nucleone selezionato. */
  function updateQuarkView(dt) {
    const sel = state.sel;
    let target = 0;
    if (sel && sel.kind !== 'electron' && nucleus.contains(sel.particle)) {
      const dq = quarkDistance();
      target = 1 - THREE.MathUtils.smoothstep(engine.viewDistance, dq * 1.25, dq * 2.1);
    }
    state.quarkFade += (target - state.quarkFade) * (1 - Math.exp(-dt * 10));
    if (target === 0 && state.quarkFade < 0.002) state.quarkFade = 0;
    quarks.setFade(state.quarkFade);
    nucleus.setInnerFade(state.quarkFade);
    nucleus.setDim(state.quarkFade);
    if (state.quarkFade > 0) quarks.update(dt, state.time, sel.particle.cur);

    const inside = state.quarkFade > 0.5;
    if (inside !== state.quarkView) {
      state.quarkView = inside;
      root.classList.toggle('is-quark-view', inside);
      renderParticle();
    }
    const pos = state.selGetter ? state.selGetter(_markerPos) : null;
    marker.update(dt, state.wall, pos, engine.camera, 1 - state.quarkFade);
  }

  // ------------------------------------------------------------ ciclo di aggiornamento
  engine.add((dt) => {
    if (state.playing) state.time += dt * state.speed;
    state.wall += dt;
    nucleus.update(dt, state.time);
    bohr.update(dt, state.time);
    const viewportPx = stage.clientHeight * engine.renderer.getPixelRatio();
    clouds.setViewportHeight(viewportPx, engine.camera.fov);
    quarks.setViewportHeight(viewportPx, engine.camera.fov);
    clouds.update(dt, state.time);
    updateQuarkView(dt);
    nucleusLabel.position.set(0, nucleus.displayRadius + 1.1, 0);
    $('.av-busy').hidden = !clouds.busy;

    frame++;
    if (pointer.inside && !engine.dragging && (pointer.dirty || frame % 4 === 0)) {
      pointer.dirty = false;
      pick();
    }
  });

  // solo in sviluppo: accesso dalla console per test e diagnosi
  if (import.meta.env.DEV) window.__atomViewer = { engine, nucleus, bohr, clouds, quarks, marker, state, select, clearSelection };

  const fpsEl = $('.av-fps');
  engine.onFps = (fps, q) => {
    fpsEl.textContent = t('fps', { fps: Math.round(fps), q: t('quality')[q] });
  };

  // ------------------------------------------------------------ tastiera
  function onKey(ev) {
    if (root.hidden) return;
    const tag = ev.target.tagName;
    const typing = tag === 'INPUT' && ev.target.type !== 'checkbox' && ev.target.type !== 'range';
    if (ev.key === 'Escape') {
      ev.preventDefault();
      // prima si chiude l'analisi della particella, poi il visualizzatore
      if (state.sel) clearSelection();
      else close();
      return;
    }
    if (typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const key = ev.key.toLowerCase();
    if (key === ' ' && tag !== 'BUTTON') {
      ev.preventDefault();
      state.playing = !state.playing;
      applyVisibility();
    } else if (key === 'e') setExploded(!state.exploded);
    else if (key === 'b') setMode('bohr');
    else if (key === 'q') setMode('quantum');
    else if (key === 'l') {
      state.show.labels = !state.show.labels;
      applyVisibility();
    } else if (key === 'f') fpsEl.hidden = !fpsEl.hidden;
  }
  window.addEventListener('keydown', onKey);

  // ------------------------------------------------------------ apertura / chiusura
  let lastFocus = null;
  function open(z) {
    lastFocus = document.activeElement;
    root.hidden = false;
    root.classList.remove('is-leaving');
    root.classList.add('is-entering');
    setTimeout(() => root.classList.remove('is-entering'), 900);
    setPanel(state.panel);
    engine.resetQuality();
    state.mode = 'bohr';
    Object.assign(state.show, { shells: true, orbitals: false, axes: false });
    build(z, { intro: true });
    introCamera();
    engine.start();
    $('.av-hint').classList.remove('is-gone');
    setTimeout(() => $('.av-hint').classList.add('is-gone'), 7000);
    requestAnimationFrame(() => $('.av-back').focus({ preventScroll: true }));
  }

  function close() {
    if (root.hidden) return;
    setHover(null);
    clearSelection({ fly: false });
    root.classList.add('is-leaving');
    setTimeout(() => {
      root.hidden = true;
      root.classList.remove('is-leaving');
      engine.stop();
      lastFocus?.focus?.({ preventScroll: true });
      onClose?.(state.z);
    }, 260);
  }

  return { open, close, isOpen: () => !root.hidden };
}
