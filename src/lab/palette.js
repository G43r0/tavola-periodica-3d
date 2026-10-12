// Tavolozza degli elementi del laboratorio: elementi frequenti + mini tavola periodica dei 118 elementi.
// Clic = aggiunge l'atomo al banco; trascinamento = lo aggiunge nel punto di rilascio.
import { CATEGORY } from '../data/categories.js';
import { normalize, esc } from '../chem/format.js';
import { TIER } from './chem/elements-lab.js';
import { createT } from '../i18n/index.js';

const t = createT({
  it: {
    unverified: ' — struttura non verificata (metallo del blocco d/f)',
    unknown: ' — chimica sconosciuta (elemento superpesante)',
    search: 'Cerca elemento…',
    searchLabel: 'Cerca un elemento da aggiungere',
    frequent: 'Più usati',
    table: 'Tavola periodica',
    legend: '<i>~</i> struttura non verificata · <i>?</i> chimica sconosciuta',
    hint: 'Clic per aggiungere un atomo, oppure trascinalo sul banco.',
  },
  en: {
    unverified: ' — structure not verified (d/f-block metal)',
    unknown: ' — unknown chemistry (superheavy element)',
    search: 'Search element…',
    searchLabel: 'Search an element to add',
    frequent: 'Most used',
    table: 'Periodic table',
    legend: '<i>~</i> structure not verified · <i>?</i> unknown chemistry',
    hint: 'Click to add an atom, or drag it onto the bench.',
  },
  eli6: {
    unverified: ' — per questo metallo le regole semplici non bastano',
    unknown: ' — nessuno sa come si lega (elemento troppo pesante)',
    legend: '<i>~</i> regole semplici non bastano · <i>?</i> nessuno lo sa',
    hint: 'Clicca un elemento per mettere un suo atomo sul banco.',
  },
});

const FREQUENT = ['H', 'C', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I', 'Na', 'K', 'Mg', 'Ca', 'Al', 'Si', 'B', 'Xe'];
const TIER_MARK = { [TIER.UNVERIFIED]: '~', [TIER.UNKNOWN]: '?' };
const TIER_TITLE = {
  [TIER.MAIN]: '',
  [TIER.UNVERIFIED]: t('unverified'),
  [TIER.UNKNOWN]: t('unknown'),
};

export function createPalette(host, elements, lab, { onPick }) {
  const cell = (el, extra = '', place = '') => {
    const info = lab.get(el.z);
    const cat = CATEGORY[el.category] ?? CATEGORY.unknown;
    const mark = TIER_MARK[info.tier] ?? '';
    return `<button type="button" class="pal-cell ${extra}" data-z="${el.z}" draggable="true" style="--c:${cat.color};--a:${info.color};${place}"
        title="${esc(el.name)} (Z = ${el.z})${TIER_TITLE[info.tier]}">
        <span class="pal-cell__sym">${el.symbol}</span>${mark ? `<i class="pal-cell__tier">${mark}</i>` : ''}</button>`;
  };
  const bySymbol = new Map(elements.map((e) => [e.symbol, e]));
  host.innerHTML = `
    <div class="pal-search">
      <input type="search" placeholder="${t('search')}" aria-label="${t('searchLabel')}" spellcheck="false" />
    </div>
    <p class="pal-title">${t('frequent')}</p>
    <div class="pal-frequent">${FREQUENT.map((s) => cell(bySymbol.get(s), 'pal-cell--big')).join('')}</div>
    <p class="pal-title">${t('table')}</p>
    <div class="pal-grid">${elements
      .map((el) => cell(el, '', `grid-column:${el.grid.x};grid-row:${el.grid.y}`))
      .join('')}</div>
    <p class="pal-legend">${t('legend')}</p>
    <p class="pal-hint">${t('hint')}</p>`;

  host.addEventListener('click', (ev) => {
    const b = ev.target.closest('.pal-cell');
    if (b) onPick(Number(b.dataset.z));
  });
  host.addEventListener('dragstart', (ev) => {
    const b = ev.target.closest('.pal-cell');
    if (!b) return;
    ev.dataTransfer.setData('text/x-element', b.dataset.z);
    ev.dataTransfer.effectAllowed = 'copy';
  });
  const input = host.querySelector('input');
  input.addEventListener('input', () => {
    const q = normalize(input.value);
    host.querySelectorAll('.pal-grid .pal-cell').forEach((b) => {
      const el = elements[Number(b.dataset.z) - 1];
      const match = !q || normalize(el.name).startsWith(q) || el.symbol.toLowerCase() === q || String(el.z) === q;
      b.classList.toggle('is-dim', !match);
    });
  });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const first = host.querySelector('.pal-grid .pal-cell:not(.is-dim)');
      if (first && input.value) onPick(Number(first.dataset.z));
    }
    ev.stopPropagation();
  });
}
