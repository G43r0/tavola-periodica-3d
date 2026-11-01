// Esportazione dal laboratorio: disegno di Lewis come file SVG e formula in testo semplice. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { standaloneSvg } from '../../src/lab/lewis-svg.js';
import { plainFormula } from '../../src/lab/molecule-panel.js';

test('SVG da salvare: file autonomo, con i suoi colori (senza le variabili CSS dell\'app) e lo sfondo bianco', () => {
  const svg = '<svg class="lewis" viewBox="0 0 100 50" width="150" role="img" aria-label="Lewis"><line class="lw-bond" x1="0" y1="0" x2="10" y2="10"/><text class="lw-atom" x="5" y="5">O</text></svg>';
  const file = standaloneSvg(svg);
  assert.match(file, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(file, /<style>[^<]*\.lw-bond\s*\{[^}]*stroke:\s*#/);
  assert.doesNotMatch(file, /var\(--/);
  assert.match(file, /<rect[^>]*fill="#fff(fff)?"/);
  assert.match(file, /<text class="lw-atom" x="5" y="5">O<\/text>/);
});

test('formula in testo semplice: pedici e cariche come cifre e segni', () => {
  assert.equal(plainFormula('C₉H₈O₄'), 'C9H8O4');
  assert.equal(plainFormula('NH₄⁺'), 'NH4+');
  assert.equal(plainFormula('SO₄²⁻'), 'SO42-');
});
