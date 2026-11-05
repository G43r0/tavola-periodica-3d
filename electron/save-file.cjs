// Salvataggi del simulatore: un file JSON nella cartella dei dati dell'utente, con tre copie di sicurezza accanto. Si
// accetta solo JSON valido fino a 5 MB; la scrittura passa da un file temporaneo, così un'interruzione non lascia il file
// a metà. Le scritture vanno una alla volta (il .tmp è uno solo): mentre una è in corso aspetta solo l'ultimo testo
// arrivato. Nessuna dipendenza da Electron, così si prova con npm test.
//
// Le copie (`<file>.1`, `.2`, `.3`, dalla più recente):
// - la .1 è sempre il salvataggio precedente (prima della 1.0 era il `.bak`);
// - la .2 si rinfresca con la .1 quando ha almeno 10 minuti, e la .2 di prima passa alla .3.
// Così le copie coprono la partita in corso e quelle prima, non gli ultimi tre secondi. In lettura vale il primo JSON
// valido tra il file, la .1, la .2, la .3 e il `.bak` delle 0.9.x.
const fs = require('node:fs');

const SAVE_MAX = 5 * 1024 * 1024;
const ROTATE_MS = 10 * 60_000;

/**
 * @param {string} file
 * @param {{ max?: number, now?: () => number, onError?: (message: string) => void }} [options]
 */
function createSaveFile(file, { max = SAVE_MAX, now = Date.now, onError = (m) => console.error(m) } = {}) {
  const copy = (n) => `${file}.${n}`;
  const valid = (text) => {
    if (typeof text !== 'string' || text.length > max) return false;
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };
  const readValid = async (path) => {
    try {
      const text = await fs.promises.readFile(path, 'utf8');
      return valid(text) ? text : null;
    } catch {
      return null;
    }
  };
  const statOf = (path) => fs.promises.stat(path).catch(() => null);

  /** Il salvataggio; se il file è rotto (o troppo grande) la copia più recente che si legge; null se nessuna. */
  async function read() {
    for (const path of [file, copy(1), copy(2), copy(3), `${file}.bak`]) {
      const text = await readValid(path);
      if (text !== null) return text;
    }
    return null;
  }

  /** Sposta le copie prima di sostituire il file: la .1 diventa il file di adesso. */
  async function rotate() {
    // un file mancante o rotto non scaccia le copie buone
    if ((await readValid(file)) === null) return;
    const two = await statOf(copy(2));
    if (!two || now() - two.mtimeMs >= ROTATE_MS) {
      if (two) await fs.promises.rename(copy(2), copy(3));
      if (await statOf(copy(1))) {
        await fs.promises.rename(copy(1), copy(2));
        const t = new Date(now());
        await fs.promises.utimes(copy(2), t, t);
      }
    }
    await fs.promises.copyFile(file, copy(1));
  }

  let queued = null; // l'ultimo testo in attesa di essere scritto
  let running = null; // le scritture in corso: si risolve quando anche l'ultimo testo in attesa è sul disco

  async function writeOnce(json) {
    const tmp = `${file}.tmp`;
    try {
      await fs.promises.writeFile(tmp, json, 'utf8');
      try {
        await rotate();
      } catch (err) {
        onError(`Copie del salvataggio non aggiornate: ${err.message}`);
      }
      await fs.promises.rename(tmp, file);
    } catch (err) {
      onError(`Salvataggio del simulatore non scritto: ${err.message}`);
    }
  }

  async function drain() {
    try {
      while (queued !== null) {
        const json = queued;
        queued = null;
        await writeOnce(json);
      }
    } finally {
      running = null;
    }
  }

  function write(json) {
    if (!valid(json)) return running ?? Promise.resolve();
    queued = json;
    running ??= drain();
    return running;
  }

  return { read, write };
}

module.exports = { createSaveFile, SAVE_MAX, ROTATE_MS };
