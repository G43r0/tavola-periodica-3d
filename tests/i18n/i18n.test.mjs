// Test delle lingue (italiano, inglese, «Spiegamelo come se avessi 6 anni») e del glossario della modalità Spiega: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _setLangForTests, createT } from '../../src/i18n/index.js';
import { entry, wordIndex, shortcut, variants, allKeys } from '../../src/i18n/glossary.js';
import { GLOSSARY_IT } from '../../src/i18n/data/glossary-it.js';
import { GLOSSARY_EN } from '../../src/i18n/data/glossary-en.js';
import { GLOSSARY_ELI6 } from '../../src/i18n/data/glossary-eli6.js';
import { ELEMENTS_EN } from '../../src/i18n/data/elements-en.js';
import { ELEMENTS_ELI6 } from '../../src/i18n/data/elements-eli6.js';
import { MOLECULES_EN } from '../../src/i18n/data/molecules-en.js';
import { BASE_REACTIONS_EN, NOTES_EN, SUBGROUPS_EN } from '../../src/i18n/data/reactions-en.js';
import { LAB_STRINGS } from '../../src/lab/lab-strings.js';
import { SANDBOX_STRINGS } from '../../src/sandbox/sandbox-strings.js';
import { SANDBOX_DESCRIBE } from '../../src/sandbox/describe-strings.js';
import { APPEARANCE_STRINGS } from '../../src/gfx/appearance.js';
import { GAME_STRINGS } from '../../src/game/game-strings.js';
import { CATEGORIES } from '../../src/data/categories.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';
import { REACTIONS } from '../../src/lab/data/reactions.js';

// un testo può essere una stringa o una funzione (quando la frase cambia con i numeri)
const kind = (v) => (Array.isArray(v) ? 'array' : typeof v === 'function' ? 'string' : typeof v);

for (const [name, table] of Object.entries({ LAB_STRINGS, SANDBOX_STRINGS, SANDBOX_DESCRIBE, APPEARANCE_STRINGS, GAME_STRINGS })) {
  test(`${name}: ogni testo italiano ha la sua traduzione inglese dello stesso tipo`, () => {
    for (const [key, value] of Object.entries(table.it)) {
      assert.ok(key in table.en, `${name}.en.${key} mancante`);
      assert.equal(kind(table.en[key]), kind(value), `${name}.en.${key}: tipo diverso`);
    }
  });
  test(`${name}: la versione semplice ridefinisce solo testi che esistono`, () => {
    for (const key of Object.keys(table.eli6 ?? {})) assert.ok(key in table.it, `${name}.eli6.${key} non esiste in italiano`);
  });
}

test('le traduzioni usano i segnaposto {x} dell\'italiano', () => {
  const holes = (s) => [...new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1].toLowerCase()))].sort().join(',');
  for (const [name, table] of Object.entries({ LAB_STRINGS, SANDBOX_STRINGS, SANDBOX_DESCRIBE, APPEARANCE_STRINGS, GAME_STRINGS })) {
    for (const [key, value] of Object.entries(table.it)) {
      if (typeof value !== 'string') continue;
      const en = table.en[key];
      if (typeof en === 'string') assert.equal(holes(en), holes(value), `${name}.en.${key}`);
      // la versione semplice può tralasciare dei dati, ma non usarne di inesistenti
      const simple = table.eli6?.[key];
      if (typeof simple === 'string') for (const h of holes(simple).split(',').filter(Boolean)) assert.ok(holes(value).split(',').includes(h), `${name}.eli6.${key}: {${h}}`);
    }
  }
});

test('createT: la versione semplice ricade sull\'italiano, l\'inglese ha il suo testo', () => {
  const t = createT({ it: { a: 'uno {n}', b: 'due' }, en: { a: 'one {n}', b: 'two' }, eli6: { b: 'due, facile' } });
  _setLangForTests('eli6');
  assert.equal(t('a', { n: 1 }), 'uno 1');
  assert.equal(t('b'), 'due, facile');
  _setLangForTests('en');
  assert.equal(t('a', { n: 2 }), 'one 2');
  _setLangForTests('it');
});

test('dati tradotti: 118 elementi, tutte le sostanze, reazioni e sottogruppi', () => {
  for (let z = 1; z <= 118; z++) {
    assert.ok(ELEMENTS_EN[z]?.o && ELEMENTS_EN[z]?.u?.length, `inglese mancante per Z = ${z}`);
    assert.ok(ELEMENTS_ELI6[z]?.s, `versione semplice mancante per Z = ${z}`);
  }
  for (const m of MOLECULES) assert.ok(MOLECULES_EN[m.id]?.n, `sostanza senza nome inglese: ${m.id}`);
  for (const r of REACTIONS) {
    if (!r.id.startsWith('cat-')) assert.ok(BASE_REACTIONS_EN[r.id], `reazione senza inglese: ${r.id}`);
    else if (r.desc !== `${r.sub}.`) assert.ok(NOTES_EN[r.catalogo], `nota inglese mancante per la reazione n. ${r.catalogo}`);
    assert.ok(SUBGROUPS_EN[r.sub], `sottogruppo senza inglese: ${r.sub}`);
  }
});

test('glossario: ogni voce italiana ha titolo e testo anche in inglese', () => {
  for (const [key, e] of Object.entries(GLOSSARY_IT)) {
    assert.ok(e.t && e.d, `voce italiana incompleta: ${key}`);
    assert.ok(GLOSSARY_EN[key]?.t && GLOSSARY_EN[key]?.d, `voce inglese mancante: ${key}`);
    assert.equal(Boolean(e.k), Boolean(GLOSSARY_EN[key].k), `scorciatoie solo in una lingua: ${key}`);
  }
  for (const key of Object.keys(GLOSSARY_EN)) assert.ok(GLOSSARY_IT[key], `voce inglese senza italiano: ${key}`);
  for (const key of Object.keys(GLOSSARY_ELI6)) assert.ok(GLOSSARY_IT[key], `voce semplice senza italiano: ${key}`);
});

test('glossario: tutti i «vedi anche» portano a una voce esistente', () => {
  for (const code of ['it', 'en', 'eli6']) {
    _setLangForTests(code);
    for (const key of allKeys()) for (const s of entry(key).s ?? []) assert.ok(entry(s), `${code}: ${key} → ${s} non esiste`);
  }
  _setLangForTests('it');
});

test('glossario: ogni data-help usato nell\'interfaccia ha una spiegazione in ogni lingua', () => {
  const files = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walk(path.join(dir, f.name));
      else if (f.name.endsWith('.js')) files.push(path.join(dir, f.name));
    }
  };
  walk(fileURLToPath(new URL('../../src', import.meta.url)));
  const keys = new Set();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/data-help="((?:term|ui|lab|sandbox|viewer|cat)\.[\w.-]+)"/g)) keys.add(m[1]);
    for (const m of src.matchAll(/'((?:term|ui|lab|sandbox|viewer)\.[a-zA-Z][\w.]*)'/g)) keys.add(m[1]);
  }
  // chiavi composte nel codice
  for (const c of CATEGORIES) keys.add(`cat.${c.key}`);
  for (const k of ['proton', 'neutron', 'electron']) keys.add(`term.${k}`);
  for (const k of ['erase', 'heat', 'cool', 'fire', 'spark', 'neutron', 'bomb', 'stir', 'wind', 'equalize', 'extinguish', 'pick']) keys.add(`sandbox.tool.${k}`);
  for (const k of ['brush', 'fill', 'line', 'rect', 'ellipse']) keys.add(`sandbox.mode.${k}`);
  assert.ok(keys.size > 100);
  for (const code of ['it', 'en', 'eli6']) {
    _setLangForTests(code);
    for (const key of keys) {
      const e = entry(key);
      assert.ok(e?.t && e?.d, `${code}: nessuna spiegazione per ${key}`);
    }
  }
  _setLangForTests('it');
});

test('glossario: riconosce parole, plurali e frasi nella lingua scelta', () => {
  _setLangForTests('it');
  const it = wordIndex();
  const find = (w) => variants(w).map((v) => it.get(v)).find(Boolean);
  assert.equal(find('neutroni'), 'term.neutron');
  assert.equal(it.get('gas nobili'), 'cat.noble-gas');
  assert.equal(it.get('punto di fusione'), 'term.meltingPoint');
  assert.equal(find('Elettronegatività'), 'term.electronegativity');
  _setLangForTests('en');
  const en = wordIndex();
  assert.equal(en.get('noble gases'), 'cat.noble-gas');
  assert.equal(variants('isotopes').map((v) => en.get(v)).find(Boolean), 'term.isotope');
  assert.equal(en.get('half-life'), 'term.halfLife');
  _setLangForTests('it');
});

test('scorciatoie: i tasti si spiegano con cosa fanno in ogni parte dell\'app', () => {
  _setLangForTests('it');
  assert.ok(shortcut('F1').rows.length >= 1);
  assert.deepEqual(shortcut('Ctrl + Z').rows.map((r) => r[0]), ['Laboratorio', 'Sandbox']);
  assert.ok(shortcut('[').rows[0][1].includes('pennello'));
  assert.ok(shortcut('Spazio') && shortcut('Esc'));
  assert.equal(shortcut('Ж'), null);
  _setLangForTests('en');
  assert.ok(shortcut('Space').rows.length === 2);
  assert.equal(shortcut('F').title, 'F key');
  _setLangForTests('it');
});
