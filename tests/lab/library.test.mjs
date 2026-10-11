// Test della libreria ampliata, della lettura delle formule e dei nomi generati: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabElements } from '../../src/lab/chem/elements-lab.js';
import { analyzeLewis } from '../../src/lab/chem/lewis.js';
import { createLibraryIndex, formulaKey, covalentParts, unitSignature } from '../../src/lab/chem/identify.js';
import { combine, entryBonds } from '../../src/lab/chem/combine.js';
import { parseFormula } from '../../src/lab/chem/formula.js';
import { binaryCovalentName, linearAlkaneName } from '../../src/lab/chem/naming.js';
import { MOLECULES, MOLECULE_GROUPS } from '../../src/lab/data/molecules.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const lab = createLabElements(elements);
const lib = createLibraryIndex(lab, MOLECULES);
const sym = (s) => lab.bySymbol.get(s).z;
const isSymbol = (s) => lab.bySymbol.has(s);

test('libreria: id unici, strutture distinte, gruppi esistenti', () => {
  assert.equal(new Set(MOLECULES.map((m) => m.id)).size, MOLECULES.length, 'id duplicati');
  const seen = new Map();
  for (const e of lib.entries) {
    const sig = unitSignature(e.graph.atoms, e.graph.bonds, true);
    assert.ok(!seen.has(sig), `${e.id} ha la stessa struttura di ${seen.get(sig)}`);
    seen.set(sig, e.id);
  }
  const groups = new Set(MOLECULE_GROUPS.map((g) => g.key));
  for (const m of MOLECULES) assert.ok(groups.has(m.group), `${m.id}: gruppo ${m.group} inesistente`);
  for (const m of MOLECULES) assert.ok(!m.state || ['gas', 'liquido', 'solido', 'soluzione'].includes(m.state), `${m.id}: stato ${m.state}`);
  assert.ok(MOLECULES.length >= 400);
});

test('libreria: almeno un composto per ogni elemento che ne forma (fino all\'einsteinio)', () => {
  const present = new Set(lib.entries.flatMap((e) => e.graph.atoms.map((a) => a.z)));
  // gas nobili leggeri e radon: nessun composto stabile; astato e francio: mai isolati in quantità visibile
  const none = new Set([2, 10, 18, 85, 86, 87]);
  const missing = [];
  for (let z = 1; z <= 99; z++) if (!none.has(z) && !present.has(z)) missing.push(lab.get(z).symbol);
  assert.deepEqual(missing, []);
});

test('libreria: la formula scritta corrisponde alla struttura', () => {
  for (const e of lib.entries) {
    if (!e.formula) continue;
    const text = e.formula.replace(/[=≡–-]/g, '');
    const r = parseFormula(text, isSymbol);
    assert.ok(r.ok, `${e.id}: formula illeggibile «${e.formula}» (${r.error})`);
    const counts = new Map();
    for (const sp of r.species) for (const [s, n] of sp.counts) counts.set(s, (counts.get(s) || 0) + n * sp.coef);
    const atoms = [...counts].flatMap(([s, n]) => Array.from({ length: n }, () => ({ z: sym(s), charge: 0 })));
    assert.equal(formulaKey(lab, atoms, 0), formulaKey(lab, e.graph.atoms, 0), `${e.id}: ${e.formula}`);
  }
});

test('composti ionici: ogni frammento riceve la sua carica netta dai legami ionici', () => {
  for (const e of lib.entries.filter((x) => x.ionic)) {
    const charge = e.graph.atoms.map(() => 0);
    for (const b of entryBonds(lab, e)) {
      if (!b.ionic) continue;
      charge[b.donor] += b.transfer;
      charge[b.donor === b.i ? b.j : b.i] -= b.transfer;
    }
    for (const f of covalentParts(e.graph.atoms, e.graph.bonds)) {
      const got = f.indices.reduce((s, i) => s + charge[i], 0);
      assert.equal(got, f.charge, `${e.id}: frammento con carica ${f.charge}, legami ionici ${got}`);
    }
  }
  // nel nitrato di potassio l'azoto (carica formale +) non cede elettroni: un solo legame ionico K→O
  const kno3 = lib.get('kno3');
  const ionicBonds = entryBonds(lab, kno3).filter((b) => b.ionic);
  assert.equal(ionicBonds.length, 1);
  assert.equal(kno3.graph.atoms[ionicBonds[0].donor].z, sym('K'));
});

test('Lewis: ioni monoatomici senza elettroni spaiati inventati', () => {
  const lw = (s, q) => analyzeLewis(lab, [{ z: sym(s), charge: q }], []);
  assert.equal(lw('H', -1).radical, 0, 'H⁻ ha una coppia 1s');
  assert.equal(lw('H', 0).radical, 1);
  assert.equal(lw('Pb', 2).radical, 0, 'Pb²⁺: coppia inerte 6s²');
  assert.equal(lw('Sn', 2).radical, 0);
  assert.equal(lw('Cr', 3).radical, 0, 'gli elettroni d non sono radicali di Lewis');
  assert.equal(lw('C', 0).radical, 4, 'simbolo di Lewis del carbonio: 4 elettroni spaiati');
  assert.equal(lw('O', -2).radical, 0);
});

test('Combina usa la libreria ampliata', () => {
  const best = (symbols) => {
    const r = combine(lab, lib, symbols.map(sym));
    return r.ok ? r.entry?.id ?? null : null;
  };
  assert.equal(best(['Fe', 'Cl', 'Cl', 'Cl']), 'fecl3');
  assert.equal(best(['Cu', 'S', 'O', 'O', 'O', 'O']), 'cuso4');
  assert.equal(best(['K', 'N', 'O', 'O', 'O']), 'kno3');
  assert.equal(best(['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S']), 's8');
  const r = combine(lab, lib, ['C', 'C', 'C', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'O'].map(sym));
  assert.deepEqual([r.entry.id, ...r.alternatives.map((e) => e.id)].sort(), ['isopropanolo', 'propan-1-olo']);
});

test('riconoscimento dalla formula per i composti dei metalli', () => {
  // FeCl₃ costruito a mano con legami covalenti: riconosciuto dalla formula
  const atoms = [{ z: sym('Fe'), charge: 0 }, ...[1, 2, 3].map(() => ({ z: sym('Cl'), charge: 0 }))];
  const bonds = [1, 2, 3].map((j) => ({ i: 0, j, order: 1 }));
  const r = lib.identify(atoms, bonds);
  assert.equal(r.entry?.id, 'fecl3');
  assert.equal(r.byFormula, true);
  // le molecole organiche no: isomeri diversi restano distinti
  const dme = lib.identify([{ z: 6, charge: 0 }, { z: 8, charge: 0 }, { z: 6, charge: 0 }, ...Array.from({ length: 6 }, () => ({ z: 1, charge: 0 }))],
    [{ i: 0, j: 1, order: 1 }, { i: 1, j: 2, order: 1 }, ...[3, 4, 5].map((j) => ({ i: 0, j, order: 1 })), ...[6, 7, 8].map((j) => ({ i: 2, j, order: 1 }))]);
  assert.equal(dme.entry?.id, 'dme');
  assert.equal(dme.exact, true);
});

test('ricerca per nome', () => {
  assert.equal(lib.byName('acqua').exact?.id, 'h2o');
  assert.equal(lib.byName('Saccarosio').exact?.id, 'saccarosio');
  assert.equal(lib.byName('aspirina').exact?.id, 'aspirina', 'anche con il nome alternativo');
  assert.equal(lib.byName('cloruro d’argento').exact?.id, 'agcl', 'apostrofo tipografico');
  assert.ok(lib.byName('acido').matches.length >= 5);
});

test('lettura delle formule', () => {
  const one = (t) => {
    const r = parseFormula(t, isSymbol);
    assert.ok(r.ok, `${t}: ${r.error}`);
    return r.species;
  };
  const counts = (sp) => Object.fromEntries(sp.counts);
  assert.deepEqual(counts(one('Ca(OH)2')[0]), { Ca: 1, O: 2, H: 2 });
  assert.deepEqual(counts(one('K4[Fe(CN)6]')[0]), { K: 4, Fe: 1, C: 6, N: 6 });
  assert.deepEqual(counts(one('(NH4)2SO4')[0]), { N: 2, H: 8, S: 1, O: 4 });
  assert.deepEqual(counts(one('H₂SO₄')[0]), { H: 2, S: 1, O: 4 });
  const hyd = one('CuSO4·5H2O')[0];
  assert.equal(hyd.parts.length, 2);
  assert.equal(hyd.parts[1].coef, 5);
  assert.deepEqual(counts(hyd), { Cu: 1, S: 1, O: 9, H: 10 });
  assert.equal(one('CuSO4.5H2O')[0].parts.length, 2);
  const eq = one('2 H2 + O2');
  assert.deepEqual(eq.map((s) => s.coef), [2, 1]);
  assert.deepEqual(one('H2+O2').map((s) => s.pretty), ['H₂', 'O₂']);
  for (const [t, q] of [['NH4+', 1], ['SO4^2-', -2], ['SO4(2-)', -2], ['SO4 2-', -2], ['SO₄²⁻', -2], ['SO4-2', -2], ['Fe3+', 3], ['O2-', -2], ['H+', 1]]) {
    assert.equal(one(t)[0].charge, q, t);
  }
  assert.equal(one('Fe3+')[0].counts.get('Fe'), 1, 'Fe3+ è uno ione ferro(III), non Fe₃⁺');
  assert.equal(one('NH4+ Cl-').length, 2);
  assert.ok(one('CC')[0].suspicious, 'CC sembra uno SMILES (etano)');
  assert.ok(!one('CH3COOH')[0].parts);
  for (const bad of ['nacl', 'Xy2', 'Ca(OH', 'H2O)', '']) assert.equal(parseFormula(bad, isSymbol).ok, false, bad);
  assert.equal(parseFormula('2H2 + O2 -> 2H2O', isSymbol).note, 'equation');
});

test('nomi sistematici delle molecole binarie', () => {
  const name = (pairs) => binaryCovalentName(new Map(pairs.map(([s, n]) => [lab.bySymbol.get(s), n])));
  assert.equal(name([['Si', 1], ['Br', 4]]), 'Tetrabromuro di silicio');
  assert.equal(name([['N', 2], ['O', 3]]), 'Triossido di diazoto');
  assert.equal(name([['P', 4], ['O', 6]]), 'Esossido di tetrafosforo');
  assert.equal(name([['C', 1], ['O', 1]]), 'Monossido di carbonio');
  assert.equal(name([['H', 1], ['Cl', 1]]), 'Cloruro di idrogeno');
  assert.equal(name([['S', 1], ['F', 6]]), 'Esafluoruro di zolfo');
  assert.equal(name([['O', 1], ['F', 2]]), 'Difluoruro di ossigeno');
  assert.equal(name([['C', 2], ['H', 6]]), null, 'gli idrocarburi hanno nomi propri');
});

test('Combina: sali con ioni noti, alcani lunghi, più unità uguali', () => {
  const charges = (symbols) => {
    const r = combine(lab, lib, symbols.map(sym));
    assert.ok(r.ok, symbols.join(''));
    assert.equal(r.source, 'ions', symbols.join(''));
    return r.salt.graph.atoms.filter((a) => lab.get(a.z).metal).map((a) => `${lab.get(a.z).symbol}${a.charge}`).sort();
  };
  const expand = (formula) => {
    const [sp] = parseFormula(formula, isSymbol).species;
    return [...sp.counts].flatMap(([s, n]) => Array(n).fill(s));
  };
  // Fe₂(SO₄)₃, Mn₂O₃ e BaO₂ sono voci della libreria: le stesse regole si provano con sali che non lo sono
  assert.deepEqual(charges(expand('Co2(SO4)3')), ['Co3', 'Co3']);
  assert.deepEqual(charges(expand('KAl(SO4)2')), ['Al3', 'K1']);
  assert.deepEqual(charges(expand('(NH4)2Fe(SO4)2')), ['Fe2']);
  assert.deepEqual(charges(expand('Pb3O4')), ['Pb2', 'Pb2', 'Pb4']);
  assert.deepEqual(charges(expand('V2O3')), ['V3', 'V3'], 'ossido, non perossido');
  assert.deepEqual(charges(expand('SrO2')), ['Sr2'], 'perossido di stronzio');
  assert.deepEqual(charges(expand('FeBr3')), ['Fe3']);
  for (const [formula, id] of [['Fe2(SO4)3', 'fe2so43'], ['Mn2O3', 'mn2o3'], ['BaO2', 'bao2']]) {
    assert.equal(combine(lab, lib, expand(formula).map(sym)).entry?.id, id, formula);
  }
  // alogenuri con cariche alte: molecole, non sali
  assert.notEqual(combine(lab, lib, expand('WF6').map(sym)).source, 'ions');
  // alcano lineare oltre la ricerca automatica
  const dodecano = combine(lab, lib, expand('C12H26').map(sym));
  assert.equal(dodecano.source, 'alkane');
  const atoms = expand('C12H26').map((s) => ({ z: sym(s) }));
  assert.equal(linearAlkaneName(atoms, dodecano.bonds), 'Dodecano');
  // 2 Na + 2 Cl: due unità di cloruro di sodio
  const two = combine(lab, lib, ['Na', 'Na', 'Cl', 'Cl'].map(sym));
  assert.equal(two.entry.id, 'nacl');
  assert.equal(two.copies, 2);
});

test('una formula ionica resta una sola unità; copie della stessa voce restano separate', () => {
  const units = (symbols) => {
    const zs = symbols.map(sym);
    const r = combine(lab, lib, zs);
    const parent = zs.map((_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (const b of r.bonds) parent[find(b.i)] = find(b.j);
    return new Set(zs.map((_, i) => find(i))).size;
  };
  const expand = (formula) => [...parseFormula(formula, isSymbol).species[0].counts].flatMap(([s, n]) => Array(n).fill(s));
  assert.equal(units(expand('(NH4)2Fe(SO4)2')), 1, 'sale di Mohr');
  assert.equal(units(expand('Pb3O4')), 1);
  assert.equal(units(expand('KAl(SO4)2')), 1);
  assert.equal(units(['Ca', 'Ca', 'Cl', 'Cl', 'Cl', 'Cl']), 2, '2 CaCl₂');
});
