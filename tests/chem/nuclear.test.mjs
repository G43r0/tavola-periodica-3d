// Test dei nuclei (chem/nuclear.js): gli isotopi che il visualizzatore 3D propone. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { viewerIsotopes } from '../../src/chem/nuclear.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const bySymbol = new Map(elements.map((el) => [el.symbol, el]));
const labels = (sym) => viewerIsotopes(bySymbol.get(sym).isotopes).map((i) => i.label);

test('visualizzatore 3D: un isotopo per numero di neutroni, anche quando in natura c\'è solo l\'isomero', () => {
  // il tantalio naturale è ¹⁸¹Ta e ¹⁸⁰ᵐTa (lo stato fondamentale ¹⁸⁰Ta dura poche ore e non è nei dati)
  assert.deepEqual(labels('Ta'), ['180m', '181']);
  // ⁹⁹ᵐTc ha gli stessi neutroni di ⁹⁹Tc: resta solo lo stato fondamentale
  assert.deepEqual(labels('Tc'), ['97', '98', '99']);
  for (const el of elements) {
    const list = viewerIsotopes(el.isotopes);
    const n = list.map((i) => i.neutrons);
    assert.equal(new Set(n).size, n.length, `${el.symbol}: neutroni ripetuti`);
    assert.deepEqual([...new Set(el.isotopes.map((i) => i.neutrons))].sort((a, b) => a - b), [...n].sort((a, b) => a - b), `${el.symbol}: manca un nucleo`);
  }
});
