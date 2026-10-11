// Barra superiore (ricerca, filtri per stato e blocco) e legenda/filtro per categoria.
import { CATEGORIES, STATES, BLOCKS } from '../data/categories.js';
import { computeVisibility } from '../state/query.js';
import { hasActiveFilters, initialState } from '../state/store.js';
import { esc } from '../chem/format.js';
import { icons } from './icons.js';

export function createToolbar(header, legend, elements, store, { onOpen, onInfo, onLab, onCategoryHover }) {
  header.innerHTML = `
    <div class="brand">
      <span class="brand__logo">${icons.atom(26)}</span>
      <div class="brand__text">
        <h1>Tavola Periodica</h1>
        <p>Laboratorio interattivo degli elementi</p>
      </div>
    </div>

    <div class="search" role="search">
      <span class="search__icon">${icons.search(17)}</span>
      <input id="search" class="search__input" type="search" autocomplete="off" spellcheck="false"
             placeholder="Nome, simbolo o numero…" aria-label="Cerca un elemento per nome, simbolo o numero atomico" />
      <span class="search__hint" aria-live="polite"></span>
      <kbd class="search__kbd">/</kbd>
    </div>

    <div class="filter-group" role="group" aria-label="Stato fisico a 25 °C">
      <span class="filter-group__label">Stato a 25 °C</span>
      <div class="segmented">
        ${STATES.map(
          (s) => `<button type="button" class="segmented__btn" data-state="${s.key}" aria-pressed="false" title="${s.label}">
              ${s.icon ? icons[s.icon](14) : ''}<span>${s.label}</span></button>`,
        ).join('')}
      </div>
    </div>

    <div class="filter-group" role="group" aria-label="Blocco">
      <span class="filter-group__label">Blocco</span>
      <div class="segmented segmented--blocks">
        ${BLOCKS.map(
          (b) => `<button type="button" class="segmented__btn" data-block="${b.key}" aria-pressed="false" title="${b.label}: ${b.hint}">${b.key}</button>`,
        ).join('')}
      </div>
    </div>

    <div class="toolbar__end">
      <span class="result-count" aria-live="polite"></span>
      <button type="button" class="btn-ghost reset" hidden title="Azzera ricerca e filtri">${icons.reset(15)}<span>Azzera</span></button>
      <button type="button" class="btn-ghost lab-entry" data-action="lab" title="Laboratorio molecolare: collega gli atomi e costruisci molecole">${icons.flask(16)}<span>Laboratorio</span></button>
      <button type="button" class="btn-icon" data-action="info" title="Fonti dei dati e guida">${icons.info(18)}</button>
    </div>`;

  legend.innerHTML = `
    <span class="legend__label">Categorie</span>
    <div class="legend__chips">
      ${CATEGORIES.map(
        (c) => `<button type="button" class="chip" data-cat="${c.key}" aria-pressed="false" style="--c:${c.color}" title="${c.label} — clic per filtrare">
            <span class="chip__dot"></span>${esc(c.short)}</button>`,
      ).join('')}
    </div>
    <span class="legend__note">Bordo tratteggiato = proprietà in gran parte previste</span>`;

  const input = header.querySelector('#search');
  const hint = header.querySelector('.search__hint');
  const count = header.querySelector('.result-count');
  const reset = header.querySelector('.reset');

  // ---- eventi
  input.addEventListener('input', () => store.set({ query: input.value }));
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
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
    count.textContent = active ? `${n} di ${elements.length}` : `${elements.length} elementi`;
    count.classList.toggle('is-empty', active && n === 0);

    if (s.query && best) hint.innerHTML = `<kbd>Invio</kbd> ${esc(best.symbol)} · ${esc(best.name)}`;
    else if (s.query) hint.textContent = 'Nessun risultato';
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
