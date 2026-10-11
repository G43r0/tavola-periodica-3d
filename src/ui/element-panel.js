// Scheda informativa dell'elemento (pannello laterale).
import { CATEGORY, STATE_LABEL, SHELL_NAMES } from '../data/categories.js';
import {
  esc, fmtMass, fmtNumber, fmtTemperature, fmtDensity, fmtIonization,
  fmtAbundance, isotopeNotation, isotopeName,
} from '../chem/format.js';
import { bohrSvg } from './bohr-icon.js';
import { icons } from './icons.js';

const EST_LABEL = {
  mp: 'punto di fusione',
  bp: 'punto di ebollizione',
  d: 'densità',
  state: 'stato fisico',
  ie: 'energia di ionizzazione',
  ox: 'stati di ossidazione',
  config: 'configurazione elettronica',
  category: 'categoria chimica',
};

const SERIES_NAME = { 6: 'serie dei lantanidi', 7: 'serie degli attinidi' };

export function createElementPanel(host, elements, store, { onOpen3D, onOpenLab, onInfo }) {
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
      case 'info': onInfo(); break;
    }
  });

  function render(el) {
    const cat = CATEGORY[el.category];
    host.style.setProperty('--c', cat.color);
    const tag = el.dataQuality === 'predicted' ? 'previsto' : 'stima';
    const est = (key) => (el.estimated.includes(key) ? ` <span class="tag tag--est">${tag}</span>` : '');
    const approx = (key) => (el.estimated.includes(key) ? '~' : '');

    head.innerHTML = `
      <div class="panel__tile">
        <span class="panel__z">${el.z}</span>
        <span class="panel__sym">${esc(el.symbol)}</span>
        <span class="panel__mass">${esc(fmtMass(el.atomicMass))}</span>
      </div>
      <div class="panel__title">
        <p class="eyebrow">${esc(cat.singular)}${el.predictedCategory ? ` · previsto: ${esc(CATEGORY[el.predictedCategory].singular.toLowerCase())}` : ''}</p>
        <h2 id="panel-title">${esc(el.name)}</h2>
        <p class="panel__sub">${esc(el.nameEn)} · ${el.group ? `gruppo ${el.group}` : SERIES_NAME[el.period]} · periodo ${el.period} · blocco ${el.block}</p>
      </div>
      <nav class="panel__nav" aria-label="Navigazione elementi">
        <button type="button" class="btn-icon" data-action="prev" title="Elemento precedente (${el.z === 1 ? 118 : el.z - 1})">${icons.prev(18)}</button>
        <button type="button" class="btn-icon" data-action="next" title="Elemento successivo (${el.z === 118 ? 1 : el.z + 1})">${icons.next(18)}</button>
        <button type="button" class="btn-icon" data-action="close" title="Chiudi (Esc)">${icons.close(18)}</button>
      </nav>`;

    const content = document.createElement('div');
    content.className = 'panel__content';
    content.innerHTML = [
      qualityBanner(el),
      heroSection(el),
      basicSection(el, cat),
      structureSection(el, est),
      physicalSection(el, est, approx),
      chemicalSection(el, est, approx),
      isotopesSection(el),
      historySection(el),
      usesSection(el),
      `<footer class="panel__foot">
         Fonti: IUPAC/CIAAW, NIST, PubChem. «~» indica un valore stimato o previsto.
         <button type="button" class="link" data-action="info">Dettagli sulle fonti</button>
       </footer>`,
    ].join('');
    scroll.replaceChildren(content);
    scroll.scrollTop = 0;
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
    return `<div class="banner banner--predicted">${icons.warn(18)}
      <p><b>Elemento superpesante, dati in gran parte previsti.</b> Ne sono stati prodotti solo pochi atomi, che decadono in tempi brevissimi:
      configurazione elettronica, stato fisico, densità, energia di ionizzazione e chimica derivano da calcoli teorici, non da misure.</p></div>`;
  }
  const fields = el.estimated.map((k) => EST_LABEL[k]).filter(Boolean);
  const neverSeen = el.z === 85 || el.z === 87 || el.z >= 100;
  return `<div class="banner banner--partial">${icons.warn(18)}
    <p>${neverSeen ? '<b>Mai osservato in quantità visibili.</b> ' : ''}Alcuni valori sono stime e non misure dirette: ${esc(fields.join(', '))}.</p></div>`;
}

function heroSection(el) {
  const main = el.isotopes.find((i) => i.main);
  return `
    <section class="hero">
      <button type="button" class="hero__atom" data-action="open-3d" title="Visualizza l'atomo in 3D">
        ${bohrSvg(el, { size: 132, animated: true })}
        <span class="hero__atom-hint">${icons.cube(13)} 3D</span>
      </button>
      <div class="counters">
        <div class="counter counter--p"><span class="counter__dot"></span><b>${el.protons}</b><span>protoni</span></div>
        <div class="counter counter--n"><span class="counter__dot"></span><b>${el.neutrons}</b><span>neutroni</span></div>
        <div class="counter counter--e"><span class="counter__dot"></span><b>${el.electrons}</b><span>elettroni</span></div>
      </div>
      <p class="hero__note">Neutroni dell'isotopo ${el.mainIsotopeKind === 'abundant' ? 'più abbondante' : 'più stabile'},
        <b>${isotopeNotation(main, el.symbol)}</b> (A = ${main.massNumber}). Nell'atomo neutro gli elettroni sono pari ai protoni.</p>
      <div class="hero__ctas">
        <button type="button" class="btn-primary hero__cta" data-action="open-3d">${icons.cube(18)}<span>Visualizza atomo in 3D</span></button>
        <button type="button" class="btn-ghost hero__lab" data-action="open-lab" title="Apri il laboratorio molecolare con questo atomo sul banco">${icons.flask(16)}<span>Usa nel laboratorio</span></button>
      </div>
    </section>`;
}

function basicSection(el, cat) {
  const massSub = el.atomicMass.isMassNumber
    ? 'numero di massa dell\'isotopo più stabile'
    : 'massa atomica standard (u)';
  const tiles = [
    ['Numero atomico', `${el.z}`, 'Z = numero di protoni'],
    ['Massa atomica', esc(fmtMass(el.atomicMass)), massSub],
    ['Categoria', esc(cat.singular), el.predictedCategory ? `prevista: ${esc(CATEGORY[el.predictedCategory].singular.toLowerCase())}` : ''],
    ['Gruppo', el.group ? `${el.group}` : '—', el.group ? '' : SERIES_NAME[el.period]],
    ['Periodo', `${el.period}`, 'riga della tavola'],
    ['Blocco', el.block, `orbitali ${el.block}`],
  ];
  return section(
    'Dati di base',
    `<div class="tiles">${tiles
      .map(([k, v, sub]) => `<div class="tile"><span class="tile__k">${k}</span><span class="tile__v">${v}</span>${sub ? `<span class="tile__sub">${sub}</span>` : ''}</div>`)
      .join('')}</div>`,
  );
}

function structureSection(el, est) {
  const shells = el.shells
    .map((n, i) => `<li class="shell"><span class="shell__name">${SHELL_NAMES[i]}</span><span class="shell__n">${n}</span><span class="shell__idx">n=${i + 1}</span></li>`)
    .join('');
  return section(
    'Struttura atomica',
    `<dl class="rows">
       <div class="row row--stack"><dt>Configurazione elettronica${est('config')}</dt>
         <dd class="mono config">${esc(el.electronConfiguration.full)}</dd></div>
       <div class="row row--stack"><dt>Configurazione abbreviata</dt>
         <dd class="mono config config--short">${esc(el.electronConfiguration.short)}</dd></div>
     </dl>
     <p class="psec__label">Elettroni per guscio <span class="muted">(${el.shells.join(' · ')})</span></p>
     <ol class="shells">${shells}</ol>`,
  );
}

function tempRow(label, k, note, estTag, approx) {
  const t = fmtTemperature(k);
  const val = t
    ? `<span class="v">${approx}${t.c} °C</span><span class="u">${approx}${t.k} K</span>`
    : `<span class="muted">${note ? '—' : 'non disponibile'}</span>`;
  return `<div class="row"><dt>${label}${estTag}</dt><dd>${val}${note ? `<span class="row__note">${esc(note)}</span>` : ''}</dd></div>`;
}

function physicalSection(el, est, approx) {
  const stateText = el.state === 'unknown'
    ? `${esc(el.statePredicted)} <span class="tag tag--est">previsto</span>`
    : `${STATE_LABEL[el.state]}${est('state')}`;
  const stateIcon = { solid: 'solid', liquid: 'liquid', gas: 'gas', unknown: 'unknown' }[el.state];
  const dens = fmtDensity(el);
  const sub = el.sublimationPointK ? fmtTemperature(el.sublimationPointK) : null;
  const meltNote = el.meltingNote || '';

  return section(
    'Proprietà fisiche',
    `<dl class="rows">
       <div class="row"><dt>Stato a 25 °C</dt><dd><span class="state state--${el.state}">${icons[stateIcon](15)}${stateText}</span></dd></div>
       ${sub
         ? `<div class="row"><dt>Sublimazione</dt><dd><span class="v">${sub.c} °C</span><span class="u">${sub.k} K</span><span class="row__note">${esc(meltNote)}</span></dd></div>`
         : tempRow('Punto di fusione', el.meltingPointK, meltNote, est('mp'), approx('mp'))}
       ${sub ? '' : tempRow('Punto di ebollizione', el.boilingPointK, '', est('bp'), approx('bp'))}
       <div class="row"><dt>Densità${est('d')}</dt><dd>${
         dens
           ? `<span class="v">${approx('d')}${dens.value} ${dens.unit}</span>${dens.note ? `<span class="row__note">${esc(dens.note)}</span>` : ''}`
           : '<span class="muted">non disponibile</span>'
       }</dd></div>
     </dl>`,
  );
}

function chemicalSection(el, est, approx) {
  const en = el.electronegativity;
  const enBar = en !== null
    ? `<span class="v">${fmtNumber(en, 2)}</span>
       <span class="scale" title="Scala di Pauling: da 0,7 (Fr) a 3,98 (F)"><span class="scale__fill" style="--p:${(((en - 0.7) / (3.98 - 0.7)) * 100).toFixed(1)}%"></span></span>`
    : `<span class="muted">${el.category === 'noble-gas' && el.z <= 18 ? 'non definita (non forma legami)' : 'non disponibile'}</span>`;
  const ie = fmtIonization(el.ionizationEnergyEv);
  const ox = el.oxidationStates.map((o) => `<span class="ox">${esc(o)}</span>`).join('');

  return section(
    'Proprietà chimiche',
    `<dl class="rows">
       <div class="row"><dt>Elettronegatività <small>(Pauling)</small></dt><dd class="en">${enBar}</dd></div>
       <div class="row"><dt>Raggio atomico <small>(van der Waals)</small></dt><dd>${
         el.vdwRadiusPm ? `<span class="v">${el.vdwRadiusPm} pm</span>` : '<span class="muted">non disponibile</span>'
       }</dd></div>
       <div class="row"><dt>Raggio covalente</dt><dd>${
         el.covalentRadiusPm ? `<span class="v">${el.covalentRadiusPm} pm</span>` : '<span class="muted">non disponibile</span>'
       }</dd></div>
       <div class="row"><dt>Energia di 1ª ionizzazione${est('ie')}</dt><dd>${
         ie ? `<span class="v">${approx('ie')}${ie.ev} eV</span><span class="u">${approx('ie')}${ie.kj} kJ/mol</span>` : '<span class="muted">non disponibile</span>'
       }</dd></div>
       ${el.electronAffinityEv !== null ? `<div class="row"><dt>Affinità elettronica</dt><dd><span class="v">${fmtNumber(el.electronAffinityEv, 3)} eV</span></dd></div>` : ''}
       <div class="row"><dt>Stati di ossidazione comuni${est('ox')}</dt><dd><span class="oxs">${ox}</span></dd></div>
     </dl>`,
  );
}

function isotopesSection(el) {
  const rows = el.isotopes
    .map((iso) => {
      const pct = iso.abundance ?? 0;
      const stability = iso.stable
        ? '<span class="badge badge--stable">Stabile</span>'
        : `<span class="badge badge--radio">Radioattivo</span>
           <span class="iso__decay">t½ ${esc(iso.halfLife.text)} · ${iso.decay.map((d) => `<abbr title="${esc(d.label)}">${esc(d.symbol)}</abbr>`).join(' / ')}</span>`;
      return `
        <tr class="${iso.main ? 'is-main' : ''}">
          <th scope="row">
            <span class="iso__not">${isotopeNotation(iso, esc(el.symbol))}</span>
            <span class="iso__name">${esc(isotopeName(iso, el.name))}${iso.main ? ' · <b>principale</b>' : ''}</span>
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
    'Isotopi principali',
    `<div class="table-wrap"><table class="isotopes">
       <thead><tr><th>Isotopo</th><th class="num">Neutroni</th><th>Abbondanza naturale</th><th>Stabilità</th></tr></thead>
       <tbody>${rows}</tbody>
     </table></div>
     ${anyNatural ? '' : '<p class="psec__note">Nessun isotopo stabile: in natura l\'elemento è assente o presente solo in tracce.</p>'}`,
  );
}

function historySection(el) {
  const year = el.discovery.year;
  return section(
    'Storia',
    `<div class="history">
       <div class="history__year"><span>${esc(year)}</span><small>${/^\d/.test(year) || year.startsWith('~') ? 'anno di scoperta' : 'scoperta'}</small></div>
       <div class="history__by"><p class="psec__label">Scopritore</p><p>${esc(el.discovery.by)}</p></div>
     </div>
     <p class="psec__label">Origine del nome</p>
     <p class="prose">${esc(el.nameOrigin)}</p>`,
  );
}

function usesSection(el) {
  return section(
    'Usi e presenza in natura',
    `<p class="psec__label">Usi comuni</p>
     <ul class="uses">${el.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
     <p class="psec__label">Dove si trova</p>
     <p class="prose">${esc(el.occurrence)}</p>`,
  );
}
