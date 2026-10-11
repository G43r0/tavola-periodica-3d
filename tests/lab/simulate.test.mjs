// Test della simulazione delle reazioni («Simula reazione»): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { createLibraryIndex, displayFormula } from '../../src/lab/chem/identify.js';
import { speciesInfo, reactionEnthalpy } from '../../src/lab/chem/reactions.js';
import { planReactions, diagnose, modelReaction, graphBondEnergy, libraryProduct } from '../../src/lab/chem/simulate.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';
import { REACTIONS, BASE_REACTIONS } from '../../src/lab/data/reactions.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const lab = createLabElements(elements);
const lib = createLibraryIndex(lab, MOLECULES);

// reazioni caricate come in lab-view.js
const reactions = REACTIONS.map((r) => {
  const load = (list) =>
    list.map(([, key]) => {
      const sp = speciesInfo(lab, lib, elements, key);
      sp.display = sp.formula ?? displayFormula(lab, sp.atoms, 0, { ionic: sp.ionic });
      return sp;
    });
  const re = { r, reactants: load(r.reactants), products: load(r.products), rc: r.reactants.map(([c]) => c), pc: r.products.map(([c]) => c) };
  re.enthalpy = reactionEnthalpy(lab, re.reactants, re.products, re.rc, re.pc);
  return re;
});

const inv = (obj) => new Map(Object.entries(obj));
const plan = (obj, opts) => planReactions(inv(obj), reactions, opts);
const ids = (p) => p.steps.map((s) => `${s.re.r.id}×${s.times}`);

test('reagenti nelle proporzioni giuste: la reazione avviene e non avanza nulla', () => {
  const p = plan({ h2: 2, o2: 1 });
  assert.deepEqual(ids(p), ['acqua×1']);
  assert.equal(p.leftover.size, 0);
  assert.ok(p.dH < -570);
  assert.deepEqual(ids(plan({ h2: 4, o2: 2 })), ['acqua×2']);
  assert.deepEqual(ids(plan({ ch4: 1, o2: 2 })), ['metano×1']);
});

test('reagente limitante e reagente in eccesso', () => {
  const p = plan({ h2: 3, o2: 1 });
  assert.deepEqual(ids(p), ['acqua×1']);
  assert.deepEqual([...p.leftover], [['h2', 1]]);
  const q = plan({ ch4: 1, o2: 5 });
  assert.deepEqual(ids(q), ['metano×1']);
  assert.deepEqual([...q.leftover], [['o2', 3]]);
});

test('poco ossigeno: combustione incompleta; ossigeno sufficiente: completa', () => {
  assert.deepEqual(ids(plan({ 'el:C': 2, o2: 1 })), ['co×1']);
  assert.deepEqual(ids(plan({ 'el:C': 1, o2: 1 })), ['co2×1']);
  assert.deepEqual(ids(plan({ 'el:C': 2, o2: 2 })), ['co2×2']);
});

test('reazioni a catena: i prodotti di un passo reagiscono nel successivo', () => {
  // N₂ + 3 H₂ → 2 NH₃, poi NH₃ + HCl → NH₄Cl
  const p = plan({ n2: 1, h2: 3, hcl: 2 });
  assert.deepEqual(ids(p), ['haber×1', 'nh4cl×2']);
  assert.equal(p.leftover.size, 0);
  assert.deepEqual(p.steps.map((s) => s.onlyOrig), [true, false], 'NH₄Cl si forma solo dopo l\'ammoniaca');
  // reazioni indipendenti: possono avvenire insieme
  const q = plan({ ch4: 1, o2: 3, h2: 2 });
  assert.deepEqual(ids(q).sort(), ['acqua×1', 'metano×1']);
  assert.ok(q.steps.every((s) => s.onlyOrig));
});

test('le reazioni endotermiche avvengono solo fornendo energia, senza tornare indietro', () => {
  assert.deepEqual(ids(plan({ h2o: 2 })), []);
  const d = diagnose(inv({ h2o: 2 }), reactions);
  assert.ok(d.endothermic.some((re) => re.r.id === 'elettrolisi'));
  const p = plan({ h2o: 2 }, { energy: true });
  assert.deepEqual(ids(p), ['elettrolisi×1'], 'idrogeno e ossigeno non si ricombinano subito in acqua');
  // passo successivo della simulazione: l'inversa della reazione appena avvenuta è esclusa
  const elettrolisi = reactions.find((re) => re.r.id === 'elettrolisi');
  assert.deepEqual(ids(plan({ h2: 2, o2: 1 }, { energy: true, exclude: [elettrolisi] })), []);
  // calcare scaldato, poi la calce viva reagisce con l'acqua e l'acqua di calce riassorbe la CO₂ (ciclo della calce)
  assert.deepEqual(ids(plan({ caco3: 1, h2o: 1 }, { energy: true })), ['calcare×1', 'calce×1', 'cat-578×1']);
  assert.deepEqual(ids(plan({ caco3: 2, h2o: 1 }, { energy: true })).slice(0, 2), ['calcare×2', 'calce×1']);
});

test('reazioni che richiedono altro: la fermentazione non avviene senza lieviti', () => {
  assert.deepEqual(ids(plan({ glucosio: 1, h2o: 1 })), []);
  assert.deepEqual(ids(plan({ glucosio: 1, h2o: 1 }, { energy: true })), []);
  assert.ok(diagnose(inv({ glucosio: 1, h2o: 1 }), reactions).needs.some((re) => re.r.id === 'fermentazione'));
  // con l'ossigeno il glucosio brucia
  assert.deepEqual(ids(plan({ glucosio: 1, o2: 6 })), ['respirazione×1']);
});

test('nessuna reazione: indica che cosa manca', () => {
  const d = diagnose(inv({ h2: 1, o2: 1 }), reactions);
  const acqua = d.missing.find((m) => m.re.r.id === 'acqua');
  assert.ok(acqua, 'la sintesi dell\'acqua è quasi pronta');
  assert.deepEqual(acqua.lack.map((x) => [x.key, x.count]), [['h2', 1]]);
  assert.equal(diagnose(inv({ co2: 1, n2: 1 }), reactions).missing.length, 0);
});

// ---------------------------------------------------------------- modello

/** Specie per il modello da una voce della libreria (come fa lab-view.js con le molecole sul banco). */
function species(id, count = 1) {
  const e = lib.get(id);
  return { key: id, count, zs: e.graph.atoms.map((a) => a.z), hf: e.hf ?? null, bondKj: e.ionic ? null : graphBondEnergy(lab, e.graph.atoms, e.graph.bonds, { tabulated: true }) };
}
// il modello prevede ciò che la libreria non sa: con tutto il catalogo molte addizioni sono già reazioni note,
// quindi gli esempi si provano con le sole reazioni scritte a mano (le altre ricadono nel ramo «la libreria sa già»)
const handWritten = new Set(BASE_REACTIONS.map((r) => r.id));
const model = (...list) => modelReaction(lab, lib, list, reactions.filter((re) => handWritten.has(re.r.id)));
const modelAll = (...list) => modelReaction(lab, lib, list, reactions);

test('modello: le reazioni del catalogo hanno la precedenza sul modello', () => {
  assert.equal(modelAll(species('h2'), species('br2')), null, 'H₂ + Br₂ → HBr è nel catalogo');
  assert.equal(modelAll(species('no2', 2)), null, '2 NO₂ ⇌ N₂O₄ è nel catalogo');
  assert.ok(model(species('h2'), species('br2')), 'senza il catalogo il modello lo prevede');
});

test('modello: sintesi per addizione con un prodotto della libreria', () => {
  const hbr = model(species('h2'), species('br2'));
  assert.equal(hbr.product.entry.id, 'hbr');
  assert.equal(hbr.product.copies, 2);
  assert.ok(hbr.dH < -40, `H₂ + Br₂: ${hbr.dH}`);

  const acid = model(species('so3'), species('h2o'));
  assert.equal(acid.product.entry.id, 'h2so4');
  assert.equal(acid.method, 'formation');
  assert.ok(Math.abs(acid.dH - (-814 + 441 + 285.83)) < 0.01);

  const etilene = model(species('c2h2'), species('h2'));
  assert.equal(etilene.product.entry.id, 'c2h4');
});

test('modello: niente reazione se i prodotti non sono più stabili o la libreria sa già come reagiscono', () => {
  assert.equal(model(species('co2'), species('h2o')), null, 'CO₂ + H₂O restano tali');
  assert.equal(model(species('h2o', 2)), null, 'due molecole d\'acqua non reagiscono');
  assert.equal(model(species('h2'), species('o2')), null, 'H₂ + O₂ non dà H₂O₂: per l\'acqua servono 2 H₂');
  assert.equal(model(species('c2h4'), species('o2')), null, 'combustione dell\'etilene: servono 3 O₂');
  assert.equal(model(species('hcl'), species('o2')), null, 'niente HClO₂: l\'energia del legame Cl=O è solo stimata');
});

test('modello: addizioni con legami di energia nota', () => {
  const dimero = model(species('no2', 2));
  assert.equal(dimero?.product.entry.id, 'n2o4', '2 NO₂ → N₂O₄');
  assert.equal(dimero.method, 'bonds');
  assert.equal(model(species('co'), species('cl2'))?.product.entry.id, 'fosgene', 'CO + Cl₂ → COCl₂');
});

test('prodotto della libreria con tutti gli atomi', () => {
  const z = (s) => lab.bySymbol.get(s).z;
  assert.equal(libraryProduct(lab, lib, [z('H'), z('H'), z('O')]).entry.id, 'h2o');
  assert.deepEqual(
    (({ entry, copies }) => [entry.id, copies])(libraryProduct(lab, lib, [z('H'), z('H'), z('Cl'), z('Cl')])),
    ['hcl', 2],
  );
  assert.equal(libraryProduct(lab, lib, [z('He'), z('Ne')]), null);
});
