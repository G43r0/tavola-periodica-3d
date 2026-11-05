// Test della versione su chiavetta: la cartella `dati` accanto all'eseguibile. npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { portableDataDir, chooseUserData } = createRequire(import.meta.url)('../../electron/portable.cjs');

function stick() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp3d-stick-'));
  return {
    dir,
    exe: path.join(dir, 'TavolaPeriodica3D.exe'),
    done: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}

test('portable: con la cartella dati accanto all’eseguibile si usa quella', () => {
  const s = stick();
  try {
    assert.equal(portableDataDir({ env: {}, execPath: s.exe }), null, 'senza dati/ niente chiavetta');
    fs.mkdirSync(path.join(s.dir, 'dati'));
    assert.equal(portableDataDir({ env: {}, execPath: s.exe }), path.join(s.dir, 'dati'));
    // la prova di scrittura non lascia file
    assert.deepEqual(fs.readdirSync(path.join(s.dir, 'dati')), []);
  } finally {
    s.done();
  }
});

test('portable: l’eseguibile «portable» di electron-builder gira da una cartella temporanea', () => {
  const s = stick();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tp3d-unpacked-'));
  try {
    fs.mkdirSync(path.join(s.dir, 'dati'));
    // l'eseguibile vero è sulla chiavetta: electron-builder lo dice in PORTABLE_EXECUTABLE_DIR
    const env = { PORTABLE_EXECUTABLE_DIR: s.dir };
    assert.equal(
      portableDataDir({ env, execPath: path.join(tmp, 'Tavola Periodica 3D.exe') }),
      path.join(s.dir, 'dati'),
    );
  } finally {
    s.done();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('portable: cartella non scrivibile o non cartella → la cartella solita', () => {
  const s = stick();
  try {
    fs.writeFileSync(path.join(s.dir, 'dati'), 'un file, non una cartella');
    assert.equal(portableDataDir({ env: {}, execPath: s.exe }), null);
    fs.rmSync(path.join(s.dir, 'dati'));
    fs.mkdirSync(path.join(s.dir, 'dati'));
    // una chiavetta protetta da scrittura: la prova di scrittura fallisce
    const readOnly = {
      ...fs,
      writeFileSync() {
        const err = new Error('EROFS: read-only file system');
        err.code = 'EROFS';
        throw err;
      },
    };
    assert.equal(portableDataDir({ env: {}, execPath: s.exe, fs: readOnly }), null);
  } finally {
    s.done();
  }
});

test('portable: TP3D_USER_DATA vince, poi la chiavetta, poi la cartella solita', () => {
  const s = stick();
  try {
    fs.mkdirSync(path.join(s.dir, 'dati'));
    const e2e = path.join(os.tmpdir(), 'tp3d-e2e-x');
    assert.deepEqual(chooseUserData({ env: { TP3D_USER_DATA: e2e }, execPath: s.exe }), {
      dir: path.resolve(e2e),
      why: 'env',
    });
    assert.deepEqual(chooseUserData({ env: {}, execPath: s.exe }), { dir: path.join(s.dir, 'dati'), why: 'portable' });
    fs.rmSync(path.join(s.dir, 'dati'), { recursive: true });
    assert.equal(chooseUserData({ env: {}, execPath: s.exe }), null);
  } finally {
    s.done();
  }
});
