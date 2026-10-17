// Esegue ogni ricetta del libro «Come si fa» con il motore dei contenitori e scrive in src/game/data/book-verified.js
// quelle che riescono, con i secondi di gioco e il contenitore dei rifiuti: il libro mostra solo quelle.
// Da rilanciare quando cambiano le ricette o il motore chimico (il test del libro lo ricorda). node scripts/book.mjs
import fs from 'node:fs';
import { createLabChemistry } from '../src/game/mixture.js';
import { bookRecipes, runRecipe } from '../src/game/book.js';

const elements = JSON.parse(fs.readFileSync(new URL('../src/data/elements.json', import.meta.url), 'utf8')).elements;
const ctx = createLabChemistry(elements);
const book = bookRecipes(ctx);
const ok = {};
for (const r of book.recipes) {
  const res = runRecipe(ctx, r);
  if (res.ok) ok[r.id] = [res.seconds, res.waste];
}
const lines = Object.entries(ok).map(([id, [s, w]]) => `  '${id}': [${s}, ${w ? `'${w}'` : 'null'}],`);
const out = `// Generato da scripts/book.mjs: le ricette del libro «Come si fa» che il motore dei contenitori esegue davvero, con i
// secondi di gioco che servono e il contenitore dei rifiuti del contenuto finale. Non modificare a mano.
export default {
${lines.join('\n')}
};
`;
fs.writeFileSync(new URL('../src/game/data/book-verified.js', import.meta.url), out);
console.log(`ricette costruite: ${book.recipes.length}, riuscite: ${Object.keys(ok).length}, non costruibili: ${book.failed.size}`);
