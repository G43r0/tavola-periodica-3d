// Test delle reazioni: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { createLibraryIndex } from '../../src/lab/chem/identify.js';
import { speciesInfo, balance, reactionEnthalpy, balanceTable } from '../../src/lab/chem/reactions.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';
import { REACTIONS, REACTION_GROUPS } from '../../src/lab/data/reactions.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const lab = createLabElements(elements);
const lib = createLibraryIndex(lab, MOLECULES);
const sp = (key) => speciesInfo(lab, lib, elements, key);

function load(r) {
  const reactants = r.reactants.map(([, k]) => sp(k));
  const products = r.products.map(([, k]) => sp(k));
  return { reactants, products, rc: r.reactants.map(([c]) => c), pc: r.products.map(([c]) => c) };
}

test('ogni reazione è bilanciata e i coefficienti sono i minimi interi', () => {
  assert.ok(REACTIONS.length >= 40);
  for (const r of REACTIONS) {
    assert.ok(REACTION_GROUPS.some((g) => g.key === r.group), r.id);
    const { reactants, products, rc, pc } = load(r);
    for (const row of balanceTable(reactants, products, rc, pc)) assert.equal(row.left, row.right, `${r.id}: Z=${row.z}`);
    const b = balance(reactants, products);
    assert.equal(b.ok, true, `${r.id}: ${b.reason}`);
    assert.deepEqual(b.reactants, rc, `${r.id} reagenti`);
    assert.deepEqual(b.products, pc, `${r.id} prodotti`);
  }
});

test('ogni specie delle reazioni ha l\'entalpia di formazione', () => {
  for (const r of REACTIONS) {
    const { reactants, products, rc, pc } = load(r);
    const h = reactionEnthalpy(lab, reactants, products, rc, pc);
    assert.deepEqual(h.formation.missing, [], r.id);
  }
});

test('ΔH° dalle entalpie di formazione (valori noti)', () => {
  const dh = (id) => {
    const { reactants, products, rc, pc } = load(REACTIONS.find((x) => x.id === id));
    return reactionEnthalpy(lab, reactants, products, rc, pc).formation.value;
  };
  const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
  assert.ok(near(dh('acqua'), -571.66), `acqua ${dh('acqua')}`);
  assert.ok(near(dh('haber'), -91.88), `Haber ${dh('haber')}`);
  assert.ok(near(dh('metano'), -890.3), `metano ${dh('metano')}`);
  assert.ok(near(dh('propano'), -2219.2, 2), `propano ${dh('propano')}`);
  assert.ok(near(dh('etanolo'), -1366.9, 2), `etanolo ${dh('etanolo')}`);
  assert.ok(near(dh('respirazione'), -2802.7, 2), `respirazione ${dh('respirazione')}`);
  assert.ok(near(dh('fotosintesi'), 2802.7, 2), `fotosintesi ${dh('fotosintesi')}`);
  assert.ok(near(dh('calcare'), 179.2), `calcare ${dh('calcare')}`);
  assert.ok(near(dh('termite'), -851.5), `termite ${dh('termite')}`);
  assert.ok(near(dh('polvere-nera'), -572.0), `polvere nera ${dh('polvere-nera')}`);
  assert.ok(near(dh('no'), 182.6), `NO ${dh('no')}`);
  assert.ok(near(dh('ammoniaca-dec'), 91.88), 'reazione inversa: ΔH opposto');
});

test('stima dalle energie di legame', () => {
  const { reactants, products, rc, pc } = load(REACTIONS.find((x) => x.id === 'acqua'));
  const h = reactionEnthalpy(lab, reactants, products, rc, pc);
  // 2 H–H + O=O rotti, 4 O–H formati: 2·436 + 498 − 4·463 = −482 kJ (acqua gassosa)
  assert.equal(h.bonds.value, 2 * 436 + 498 - 4 * 463);
  assert.equal(h.bonds.broken.get('H–H'), 2);
  assert.equal(h.bonds.formed.get('H–O'), 4);
  // con solidi ionici o metalli la stima per legami non si applica
  const na = load(REACTIONS.find((x) => x.id === 'nacl'));
  assert.equal(reactionEnthalpy(lab, na.reactants, na.products, na.rc, na.pc).bonds, null);
});

test('bilanciamento di equazioni scritte senza coefficienti', () => {
  const b = (r, p) => balance(r.map(sp), p.map(sp));
  assert.deepEqual(b(['el:Al', 'o2'], ['al2o3']), { ok: true, reactants: [4, 3], products: [2] });
  assert.deepEqual(b(['c2h6', 'o2'], ['co2', 'h2o']), { ok: true, reactants: [2, 7], products: [4, 6] });
  assert.deepEqual(b(['glucosio', 'o2'], ['co2', 'h2o']), { ok: true, reactants: [1, 6], products: [6, 6] });
  assert.equal(b(['h2'], ['h2o']).ok, false, 'manca l\'ossigeno');
});
