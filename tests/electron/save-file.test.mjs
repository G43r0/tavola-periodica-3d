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
  return {
    file: path.join(dir, 'simulatore-salvataggio.json'),
    done: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
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

test('salvataggio: si scrive solo JSON valido entro il limite; la copia precedente va nella .1', async () => {
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
    assert.equal(JSON.parse(fs.readFileSync(`${file}.1`, 'utf8')).tag, 'primo');
  } finally {
    done();
  }
});

test('salvataggio: in lettura, se il file è rotto si usa il .bak delle 0.9.x; nessun file → null', async () => {
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

const tag = (f) => JSON.parse(fs.readFileSync(f, 'utf8')).tag;
const MIN = 60_000;

test('copie: la .1 è sempre il salvataggio precedente, la .2 e la .3 distanziate di almeno 10 minuti', async () => {
  const { file, done } = tempFile();
  try {
    let clock = Date.UTC(2026, 10, 5, 9, 0);
    const store = createSaveFile(file, { now: () => clock });
    // una partita: un salvataggio al minuto per mezz'ora
    for (let m = 0; m <= 30; m++) {
      await store.write(save(`m${m}`, 10));
      clock += MIN;
    }
    assert.equal(tag(file), 'm30');
    assert.equal(tag(`${file}.1`), 'm29');
    // la .2 è stata rinfrescata al più 10 minuti fa, la .3 almeno 10 minuti prima della .2
    const m2 = Number(tag(`${file}.2`).slice(1));
    const m3 = Number(tag(`${file}.3`).slice(1));
    assert.ok(m2 >= 18 && m2 < 29, `.2 = m${m2}`);
    assert.ok(m2 - m3 >= 10, `.2 = m${m2}, .3 = m${m3}`);
  } finally {
    done();
  }
});

test('copie: scritture ravvicinate non spostano la .2 e la .3', async () => {
  const { file, done } = tempFile();
  try {
    let clock = Date.UTC(2026, 10, 5, 9, 0);
    const store = createSaveFile(file, { now: () => clock });
    for (const t of ['a', 'b', 'c']) {
      await store.write(save(t, 10));
      clock += 11 * MIN;
    }
    // alle 9:33 la .2 (delle 9:22) ha 11 minuti: si rinfresca con la .1 e la .2 di prima passa alla .3
    await store.write(save('d', 10));
    assert.deepEqual([tag(`${file}.1`), tag(`${file}.2`), tag(`${file}.3`)], ['c', 'b', 'a']);
    // dieci scritture nel minuto dopo: cambia solo la .1
    for (let i = 0; i < 10; i++) {
      clock += 5_000;
      await store.write(save(`e${i}`, 10));
    }
    assert.deepEqual([tag(`${file}.1`), tag(`${file}.2`), tag(`${file}.3`)], ['e8', 'b', 'a']);
  } finally {
    done();
  }
});

test('copie: in lettura il primo JSON valido tra il file, la .1, la .2, la .3 e il .bak', async () => {
  const { file, done } = tempFile();
  try {
    const store = createSaveFile(file, { max: 1000 });
    const rotto = '{"tag":"a metà","pad":"xx';
    fs.writeFileSync(`${file}.bak`, save('bak', 10));
    for (const n of [3, 2, 1]) fs.writeFileSync(`${file}.${n}`, save(`copia${n}`, 10));
    fs.writeFileSync(file, rotto);
    assert.equal(JSON.parse(await store.read()).tag, 'copia1');
    fs.writeFileSync(`${file}.1`, rotto);
    assert.equal(JSON.parse(await store.read()).tag, 'copia2');
    fs.writeFileSync(`${file}.2`, save('enorme', 2000));
    assert.equal(JSON.parse(await store.read()).tag, 'copia3');
    fs.rmSync(`${file}.3`);
    assert.equal(JSON.parse(await store.read()).tag, 'bak');
  } finally {
    done();
  }
});

test('copie: un file rotto sul disco non scaccia la copia buona dalla .1', async () => {
  const { file, done } = tempFile();
  try {
    const store = createSaveFile(file);
    await store.write(save('buono', 10));
    await store.write(save('dopo', 10));
    fs.writeFileSync(file, '{"tag":"rovinato da un');
    await store.write(save('nuovo', 10));
    assert.equal(tag(file), 'nuovo');
    assert.equal(tag(`${file}.1`), 'buono');
  } finally {
    done();
  }
});
