// Test della ricerca e dei filtri della tavola (state/query.js, state/store.js). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeVisibility } from '../../src/state/query.js';
import { initialState, hasActiveFilters } from '../../src/state/store.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const state = (query) => ({ ...initialState, categories: new Set(), blocks: new Set(), query });

test('ricerca: un testo di soli spazi è come la ricerca vuota (tutti gli elementi, nessun filtro attivo)', () => {
  for (const query of [' ', '   ', '\t']) {
    const { count, best } = computeVisibility(elements, state(query));
    assert.equal(count, 118, JSON.stringify(query));
    assert.equal(best, null);
    assert.equal(hasActiveFilters(state(query)), false, JSON.stringify(query));
  }
});

test('ricerca: gli spazi attorno al testo non cambiano il risultato', () => {
  const { best, count } = computeVisibility(elements, state('  26 '));
  assert.equal(best.symbol, 'Fe');
  assert.equal(count, 1);
  assert.equal(hasActiveFilters(state(' fe ')), true);
});
