// Genera src/data/binding-energies.json dalle tabelle dell'X-ray Data Booklet (LBNL):
// Table 1-1, "Electron binding energies, in electron volts, for the elements in their natural forms"
// (G. P. Williams; dati di Bearden & Burr 1967, Cardona & Ley 1978, Fuggle & Mårtensson 1980).
// Le pagine HTML originali sono in data-sources/xray-data-booklet/ (https://xdb.lbl.gov/Section1/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'data-sources', 'xray-data-booklet');
const out = path.join(root, 'src', 'data', 'binding-energies.json');

const cellText = (html) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** "L3 2p3/2" → { sub: "2p", j: "3/2" }; "K 1s" → { sub: "1s", j: null } */
function parseHeader(h) {
  const m = h.match(/(\d[spdf])\s*(\d\/2)?$/);
  if (!m) throw new Error(`Intestazione non riconosciuta: ${h}`);
  return { sub: m[1], j: m[2] ?? null };
}

const data = {};
let cells = 0;
for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.htm')).sort()) {
  const html = fs.readFileSync(path.join(srcDir, file), 'latin1');
  let columns = null;
  for (const [, tr] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => cellText(c[1]));
    if (/^Element/.test(row[0])) {
      columns = row.slice(1).map(parseHeader);
      continue;
    }
    const head = row[0]?.match(/^(\d+) [A-Z][a-z]?$/);
    if (!head || !columns) continue;
    const z = Number(head[1]);
    data[z] ??= {};
    row.slice(1).forEach((raw, i) => {
      // i simboli *, †, a, b sono note a piè di pagina della tabella originale
      const value = Number.parseFloat(raw.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(value) || !columns[i]) return;
      const { sub, j } = columns[i];
      data[z][sub] ??= {};
      data[z][sub][j ?? '-'] = value;
      cells++;
    });
  }
}

// controlli di coerenza
const zs = Object.keys(data).map(Number);
if (zs.length !== 92 || Math.min(...zs) !== 1 || Math.max(...zs) !== 92) throw new Error(`Attesi Z = 1–92, trovati ${zs.length}`);
const check = [
  [1, '1s', '-', 13.6],
  [26, '1s', '-', 7112],
  [26, '2p', '3/2', 706.8],
  [79, '4f', '7/2', 84.0],
  [92, '1s', '-', 115606],
];
for (const [z, sub, j, v] of check) {
  if (data[z]?.[sub]?.[j] !== v) throw new Error(`Valore inatteso per Z=${z} ${sub}${j}: ${data[z]?.[sub]?.[j]}`);
}
for (const z of zs) {
  const k = data[z]['1s']?.['-'];
  for (const [sub, byJ] of Object.entries(data[z])) {
    for (const v of Object.values(byJ)) if (v > k) throw new Error(`Z=${z}: ${sub} più legato di 1s`);
  }
}

const json = {
  meta: {
    source: 'X-ray Data Booklet (LBNL), Table 1-1 — G. P. Williams; Bearden & Burr (1967), Cardona & Ley (1978), Fuggle & Mårtensson (1980)',
    note: 'Elementi nella loro forma naturale; energie riferite al livello del vuoto per i gas nobili e le molecole biatomiche, al livello di Fermi per i metalli.',
    unit: 'eV',
  },
  data,
};
fs.writeFileSync(out, JSON.stringify(json));
console.log(`binding-energies.json: ${zs.length} elementi, ${cells} valori → ${path.relative(root, out)}`);
