// Test della copertura delle reazioni: quante reazioni del catalogo si fanno nel simulatore con i reagenti dello
// scaffale e dell'armadio, gruppo per gruppo (aggiungendo o togliendo reagenti la copertura non deve scendere sotto
// questi minimi). npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry } from '../../src/game/mixture.js';
import { reachable, keysOf, reagentKey } from '../../src/game/coverage.js';
import { SHELF, CABINET } from '../../src/game/reagents.js';
import { reagentLook } from '../../src/game/stock.js';
import { DEFS } from '../../src/game/items.js';
import { GHS_IDS } from '../../src/game/ghs.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);

test('armadio: ogni reagente è una sostanza nota, con contenitore, tappo ed etichetta (al massimo 3 pittogrammi)', () => {
  for (const [k, r] of Object.entries(CABINET)) {
    assert.ok(!(k in SHELF), `${k} è già sullo scaffale`);
    assert.ok(ctx.id(reagentKey(r)), `${k}: sostanza sconosciuta ${reagentKey(r)}`);
    if (r.molar) assert.ok(r.molar > 0 && r.molar <= 2, `${k}: ${r.molar} M`);
    const look = reagentLook(ctx, r);
    assert.ok(DEFS[look.kind]?.stock, `${k}: ${look.kind}`);
    assert.ok(look.ghs.length <= 3 && look.ghs.every((g) => GHS_IDS.includes(g)), `${k}: ${look.ghs}`);
    assert.equal(look.curated, false, `${k}: i pericoli dell'armadio sono dedotti dai dati`);
  }
  assert.ok(Object.keys(CABINET).length >= 45);
});

test('copertura: lo scaffale da solo e con l\'armadio, per gruppo', () => {
  const shelf = reachable(ctx, keysOf(SHELF));
  const all = reachable(ctx, keysOf(SHELF, CABINET));
  assert.ok(shelf.ids.size >= 130, `scaffale: ${shelf.ids.size}`);
  assert.ok(all.ids.size >= 360, `scaffale e armadio: ${all.ids.size}`);
  const min = {
    'acidi-basi': 90, precipitazioni: 45, redox: 45, spostamento: 34, decomposizioni: 30, 'sintesi-elementi': 28,
    acqua: 14, metallurgia: 15, organica: 15, combustioni: 13,
  };
  for (const [g, n] of Object.entries(min)) assert.ok((all.byGroup.get(g) ?? 0) >= n, `${g}: ${all.byGroup.get(g) ?? 0} < ${n}`);
  // ogni reazione realizzabile è del simulatore (con il calore, la fiamma e la lampada del laboratorio)
  const doable = new Set(ctx.rxs.map((rx) => rx.id));
  for (const id of all.ids) assert.ok(doable.has(id), id);
});

test('copertura: le reazioni classiche della scuola ci sono', () => {
  const all = reachable(ctx, keysOf(SHELF, CABINET));
  const has = (re) => [...all.ids].some((id) => {
    const rx = ctx.rxById.get(id);
    const side = (l) => l.map((x) => ctx.formula(x.sid)).sort().join('+');
    return re.test(`${side(rx.reactants)}>${side(rx.products)}`);
  });
  assert.ok(has(/^HCl\+Zn>H₂\+ZnCl₂$/), 'Zn + HCl');
  assert.ok(has(/AgNO₃.*NaCl>AgCl/), 'AgNO₃ + NaCl');
  assert.ok(has(/BaCl₂.*>BaSO₄/), 'BaSO₄');
  assert.ok(has(/^H₂O₂>/), 'H₂O₂ con MnO₂');
  assert.ok(has(/CuSO₄\+Zn>Cu\+ZnSO₄/), 'Zn + CuSO₄');
  assert.ok(has(/H₂O\+K>/), 'K + H₂O');
  assert.ok(has(/CaCO₃.*HCl/), 'CaCO₃ + HCl');
});

test('copertura: senza la lampada le reazioni con la luce non si fanno', () => {
  const lit = reachable(ctx, ['agcl']);
  const dark = reachable(ctx, ['agcl'], { light: false });
  assert.ok(lit.ids.size > dark.ids.size);
});
