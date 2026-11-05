// Test del registro locale dell'app desktop (userData/logs): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { createLogFile, createRateLimit, LOG_MAX } = createRequire(import.meta.url)('../../electron/log-file.cjs');

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp3d-log-'));
  return { dir: path.join(dir, 'logs'), done: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
const read = (dir, name = 'app.log') => fs.readFileSync(path.join(dir, name), 'utf8');

test('log-file: una riga per voce, con ora, livello e provenienza; la cartella si crea da sola', async () => {
  const { dir, done } = tempDir();
  try {
    const log = createLogFile(dir, { now: () => Date.UTC(2026, 10, 5, 10, 30) });
    await log.append('error', 'renderer', 'TypeError: x is undefined\n    at f (game.js:1:2)');
    await log.append('info', 'main', 'avvio 0.9.2');
    const lines = read(dir).trimEnd().split('\n');
    assert.equal(lines[0], '2026-11-05T10:30:00.000Z ERROR [renderer] TypeError: x is undefined');
    assert.equal(lines[1], '    at f (game.js:1:2)');
    assert.equal(lines[2], '2026-11-05T10:30:00.000Z INFO [main] avvio 0.9.2');
    assert.equal(log.dir, dir);
  } finally {
    done();
  }
});

test('log-file: non supera 1 MB (due file a rotazione), anche con migliaia di voci', async () => {
  const { dir, done } = tempDir();
  try {
    assert.equal(LOG_MAX, 1024 * 1024);
    const max = 64 * 1024;
    const log = createLogFile(dir, { max });
    const writes = [];
    for (let i = 0; i < 3000; i++) writes.push(log.append('error', 'renderer', `voce ${i} ${'x'.repeat(200)}`));
    await Promise.all(writes);
    const size = (n) => fs.statSync(path.join(dir, n)).size;
    assert.ok(size('app.log') + size('app.1.log') <= max, `${size('app.log') + size('app.1.log')} byte`);
    // l'ultima voce c'è, le prime sono uscite
    assert.match(read(dir), /voce 2999 /);
    assert.doesNotMatch(read(dir) + read(dir, 'app.1.log'), /voce 0 /);
    assert.deepEqual(fs.readdirSync(dir).sort(), ['app.1.log', 'app.log']);
  } finally {
    done();
  }
});

test('log-file: voci troncate a 8 KB e senza caratteri di controllo', async () => {
  const { dir, done } = tempDir();
  try {
    const log = createLogFile(dir);
    await log.append('error', 'renderer', `inizio\u0000\u001b[31m${'y'.repeat(20_000)}`);
    const text = read(dir);
    assert.ok(text.length < 8 * 1024 + 100, `${text.length}`);
    assert.ok(!text.includes('\u0000') && !text.includes('\u001b'));
    assert.match(text, /…\n$/);
  } finally {
    done();
  }
});

test('log-file: al più 60 voci al minuto dal renderer, poi una riga con quante sono state saltate', () => {
  let clock = 0;
  const limit = createRateLimit({ perMinute: 60, now: () => clock });
  let ok = 0;
  for (let i = 0; i < 500; i++) if (limit.take()) ok++;
  assert.equal(ok, 60);
  assert.equal(limit.flushSkipped(), 440);
  assert.equal(limit.flushSkipped(), 0, 'il conto si azzera dopo averlo letto');
  clock += 60_000;
  assert.ok(limit.take(), 'il minuto dopo si riparte');
});
