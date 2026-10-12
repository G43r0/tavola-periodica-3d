// Anteprima dell'elemento sotto il cursore, nello spazio vuoto in alto nella tavola.
import { CATEGORY, STATE_LABEL } from '../data/categories.js';
import { fmtMass, fmtNumber, esc } from '../chem/format.js';
import { bohrSvg } from './bohr-icon.js';
import { icons } from './icons.js';
import { createT } from '../i18n/index.js';

const t = createT({
  it: {
    title: 'Esplora gli elementi',
    intro: 'Passa il mouse su un elemento per un\'anteprima, cliccalo per aprire la scheda completa. Passando su un numero di <b>gruppo</b> o di <b>periodo</b> evidenzi l\'intera colonna o riga.',
    explainTip: 'Non conosci una parola? Premi <kbd>F1</kbd> (modalità Spiega), poi evidenziala o fai clic destro.',
    search: 'cerca', move: 'muovi', enter: 'Invio', open: 'apri', close: 'chiudi',
    predicted: '{state} (previsto)',
    selected: 'Elemento selezionato',
    state: 'Stato', group: 'Gruppo', period: 'Periodo', block: 'Blocco', en: 'Elettroneg.',
  },
  en: {
    title: 'Explore the elements',
    intro: 'Hover over an element for a preview, click it to open the full card. Hovering over a <b>group</b> or <b>period</b> number highlights the whole column or row.',
    explainTip: 'Don\'t know a word? Press <kbd>F1</kbd> (Explain mode), then highlight it or right-click it.',
    search: 'search', move: 'move', enter: 'Enter', open: 'open', close: 'close',
    predicted: '{state} (predicted)',
    selected: 'Selected element',
    state: 'State', group: 'Group', period: 'Period', block: 'Block', en: 'Electroneg.',
  },
  eli6: {
    title: 'Scopri gli elementi',
    intro: 'Gli <b>elementi</b> sono i «mattoncini» di cui è fatto tutto. Passa il mouse su un quadratino per vederlo, cliccalo per sapere tutto. Le <b>colonne</b> mettono insieme elementi che si comportano in modo simile.',
    explainTip: 'Una parola difficile? Premi <kbd>F1</kbd>, poi evidenziala o premi il tasto destro sopra: te la spiego.',
    predicted: '{state} (secondo i calcoli)',
  },
});

const INTRO = () => `
  <div class="inspector__intro">
    <p class="inspector__title">${t('title')}</p>
    <p>${t('intro')}</p>
    <p class="inspector__keys">${icons.keyboard(15)}
      <span><kbd>/</kbd> ${t('search')}</span><span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> ${t('move')}</span>
      <span><kbd>${t('enter')}</kbd> ${t('open')}</span><span><kbd>Esc</kbd> ${t('close')}</span></p>
    <p class="inspector__tip">${t('explainTip')}</p>
  </div>`;

export function createInspector(host, { thumb } = {}) {
  let currentZ = undefined;

  function show(el, { pinned = false } = {}) {
    const key = el ? `${el.z}:${pinned}` : null;
    if (key === currentZ) return;
    currentZ = key;

    if (!el) {
      host.innerHTML = INTRO();
      host.style.removeProperty('--c');
      return;
    }

    const cat = CATEGORY[el.category];
    const state = el.state === 'unknown' ? t('predicted', { state: el.statePredicted }) : STATE_LABEL[el.state];
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
          <p class="inspector__eyebrow">${pinned ? t('selected') : esc(cat.singular)}</p>
          <p class="inspector__name">${esc(el.name)}</p>
          <p class="inspector__config">${esc(el.electronConfiguration.short)}</p>
          <dl class="inspector__stats">
            <div><dt>${t('state')}</dt><dd>${esc(state)}</dd></div>
            <div><dt>${t('group')}</dt><dd>${el.group ?? '—'}</dd></div>
            <div><dt>${t('period')}</dt><dd>${el.period}</dd></div>
            <div><dt>${t('block')}</dt><dd>${el.block}</dd></div>
            <div><dt>${t('en')}</dt><dd>${en}</dd></div>
          </dl>
        </div>
        <div class="inspector__atom">${thumb?.(el.z) ? `<img class="inspector__spec" src="${thumb(el.z)}" alt="" />` : bohrSvg(el, { size: 120, animated: false })}</div>
      </div>`;
  }

  show(null);
  return { show };
}
