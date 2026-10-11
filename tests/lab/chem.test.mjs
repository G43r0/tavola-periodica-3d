// Test del motore chimico del laboratorio: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { analyzeLewis } from '../../src/lab/chem/lewis.js';
import { parseSmiles } from '../../src/lab/chem/smiles.js';
import { createRelaxer, angleAt, vsepr, initialLayout } from '../../src/lab/chem/geometry.js';
import { createLibraryIndex, formulaKey, displayFormula } from '../../src/lab/chem/identify.js';
import { combine } from '../../src/lab/chem/combine.js';
import { checkBond, checkOrder } from '../../src/lab/chem/bonding.js';
import { Bench } from '../../src/lab/chem/molecule.js';
import { MOLECULES } from '../../src/lab/data/molecules.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const lab = createLabElements(elements);
const lib = createLibraryIndex(lab, MOLECULES);
const sym = (s) => lab.bySymbol.get(s).z;

function shape(smiles, { geo = null, steps = 2000 } = {}) {
  const g = parseSmiles(smiles, lab.bySymbol);
  const lw = analyzeLewis(lab, g.atoms, g.bonds);
  const pos = initialLayout(lab, { atoms: g.atoms, bonds: g.bonds, ionic: [] });
  const r = createRelaxer(lab, { atoms: g.atoms, bonds: g.bonds, ionic: [] }, lw.atoms, pos, geo);
  r.run(steps);
  const centre = r.neighbors.reduce((best, nb, i) => (nb.length > r.neighbors[best].length ? i : best), 0);
  const nb = r.neighbors[centre].map((x) => x.k);
  const angles = [];
  for (let p = 0; p < nb.length; p++) for (let q = p + 1; q < nb.length; q++) angles.push(angleAt(pos, centre, nb[p], nb[q]));
  return { g, lw, pos, angles: angles.sort((a, b) => a - b), vs: vsepr(lab, g, lw)[centre] };
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

test('la libreria si legge tutta e le formule sono corrette', () => {
  assert.equal(lib.entries.length, MOLECULES.length);
  const f = (id) => formulaKey(lab, lib.get(id).graph.atoms, lib.get(id).charge);
  assert.equal(f('h2o'), 'H2O');
  assert.equal(f('etanolo'), 'C2H6O');
  assert.equal(f('glucosio'), 'C6H12O6');
  assert.equal(f('nh4'), 'H4N(1)');
  assert.equal(f('so4'), 'O4S(-2)');
  assert.equal(f('al2o3'), 'Al2O3');
  assert.equal(displayFormula(lab, lib.get('nacl').graph.atoms, 0, { ionic: true }), 'NaCl');
  assert.equal(displayFormula(lab, lib.get('h2so4').graph.atoms), 'H₂SO₄');
  assert.equal(displayFormula(lab, lib.get('nh3').graph.atoms), 'NH₃');
});

test('ogni voce della libreria ha una struttura di Lewis coerente', () => {
  const radicals = new Set(['no', 'no2', 'clo2']);
  const incomplete = new Set(['bf3', 'becl2']);
  for (const e of lib.entries) {
    for (const part of splitParts(e.graph)) {
      const lw = analyzeLewis(lab, part.atoms, part.bonds);
      assert.equal(lw.invalid, null, `${e.id}: ${lw.invalid}`);
      if (!radicals.has(e.id)) assert.equal(lw.radical, 0, `${e.id} non dovrebbe essere radicale`);
      if (!incomplete.has(e.id) && !radicals.has(e.id) && part.atoms.length > 1) assert.equal(lw.incomplete.length, 0, `${e.id}: ottetto incompleto`);
      // la somma delle cariche formali è la carica del frammento
      assert.equal(lw.atoms.reduce((s, a) => s + a.formalCharge, 0), lw.charge, e.id);
    }
  }
});

function splitParts(g) {
  const parent = g.atoms.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const b of g.bonds) parent[find(b.i)] = find(b.j);
  const groups = new Map();
  g.atoms.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) || []), i]));
  return [...groups.values()].map((idx) => {
    const m = new Map(idx.map((v, k) => [v, k]));
    return { atoms: idx.map((i) => g.atoms[i]), bonds: g.bonds.filter((b) => m.has(b.i)).map((b) => ({ i: m.get(b.i), j: m.get(b.j), order: b.order })) };
  });
}

test('Lewis: coppie solitarie, cariche formali, radicali', () => {
  const water = shape('O').lw;
  assert.equal(water.atoms[0].lonePairs, 2);
  assert.equal(water.atoms[0].formalCharge, 0);
  const nh4 = shape('[NH4+]').lw;
  assert.equal(nh4.atoms[0].formalCharge, 1);
  assert.equal(nh4.atoms[0].lonePairs, 0);
  const co = shape('[C-]#[O+]').lw;
  assert.deepEqual(co.atoms.map((a) => a.formalCharge), [-1, 1]);
  const no = shape('[N]=O').lw;
  assert.equal(no.radical, 1);
  assert.equal(no.atoms[0].unpaired, 1, 'l\'elettrone spaiato sta sull\'azoto');
  const xef2 = shape('F[Xe]F').lw;
  assert.equal(xef2.atoms[1].lonePairs, 3);
  // CO₂ disegnato con legami singoli: il carbonio resta con l'ottetto incompleto
  const co2single = analyzeLewis(lab, [{ z: 8, charge: 0 }, { z: 6, charge: 0 }, { z: 8, charge: 0 }], [{ i: 0, j: 1, order: 1 }, { i: 1, j: 2, order: 1 }]);
  assert.deepEqual(co2single.incomplete, [1]);
  // atomo di cloro isolato: 7 elettroni, uno spaiato
  const cl = analyzeLewis(lab, [{ z: 17, charge: 0 }], []);
  assert.equal(cl.radical, 1);
  assert.equal(analyzeLewis(lab, [{ z: 17, charge: -1 }], []).radical, 0);
});

test('VSEPR: forme e angoli', () => {
  const ch4 = shape('C');
  assert.equal(ch4.vs.shape, 'tetraedrica');
  assert.ok(ch4.angles.every((a) => near(a, 109.47, 0.6)), `CH₄ ${ch4.angles}`);

  const nh3 = shape('N');
  assert.equal(nh3.vs.notation, 'AX3E1');
  assert.ok(nh3.angles.every((a) => a < 109.4 && a > 100), `NH₃ ${nh3.angles}`);

  const h2o = shape('O');
  assert.equal(h2o.vs.shape, 'piegata');
  assert.ok(h2o.angles[0] < nh3.angles[0], 'l\'acqua è più chiusa dell\'ammoniaca (due coppie solitarie)');
  const h2oExp = shape('O', { geo: lib.get('h2o').geo });
  assert.ok(near(h2oExp.angles[0], 104.5, 0.3), `H₂O sperimentale ${h2oExp.angles[0]}`);

  assert.ok(near(shape('O=C=O').angles[0], 180, 1), 'CO₂ lineare');
  assert.ok(shape('FB(F)F').angles.every((a) => near(a, 120, 1)), 'BF₃ trigonale');
  assert.ok(near(shape('F[Xe]F').angles[0], 180, 1.5), 'XeF₂ lineare');

  const sf6 = shape('FS(F)(F)(F)(F)F');
  assert.equal(sf6.angles.filter((a) => near(a, 90, 2)).length, 12);
  assert.equal(sf6.angles.filter((a) => near(a, 180, 2)).length, 3);

  const xef4 = shape('F[Xe](F)(F)F');
  assert.equal(xef4.vs.shape, 'quadrato planare');
  assert.equal(xef4.angles.filter((a) => near(a, 90, 3)).length, 4, `XeF₄ ${xef4.angles}`);
  assert.equal(xef4.angles.filter((a) => near(a, 180, 3)).length, 2, `XeF₄ ${xef4.angles}`);

  const pcl5 = shape('ClP(Cl)(Cl)(Cl)Cl');
  assert.equal(pcl5.angles.filter((a) => near(a, 120, 3)).length, 3, `PCl₅ ${pcl5.angles}`);
  assert.equal(pcl5.angles.filter((a) => near(a, 90, 3)).length, 6, `PCl₅ ${pcl5.angles}`);

  const sf4 = shape('FS(F)(F)F');
  assert.equal(sf4.vs.shape, 'ad altalena');
  assert.ok(sf4.angles.at(-1) > 160, `SF₄: angolo assiale ${sf4.angles}`);

  const clf3 = shape('F[Cl](F)F');
  assert.equal(clf3.vs.shape, 'a T');
  assert.ok(clf3.angles.at(-1) > 160 && clf3.angles[0] < 100, `ClF₃ ${clf3.angles}`);
});

test('cicloesano: anello piegato (angoli vicini a 109,5°)', () => {
  const { pos } = shape('C1CCCCC1', { steps: 3000 });
  const ring = [0, 1, 2, 3, 4, 5].map((c) => angleAt(pos, c, (c + 5) % 6, (c + 1) % 6));
  assert.ok(ring.every((a) => a > 105 && a < 114), `angoli dell'anello ${ring.map((a) => a.toFixed(1))}`);
});

test('molecole planari: etilene e benzene', () => {
  for (const smi of ['C=C', 'C1=CC=CC=C1']) {
    const { pos } = shape(smi);
    // piano dei primi tre atomi di carbonio (o C, C, H)
    const [a, b, c] = [pos[0], pos[1], pos[2]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n);
    const maxDev = Math.max(...pos.map((p) => Math.abs(((p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1] + (p[2] - a[2]) * n[2]) / l)));
    assert.ok(maxDev < 0.08, `${smi} non planare (scarto ${maxDev.toFixed(3)})`);
  }
});

test('riconoscimento indipendente dall\'ordine degli atomi', () => {
  const atoms = [{ z: 1, charge: 0 }, { z: 6, charge: 0 }, { z: 1, charge: 0 }, { z: 8, charge: 0 }, { z: 1, charge: 0 }, { z: 6, charge: 0 }, { z: 1, charge: 0 }, { z: 1, charge: 0 }, { z: 1, charge: 0 }];
  // H3C–CH2–OH scritto in ordine sparso
  const bonds = [[1, 0], [1, 2], [1, 6], [1, 5], [5, 7], [5, 8], [5, 3], [3, 4]].map(([i, j]) => ({ i, j, order: 1 }));
  const r = lib.identify(atoms, bonds);
  assert.equal(r.entry?.id, 'etanolo');
  assert.equal(r.exact, true);
  // stesso scheletro, ordini diversi: CO₂ con legami singoli è riconosciuto ma non esatto
  const co2 = lib.identify([{ z: 8, charge: 0 }, { z: 6, charge: 0 }, { z: 8, charge: 0 }], [{ i: 0, j: 1, order: 1 }, { i: 1, j: 2, order: 1 }]);
  assert.equal(co2.entry?.id, 'co2');
  assert.equal(co2.exact, false);
});

function combineIds(symbols) {
  const zs = symbols.map(sym);
  const r = combine(lab, lib, zs);
  if (!r.ok) return { r, names: [] };
  // ricostruisce le unità e le riconosce
  const parent = zs.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const b of r.bonds) parent[find(b.i)] = find(b.j);
  const units = new Map();
  zs.forEach((_, i) => units.set(find(i), [...(units.get(find(i)) || []), i]));
  const names = [...units.values()].map((idx) => {
    const m = new Map(idx.map((v, k) => [v, k]));
    const charge = new Array(idx.length).fill(0);
    const bonds = [];
    for (const b of r.bonds) {
      if (!m.has(b.i)) continue;
      if (b.ionic) {
        charge[m.get(b.donor)] += b.transfer;
        charge[m.get(b.donor === b.i ? b.j : b.i)] -= b.transfer;
      } else bonds.push({ i: m.get(b.i), j: m.get(b.j), order: b.order });
    }
    const atoms = idx.map((i, k) => ({ z: zs[i], charge: charge[k] }));
    const id = lib.identify(atoms, bonds);
    return id.exact ? id.entry.id : formulaKey(lab, atoms, 0);
  });
  return { r, names: names.sort() };
}

test('Combina: dalla libreria e con la ricerca', () => {
  assert.deepEqual(combineIds(['H', 'H', 'O']).names, ['h2o']);
  assert.deepEqual(combineIds(['H', 'H']).names, ['h2']);
  assert.deepEqual(combineIds(['C', 'H', 'H', 'H', 'H']).names, ['ch4']);
  assert.deepEqual(combineIds(['N', 'H', 'H', 'H']).names, ['nh3']);
  assert.deepEqual(combineIds(['C', 'O', 'O']).names, ['co2']);
  assert.deepEqual(combineIds(['Na', 'Cl']).names, ['nacl']);
  assert.deepEqual(combineIds(['Na', 'Na', 'O']).names, ['na2o']);
  assert.deepEqual(combineIds(['Mg', 'Cl', 'Cl']).names, ['mgcl2']);
  const ethanol = combineIds(['C', 'C', 'H', 'H', 'H', 'H', 'H', 'H', 'O']);
  assert.deepEqual(ethanol.names, ['etanolo']);
  assert.deepEqual(ethanol.r.alternatives.map((e) => e.id), ['dme']);
});

test('Combina: casi non in libreria', () => {
  assert.deepEqual(combineIds(['H', 'H', 'H', 'H', 'O', 'O']).names, ['h2o', 'h2o'], '2 H₂ + O₂ → 2 H₂O');
  const r3 = combineIds(['H', 'H', 'H', 'O']);
  assert.equal(r3.r.unpaired, 1);
  assert.deepEqual(r3.names, ['H', 'h2o'], '3 H + O → H₂O + H');
  assert.deepEqual(combineIds(['Na', 'Na', 'Cl', 'Cl']).names, ['nacl', 'nacl']);
  assert.deepEqual(combineIds(['Ca', 'C', 'O', 'O', 'O']).names, ['caco3']);
  assert.deepEqual(combineIds(['N', 'N', 'H', 'H', 'H', 'H', 'H', 'H']).names, ['nh3', 'nh3']);
  assert.deepEqual(combineIds(['P', 'Cl', 'Cl', 'Cl', 'Cl', 'Cl']).names, ['pcl5']);
  assert.equal(combineIds(['He', 'Ne']).r.ok, false);
  assert.equal(combineIds(['Na', 'K']).r.ok, false);
});

test('regole dei legami sul banco', () => {
  const bench = new Bench();
  const h1 = bench.addAtom(1);
  const h2 = bench.addAtom(1);
  const h3 = bench.addAtom(1);
  assert.equal(checkBond(bench, lab, h1, h2).ok, true);
  bench.addBond(h1, h2);
  const r = checkBond(bench, lab, h2, h3);
  assert.equal(r.ok, false);
  assert.match(r.reason, /idrogeno/);

  const ne = bench.addAtom(10);
  assert.match(checkBond(bench, lab, ne, h3).reason, /gas nobile/);

  const na = bench.addAtom(11);
  const cl = bench.addAtom(17);
  const ionic = checkBond(bench, lab, na, cl);
  assert.equal(ionic.kind, 'ionic');
  assert.equal(ionic.transfer, 1);
  bench.addBond(na, cl, { ionic: true, transfer: 1, donor: na });
  assert.equal(bench.atomCharge(na), 1);
  assert.equal(bench.atomCharge(cl), -1);
  const cl2 = bench.addAtom(17);
  assert.match(checkBond(bench, lab, na, cl2).reason, /ceduto/);

  const c = bench.addAtom(6);
  const o = bench.addAtom(8);
  const bond = bench.addBond(c, o);
  assert.equal(checkOrder(bench, lab, bond, 2).ok, true);
  assert.equal(checkOrder(bench, lab, bond, 3).ok, true);
  const hh = bench.bondBetween(h1, h2).id;
  assert.equal(checkOrder(bench, lab, hh, 2).ok, false);
});
