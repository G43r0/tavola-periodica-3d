// Scrittore SMILES: una molecola costruita si copia come SMILES e, incollata (Ctrl+V), torna uguale. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { parseSmiles, writeSmiles } from '../../src/lab/chem/smiles.js';
import { createLibraryIndex, signature } from '../../src/lab/chem/identify.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const lab = createLabElements(elements);
const library = createLibraryIndex(lab, MOLECULES);
const symbolOf = (z) => lab.get(z).symbol;
const write = (smiles) => writeSmiles(parseSmiles(smiles, lab.bySymbol), symbolOf);
const same = (a, b) =>
  signature(a.atoms, a.bonds) === signature(b.atoms, b.bonds) &&
  JSON.stringify(a.atoms.map((x) => `${x.z}${x.charge}`).sort()) ===
    JSON.stringify(b.atoms.map((x) => `${x.z}${x.charge}`).sort());

test('SMILES scritte: idrogeni impliciti, legami, rami, anelli, ioni', () => {
  assert.equal(write('O'), 'O');
  assert.equal(write('CCO'), 'CCO');
  assert.equal(write('C=O'), 'C=O');
  assert.equal(write('[NH4+]'), '[NH4+]');
  assert.equal(write('[Na+].[Cl-]'), '[Na+].[Cl-]');
  assert.equal(write('[H][H]'), '[H][H]');
  assert.match(write('C1=CC=CC=C1'), /^C1=CC=CC=C1$|^C1C=CC=CC=1$|^C=1C=CC=CC=1$/);
  assert.match(write('CC(=O)O'), /^CC\(=O\)O$|^CC\(O\)=O$/);
});

test('andata e ritorno: tutte le sostanze della libreria tornano uguali dalla SMILES scritta', () => {
  const bad = [];
  for (const m of MOLECULES) {
    const g = library.get(m.id).graph;
    const smiles = writeSmiles(g, symbolOf);
    let back = null;
    try {
      back = parseSmiles(smiles, lab.bySymbol);
    } catch (err) {
      bad.push(`${m.id}: ${smiles} (${err.message})`);
      continue;
    }
    if (!same(g, back)) bad.push(`${m.id}: ${smiles}`);
  }
  assert.deepEqual(bad, []);
});
