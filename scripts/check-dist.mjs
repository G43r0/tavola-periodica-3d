// Controlla che la build vera (`vite build`) non porti con sé cose di sviluppo:
//  - i ganci di test del renderer (src/test-hooks.js) non devono comparire nei file JS;
//  - la CSP di index.html non deve permettere WebSocket (`ws:`), che servono solo al server di sviluppo.
// Esce con 1 se trova qualcosa. Uso: `node scripts/check-dist.mjs [cartella]` (predefinita: dist).
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Come parola intera: la sottostringa `__lab` compare anche in classi CSS come `hero__lab` e `filter-group__label`.
const HOOKS = ['__tp3d', '__lab', '__sandbox', '__atomViewer'].map((name) => ({
  name,
  re: new RegExp(String.raw`\b${name}\b`),
}));

const dist = resolve(process.argv[2] ?? 'dist');
const problems = [];

const assets = join(dist, 'assets');
const scripts = readdirSync(assets).filter((f) => f.endsWith('.js'));
if (!scripts.length) problems.push(`nessun file JS in ${assets}: la build c'è?`);
for (const file of scripts) {
  const code = readFileSync(join(assets, file), 'utf8');
  for (const { name, re } of HOOKS) {
    if (re.test(code)) problems.push(`assets/${file}: contiene il gancio di test ${name}`);
  }
}

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const meta = html.match(/<meta\s[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)?.[0];
// la CSP contiene apici ('self'), quindi il valore va letto fino all'apice di chiusura dello stesso tipo
const content = meta?.match(/\scontent=(?:"([^"]*)"|'([^']*)')/i);
const policy = content?.[1] ?? content?.[2];
if (policy === undefined) problems.push('index.html: manca la CSP (meta Content-Security-Policy)');
else if (/(^|[\s;])wss?:/i.test(policy)) problems.push(`index.html: la CSP permette WebSocket (ws:): ${policy}`);

if (problems.length) {
  console.error(`check-dist: ${problems.length} problemi in ${dist}`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check-dist: ${scripts.length} file JS e la CSP di ${dist} sono puliti`);
