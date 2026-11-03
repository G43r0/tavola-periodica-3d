// Ricerca per formula uguale ovunque: «CuSO4» = «CuSO₄», «Na+» = «Na⁺» (esempi e reazioni del laboratorio, sandbox,
// magazzino del simulatore, libro). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalize } from '../../src/chem/format.js';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { createLibraryIndex, displayFormula, normalizeName, librarySearchText } from '../../src/lab/chem/identify.js';
import { speciesInfo, reactionEnthalpy } from '../../src/lab/chem/reactions.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';
import { REACTIONS } from '../../src/lab/data/reactions.js';
import { reactionResultsHtml } from '../../src/lab/reaction-panel.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const lab = createLabElements(elements);
const library = createLibraryIndex(lab, MOLECULES);

test('normalize e normalizeName: pedici, apici e meno tipografico come cifre e segni', () => {
  for (const fn of [normalize, normalizeName]) {
    assert.equal(fn('CuSO₄'), fn('CuSO4'));
    assert.equal(fn('Na⁺'), fn('Na+'));
    assert.equal(fn('SO₄²⁻'), fn('SO42-'));
    assert.equal(fn('Cl−'), fn('Cl-'));
    assert.equal(fn('Ossido di ALLUMINIO'), fn('ossido di alluminio'));
  }
});

test('esempi del laboratorio: si trovano con la formula scritta in tutti i modi, ioni compresi', () => {
  const finds = (id, q) => librarySearchText(lab, library.get(id)).includes(normalizeName(q));
  for (const q of ['CuSO4', 'CuSO₄', 'solfato di rame']) assert.ok(finds('cuso4', q), q);
  for (const q of ['Na+', 'Na⁺']) assert.ok(finds('ione-sodio', q), q);
  for (const q of ['CH4', 'CH₄', 'metano']) assert.ok(finds('ch4', q), q);
  assert.ok(finds('tetraamminorame', '[Cu(NH3)4]2+'));
  assert.ok(!finds('cuso4', 'Na+'));
});

test('reazioni del laboratorio: CH₄ e CH4 trovano le stesse reazioni', () => {
  const loaded = REACTIONS.map((r) => {
    const load = (list) =>
      list.map(([, key]) => {
        const sp = speciesInfo(lab, library, elements, key);
        sp.display = sp.formula ?? displayFormula(lab, sp.atoms, 0, { ionic: sp.ionic });
        return sp;
      });
    const re = {
      r,
      reactants: load(r.reactants),
      products: load(r.products),
      rc: r.reactants.map(([c]) => c),
      pc: r.products.map(([c]) => c),
    };
    re.enthalpy = reactionEnthalpy(lab, re.reactants, re.products, re.rc, re.pc);
    return re;
  });
  const html = (query) => reactionResultsHtml(loaded, { query, open: new Set() });
  assert.match(html('CH₄'), /\d+ reazioni trovate/);
  assert.equal(html('CH₄'), html('CH4'));
  assert.equal(html('CuSO₄'), html('CuSO4'));
});
