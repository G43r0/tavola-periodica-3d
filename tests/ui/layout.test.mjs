// Struttura della pagina principale (CSS): npm test. La verifica vera è nel browser a 1024 × 640 (la finestra minima).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../../src/styles/layout.css', import.meta.url), 'utf8');
const rule = (sel) => css.match(new RegExp(`(^|\\n)${sel.replace(/[#.]/g, '\\$&')} \\{([^}]*)\\}`))?.[2] ?? '';

test('finestra stretta: la colonna dell\'app non si allarga al contenuto della barra', () => {
  // prima la colonna implicita «auto» prendeva la larghezza minima della barra (1871 px a 1024 px di finestra):
  // la barra non risultava mai troppo piena, quindi la barra adattiva di toolbar.js non scattava e i pulsanti
  // a destra (Grafica, Lingua, Fonti) e la scheda dell'elemento finivano fuori dallo schermo
  assert.match(rule('#app'), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});
