// Test dei dati degli elementi tradotti in inglese (localizeElements lavora una volta per processo): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { _setLangForTests } from '../../src/i18n/index.js';
import { localizeElements } from '../../src/i18n/elements.js';

_setLangForTests('en');
const elements = localizeElements(JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements);
const bySymbol = new Map(elements.map((e) => [e.symbol, e]));

test('inglese: le sigle dei decadimenti sono quelle inglesi (EC, IT, SF)', () => {
  const symbols = new Set(elements.flatMap((e) => e.isotopes.flatMap((i) => i.decay.map((d) => d.symbol))));
  for (const it of ['CE', 'TI', 'FS']) assert.ok(!symbols.has(it), `sigla italiana ${it}`);
  for (const en of ['EC', 'IT', 'SF']) assert.ok(symbols.has(en), `manca ${en}`);
  const at = bySymbol.get('At').isotopes.flatMap((i) => i.decay.map((d) => d.symbol));
  assert.ok(at.includes('EC'), `astato: ${at.join(' ')}`);
});

test('inglese: nomi IUPAC degli elementi (aluminium, caesium, sulfur)', () => {
  assert.equal(bySymbol.get('Al').name, 'Aluminium');
  assert.equal(bySymbol.get('Cs').name, 'Caesium');
  assert.equal(bySymbol.get('S').name, 'Sulfur');
});
