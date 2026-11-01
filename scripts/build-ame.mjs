// Genera src/data/ame2020.js: energia di legame per nucleone (keV) dei nuclei misurati, dalla tabella AME2020
// (W.J. Huang, M. Wang, F.G. Kondev, G. Audi, S. Naimi, Chinese Physics C 45, 030003, 2021), file mass_1.mas20.txt
// della Atomic Mass Data Center (https://www-nds.iaea.org/amdc/), copiato in data-sources/ame2020/.
// I valori con «#» sono stimati (da sistematiche, non misurati) e si lasciano fuori: lì resta la formula semiempirica.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'data-sources', 'ame2020', 'mass_1.mas20.txt');
const out = path.join(root, 'src', 'data', 'ame2020.js');

const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);
// formato Fortran a1,i3,i5,i5,i5,1x,a3,a4,1x,f14.6,f12.6,f13.5,...: Z alle colonne 10–14, A 15–19, B/A 55–67
const start = lines.findIndex((l) => /^0\s+1\s+1\s+0\s+1\s+n/.test(l));
if (start < 0) throw new Error('inizio della tabella non trovato');
const table = {};
for (const line of lines.slice(start)) {
  if (line.length < 67) continue;
  const z = Number(line.slice(9, 14));
  const a = Number(line.slice(14, 19));
  const be = line.slice(54, 67).trim();
  if (!Number.isInteger(z) || !Number.isInteger(a) || a < 2 || z < 1 || !be || be.includes('#') || be === '*') continue;
  table[`${z}-${a}`] = Number(be);
}
const keys = Object.keys(table);
const body = keys.map((k) => `'${k}':${table[k]}`).join(',');
fs.writeFileSync(
  out,
  `// Generato da scripts/build-ame.mjs: B/A in keV dei nuclei misurati (AME2020). Non modificare a mano.\nexport default {${body}};\n`,
);
console.log(`ame2020.js: ${keys.length} nuclei misurati`);
