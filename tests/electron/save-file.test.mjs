// Test del file dei salvataggi del simulatore nell'app desktop: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { createSaveFile } = createRequire(import.meta.url)('../../electron/save-file.cjs');

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp3d-save-'));
  return { file: path.join(dir, 'simulatore-salvataggio.json'), done: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
const save = (tag, n) => JSON.stringify({ tag, pad: 'x'.repeat(n) });

test('salvataggio: scritture di fila (due reazioni nuove nello stesso passo) → resta l’ultima, intera', async () => {
  const { file, done } = tempFile();
  try {
    const store = createSaveFile(file);
    for (let round = 0; round < 40; round++) {
      // la prima più lunga della seconda: è il caso in cui il .tmp condiviso restava con la coda della prima
      const a = save(`A${round}`, 521 + round * 300);
      const b = save(`B${round}`, 437);
      store.write(a);
      await store.write(b);
      assert.equal(fs.readFileSync(file, 'utf8'), b, `giro ${round}`);
    }
    const burst = Array.from({ length: 12 }, (_, i) => save(`C${i}`, 2000 - i * 100));
    await Promise.all(burst.map((json) => store.write(json)));
    assert.equal(fs.readFileSync(file, 'utf8'), burst.at(-1));
  } finally {
    done();
  }
});

test('salvataggio: si scrive solo JSON valido entro il limite; la copia precedente va nel .bak', async () => {
  const { file, done } = tempFile();
  try {
    const store = createSaveFile(file, { max: 1000 });
    await store.write(save('primo', 10));
    await store.write('{rotto');
    await store.write(save('enorme', 2000));
    await store.write(42);
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).tag, 'primo');
    await store.write(save('secondo', 10));
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).tag, 'secondo');
    assert.equal(JSON.parse(fs.readFileSync(`${file}.bak`, 'utf8')).tag, 'primo');
  } finally {
    done();
  }
});

test('salvataggio: in lettura, se il file è rotto si usa il .bak; nessun file → null', async () => {
  const { file, done } = tempFile();
  try {
    const store = createSaveFile(file, { max: 1000 });
    assert.equal(await store.read(), null);
    fs.writeFileSync(`${file}.bak`, save('copia', 10));
    fs.writeFileSync(file, '{"tag":"a metà","pad":"xx');
    assert.equal(JSON.parse(await store.read()).tag, 'copia');
    fs.writeFileSync(file, save('buono', 10));
    assert.equal(JSON.parse(await store.read()).tag, 'buono');
    fs.writeFileSync(file, save('enorme', 2000));
    assert.equal(JSON.parse(await store.read()).tag, 'copia', 'oltre il limite vale come rotto');
    fs.rmSync(`${file}.bak`);
    assert.equal(await store.read(), null);
  } finally {
    done();
  }
});
