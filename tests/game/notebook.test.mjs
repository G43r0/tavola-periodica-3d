// Test del quaderno di laboratorio: salvataggio con la versione, prima osservazione, pagine divise nei gruppi del
// catalogo e percentuale scoperta. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry } from '../../src/game/mixture.js';
import { NOTEBOOK_VERSION, emptyNotebook, loadNotebook, recordReaction, notebookPages, percent } from '../../src/game/notebook.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);

test('quaderno: la prima osservazione è nuova, le successive contano soltanto', () => {
  const nb = emptyNotebook();
  assert.equal(recordReaction(nb, 'cat-828', { mode: 'free', aq: true, tags: ['gas'], now: 1000 }), true);
  assert.equal(recordReaction(nb, 'cat-828', { mode: 'career', now: 2000 }), false);
  assert.deepEqual(nb.rx['cat-828'], { first: 1000, count: 2, mode: 'free', aq: true, tags: ['gas'] });
});

test('quaderno: dal salvataggio tiene le voci valide e scarta il resto', () => {
  assert.deepEqual(loadNotebook(null), emptyNotebook());
  assert.deepEqual(loadNotebook('rotto'), emptyNotebook());
  assert.deepEqual(loadNotebook({ v: NOTEBOOK_VERSION + 1, rx: { a: { first: 1 } } }).rx, {}, 'versione futura');
  const nb = loadNotebook({ v: 1, rx: { a: { first: 5, count: 0, mode: 'career', aq: 1, tags: ['gas', 3] }, b: null, c: 'x' } });
  assert.deepEqual(nb.rx, { a: { first: 5, count: 1, mode: 'career', aq: true, tags: ['gas'] } });
  // senza numero di versione (il primo formato) le voci restano
  assert.ok(loadNotebook({ rx: { a: { first: 1 } } }).rx.a);
});

test('quaderno: le 1349 pagine del catalogo nei 14 gruppi, con quelle che il simulatore sa fare', () => {
  const nb = emptyNotebook();
  const pages = notebookPages(ctx, nb);
  assert.equal(pages.groups.length, 14);
  assert.equal(pages.total, 1349);
  assert.equal(pages.found, 0);
  assert.equal(pages.doable, new Set(ctx.rxs.map((rx) => rx.id)).size);
  assert.ok(pages.doable > 1200, `${pages.doable}`);
  for (const g of pages.groups) {
    assert.ok(g.label, g.key);
    assert.equal(g.pages.length, g.total);
    assert.ok(g.doable <= g.total);
  }
  // biochimica: tutte le reazioni le fanno gli organismi viventi (o sono equilibri)
  const bio = pages.groups.find((g) => g.key === 'biochimica');
  assert.equal(bio.doable, 0);
  assert.ok(bio.pages.every((p) => !p.doable));

  recordReaction(nb, 'cat-828');
  recordReaction(nb, 'cat-765');
  const after = notebookPages(ctx, nb);
  assert.equal(after.found, 2);
  assert.equal(percent(after.found, after.doable), 0);
  assert.equal(percent(1, 2), 50);
  assert.equal(percent(0, 0), 0);
});
