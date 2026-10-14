// Test dei reagenti del magazzino del simulatore: contenitore, famiglia (colore del tappo), pittogrammi GHS e
// avvertenza dell'etichetta. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLabChemistry } from '../../src/game/mixture.js';
import { SHELF, LIGHT_SENSITIVE } from '../../src/game/reagents.js';
import { reagentLook, familyOf, FAMILIES, FAMILY_ORDER, STRONG_OXIDIZERS } from '../../src/game/stock.js';
import { GHS, GHS_IDS, SIGNAL } from '../../src/game/ghs.js';
import { DEFS } from '../../src/game/items.js';
import { GAME_STRINGS } from '../../src/game/game-strings.js';
import { S } from '../../src/sandbox/substances.js';

const elements = JSON.parse(fs.readFileSync(new URL('../../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const look = (r) => reagentLook(ctx, r);

test('pittogrammi GHS: i nove del regolamento CLP, con il nome nelle tre lingue e un disegno', () => {
  assert.deepEqual(GHS_IDS, ['GHS01', 'GHS02', 'GHS03', 'GHS04', 'GHS05', 'GHS06', 'GHS07', 'GHS08', 'GHS09']);
  for (const id of GHS_IDS) {
    for (const lang of ['it', 'en', 'eli6']) assert.ok(GHS[id].name[lang], `${id} ${lang}`);
    assert.ok(GHS[id].parts.length > 0, id);
    for (const p of GHS[id].parts) assert.ok(p.fill || (p.stroke && p.d), `${id}: parte senza tracciato`);
  }
  assert.deepEqual(Object.keys(SIGNAL), ['danger', 'warning']);
});

test('scaffale: ogni reagente ha i pericoli della scheda di sicurezza (pittogrammi, frasi H, avvertenza)', () => {
  for (const [k, r] of Object.entries(SHELF)) {
    assert.ok(Array.isArray(r.ghs), `${k}: pittogrammi mancanti`);
    for (const g of r.ghs) assert.ok(GHS_IDS.includes(g), `${k}: ${g}`);
    for (const h of r.h) assert.match(h, /^H\d{3}[A-Za-z]*$/, `${k}: ${h}`);
    assert.equal(r.ghs.length > 0, Boolean(r.signal), `${k}: avvertenza solo se ci sono pittogrammi`);
    assert.equal(r.h.length > 0, r.ghs.length > 0, `${k}: frasi H e pittogrammi insieme`);
    const l = look(r);
    assert.ok(l.curated);
    assert.ok(DEFS[l.kind]?.stock, `${k}: contenitore ${l.kind}`);
    assert.ok(FAMILIES[l.family], `${k}: famiglia ${l.family}`);
  }
  // alcuni valori delle schede: HCl 1 M è solo corrosivo per i metalli; NaOH 1 M corrode la pelle
  assert.deepEqual(look(SHELF.hcl1).h, ['H290']);
  assert.equal(look(SHELF.hcl1).signal, 'warning');
  assert.equal(look(SHELF.naoh1).signal, 'danger');
  assert.deepEqual(look(SHELF.nacl).ghs, []);
  assert.deepEqual(look(SHELF.ethanol).ghs, ['GHS02', 'GHS07']);
});

test('contenitori: vetro chiaro, ambrato per ciò che la luce decompone, plastica per basi forti e HF', () => {
  const kinds = {
    water: 'washbottle', php: 'dropper', hcl1: 'bottleClear', naoh1: 'bottlePE', agno3: 'bottle', ki01: 'bottle',
    nacl: 'jarGlass', cuso4: 'jarGlass', zn: 'jarGlass', ethanol: 'bottleClear',
  };
  for (const [k, kind] of Object.entries(kinds)) assert.equal(look(SHELF[k]).kind, kind, k);
  assert.equal(look({ solid: 'naoh' }).kind, 'jar');
  assert.equal(look({ solid: 'kmno4' }).kind, 'jarAmber');
  assert.equal(look({ solid: 'i2' }).kind, 'jarAmber');
  assert.equal(look({ solute: 'hf', molar: 1 }).kind, 'bottlePE');
  assert.equal(look({ liquid: 'h2o2' }).kind, 'bottle');
  for (const k of [...LIGHT_SENSITIVE, ...STRONG_OXIDIZERS]) assert.ok(ctx.id(k), `sostanza sconosciuta: ${k}`);
});

test('famiglie: acidi, basi, sali (anche i carbonati), ossidanti solidi, metalli, organici', () => {
  const fam = (k, form) => familyOf(ctx, ctx.id(k), form);
  assert.equal(fam('hcl', 'solution'), 'acid');
  assert.equal(fam('acido-acetico', 'solution'), 'acid');
  assert.equal(fam('naoh', 'solution'), 'base');
  assert.equal(fam('nh3', 'solution'), 'base');
  assert.equal(fam('nacl'), 'salt');
  assert.equal(fam('nahco3'), 'salt');
  assert.equal(fam('na2co3'), 'salt');
  assert.equal(fam('kmno4'), 'oxidizer');
  assert.equal(fam('kmno4', 'solution'), 'oxidizer');
  assert.equal(fam('kno3'), 'oxidizer');
  assert.equal(fam('pbno32', 'solution'), 'salt');
  assert.equal(fam('Zn'), 'metal');
  assert.equal(fam('etanolo', 'liquid'), 'organic');
  assert.equal(fam('glucosio'), 'organic');
  assert.equal(fam('S'), 'inorganic');
  for (const f of FAMILY_ORDER) assert.ok(FAMILIES[f], f);
});

test('pericoli dedotti dai dati per le altre sostanze del magazzino', () => {
  const g = (r) => look(r).ghs;
  assert.deepEqual(g({ solid: 'Na' }), ['GHS02', 'GHS05']);
  assert.deepEqual(g({ solid: 'glucosio' }), []);
  assert.ok(g({ solid: 'tnt' }).includes('GHS01'));
  assert.ok(g({ liquid: 'acetone' }).includes('GHS02'));
  assert.ok(g({ solid: 'kno3' }).includes('GHS03'));
  assert.ok(g({ solute: 'hno3', molar: 1 }).includes('GHS05'));
  assert.ok(g({ solid: 'hgcl2' }).includes('GHS06'));
  assert.ok(g({ solid: 'kcn' }).includes('GHS06'));
  assert.ok(g({ solid: 'k2cr2o7' }).includes('GHS08'));
  assert.ok(g({ solid: 'cocl2-6h2o' }).includes('GHS09'));
  assert.deepEqual(g({ solute: 'nacl', molar: 1 }), []);
  assert.deepEqual(g({ solute: 'naoh', molar: 0.05 }), [], 'base molto diluita: niente pittogrammi');
  assert.equal(look({ solute: 'hno3', molar: 0.5 }).signal, 'warning');
  assert.equal(look({ solid: 'glucosio' }).signal, null);
  assert.equal(look({ solid: 'tnt' }).curated, false);
});

test('magazzino del Laboratorio libero: ogni sostanza ha contenitore, tappo ed etichetta (al massimo 3 pittogrammi)', () => {
  let n = 0;
  for (const e of ctx.subs.library.entries) {
    const sid = ctx.subs.libraryId.get(e.id);
    const s = ctx.sub(sid);
    if (!s || s.flags & S.AQUEOUS) continue;
    const st = s.kind === 'element' ? (s.mp > 295 ? 'solid' : s.bp > 295 ? 'liquid' : 'gas') : s.state25;
    if (st === 'gas') continue;
    const forms = [st === 'solid' ? { solid: e.id } : { liquid: e.id }];
    if (ctx.solubility(sid, 295) > 0.5) forms.push({ solute: e.id, molar: 0.1 });
    for (const r of forms) {
      const l = look(r);
      assert.ok(DEFS[l.kind]?.stock, `${e.id}: ${l.kind}`);
      assert.ok(l.ghs.length <= 3, `${e.id}: ${l.ghs}`);
      assert.ok(l.ghs.every((x) => GHS_IDS.includes(x)));
      n++;
    }
  }
  assert.ok(n > 500, `${n}`);
});

test('testi: famiglie, legenda e avvertenze in italiano e in inglese', () => {
  for (const lang of ['it', 'en']) {
    const T = GAME_STRINGS[lang];
    for (const f of Object.keys(FAMILIES)) assert.ok(T[`fam_${f}`], `${lang} fam_${f}`);
    for (const f of FAMILY_ORDER) assert.ok(T[`legend_${f}`], `${lang} legend_${f}`);
    for (const s of Object.keys(SIGNAL)) assert.ok(T[`signal_${s}`], `${lang} signal_${s}`);
    assert.ok(T.capLegendTitle);
  }
});
