// Test dei preset grafici e dell'aspetto reale degli elementi: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, gfxOf, getGfx, seg, _setGfxForTests } from '../../src/gfx/preset.js';
import { APPEARANCE, APPEARANCE_STRINGS, describeAppearance } from '../../src/gfx/appearance.js';
import { _setLangForTests } from '../../src/i18n/index.js';

test('preset: tre livelli con le stesse impostazioni, Medio è il predefinito', () => {
  assert.deepEqual(PRESETS, ['simple', 'medium', 'pro']);
  assert.equal(getGfx(), 'medium');
  const keys = Object.keys(gfxOf('medium')).sort();
  for (const code of PRESETS) assert.deepEqual(Object.keys(gfxOf(code)).sort(), keys, `impostazioni diverse in ${code}`);
});

test('preset Medio: la grafica di prima, invariata', () => {
  const m = gfxOf('medium');
  assert.equal(m.pixelRatio(3), 2);
  assert.equal(m.pixelRatio(1), 1);
  assert.equal(m.antialias, true);
  assert.equal(m.post, true);
  assert.equal(m.msaa, 0);
  assert.equal(m.toneMapping, 'aces');
  assert.equal(m.exposure, 1.05);
  assert.equal(m.dust, 900);
  assert.deepEqual(m.adapt, ['bloom', 'dpr1']);
  assert.equal(m.adaptFps, 45);
  assert.equal(m.detail, 1);
  assert.equal(m.points, 1);
  for (const f of ['env', 'shadows', 'ao', 'physical', 'specimens']) assert.equal(m[f], false, f);
  assert.equal(seg(28), 28);
});

test('preset Semplice e Professionale: meno e più dettaglio', () => {
  const s = gfxOf('simple');
  const p = gfxOf('pro');
  assert.equal(s.post, false);
  assert.equal(s.sandbox.glow, false);
  assert.ok(s.detail < 1 && s.points < 1);
  assert.ok(p.detail > 1 && p.points > 1 && p.msaa >= 4);
  assert.ok(p.pixelRatio(1) > 1, 'sovracampionamento anche sugli schermi normali');
  for (const f of ['env', 'shadows', 'ao', 'physical', 'specimens']) assert.equal(p[f], true, f);
  assert.equal(p.sandbox.texture, true);
  _setGfxForTests('simple');
  assert.ok(seg(28) < 28 && seg(4) >= 6);
  _setGfxForTests('medium');
});

const HEX = /^#[0-9a-f]{6}$/i;
const FORMS = new Set(['cube', 'lump', 'crystals', 'gas', 'liquid', 'drop', 'sealed', 'unknown']);

test('aspetto reale: tutti i 118 elementi, con forma, colore e materiale validi', () => {
  for (let z = 1; z <= 118; z++) {
    const a = APPEARANCE[z];
    assert.ok(a, `manca l'aspetto di Z = ${z}`);
    assert.ok(FORMS.has(a.form), `forma sconosciuta per Z = ${z}: ${a.form}`);
    if (a.form === 'gas') assert.ok(HEX.test(a.glow ?? '') || HEX.test(a.gas ?? ''), `gas senza colore: Z = ${z}`);
    else assert.ok(HEX.test(a.c), `colore non valido per Z = ${z}`);
    if (a.form === 'cube') {
      assert.equal(a.m, 1, `i cubetti sono metalli: Z = ${z}`);
      assert.ok(['polished', 'brushed', 'cast'].includes(a.fin), `finitura per Z = ${z}`);
    }
    if (a.r !== undefined) assert.ok(a.r > 0 && a.r < 1, `ruvidezza fuori scala per Z = ${z}`);
  }
  // qualche fatto da non sbagliare
  assert.equal(APPEARANCE[80].form, 'drop'); // mercurio liquido
  assert.equal(APPEARANCE[35].form, 'liquid'); // bromo liquido
  for (const z of [2, 10, 18, 36, 54]) assert.equal(APPEARANCE[z].form, 'gas');
  for (let z = 100; z <= 118; z++) assert.equal(APPEARANCE[z].form, 'unknown');
});

test('aspetto reale: testi in ogni lingua, senza segnaposto rimasti', () => {
  for (const [key, value] of Object.entries(APPEARANCE_STRINGS.it)) assert.equal(typeof APPEARANCE_STRINGS.en[key], typeof value, `en.${key}`);
  for (const key of Object.keys(APPEARANCE_STRINGS.eli6)) assert.ok(key in APPEARANCE_STRINGS.it, `eli6.${key} non esiste in italiano`);
  for (const a of Object.values(APPEARANCE)) {
    assert.ok(`look.${a.look}` in APPEARANCE_STRINGS.it, `aggettivo mancante: ${a.look}`);
    if (a.note) assert.ok(`note.${a.note}` in APPEARANCE_STRINGS.it, `nota mancante: ${a.note}`);
  }
  for (const lang of ['it', 'en', 'eli6']) {
    _setLangForTests(lang);
    for (let z = 1; z <= 118; z++) {
      const text = describeAppearance(z);
      assert.ok(text.length > 10, `${lang}: didascalia vuota per Z = ${z}`);
      assert.ok(!/[{}]/.test(text), `${lang}: segnaposto rimasto per Z = ${z}: ${text}`);
      assert.ok(!/\s[.,]/.test(text), `${lang}: punteggiatura staccata per Z = ${z}: ${text}`);
    }
  }
  _setLangForTests('it');
});
