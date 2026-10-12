// Barra superiore (ricerca, filtri per stato e blocco, lingua, modalità Spiega) e legenda/filtro per categoria.
import { CATEGORIES, STATES, BLOCKS } from '../data/categories.js';
import { computeVisibility } from '../state/query.js';
import { hasActiveFilters, initialState } from '../state/store.js';
import { esc } from '../chem/format.js';
import { createT, LANGS, getLang, setLang, langInfo } from '../i18n/index.js';
import { icons } from './icons.js';

const t = createT({
  it: {
    title: 'Tavola Periodica',
    subtitle: 'Laboratorio interattivo degli elementi',
    searchPlaceholder: 'Nome, simbolo o numero…',
    searchLabel: 'Cerca un elemento per nome, simbolo o numero atomico',
    stateGroup: 'Stato fisico a 25 °C',
    stateLabel: 'Stato a 25 °C',
    blockGroup: 'Blocco',
    reset: 'Azzera',
    resetTitle: 'Azzera ricerca e filtri',
    lab: 'Laboratorio',
    labTitle: 'Laboratorio molecolare: collega gli atomi e costruisci molecole',
    sandbox: 'Sandbox',
    sandboxTitle: 'Sandbox degli elementi: polveri, liquidi e gas che fondono, bruciano e reagiscono',
    explain: 'Spiega',
    explainTitle: 'Modalità Spiega (F1): evidenzia una parola o fai clic destro su qualcosa per sapere cos\'è',
    language: 'Lingua',
    info: 'Fonti dei dati e guida',
    categories: 'Categorie',
    categoriesGroup: 'Legenda e filtro per categoria',
    chipTitle: '{label} — clic per filtrare',
    legendNote: 'Bordo tratteggiato = proprietà in gran parte previste',
    countOf: '{n} di {total}',
    countAll: '{total} elementi',
    enter: 'Invio',
    noResults: 'Nessun risultato',
  },
  en: {
    title: 'Periodic Table',
    subtitle: 'Interactive laboratory of the elements',
    searchPlaceholder: 'Name, symbol or number…',
    searchLabel: 'Search an element by name, symbol or atomic number',
    stateGroup: 'Physical state at 25 °C',
    stateLabel: 'State at 25 °C',
    blockGroup: 'Block',
    reset: 'Reset',
    resetTitle: 'Clear search and filters',
    lab: 'Laboratory',
    labTitle: 'Molecular laboratory: connect atoms and build molecules',
    sandbox: 'Sandbox',
    sandboxTitle: 'Element sandbox: powders, liquids and gases that melt, burn and react',
    explain: 'Explain',
    explainTitle: 'Explain mode (F1): highlight a word or right-click anything to find out what it is',
    language: 'Language',
    info: 'Data sources and guide',
    categories: 'Categories',
    categoriesGroup: 'Legend and category filter',
    chipTitle: '{label} — click to filter',
    legendNote: 'Dashed border = properties largely predicted',
    countOf: '{n} of {total}',
    countAll: '{total} elements',
    enter: 'Enter',
    noResults: 'No results',
  },
  eli6: {
    subtitle: 'Gioca e scopri di cosa è fatto il mondo',
    searchPlaceholder: 'Scrivi nome, sigla o numero…',
    stateGroup: 'Com\'è a temperatura di casa',
    stateLabel: 'A casa è…',
    labTitle: 'Laboratorio: attacca gli atomi tra loro e costruisci molecole',
    sandboxTitle: 'Sabbiera: versa polveri, liquidi e gas e guarda cosa succede quando li scaldi o li mescoli',
    explainTitle: 'Modalità Spiega (F1): evidenzia una parola o premi il tasto destro su qualcosa e ti spiego cos\'è',
    info: 'Da dove vengono i dati, e come si usa',
    legendNote: 'Bordo a trattini = di questi elementi sappiamo poco, molti dati sono ipotesi',
  },
});

export function createToolbar(header, legend, elements, store, { onOpen, onInfo, onLab, onSandbox, onCategoryHover, onSearchCommit }) {
  header.innerHTML = `
    <div class="brand">
      <span class="brand__logo" data-help="ui.logo">${icons.atom(26)}</span>
      <div class="brand__text">
        <h1>${t('title')}</h1>
        <p>${t('subtitle')}</p>
      </div>
    </div>

    <div class="search" role="search">
      <span class="search__icon">${icons.search(17)}</span>
      <input id="search" class="search__input" type="search" autocomplete="off" spellcheck="false" data-help="ui.search"
             placeholder="${esc(t('searchPlaceholder'))}" aria-label="${esc(t('searchLabel'))}" />
      <span class="search__hint" aria-live="polite"></span>
      <kbd class="search__kbd">/</kbd>
    </div>

    <div class="filter-group" role="group" aria-label="${esc(t('stateGroup'))}" data-help="ui.stateFilter">
      <span class="filter-group__label">${t('stateLabel')}</span>
      <div class="segmented">
        ${STATES.map(
          (s) => `<button type="button" class="segmented__btn" data-state="${s.key}" aria-pressed="false" title="${esc(s.label)}">
              ${s.icon ? icons[s.icon](14) : ''}<span>${esc(s.label)}</span></button>`,
        ).join('')}
      </div>
    </div>

    <div class="filter-group" role="group" aria-label="${esc(t('blockGroup'))}" data-help="ui.blockFilter">
      <span class="filter-group__label">${t('blockGroup')}</span>
      <div class="segmented segmented--blocks">
        ${BLOCKS.map(
          (b) => `<button type="button" class="segmented__btn" data-block="${b.key}" aria-pressed="false" title="${esc(b.label)}: ${esc(b.hint)}">${b.key}</button>`,
        ).join('')}
      </div>
    </div>

    <div class="toolbar__end">
      <span class="result-count" aria-live="polite"></span>
      <button type="button" class="btn-ghost reset" hidden title="${esc(t('resetTitle'))}" data-help="ui.reset">${icons.reset(15)}<span>${t('reset')}</span></button>
      <button type="button" class="btn-ghost lab-entry" data-action="lab" data-help="ui.lab" title="${esc(t('labTitle'))}">${icons.flask(16)}<span>${t('lab')}</span></button>
      <button type="button" class="btn-ghost lab-entry" data-action="sandbox" data-help="ui.sandbox" title="${esc(t('sandboxTitle'))}">${icons.sand(16)}<span>${t('sandbox')}</span></button>
      <button type="button" class="btn-ghost explain-toggle" data-action="explain" data-help="ui.explain" aria-pressed="false" title="${esc(t('explainTitle'))}">${icons.explain(16)}<span>${t('explain')}</span></button>
      <div class="lang" data-help="ui.language">
        <button type="button" class="btn-ghost lang__btn" aria-haspopup="menu" aria-expanded="false" title="${esc(t('language'))}">
          ${icons.globe(16)}<span>${esc(langInfo().short)}</span></button>
        <div class="lang__menu" role="menu" hidden>
          ${LANGS.map((l) => `<button type="button" role="menuitemradio" class="lang__item" data-lang="${l.code}" aria-checked="${l.code === getLang()}">
              <b>${esc(l.short)}</b><span>${esc(l.name)}</span></button>`).join('')}
        </div>
      </div>
      <button type="button" class="btn-icon" data-action="info" data-help="ui.info" title="${esc(t('info'))}">${icons.info(18)}</button>
    </div>`;

  legend.setAttribute('aria-label', t('categoriesGroup'));
  legend.innerHTML = `
    <span class="legend__label">${t('categories')}</span>
    <div class="legend__chips">
      ${CATEGORIES.map(
        (c) => `<button type="button" class="chip" data-cat="${c.key}" aria-pressed="false" style="--c:${c.color}" title="${esc(t('chipTitle', { label: c.label }))}">
            <span class="chip__dot"></span>${esc(c.short)}</button>`,
      ).join('')}
    </div>
    <span class="legend__note">${t('legendNote')}</span>`;

  const input = header.querySelector('#search');
  const hint = header.querySelector('.search__hint');
  const count = header.querySelector('.result-count');
  const reset = header.querySelector('.reset');

  // ---- menu della lingua
  const langBtn = header.querySelector('.lang__btn');
  const langMenu = header.querySelector('.lang__menu');
  const setMenu = (open) => {
    langMenu.hidden = !open;
    langBtn.setAttribute('aria-expanded', String(open));
    if (open) langMenu.querySelector('[aria-checked="true"]')?.focus();
  };
  langBtn.addEventListener('click', () => setMenu(langMenu.hidden));
  langMenu.addEventListener('click', (ev) => {
    const item = ev.target.closest('[data-lang]');
    if (!item) return;
    setMenu(false);
    setLang(item.dataset.lang);
  });
  langMenu.addEventListener('keydown', (ev) => {
    const items = [...langMenu.querySelectorAll('[data-lang]')];
    const i = items.indexOf(document.activeElement);
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      setMenu(false);
      langBtn.focus();
    } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      items[(i + (ev.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    }
  });
  document.addEventListener('pointerdown', (ev) => {
    if (!langMenu.hidden && !ev.target.closest('.lang')) setMenu(false);
  });

  // ---- eventi
  input.addEventListener('input', () => store.set({ query: input.value }));
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      if (onSearchCommit?.(input.value, ev)) return;
      const { best } = computeVisibility(elements, store.get());
      if (best) onOpen(best.z);
    } else if (ev.key === 'Escape') {
      if (input.value) {
        input.value = '';
        store.set({ query: '' });
      } else input.blur();
      ev.stopPropagation();
    }
  });

  header.addEventListener('click', (ev) => {
    const stateBtn = ev.target.closest('[data-state]');
    const blockBtn = ev.target.closest('[data-block]');
    if (stateBtn) store.set({ physState: stateBtn.dataset.state });
    if (blockBtn) {
      const blocks = new Set(store.get().blocks);
      const k = blockBtn.dataset.block;
      blocks.has(k) ? blocks.delete(k) : blocks.add(k);
      store.set({ blocks });
    }
    if (ev.target.closest('.reset')) {
      input.value = '';
      store.set({ ...initialState, categories: new Set(), blocks: new Set(), selectedZ: store.get().selectedZ });
    }
    if (ev.target.closest('[data-action="info"]')) onInfo();
    if (ev.target.closest('[data-action="lab"]')) onLab?.();
    if (ev.target.closest('[data-action="sandbox"]')) onSandbox?.();
  });

  legend.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-cat]');
    if (!chip) return;
    const categories = new Set(store.get().categories);
    const k = chip.dataset.cat;
    categories.has(k) ? categories.delete(k) : categories.add(k);
    store.set({ categories });
  });
  legend.addEventListener('pointerover', (ev) => {
    const chip = ev.target.closest('[data-cat]');
    onCategoryHover(chip ? chip.dataset.cat : null);
  });
  legend.addEventListener('pointerleave', () => onCategoryHover(null));

  // ---- rendering dello stato
  function render(s) {
    header.querySelectorAll('[data-state]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.state === s.physState)));
    header.querySelectorAll('[data-block]').forEach((b) => b.setAttribute('aria-pressed', String(s.blocks.has(b.dataset.block))));
    legend.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(s.categories.has(b.dataset.cat))));
    legend.classList.toggle('has-selection', s.categories.size > 0);

    const active = hasActiveFilters(s);
    const { count: n, best } = computeVisibility(elements, s);
    reset.hidden = !active;
    count.textContent = active ? t('countOf', { n, total: elements.length }) : t('countAll', { total: elements.length });
    count.classList.toggle('is-empty', active && n === 0);

    if (s.query && best) hint.innerHTML = `<kbd>${t('enter')}</kbd> ${esc(best.symbol)} · ${esc(best.name)}`;
    else if (s.query) hint.textContent = t('noResults');
    else hint.textContent = '';
    if (input.value !== s.query) input.value = s.query;
  }
  store.subscribe(render);
  render(store.get());

  return {
    focusSearch() {
      input.focus();
      input.select();
    },
  };
}
