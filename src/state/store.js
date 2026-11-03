// Store minimale con sottoscrizioni: unica fonte di verità per filtri, ricerca e selezione.

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      const prev = state;
      state = { ...state, ...next };
      listeners.forEach((fn) => fn(state, prev));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const initialState = {
  query: '',
  categories: new Set(), // vuoto = tutte
  physState: 'all',
  blocks: new Set(), // vuoto = tutti
  selectedZ: null,
  hoveredZ: null,
};

export function hasActiveFilters(s) {
  return s.query.trim() !== '' || s.categories.size > 0 || s.physState !== 'all' || s.blocks.size > 0;
}
