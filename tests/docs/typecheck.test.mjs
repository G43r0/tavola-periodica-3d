// Il controllo dei tipi (tsc, npm run typecheck) guarda solo i moduli con `// @ts-check` in testa: l'elenco CHECKED
// dice quali sono, e il test impedisce che un modulo esca in silenzio dal controllo. Se aggiungi un modulo: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, root), 'utf8');
/** I file .js di una cartella, così un file nuovo in quella cartella entra nell'elenco senza toccare il test. */
const jsIn = (dir) =>
  fs
    .readdirSync(new URL(`${dir}/`, root))
    .filter((f) => f.endsWith('.js'))
    .sort()
    .map((f) => `${dir}/${f}`);

const CHECKED = [
  ...jsIn('src/chem'),
  ...jsIn('src/lab/chem'),
  'src/sandbox/world.js',
  'src/sandbox/chemistry.js',
  'src/game/mixture.js',
  'src/game/career.js',
  'src/game/save.js',
  'src/game/book.js',
  'src/game/profile-file.js',
  'src/ui/error-logic.js',
];

/** Tutti i .js sotto `src/`. */
function allSources(dir = 'src') {
  return fs.readdirSync(new URL(`${dir}/`, root), { withFileTypes: true }).flatMap((e) => {
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? allSources(p) : e.name.endsWith('.js') ? [p] : [];
  });
}

test('i moduli controllati iniziano con // @ts-check', () => {
  assert.ok(CHECKED.length >= 7 + 13 + 6, `CHECKED è troppo corto: ${CHECKED.length} file`);
  for (const file of CHECKED) {
    const first = read(file).split(/\r?\n/, 1)[0];
    assert.equal(first, '// @ts-check', `${file}: la prima riga deve essere «// @ts-check»`);
  }
});

test('nessun modulo ha // @ts-check senza stare in CHECKED', () => {
  const marked = allSources().filter((f) => read(f).split(/\r?\n/, 1)[0] === '// @ts-check');
  assert.deepEqual(
    marked.filter((f) => !CHECKED.includes(f)),
    [],
    'aggiungi questi file a CHECKED (o togli il // @ts-check)',
  );
});

test('tsconfig: checkJs spento (si controlla un modulo alla volta) e lo script typecheck esiste', () => {
  const tsconfig = JSON.parse(read('tsconfig.json'));
  assert.equal(tsconfig.compilerOptions.checkJs, false);
  assert.equal(tsconfig.compilerOptions.noEmit, true);
  assert.deepEqual(tsconfig.include, ['src/**/*.js', 'src/types.d.ts']);
  assert.equal(JSON.parse(read('package.json')).scripts.typecheck, 'tsc -p tsconfig.json');
});

test('@ts-expect-error: al massimo 5 in tutto src/, ognuno con il motivo sulla stessa riga', () => {
  const found = [];
  for (const file of allSources()) {
    for (const line of read(file).split(/\r?\n/)) {
      if (line.includes('@ts-expect-error')) found.push({ file, line });
    }
  }
  assert.ok(found.length <= 5, `troppi @ts-expect-error: ${found.length}`);
  for (const { file, line } of found) {
    assert.match(line, /@ts-expect-error\s+\S/, `${file}: @ts-expect-error senza il motivo sulla stessa riga`);
  }
});
