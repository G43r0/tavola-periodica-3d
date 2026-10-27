// Copertura delle reazioni del simulatore di laboratorio: per ogni gruppo del catalogo, quante reazioni si fanno con
// lo scaffale, con lo scaffale e l'armadio, con tutto il magazzino del Laboratorio libero, e quante il simulatore sa
// fare. Con --gain mostra quante reazioni in più porta ogni reagente dell'armadio. Uso: node scripts/coverage.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLabChemistry } from '../src/game/mixture.js';
import { reachable, keysOf } from '../src/game/coverage.js';
import { SHELF, CABINET } from '../src/game/reagents.js';
import { REACTION_GROUPS } from '../src/lab/data/reactions.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const elements = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'elements.json'), 'utf8')).elements;
const ctx = createLabChemistry(elements);

const shelf = keysOf(SHELF);
const cabinet = keysOf(SHELF, CABINET);
const store = [...ctx.subs.library.entries.map((e) => e.id), ...ctx.subs.elements.map((el) => el.symbol)];
const runs = [['scaffale', reachable(ctx, shelf)], ['+ armadio', reachable(ctx, cabinet)], ['magazzino', reachable(ctx, store)]];
const doable = new Map();
for (const rx of ctx.rxs) doable.set(rx.group, (doable.get(rx.group) ?? 0) + 1);

const W = Math.max(...REACTION_GROUPS.map((g) => g.label.length)) + 2;
const pad = (s) => String(s).padEnd(W);
const num = (s, n) => String(s).padStart(n);
console.log(`${pad('gruppo')}${runs.map(([n]) => num(n, 11)).join('')}${num('simulatore', 12)}`);
for (const g of REACTION_GROUPS) {
  console.log(`${pad(g.label)}${runs.map(([, r]) => num(r.byGroup.get(g.key) ?? 0, 11)).join('')}${num(doable.get(g.key) ?? 0, 12)}`);
}
console.log(`${pad('totale')}${runs.map(([, r]) => num(r.ids.size, 11)).join('')}${num(ctx.rxs.length, 12)}`);
console.log(`\nreagenti: scaffale ${shelf.length}, con l'armadio ${cabinet.length}`);

if (process.argv.includes('--gain')) {
  const all = runs[1][1].ids.size;
  const gain = Object.entries(CABINET).map(([k]) => {
    const rest = keysOf(SHELF, Object.fromEntries(Object.entries(CABINET).filter(([x]) => x !== k)));
    return [k, all - reachable(ctx, rest).ids.size];
  });
  console.log('\nreazioni perse togliendo ogni reagente dell\'armadio:');
  console.log(gain.sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · '));
}
