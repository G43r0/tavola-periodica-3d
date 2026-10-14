// Test del tutorial del quaderno: ogni pagina ha l'illustrazione (SVG ben formato, senza valori mancanti) e i testi in
// italiano e in inglese; le parole dentro le illustrazioni sono tradotte. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL, ILLUSTRATION_WORDS, illustration } from '../../src/game/tutorial.js';
import { GAME_STRINGS } from '../../src/game/game-strings.js';

test('tutorial: ogni pagina ha un\'illustrazione SVG completa', () => {
  assert.ok(TUTORIAL.length >= 15);
  assert.equal(new Set(TUTORIAL).size, TUTORIAL.length, 'pagine ripetute');
  for (const id of TUTORIAL) {
    const svg = illustration(id, (w) => `[${w}]`);
    assert.match(svg, /^<svg [^>]*viewBox="0 0 320 180"/, id);
    assert.ok(svg.endsWith('</svg>'), id);
    assert.ok(!/undefined|NaN|null/.test(svg), `${id}: valore mancante`);
    // tag aperti e chiusi in pari (i tag che si chiudono da soli non contano)
    const open = (svg.match(/<(g|svg|text)\b/g) ?? []).length;
    const close = (svg.match(/<\/(g|svg|text)>/g) ?? []).length;
    assert.equal(open, close, `${id}: tag non chiusi`);
  }
  assert.equal(illustration('nessuna'), '');
});

test('tutorial: titoli e passi nelle due lingue, parole delle illustrazioni tradotte', () => {
  for (const lang of ['it', 'en']) {
    const T = GAME_STRINGS[lang];
    for (const id of TUTORIAL) {
      assert.ok(T[`tut_${id}_title`], `${lang} tut_${id}_title`);
      const steps = T[`tut_${id}_steps`];
      assert.ok(Array.isArray(steps) && steps.length >= 3, `${lang} tut_${id}_steps`);
    }
    for (const w of ILLUSTRATION_WORDS) assert.ok(T[`tutw_${w}`], `${lang} tutw_${w}`);
  }
  // le parole usate nelle illustrazioni sono tutte nell'elenco (così non ne manca nessuna tradotta)
  for (const id of TUTORIAL) {
    const used = new Set();
    illustration(id, (w) => (used.add(w), w));
    for (const w of used) assert.ok(ILLUSTRATION_WORDS.includes(w), `${id}: parola ${w} non nell'elenco`);
  }
});
