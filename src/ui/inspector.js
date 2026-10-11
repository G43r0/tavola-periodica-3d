// Anteprima dell'elemento sotto il cursore, nello spazio vuoto in alto nella tavola.
import { CATEGORY, STATE_LABEL } from '../data/categories.js';
import { fmtMass, fmtNumber, esc } from '../chem/format.js';
import { bohrSvg } from './bohr-icon.js';
import { icons } from './icons.js';

const INTRO = `
  <div class="inspector__intro">
    <p class="inspector__title">Esplora gli elementi</p>
    <p>Passa il mouse su un elemento per un'anteprima, cliccalo per aprire la scheda completa.
       Passando su un numero di <b>gruppo</b> o di <b>periodo</b> evidenzi l'intera colonna o riga.</p>
    <p class="inspector__keys">${icons.keyboard(15)}
      <span><kbd>/</kbd> cerca</span><span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> muovi</span>
      <span><kbd>Invio</kbd> apri</span><span><kbd>Esc</kbd> chiudi</span></p>
  </div>`;

export function createInspector(host) {
  let currentZ = undefined;

  function show(el, { pinned = false } = {}) {
    const key = el ? `${el.z}:${pinned}` : null;
    if (key === currentZ) return;
    currentZ = key;

    if (!el) {
      host.innerHTML = INTRO;
      host.style.removeProperty('--c');
      return;
    }

    const cat = CATEGORY[el.category];
    const state = el.state === 'unknown' ? `${el.statePredicted} (previsto)` : STATE_LABEL[el.state];
    const en = el.electronegativity !== null ? fmtNumber(el.electronegativity, 2) : '—';
    host.style.setProperty('--c', cat.color);
    host.innerHTML = `
      <div class="inspector__card ${pinned ? 'is-pinned' : ''}">
        <div class="inspector__tile">
          <span class="inspector__z">${el.z}</span>
          <span class="inspector__sym">${esc(el.symbol)}</span>
          <span class="inspector__mass">${esc(fmtMass(el.atomicMass))}</span>
        </div>
        <div class="inspector__info">
          <p class="inspector__eyebrow">${pinned ? 'Elemento selezionato' : cat.singular}</p>
          <p class="inspector__name">${esc(el.name)}</p>
          <p class="inspector__config">${esc(el.electronConfiguration.short)}</p>
          <dl class="inspector__stats">
            <div><dt>Stato</dt><dd>${esc(state)}</dd></div>
            <div><dt>Gruppo</dt><dd>${el.group ?? '—'}</dd></div>
            <div><dt>Periodo</dt><dd>${el.period}</dd></div>
            <div><dt>Blocco</dt><dd>${el.block}</dd></div>
            <div><dt>Elettroneg.</dt><dd>${en}</dd></div>
          </dl>
        </div>
        <div class="inspector__atom">${bohrSvg(el, { size: 120, animated: false })}</div>
      </div>`;
  }

  show(null);
  return { show };
}
