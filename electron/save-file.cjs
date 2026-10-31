// Salvataggi del simulatore: un file JSON nella cartella dei dati dell'utente (accanto, la copia precedente). Si accetta
// solo JSON valido fino a 5 MB; la scrittura passa da un file temporaneo, così un'interruzione non lascia il file a metà.
// Le scritture vanno una alla volta (il .tmp è uno solo): mentre una è in corso aspetta solo l'ultimo testo arrivato.
// Nessuna dipendenza da Electron, così si prova con npm test.
const fs = require('node:fs');

const SAVE_MAX = 5 * 1024 * 1024;

function createSaveFile(file, { max = SAVE_MAX } = {}) {
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

  /** Il salvataggio; se il file è rotto (o troppo grande) la copia precedente; null se non c'è nessuno dei due. */
  const read = async () => (await readValid(file)) ?? readValid(`${file}.bak`);

  let queued = null; // l'ultimo testo in attesa di essere scritto
  let running = null; // le scritture in corso: si risolve quando anche l'ultimo testo in attesa è sul disco

  async function writeOnce(json) {
    const tmp = `${file}.tmp`;
    try {
      await fs.promises.writeFile(tmp, json, 'utf8');
      await fs.promises.copyFile(file, `${file}.bak`).catch(() => {});
      await fs.promises.rename(tmp, file);
    } catch (err) {
      console.error('Salvataggio del simulatore non scritto:', err.message);
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

module.exports = { createSaveFile, SAVE_MAX };
