// App su chiavetta: se accanto all'eseguibile c'è una cartella `dati` in cui si può scrivere, l'app tiene lì
// impostazioni, salvataggi, registri e la cache di Chromium. App e progressi viaggiano insieme, anche nei laboratori di
// informatica che si azzerano a ogni riavvio. Nessuna dipendenza da Electron, così si prova con npm test.
const nodeFs = require('node:fs');
const path = require('node:path');

const DATA_DIR = 'dati';

/**
 * La cartella `dati` della chiavetta, o null se non c'è o non si può scrivere (chiavetta protetta, `Program Files`).
 * L'eseguibile «portable» di electron-builder si estrae e gira da una cartella temporanea: dov'è quello vero lo dice
 * `PORTABLE_EXECUTABLE_DIR`.
 *
 * @param {{ env: Record<string, string | undefined>, execPath: string, fs?: typeof nodeFs }} where
 * @returns {string | null}
 */
function portableDataDir({ env, execPath, fs = nodeFs }) {
  const base = env.PORTABLE_EXECUTABLE_DIR || path.dirname(execPath);
  const dir = path.join(base, DATA_DIR);
  try {
    if (!fs.statSync(dir).isDirectory()) return null;
    // la prova vera: un file creato e cancellato (i permessi da soli non dicono di una chiavetta protetta)
    const probe = path.join(dir, `.tp3d-prova-${process.pid}`);
    fs.writeFileSync(probe, '');
    fs.unlinkSync(probe);
    return dir;
  } catch {
    return null;
  }
}

/**
 * Dove tenere i dati dell'utente: `TP3D_USER_DATA` (gli E2E, mai i dati veri di chi sviluppa), poi la chiavetta;
 * null = la cartella solita di Electron.
 *
 * @param {{ env: Record<string, string | undefined>, execPath: string, fs?: typeof nodeFs }} where
 * @returns {{ dir: string, why: 'env' | 'portable' } | null}
 */
function chooseUserData(where) {
  if (where.env.TP3D_USER_DATA) return { dir: path.resolve(where.env.TP3D_USER_DATA), why: 'env' };
  const dir = portableDataDir(where);
  return dir ? { dir, why: 'portable' } : null;
}

module.exports = { portableDataDir, chooseUserData, DATA_DIR };
