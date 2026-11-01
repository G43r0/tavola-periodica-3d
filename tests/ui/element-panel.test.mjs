// Test della scheda dell'elemento (sezioni HTML pure, senza DOM): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chemicalSection, qualityBanner, estimateMarkers, structureSection, basicSection } from '../../src/ui/element-panel.js';
import { _setLangForTests } from '../../src/i18n/index.js';
import { CATEGORY } from '../../src/data/categories.js';
import { GLOSSARY_IT } from '../../src/i18n/data/glossary-it.js';
import { GLOSSARY_EN } from '../../src/i18n/data/glossary-en.js';
import { GLOSSARY_ELI6 } from '../../src/i18n/data/glossary-eli6.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const bySymbol = new Map(elements.map((e) => [e.symbol, e]));
const chem = (sym) => {
  const el = bySymbol.get(sym);
  const { est, approx } = estimateMarkers(el);
  return chemicalSection(el, est, approx);
};

test('dati: elettronegatività stimata per Pm, Eu, Tb, Yb e affinità misurate per Ca, Sr, Ba, Lu, Hf', () => {
  for (const s of ['Pm', 'Eu', 'Tb', 'Yb']) {
    const el = bySymbol.get(s);
    assert.ok(el.electronegativity > 0.7 && el.electronegativity < 1.5, `${s}: ${el.electronegativity}`);
    assert.ok(el.estimated.includes('en'), `${s} non segnata come stima`);
  }
  for (const s of ['Ca', 'Sr', 'Ba', 'Lu', 'Hf']) assert.ok(bySymbol.get(s).electronAffinityEv > 0, s);
  for (const s of ['He', 'Be', 'N', 'Ne', 'Mg', 'Ar', 'Zn', 'Xe', 'Hg']) assert.equal(bySymbol.get(s).anionUnbound, true, s);
  assert.equal(bySymbol.get('Cl').anionUnbound, undefined);
});

test('scheda: l\'elettronegatività stimata ha l\'etichetta «stima» e la tilde', () => {
  const html = chem('Eu');
  const row = html.match(/<div class="row" data-help="term\.electronegativity">.*?<\/div>/s)[0];
  assert.match(row, /tag--est/);
  assert.match(row, /~1,2/);
  assert.doesNotMatch(chem('Fe').match(/<div class="row" data-help="term\.electronegativity">.*?<\/div>/s)[0], /tag--est|~/);
});

test('scheda: anione instabile al posto della riga mancante dell\'affinità elettronica', () => {
  assert.match(chem('N'), /term\.electronAffinity.*anione instabile/s);
  assert.doesNotMatch(chem('Pm'), /term\.electronAffinity/);
  assert.match(chem('Ca'), /term\.electronAffinity.*0,025 eV/s);
});

test('scheda: il riquadro delle stime nomina l\'elettronegatività', () => {
  assert.match(qualityBanner(bySymbol.get('Yb')), /elettronegatività/);
});

test('periodo e gusci: il palladio è nel periodo 5 ma ha 4 gusci, e scheda e glossario non dicono il contrario', () => {
  assert.deepEqual(elements.filter((e) => e.shells.length !== e.period).map((e) => e.symbol), ['Pd']);
  const pd = bySymbol.get('Pd');
  const fe = bySymbol.get('Fe');
  const { est } = estimateMarkers(pd);
  assert.match(structureSection(pd, est), /psec__note.*5s/s);
  assert.doesNotMatch(structureSection(fe, estimateMarkers(fe).est), /psec__note/);
  // prima: «il numero del periodo è il numero di gusci occupati», senza eccezioni
  for (const g of [GLOSSARY_IT, GLOSSARY_EN, GLOSSARY_ELI6]) assert.match(g['term.period'].d, /pallad/i);
  _setLangForTests('eli6');
  try {
    assert.match(basicSection(fe, CATEGORY[fe.category], {}), /quanti «strati» di elettroni ha/);
    assert.doesNotMatch(basicSection(pd, CATEGORY[pd.category], {}), /quanti «strati» di elettroni ha/);
  } finally {
    _setLangForTests('it');
  }
});
