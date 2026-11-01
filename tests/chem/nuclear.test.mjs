// Test dei nuclei (chem/nuclear.js): gli isotopi che il visualizzatore 3D propone. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { viewerIsotopes, shortHalfLife, bindingPerNucleon } from '../../src/chem/nuclear.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const bySymbol = new Map(elements.map((el) => [el.symbol, el]));
const labels = (sym) => viewerIsotopes(bySymbol.get(sym).isotopes).map((i) => i.label);

test("visualizzatore 3D: un isotopo per numero di neutroni, anche quando in natura c'è solo l'isomero", () => {
  // il tantalio naturale è ¹⁸¹Ta e ¹⁸⁰ᵐTa (lo stato fondamentale ¹⁸⁰Ta dura poche ore e non è nei dati)
  assert.deepEqual(labels('Ta'), ['180m', '181']);
  // ⁹⁹ᵐTc ha gli stessi neutroni di ⁹⁹Tc: resta solo lo stato fondamentale
  assert.deepEqual(labels('Tc'), ['97', '98', '99']);
  for (const el of elements) {
    const list = viewerIsotopes(el.isotopes);
    const n = list.map((i) => i.neutrons);
    assert.equal(new Set(n).size, n.length, `${el.symbol}: neutroni ripetuti`);
    assert.deepEqual(
      [...new Set(el.isotopes.map((i) => i.neutrons))].sort((a, b) => a - b),
      [...n].sort((a, b) => a - b),
      `${el.symbol}: manca un nucleo`,
    );
  }
});

test('emivita abbreviata del visualizzatore: Ma e Ga, non «milioni di a»', () => {
  assert.equal(shortHalfLife('2,6 milioni di anni', ' a'), '2,6 Ma');
  assert.equal(shortHalfLife('4,468 miliardi di anni', ' a'), '4,468 Ga');
  assert.equal(shortHalfLife('2.6 million years', ' y'), '2.6 Ma');
  assert.equal(shortHalfLife('1.25 billion years', ' y'), '1.25 Ga');
  assert.equal(shortHalfLife('5730 anni', ' a'), '5730 a');
  assert.equal(shortHalfLife('1,08 × 10¹⁴ anni', ' a'), '1,08 × 10¹⁴ a');
  assert.equal(shortHalfLife('8,02 giorni', ' a'), '8,02 giorni');
});

test('energia di legame dei nuclei: misurata (AME2020) anche oltre A = 22', () => {
  for (const [z, a, mev] of [
    [26, 56, 8.79],
    [28, 62, 8.795],
    [26, 58, 8.792],
    [50, 120, 8.505],
    [82, 208, 7.868],
    [92, 235, 7.591],
    [92, 238, 7.57],
    [94, 239, 7.56],
  ]) {
    const b = bindingPerNucleon(z, a);
    assert.equal(b.measured, true, `${z}-${a}`);
    assert.ok(Math.abs(b.mev - mev) < 0.001, `${z}-${a}: ${b.mev}`);
  }
  // il confronto vero tra i nuclei più legati
  assert.ok(bindingPerNucleon(28, 62).mev > bindingPerNucleon(26, 58).mev);
  assert.ok(bindingPerNucleon(26, 58).mev > bindingPerNucleon(26, 56).mev);
  // dove manca la misura resta la formula semiempirica
  assert.equal(bindingPerNucleon(118, 300)?.measured ?? false, false);
});
