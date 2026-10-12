// Scheda informativa dell'elemento (pannello laterale).
import { CATEGORY, STATE_LABEL, SHELL_NAMES } from '../data/categories.js';
import {
  esc, fmtMass, fmtNumber, fmtTemperature, fmtDensity, fmtIonization,
  fmtAbundance, isotopeNotation, isotopeName,
} from '../chem/format.js';
import { createT, isSimple } from '../i18n/index.js';
import { gfx } from '../gfx/preset.js';
import { appearanceTitle, appearanceCaption, describeAppearance } from '../gfx/appearance.js';
import { bohrSvg } from './bohr-icon.js';
import { icons } from './icons.js';

const t = createT({
  it: {
    'est.mp': 'punto di fusione',
    'est.bp': 'punto di ebollizione',
    'est.d': 'densità',
    'est.state': 'stato fisico',
    'est.ie': 'energia di ionizzazione',
    'est.ox': 'stati di ossidazione',
    'est.config': 'configurazione elettronica',
    'est.category': 'categoria chimica',
    lanthanideSeries: 'serie dei lantanidi',
    actinideSeries: 'serie degli attinidi',
    tagPredicted: 'previsto',
    tagEstimate: 'stima',
    predictedCat: 'previsto: {cat}',
    groupN: 'gruppo {n}',
    periodN: 'periodo {n}',
    blockN: 'blocco {b}',
    nav: 'Navigazione elementi',
    prev: 'Elemento precedente ({z})',
    next: 'Elemento successivo ({z})',
    close: 'Chiudi (Esc)',
    sources: 'Fonti: IUPAC/CIAAW, NIST, PubChem. «~» indica un valore stimato o previsto.',
    sourcesLink: 'Dettagli sulle fonti',
    predictedBanner: '<b>Elemento superpesante, dati in gran parte previsti.</b> Ne sono stati prodotti solo pochi atomi, che decadono in tempi brevissimi: configurazione elettronica, stato fisico, densità, energia di ionizzazione e chimica derivano da calcoli teorici, non da misure.',
    neverSeen: '<b>Mai osservato in quantità visibili.</b> ',
    partialBanner: 'Alcuni valori sono stime e non misure dirette: {fields}.',
    view3d: 'Visualizza l\'atomo in 3D',
    protons: 'protoni',
    neutrons: 'neutroni',
    electrons: 'elettroni',
    heroNote: (p) => `Neutroni dell'isotopo ${p.abundant ? 'più abbondante' : 'più stabile'}, <b>${p.iso}</b> (A = ${p.A}). Nell'atomo neutro gli elettroni sono pari ai protoni.`,
    cta3d: 'Visualizza atomo in 3D',
    ctaLab: 'Usa nel laboratorio',
    ctaLabTitle: 'Apri il laboratorio molecolare con questo atomo sul banco',
    ctaSandbox: 'Sandbox',
    ctaSandboxTitle: 'Apri la sandbox degli elementi con questo elemento nel pennello',
    simpleTitle: 'In parole semplici',
    basic: 'Dati di base',
    massNumberSub: 'numero di massa dell\'isotopo più stabile',
    massSub: 'massa atomica standard (u)',
    atomicNumber: 'Numero atomico',
    atomicNumberSub: 'Z = numero di protoni',
    atomicMass: 'Massa atomica',
    category: 'Categoria',
    predictedSub: 'prevista: {cat}',
    group: 'Gruppo',
    period: 'Periodo',
    periodSub: 'riga della tavola',
    block: 'Blocco',
    blockSub: 'orbitali {b}',
    structure: 'Struttura atomica',
    config: 'Configurazione elettronica',
    configShort: 'Configurazione abbreviata',
    shells: 'Elettroni per guscio',
    notAvailable: 'non disponibile',
    physical: 'Proprietà fisiche',
    state25: 'Stato a 25 °C',
    sublimation: 'Sublimazione',
    melting: 'Punto di fusione',
    boiling: 'Punto di ebollizione',
    density: 'Densità',
    chemical: 'Proprietà chimiche',
    paulingScale: 'Scala di Pauling: da 0,7 (Fr) a 3,98 (F)',
    enUndefined: 'non definita (non forma legami)',
    electronegativity: 'Elettronegatività',
    pauling: '(Pauling)',
    atomicRadius: 'Raggio atomico',
    vdw: '(van der Waals)',
    covalentRadius: 'Raggio covalente',
    ionization: 'Energia di 1ª ionizzazione',
    affinity: 'Affinità elettronica',
    oxidation: 'Stati di ossidazione comuni',
    stable: 'Stabile',
    radioactive: 'Radioattivo',
    main: 'principale',
    isotopes: 'Isotopi principali',
    isotope: 'Isotopo',
    neutronsCol: 'Neutroni',
    abundance: 'Abbondanza naturale',
    stability: 'Stabilità',
    noStable: 'Nessun isotopo stabile: in natura l\'elemento è assente o presente solo in tracce.',
    history: 'Storia',
    discoveryYear: 'anno di scoperta',
    discovery: 'scoperta',
    discoverer: 'Scopritore',
    nameOrigin: 'Origine del nome',
    uses: 'Usi e presenza in natura',
    usesCommon: 'Usi comuni',
    whereFound: 'Dove si trova',
  },
  en: {
    'est.mp': 'melting point',
    'est.bp': 'boiling point',
    'est.d': 'density',
    'est.state': 'physical state',
    'est.ie': 'ionisation energy',
    'est.ox': 'oxidation states',
    'est.config': 'electron configuration',
    'est.category': 'chemical category',
    lanthanideSeries: 'lanthanide series',
    actinideSeries: 'actinide series',
    tagPredicted: 'predicted',
    tagEstimate: 'estimate',
    predictedCat: 'predicted: {cat}',
    groupN: 'group {n}',
    periodN: 'period {n}',
    blockN: '{b}-block',
    nav: 'Element navigation',
    prev: 'Previous element ({z})',
    next: 'Next element ({z})',
    close: 'Close (Esc)',
    sources: 'Sources: IUPAC/CIAAW, NIST, PubChem. «~» marks an estimated or predicted value.',
    sourcesLink: 'About the sources',
    predictedBanner: '<b>Superheavy element, data largely predicted.</b> Only a few atoms have ever been made, and they decay almost instantly: electron configuration, physical state, density, ionisation energy and chemistry come from theoretical calculations, not measurements.',
    neverSeen: '<b>Never seen in visible amounts.</b> ',
    partialBanner: 'Some values are estimates rather than direct measurements: {fields}.',
    view3d: 'View the atom in 3D',
    protons: 'protons',
    neutrons: 'neutrons',
    electrons: 'electrons',
    heroNote: (p) => `Neutrons of the ${p.abundant ? 'most abundant' : 'most stable'} isotope, <b>${p.iso}</b> (A = ${p.A}). In the neutral atom the electrons equal the protons.`,
    cta3d: 'View atom in 3D',
    ctaLab: 'Use in the laboratory',
    ctaLabTitle: 'Open the molecular laboratory with this atom on the bench',
    ctaSandbox: 'Sandbox',
    ctaSandboxTitle: 'Open the element sandbox with this element in the brush',
    simpleTitle: 'In simple words',
    basic: 'Basic data',
    massNumberSub: 'mass number of the most stable isotope',
    massSub: 'standard atomic weight (u)',
    atomicNumber: 'Atomic number',
    atomicNumberSub: 'Z = number of protons',
    atomicMass: 'Atomic mass',
    category: 'Category',
    predictedSub: 'predicted: {cat}',
    group: 'Group',
    period: 'Period',
    periodSub: 'row of the table',
    block: 'Block',
    blockSub: '{b} orbitals',
    structure: 'Atomic structure',
    config: 'Electron configuration',
    configShort: 'Short configuration',
    shells: 'Electrons per shell',
    notAvailable: 'not available',
    physical: 'Physical properties',
    state25: 'State at 25 °C',
    sublimation: 'Sublimation',
    melting: 'Melting point',
    boiling: 'Boiling point',
    density: 'Density',
    chemical: 'Chemical properties',
    paulingScale: 'Pauling scale: from 0.7 (Fr) to 3.98 (F)',
    enUndefined: 'undefined (forms no bonds)',
    electronegativity: 'Electronegativity',
    pauling: '(Pauling)',
    atomicRadius: 'Atomic radius',
    vdw: '(van der Waals)',
    covalentRadius: 'Covalent radius',
    ionization: '1st ionisation energy',
    affinity: 'Electron affinity',
    oxidation: 'Common oxidation states',
    stable: 'Stable',
    radioactive: 'Radioactive',
    main: 'main',
    isotopes: 'Main isotopes',
    isotope: 'Isotope',
    neutronsCol: 'Neutrons',
    abundance: 'Natural abundance',
    stability: 'Stability',
    noStable: 'No stable isotope: in nature the element is absent or present only in traces.',
    history: 'History',
    discoveryYear: 'year of discovery',
    discovery: 'discovery',
    discoverer: 'Discoverer',
    nameOrigin: 'Origin of the name',
    uses: 'Uses and occurrence',
    usesCommon: 'Common uses',
    whereFound: 'Where it is found',
  },
  eli6: {
    tagPredicted: 'ipotesi',
    tagEstimate: 'stima',
    predictedBanner: '<b>Di questo elemento sappiamo pochissimo.</b> Gli scienziati ne hanno costruiti solo pochi atomi, che si sono rotti quasi subito. Per questo molti numeri qui sotto sono calcoli e ipotesi, non misure.',
    neverSeen: '<b>Nessuno ne ha mai visto un pezzetto.</b> ',
    partialBanner: 'Alcuni numeri sono stime, cioè ipotesi ragionate, e non misure: {fields}.',
    heroNote: (p) => `I <b>protoni</b> (rossi) e i <b>neutroni</b> (grigi) stanno nel centro dell'atomo, il nucleo. Gli <b>elettroni</b> girano intorno e sono tanti quanti i protoni. Qui contiamo i neutroni di ${p.iso}.`,
    ctaLab: 'Costruisci molecole',
    simpleTitle: 'In parole semplici',
    basic: 'La carta d\'identità',
    atomicNumberSub: 'quanti protoni ha: è il suo numero di riconoscimento',
    massSub: 'quanto pesa un atomo (in unità piccolissime)',
    massNumberSub: 'quanti protoni e neutroni ha la sua versione più duratura',
    periodSub: 'la riga: quanti «strati» di elettroni ha',
    blockSub: 'la sua ultima «stanza» per gli elettroni è di tipo {b}',
    structure: 'Come è fatto dentro',
    config: 'Dove stanno gli elettroni',
    configShort: 'Lo stesso, in breve',
    shells: 'Elettroni in ogni strato',
    physical: 'Com\'è al tatto e alla vista',
    state25: 'A temperatura di casa è',
    sublimation: 'Diventa gas (senza sciogliersi) a',
    melting: 'Si scioglie a',
    boiling: 'Bolle a',
    density: 'Quanto è pesante (densità)',
    chemical: 'Come si comporta con gli altri atomi',
    electronegativity: 'Quanto tira a sé gli elettroni',
    paulingScale: 'Da 0,7 (tira pochissimo, il francio) a 3,98 (tira fortissimo, il fluoro)',
    enUndefined: 'non si misura: non si lega con nessuno',
    atomicRadius: 'Grandezza dell\'atomo',
    covalentRadius: 'Grandezza quando si lega',
    ionization: 'Fatica per strappargli un elettrone',
    affinity: 'Energia che libera se riceve un elettrone',
    oxidation: 'Quanti elettroni dà o prende di solito',
    isotopes: 'Le sue versioni (isotopi)',
    isotope: 'Versione',
    abundance: 'Quanto è comune in natura',
    stability: 'Dura per sempre?',
    stable: 'Sì, è stabile',
    radioactive: 'No, è radioattivo',
    noStable: 'Nessuna versione dura per sempre: tutte, piano piano, si trasformano in altri elementi.',
    history: 'La sua storia',
    discoverer: 'Chi l\'ha scoperto',
    nameOrigin: 'Da dove viene il nome',
    uses: 'A cosa serve e dove si trova',
    usesCommon: 'A cosa serve',
  },
});

const SERIES_NAME = () => ({ 6: t('lanthanideSeries'), 7: t('actinideSeries') });

export function createElementPanel(host, elements, store, { onOpen3D, onOpenLab, onOpenSandbox, onInfo }) {
  const byZ = new Map(elements.map((e) => [e.z, e]));

  host.innerHTML = `
    <div class="panel__frame">
      <header class="panel__head"></header>
      <div class="panel__scroll" tabindex="-1"></div>
    </div>`;
  const head = host.querySelector('.panel__head');
  const scroll = host.querySelector('.panel__scroll');

  host.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-action]');
    if (!a) return;
    const z = store.get().selectedZ;
    switch (a.dataset.action) {
      case 'close': store.set({ selectedZ: null }); break;
      case 'prev': store.set({ selectedZ: z === 1 ? 118 : z - 1 }); break;
      case 'next': store.set({ selectedZ: z === 118 ? 1 : z + 1 }); break;
      case 'open-3d': onOpen3D(z); break;
      case 'open-lab': onOpenLab?.(z); break;
      case 'open-sandbox': onOpenSandbox?.(z); break;
      case 'info': onInfo(); break;
    }
  });

  function render(el) {
    const cat = CATEGORY[el.category];
    host.style.setProperty('--c', cat.color);
    const tag = el.dataQuality === 'predicted' ? t('tagPredicted') : t('tagEstimate');
    const est = (key) => (el.estimated.includes(key) ? ` <span class="tag tag--est">${tag}</span>` : '');
    const approx = (key) => (el.estimated.includes(key) ? '~' : '');
    const series = SERIES_NAME();

    head.innerHTML = `
      <div class="panel__tile">
        <span class="panel__z">${el.z}</span>
        <span class="panel__sym">${esc(el.symbol)}</span>
        <span class="panel__mass">${esc(fmtMass(el.atomicMass))}</span>
      </div>
      <div class="panel__title">
        <p class="eyebrow">${esc(cat.singular)}${el.predictedCategory ? ` · ${esc(t('predictedCat', { cat: CATEGORY[el.predictedCategory].singular.toLowerCase() }))}` : ''}</p>
        <h2 id="panel-title">${esc(el.name)}</h2>
        <p class="panel__sub">${esc(el.name === el.nameEn ? el.nameIt ?? el.nameEn : el.nameEn)} · ${el.group ? t('groupN', { n: el.group }) : series[el.period]} · ${t('periodN', { n: el.period })} · ${t('blockN', { b: el.block })}</p>
      </div>
      <nav class="panel__nav" aria-label="${esc(t('nav'))}">
        <button type="button" class="btn-icon" data-action="prev" title="${esc(t('prev', { z: el.z === 1 ? 118 : el.z - 1 }))}">${icons.prev(18)}</button>
        <button type="button" class="btn-icon" data-action="next" title="${esc(t('next', { z: el.z === 118 ? 1 : el.z + 1 }))}">${icons.next(18)}</button>
        <button type="button" class="btn-icon" data-action="close" title="${esc(t('close'))}">${icons.close(18)}</button>
      </nav>`;

    const content = document.createElement('div');
    content.className = 'panel__content';
    content.innerHTML = [
      qualityBanner(el),
      heroSection(el),
      specimenSection(el),
      simpleSection(el),
      basicSection(el, cat, series),
      structureSection(el, est),
      physicalSection(el, est, approx),
      chemicalSection(el, est, approx),
      isotopesSection(el),
      historySection(el),
      usesSection(el),
      `<footer class="panel__foot">
         ${t('sources')}
         <button type="button" class="link" data-action="info">${t('sourcesLink')}</button>
       </footer>`,
    ].join('');
    scroll.replaceChildren(content);
    scroll.scrollTop = 0;
    const spec = content.querySelector('.specimen');
    if (spec) mountSpecimen(spec, el.z);
  }

  // campione realistico dell'elemento (preset Professionale), caricato su richiesta
  let specimenLoading = null;
  function mountSpecimen(target, z) {
    specimenLoading ??= import('../gfx/specimen.js').then((m) => m.createSpecimenView());
    specimenLoading
      .then((view) => {
        if (target.isConnected) view.show(target, z);
      })
      .catch((err) => {
        console.error(err);
        target.closest('.psec')?.remove();
      });
  }

  // ---------------------------------------------------------- apertura / chiusura
  let openZ = null;
  store.subscribe((s, prev) => {
    if (s.selectedZ === prev.selectedZ) return;
    if (s.selectedZ) {
      render(byZ.get(s.selectedZ));
      if (!openZ) {
        host.classList.add('is-open');
        host.removeAttribute('inert');
        document.body.classList.add('panel-open');
      }
    } else {
      host.classList.remove('is-open');
      host.setAttribute('inert', '');
      document.body.classList.remove('panel-open');
    }
    openZ = s.selectedZ;
  });
  host.setAttribute('inert', '');
}

// ============================================================ sezioni

function section(title, body, extraClass = '') {
  return `<section class="psec ${extraClass}"><h3 class="psec__title">${title}</h3>${body}</section>`;
}

function qualityBanner(el) {
  if (el.dataQuality === 'measured') return '';
  if (el.dataQuality === 'predicted') {
    return `<div class="banner banner--predicted">${icons.warn(18)}<p>${t('predictedBanner')}</p></div>`;
  }
  const fields = el.estimated.map((k) => (t.has(`est.${k}`) ? t(`est.${k}`) : null)).filter(Boolean);
  const neverSeen = el.z === 85 || el.z === 87 || el.z >= 100;
  return `<div class="banner banner--partial">${icons.warn(18)}
    <p>${neverSeen ? t('neverSeen') : ''}${t('partialBanner', { fields: esc(fields.join(', ')) })}</p></div>`;
}

function heroSection(el) {
  const main = el.isotopes.find((i) => i.main);
  return `
    <section class="hero">
      <button type="button" class="hero__atom" data-action="open-3d" title="${esc(t('view3d'))}">
        ${bohrSvg(el, { size: 132, animated: gfx().animatedIcons })}
        <span class="hero__atom-hint">${icons.cube(13)} 3D</span>
      </button>
      <div class="counters">
        <div class="counter counter--p"><span class="counter__dot"></span><b>${el.protons}</b><span>${t('protons')}</span></div>
        <div class="counter counter--n"><span class="counter__dot"></span><b>${el.neutrons}</b><span>${t('neutrons')}</span></div>
        <div class="counter counter--e"><span class="counter__dot"></span><b>${el.electrons}</b><span>${t('electrons')}</span></div>
      </div>
      <p class="hero__note">${t('heroNote', { abundant: el.mainIsotopeKind === 'abundant', iso: isotopeNotation(main, el.symbol), A: main.massNumber })}</p>
      <div class="hero__ctas">
        <button type="button" class="btn-primary hero__cta" data-action="open-3d" data-help="ui.view3d">${icons.cube(18)}<span>${t('cta3d')}</span></button>
        <button type="button" class="btn-ghost hero__lab" data-action="open-lab" data-help="ui.lab" title="${esc(t('ctaLabTitle'))}">${icons.flask(16)}<span>${t('ctaLab')}</span></button>
        <button type="button" class="btn-ghost hero__lab" data-action="open-sandbox" data-help="ui.sandbox" title="${esc(t('ctaSandboxTitle'))}">${icons.sand(16)}<span>${t('ctaSandbox')}</span></button>
      </div>
    </section>`;
}

/** Preset Professionale: campione 3D dell'elemento con il suo aspetto reale (colori e materiali veri). */
function specimenSection(el) {
  if (!gfx().specimens) return '';
  return `<section class="psec psec--specimen" data-help="ui.specimen">
      <h3 class="psec__title">${appearanceTitle()}</h3>
      <div class="specimen" role="img" aria-label="${esc(describeAppearance(el.z))}"></div>
      <p class="prose specimen__text">${esc(describeAppearance(el.z))}</p>
      <p class="specimen__note">${appearanceCaption()}</p>
    </section>`;
}

/** Solo nella lingua «Spiegamelo come se avessi 6 anni»: una frase semplice sull'elemento. */
function simpleSection(el) {
  if (!isSimple() || !el.simple) return '';
  return `<section class="psec psec--simple"><h3 class="psec__title">${t('simpleTitle')}</h3><p class="prose prose--big">${esc(el.simple)}</p></section>`;
}

function basicSection(el, cat, series) {
  const massSub = el.atomicMass.isMassNumber ? t('massNumberSub') : t('massSub');
  const tiles = [
    [t('atomicNumber'), `${el.z}`, t('atomicNumberSub'), 'term.atomicNumber'],
    [t('atomicMass'), esc(fmtMass(el.atomicMass)), massSub, 'term.atomicMass'],
    [t('category'), esc(cat.singular), el.predictedCategory ? esc(t('predictedSub', { cat: CATEGORY[el.predictedCategory].singular.toLowerCase() })) : '', `cat.${el.category}`],
    [t('group'), el.group ? `${el.group}` : '—', el.group ? '' : series[el.period], 'term.group'],
    [t('period'), `${el.period}`, t('periodSub'), 'term.period'],
    [t('block'), el.block, t('blockSub', { b: el.block }), 'term.block'],
  ];
  return section(
    t('basic'),
    `<div class="tiles">${tiles
      .map(([k, v, sub, help]) => `<div class="tile" data-help="${help}"><span class="tile__k">${k}</span><span class="tile__v">${v}</span>${sub ? `<span class="tile__sub">${sub}</span>` : ''}</div>`)
      .join('')}</div>`,
  );
}

function structureSection(el, est) {
  const shells = el.shells
    .map((n, i) => `<li class="shell"><span class="shell__name">${SHELL_NAMES[i]}</span><span class="shell__n">${n}</span><span class="shell__idx">n=${i + 1}</span></li>`)
    .join('');
  return section(
    t('structure'),
    `<dl class="rows">
       <div class="row row--stack" data-help="term.electronConfiguration"><dt>${t('config')}${est('config')}</dt>
         <dd class="mono config">${esc(el.electronConfiguration.full)}</dd></div>
       <div class="row row--stack" data-help="term.electronConfiguration"><dt>${t('configShort')}</dt>
         <dd class="mono config config--short">${esc(el.electronConfiguration.short)}</dd></div>
     </dl>
     <p class="psec__label" data-help="term.shell">${t('shells')} <span class="muted">(${el.shells.join(' · ')})</span></p>
     <ol class="shells" data-help="term.shell">${shells}</ol>`,
  );
}

function tempRow(label, k, note, estTag, approx, help) {
  const tt = fmtTemperature(k);
  const val = tt
    ? `<span class="v">${approx}${tt.c} °C</span><span class="u">${approx}${tt.k} K</span>`
    : `<span class="muted">${note ? '—' : t('notAvailable')}</span>`;
  return `<div class="row" data-help="${help}"><dt>${label}${estTag}</dt><dd>${val}${note ? `<span class="row__note">${esc(note)}</span>` : ''}</dd></div>`;
}

function physicalSection(el, est, approx) {
  const stateText = el.state === 'unknown'
    ? `${esc(el.statePredicted)} <span class="tag tag--est">${t('tagPredicted')}</span>`
    : `${STATE_LABEL[el.state]}${est('state')}`;
  const stateIcon = { solid: 'solid', liquid: 'liquid', gas: 'gas', unknown: 'unknown' }[el.state];
  const dens = fmtDensity(el);
  const sub = el.sublimationPointK ? fmtTemperature(el.sublimationPointK) : null;
  const meltNote = el.meltingNote || '';

  return section(
    t('physical'),
    `<dl class="rows">
       <div class="row" data-help="term.state"><dt>${t('state25')}</dt><dd><span class="state state--${el.state}">${icons[stateIcon](15)}${stateText}</span></dd></div>
       ${sub
         ? `<div class="row" data-help="term.sublimation"><dt>${t('sublimation')}</dt><dd><span class="v">${sub.c} °C</span><span class="u">${sub.k} K</span><span class="row__note">${esc(meltNote)}</span></dd></div>`
         : tempRow(t('melting'), el.meltingPointK, meltNote, est('mp'), approx('mp'), 'term.meltingPoint')}
       ${sub ? '' : tempRow(t('boiling'), el.boilingPointK, '', est('bp'), approx('bp'), 'term.boilingPoint')}
       <div class="row" data-help="term.density"><dt>${t('density')}${est('d')}</dt><dd>${
         dens
           ? `<span class="v">${approx('d')}${dens.value} ${dens.unit}</span>${dens.note ? `<span class="row__note">${esc(dens.note)}</span>` : ''}`
           : `<span class="muted">${t('notAvailable')}</span>`
       }</dd></div>
     </dl>`,
  );
}

function chemicalSection(el, est, approx) {
  const en = el.electronegativity;
  const na = `<span class="muted">${t('notAvailable')}</span>`;
  const enBar = en !== null
    ? `<span class="v">${fmtNumber(en, 2)}</span>
       <span class="scale" title="${esc(t('paulingScale'))}"><span class="scale__fill" style="--p:${(((en - 0.7) / (3.98 - 0.7)) * 100).toFixed(1)}%"></span></span>`
    : `<span class="muted">${el.category === 'noble-gas' && el.z <= 18 ? t('enUndefined') : t('notAvailable')}</span>`;
  const ie = fmtIonization(el.ionizationEnergyEv);
  const ox = el.oxidationStates.map((o) => `<span class="ox">${esc(o)}</span>`).join('');

  return section(
    t('chemical'),
    `<dl class="rows">
       <div class="row" data-help="term.electronegativity"><dt>${t('electronegativity')} <small>${t('pauling')}</small></dt><dd class="en">${enBar}</dd></div>
       <div class="row" data-help="term.atomicRadius"><dt>${t('atomicRadius')} <small>${t('vdw')}</small></dt><dd>${
         el.vdwRadiusPm ? `<span class="v">${el.vdwRadiusPm} pm</span>` : na
       }</dd></div>
       <div class="row" data-help="term.covalentRadius"><dt>${t('covalentRadius')}</dt><dd>${
         el.covalentRadiusPm ? `<span class="v">${el.covalentRadiusPm} pm</span>` : na
       }</dd></div>
       <div class="row" data-help="term.ionizationEnergy"><dt>${t('ionization')}${est('ie')}</dt><dd>${
         ie ? `<span class="v">${approx('ie')}${ie.ev} eV</span><span class="u">${approx('ie')}${ie.kj} kJ/mol</span>` : na
       }</dd></div>
       ${el.electronAffinityEv !== null ? `<div class="row" data-help="term.electronAffinity"><dt>${t('affinity')}</dt><dd><span class="v">${fmtNumber(el.electronAffinityEv, 3)} eV</span></dd></div>` : ''}
       <div class="row" data-help="term.oxidationState"><dt>${t('oxidation')}${est('ox')}</dt><dd><span class="oxs">${ox}</span></dd></div>
     </dl>`,
  );
}

function isotopesSection(el) {
  const rows = el.isotopes
    .map((iso) => {
      const pct = iso.abundance ?? 0;
      const stability = iso.stable
        ? `<span class="badge badge--stable">${t('stable')}</span>`
        : `<span class="badge badge--radio">${t('radioactive')}</span>
           <span class="iso__decay">t½ ${esc(iso.halfLife.text)} · ${iso.decay.map((d) => `<abbr title="${esc(d.simple ?? d.label)}">${esc(d.symbol)}</abbr>`).join(' / ')}</span>`;
      return `
        <tr class="${iso.main ? 'is-main' : ''}">
          <th scope="row">
            <span class="iso__not">${isotopeNotation(iso, esc(el.symbol))}</span>
            <span class="iso__name">${esc(isotopeName(iso, el.name))}${iso.main ? ` · <b>${t('main')}</b>` : ''}</span>
          </th>
          <td class="num">${iso.neutrons}</td>
          <td class="iso__ab">
            <span class="ab">${esc(fmtAbundance(iso))}</span>
            ${iso.abundance !== null ? `<span class="bar"><span style="--p:${Math.max(pct, 0.8)}%"></span></span>` : ''}
          </td>
          <td>${stability}</td>
        </tr>`;
    })
    .join('');
  const anyNatural = el.isotopes.some((i) => i.abundance !== null);
  return section(
    t('isotopes'),
    `<div class="table-wrap" data-help="term.isotope"><table class="isotopes">
       <thead><tr><th>${t('isotope')}</th><th class="num">${t('neutronsCol')}</th><th>${t('abundance')}</th><th data-help="term.radioactivity">${t('stability')}</th></tr></thead>
       <tbody>${rows}</tbody>
     </table></div>
     ${anyNatural ? '' : `<p class="psec__note">${t('noStable')}</p>`}`,
  );
}

function historySection(el) {
  const year = el.discovery.year;
  return section(
    t('history'),
    `<div class="history">
       <div class="history__year"><span>${esc(year)}</span><small>${/^\d/.test(year) || year.startsWith('~') ? t('discoveryYear') : t('discovery')}</small></div>
       <div class="history__by"><p class="psec__label">${t('discoverer')}</p><p>${esc(el.discovery.by)}</p></div>
     </div>
     <p class="psec__label">${t('nameOrigin')}</p>
     <p class="prose">${esc(el.nameOrigin)}</p>`,
  );
}

function usesSection(el) {
  return section(
    t('uses'),
    `<p class="psec__label">${t('usesCommon')}</p>
     <ul class="uses">${el.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
     <p class="psec__label">${t('whereFound')}</p>
     <p class="prose">${esc(el.occurrence)}</p>`,
  );
}
