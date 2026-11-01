// I numeri del README devono restare quelli dei dati (prima 81 termini, 47 reagenti dell'armadio...): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GLOSSARY_IT } from '../../src/i18n/data/glossary-it.js';
import { SHELF, CABINET } from '../../src/game/reagents.js';
import { createLabChemistry } from '../../src/game/mixture.js';
import { reachable, keysOf } from '../../src/game/coverage.js';
import { TUTORIAL } from '../../src/game/tutorial.js';
import { TOOL_PAGES, TECHNIQUE_PAGES } from '../../src/game/data/book-pages.js';
import VERIFIED from '../../src/game/data/book-verified.js';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { createLibraryIndex } from '../../src/lab/chem/identify.js';
import { speciesInfo, reactionEnthalpy } from '../../src/lab/chem/reactions.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';
import { REACTIONS, REACTION_GROUPS, BASE_REACTIONS } from '../../src/lab/data/reactions.js';
import { FORMATION_ENTHALPIES } from '../../src/lab/data/formation-enthalpies.js';
import { createSubstances } from '../../src/sandbox/substances.js';
import { World } from '../../src/sandbox/world.js';

const readme = fs.readFileSync(new URL('../../README.md', import.meta.url), 'utf8').replace(/\r?\n\s*/g, ' ');
const source = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const elements = JSON.parse(source('src/data/elements.json')).elements;

/** Il numero che nel README segue il testo `before` (gli asterischi del grassetto non contano). */
function numberAfter(before) {
  const m = readme.replace(/\*\*/g, '').match(new RegExp(`${before} (\\d+)`));
  assert.ok(m, `README: manca «${before} N»`);
  return Number(m[1]);
}
/** Tutti i numeri che nel README precedono la parola (anche in grassetto: «**88 termini**»). */
const numbersBefore = (words) =>
  [...readme.replace(/\*\*/g, '').matchAll(new RegExp(`\\b(\\d+) ${words}`, 'g'))].map((m) => Number(m[1]));

test('README: termini del glossario, sostanze, entalpie e reazioni scritte a mano', () => {
  assert.deepEqual(numbersBefore('termini'), [Object.keys(GLOSSARY_IT).filter((k) => k.startsWith('term.')).length]);
  for (const n of numbersBefore('sostanze(?! comuni)')) assert.equal(n, MOLECULES.length);
  assert.equal(numberAfter('entalpie di formazione di'), Object.keys(FORMATION_ENTHALPIES).length);
  // il pannello Reazioni del laboratorio mostra tutto il catalogo (prima il README diceva «47 reazioni in 5 gruppi»)
  assert.match(
    readme.replace(/\*\*/g, ''),
    new RegExp(
      `Reazioni nella barra del laboratorio: le ${REACTIONS.length} reazioni del catalogo in ${REACTION_GROUPS.length} gruppi`,
    ),
  );
  assert.equal(numberAfter('con la ricerca;'), BASE_REACTIONS.length);
  for (const n of numbersBefore('reazioni(?! (in|del|usano))')) assert.equal(n, REACTIONS.length);
});

test('README: pagine del libro «Come si fa» (strumenti, tecniche, sicurezza)', () => {
  // prima «strumenti (24)», nel gioco 26
  const inParens = (words) => Number(readme.match(new RegExp(`${words} \\((\\d+)`))?.[1]);
  assert.equal(inParens('le pagine degli strumenti'), Object.keys(TOOL_PAGES).length);
  assert.equal(inParens('delle tecniche'), Object.keys(TECHNIQUE_PAGES).length);
});

test('README: ΔH°, ricette del libro, quaderno e tutorial', () => {
  const lab = createLabElements(elements);
  const lib = createLibraryIndex(lab, MOLECULES);
  const sp = (k) => speciesInfo(lab, lib, elements, k);
  const withDH = REACTIONS.filter(
    (r) =>
      reactionEnthalpy(
        lab,
        r.reactants.map(([, k]) => sp(k)),
        r.products.map(([, k]) => sp(k)),
        r.reactants.map(([c]) => c),
        r.products.map(([c]) => c),
      ).formation.value !== null,
  ).length;
  assert.equal(numberAfter('danno il ΔH° a'), withDH);
  assert.equal(numberAfter('le ricette di'), Object.keys(VERIFIED).length);
  assert.equal(numberAfter('tutorial ha'), TUTORIAL.length);
  assert.match(
    readme.replace(/\*\*/g, ''),
    new RegExp(`le ${REACTIONS.length} pagine sono divise nei ${REACTION_GROUPS.length} gruppi`),
  );
});

test("README e commenti: reagenti dell'armadio e reazioni che si fanno nel simulatore", () => {
  assert.deepEqual(numbersBefore("reagenti d'uso"), [Object.keys(CABINET).length]);
  const ctx = createLabChemistry(elements);
  const shelf = reachable(ctx, keysOf(SHELF)).ids.size;
  const all = reachable(ctx, keysOf(SHELF, CABINET)).ids.size;
  assert.equal(numberAfter('si possono fare'), all);
  assert.deepEqual(numbersBefore('con il solo scaffale'), [shelf]);
  assert.equal(numberAfter('scoperta tra le'), new Set(ctx.rxs.map((rx) => rx.id)).size);
  // il commento sopra CABINET non ripete i numeri (diceva 383 e 144, il README 504 e 317)
  assert.doesNotMatch(source('src/game/reagents.js'), /se ne\s+(\*\s+)?fanno \d+/);
});

test('README: reazioni del catalogo nella sandbox (motore, regole «a mano», escluse)', () => {
  const chem = new World(createSubstances(elements), 4, 4).chem;
  const off = chem.list.filter((rx) => rx.disabled);
  const rules = off.filter((rx) => rx.disabled.startsWith('regola:')).length;
  assert.equal(numberAfter('nitrometano\\)\\.'), chem.list.length - off.length);
  assert.match(readme, new RegExp(`reazioni usano il motore del catalogo, ${rules} coincidono con le regole`));
  assert.equal(numberAfter('restano escluse, con il motivo, solo'), off.length - rules);
});
