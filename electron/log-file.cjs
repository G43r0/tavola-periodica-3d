// Registro locale dell'app desktop (`userData/logs`): gli errori del renderer, i crash e gli errori dei salvataggi, per
// capire un problema segnalato da una scuola. Non si invia mai da solo: lo apre chi vuole dal menu «Aiuto».
// Due file a rotazione (`app.log` e `app.1.log`), insieme al massimo 1 MB; ogni voce al massimo 8 KB. Le scritture vanno
// una alla volta. Nessuna dipendenza da Electron, così si prova con npm test.
const fs = require('node:fs');
const path = require('node:path');

const LOG_MAX = 1024 * 1024;
const ENTRY_MAX = 8 * 1024;

/**
 * @param {string} dir la cartella dei registri (si crea alla prima scrittura)
 * @param {{ max?: number, now?: () => number }} [options] max: byte dei due file insieme
 */
function createLogFile(dir, { max = LOG_MAX, now = Date.now } = {}) {
  const file = path.join(dir, 'app.log');
  const old = path.join(dir, 'app.1.log');
  let chain = Promise.resolve();

  /** Una voce: ora, livello e provenienza sulla prima riga, il resto rientrato; senza caratteri di controllo. */
  function format(level, source, message) {
    let text = String(message)
      // eslint-disable-next-line no-control-regex -- i caratteri di controllo (tranne a capo e tab) vanno tolti di proposito
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      .replace(/\r\n?/g, '\n');
    if (text.length > ENTRY_MAX) text = `${text.slice(0, ENTRY_MAX - 1)}…`;
    const [first, ...rest] = text.split('\n');
    const head = `${new Date(now()).toISOString()} ${String(level).toUpperCase()} [${source}] ${first}`;
    return `${[head, ...rest.map((l) => (l.startsWith('    ') ? l : `    ${l}`))].join('\n')}\n`;
  }

  async function write(line) {
    await fs.promises.mkdir(dir, { recursive: true });
    const size = await fs.promises.stat(file).then(
      (s) => s.size,
      () => 0,
    );
    // ogni file al massimo metà del limite: quando il nuovo si riempie, il vecchio sparisce
    if (size && size + Buffer.byteLength(line) > max / 2) await fs.promises.rename(file, old);
    await fs.promises.appendFile(file, line, 'utf8');
  }

  /**
   * Aggiunge una voce. Non lancia mai: un registro che non si scrive non deve rompere l'app.
   * @param {'error' | 'warn' | 'info'} level
   * @param {string} source renderer, main, salvataggi…
   * @param {string} message
   */
  function append(level, source, message) {
    const line = format(level, source, message);
    chain = chain.then(() => write(line)).catch(() => {});
    return chain;
  }

  return { append, dir };
}

/**
 * Limite di voci al minuto, perché un errore ripetuto a ogni fotogramma non riempia il registro.
 * @param {{ perMinute?: number, now?: () => number }} [options]
 */
function createRateLimit({ perMinute = 60, now = Date.now } = {}) {
  let windowStart = -Infinity;
  let used = 0;
  let skipped = 0;
  return {
    /** true se la voce si può scrivere */
    take() {
      const t = now();
      if (t - windowStart >= 60_000) {
        windowStart = t;
        used = 0;
      }
      if (used < perMinute) {
        used++;
        return true;
      }
      skipped++;
      return false;
    },
    /** Quante voci sono state saltate dall'ultima volta (e azzera il conto). */
    flushSkipped() {
      const n = skipped;
      skipped = 0;
      return n;
    },
  };
}

module.exports = { createLogFile, createRateLimit, LOG_MAX, ENTRY_MAX };
