// @ts-check
// Logica della finestra «Qualcosa è andato storto» (src/ui/error-report.js): che cosa dire di un errore, quali errori
// ignorare, l'elenco degli errori della sessione, il testo di «Copia i dettagli» e il modulo di GitHub già compilato per
// «Segnala». Modulo puro, senza DOM: si prova con npm test.

const REPO = 'https://github.com/G43r0/tavola-periodica-3d';
/** Lunghezza massima dell'indirizzo di «Segnala» (i browser e GitHub ne accettano di più, ma non sempre). */
export const ISSUE_MAX = 6000;
const MESSAGE_MAX = 2000;
const STACK_LINES = 15;

/**
 * @typedef {{ name: string, message: string, stack: string, source: string }} ErrorInfo
 * @typedef {{ info: ErrorInfo, count: number, first: number }} ErrorEntry
 * @typedef {{ version?: string | null, system?: string, gfx?: string, lang?: string, module?: string }} About
 */

/** Toglie dai percorsi la parte che dipende dal computer (la cartella dell'utente, l'indirizzo del server). */
export function cleanPaths(text) {
  return String(text)
    .replace(/file:\/\/\/[^\s)]*?\/(?=(?:assets|dist|src)\/)/g, '')
    .replace(/https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//g, '');
}

const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Messaggio, nome e pila di qualunque cosa sia stata lanciata (un Error, una stringa, un oggetto…).
 * @param {unknown} value
 * @param {{ source?: string, line?: number, col?: number }} [where] file e riga dall'evento `error`
 * @returns {ErrorInfo}
 */
export function describeError(value, where = {}) {
  let name = 'Error';
  let message;
  let stack = '';
  if (value instanceof Error || (value && typeof value === 'object' && 'message' in value && 'stack' in value)) {
    const e = /** @type {{ name?: unknown, message?: unknown, stack?: unknown }} */ (value);
    name = String(e.name || 'Error');
    message = String(e.message ?? '');
    stack = typeof e.stack === 'string' ? e.stack : '';
  } else if (typeof value === 'string') message = value;
  else {
    try {
      message = value === undefined ? 'undefined' : (JSON.stringify(value) ?? String(value));
    } catch {
      message = Object.prototype.toString.call(value);
    }
  }
  const source = where.source
    ? `${where.source}${where.line ? `:${where.line}${where.col ? `:${where.col}` : ''}` : ''}`
    : '';
  return { name, message: cut(message, MESSAGE_MAX), stack: cleanPaths(stack), source: cleanPaths(source) };
}

/**
 * Errori che non dicono niente dell'app: avvisi del browser, estensioni, audio e video interrotti.
 * @param {ErrorInfo} info
 */
export function isIgnorable(info) {
  const { name, message, stack, source } = info;
  if (/^ResizeObserver loop/.test(message)) return true;
  // il messaggio vuoto che il browser dà per gli script di un'altra origine (e per le estensioni)
  if (message === 'Script error.' && !source && !stack) return true;
  if (/(?:chrome|moz|safari(?:-web)?)-extension:\/\//.test(`${source}\n${stack}`)) return true;
  if (name === 'AbortError' || name === 'NotAllowedError') return true;
  return false;
}

/**
 * Gli errori della sessione: lo stesso errore (stesso messaggio e stessa pila) si conta una volta.
 * @param {{ max?: number, now?: () => number }} [options]
 */
export function createErrorLog({ max = 20, now = Date.now } = {}) {
  /** @type {Map<string, ErrorEntry>} */
  const byKey = new Map();
  let total = 0;
  return {
    /**
     * @param {ErrorInfo} info
     * @returns {{ entry: ErrorEntry, fresh: boolean }} fresh: la prima volta che si vede
     */
    add(info) {
      total++;
      const key = `${info.name}\n${info.message}\n${info.stack || info.source}`;
      const old = byKey.get(key);
      if (old) {
        old.count++;
        return { entry: old, fresh: false };
      }
      const entry = { info, count: 1, first: now() };
      byKey.set(key, entry);
      // i più vecchi escono quando sono troppi
      while (byKey.size > max) byKey.delete(byKey.keys().next().value);
      return { entry, fresh: true };
    },
    /** @returns {ErrorEntry[]} dal più vecchio */
    entries: () => [...byKey.values()],
    total: () => total,
  };
}

/** La pila senza la prima riga quando ripete «Nome: messaggio», al massimo 15 righe. */
function stackLines(info) {
  const lines = info.stack.split('\n').filter((l) => l.trim());
  if (lines.length && lines[0].includes(info.message)) lines.shift();
  return lines.slice(0, STACK_LINES).map((l) => `    ${l.trim()}`);
}

/**
 * Il testo di «Copia i dettagli»: da incollare in una segnalazione o in un messaggio al docente.
 * @param {ErrorEntry[]} entries
 * @param {About} about
 */
export function reportText(entries, about) {
  const head = [
    `Tavola Periodica 3D ${about.version ?? '(versione sconosciuta)'}`,
    `Sistema: ${about.system ?? '?'}`,
    `Grafica: ${about.gfx ?? '?'} · Lingua: ${about.lang ?? '?'} · Modulo: ${about.module ?? 'tavola'}`,
  ];
  const body = entries.map((e, i) => {
    const { info } = e;
    const lines = [
      `${i + 1}. ${info.name}: ${info.message}${e.count > 1 ? ` (×${e.count})` : ''} — ${new Date(e.first).toISOString()}`,
    ];
    if (info.source) lines.push(`    in ${info.source}`);
    lines.push(...stackLines(info));
    return lines.join('\n');
  });
  return [...head, '', ...body].join('\n');
}

const AREAS = {
  tavola: ['Tavola', 'Tavola periodica e schede degli elementi'],
  atomo: ['Visualizzatore 3D', 'Visualizzatore 3D (atomo, nucleo, particelle)'],
  laboratorio: ['Laboratorio', 'Laboratorio molecolare (legami, formule, reazioni)'],
  sandbox: ['Sandbox', 'Sandbox degli elementi'],
  simulatore: ['Simulatore', 'Simulatore di laboratorio (in prima persona)'],
};

/**
 * Il modulo «Errore dell'app» (.github/ISSUE_TEMPLATE/bug.yml) già compilato: titolo, versione, sistema, dove succede e
 * i dettagli in «Che cosa è successo invece». I passi li scrive chi segnala.
 * @param {string} details il testo di reportText
 * @param {About} about
 * @param {string} [firstMessage] il messaggio per il titolo (predefinito: la prima riga d'errore dei dettagli)
 */
export function issueUrl(details, about, firstMessage) {
  const [prefix, area] = AREAS[about.module ?? 'tavola'] ?? AREAS.tavola;
  const message = firstMessage ?? (details.match(/^1\. (?:[^:\n]+: )?(.*?)(?: \(×\d+\))? — /m)?.[1] || 'errore');
  const build = (text) => {
    const params = new URLSearchParams({
      template: 'bug.yml',
      title: `${prefix}: ${cut(message, 80)}`,
      version: about.version ?? '',
      system: about.system ?? '',
      area,
      actual: `Si è aperta la finestra «Qualcosa è andato storto». Dettagli:\n\n\`\`\`\n${text}\n\`\`\``,
    });
    return `${REPO}/issues/new?${params}`;
  };
  let url = build(details);
  const note = '\n… (dettagli tagliati: il testo completo si copia con «Copia i dettagli»)';
  for (let n = details.length; url.length > ISSUE_MAX && n > 0;) {
    n = Math.floor(n * 0.85);
    url = build(details.slice(0, n) + note);
  }
  return url;
}
