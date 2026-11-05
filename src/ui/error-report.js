// Finestra «Qualcosa è andato storto»: un errore imprevisto (un'eccezione o una promessa rifiutata che nessuno gestisce)
// invece di sparire nella console apre una finestra con Riprova, Copia i dettagli, Segnala e Chiudi. Nell'app desktop
// ogni errore nuovo finisce anche nel registro locale (electron/log-file.cjs, menu «Aiuto»).
//
// Si attiva appena il modulo viene caricato: `main.js` lo importa per primo, così prende anche gli errori degli altri
// moduli mentre si caricano. La logica (che cosa ignorare, il testo dei dettagli, il modulo di GitHub) è in
// error-logic.js, provata con npm test.
import '../styles/error.css';
import { createT, getLang } from '../i18n/index.js';
import { getGfx } from '../gfx/preset.js';
import { describeError, isIgnorable, createErrorLog, reportText, issueUrl } from './error-logic.js';

const t = createT({
  it: {
    title: 'Qualcosa è andato storto',
    text: "L'app ha incontrato un errore imprevisto. Puoi chiudere questo avviso e continuare, oppure ricaricare l'app: quello che è già salvato (la Carriera, il quaderno, il banco del laboratorio, la scena della sandbox) non si perde.",
    more: (p) => (p.n === 1 ? 'e un altro errore' : `e altri ${p.n} errori`),
    details: 'Dettagli tecnici',
    retry: 'Ricarica l’app',
    copy: 'Copia i dettagli',
    copied: 'Copiato ✓',
    copyFailed: 'Copia non riuscita: seleziona il testo nei dettagli',
    report: 'Segnala',
    reportTitle: 'Apre su GitHub il modulo per segnalare un errore, già compilato con questi dettagli',
    close: 'Chiudi',
    logNote: 'L’errore è anche nel registro dell’app: menu Aiuto → Apri la cartella dei registri.',
    desktop: 'app desktop',
    browser: 'browser',
  },
  en: {
    title: 'Something went wrong',
    text: 'The app ran into an unexpected error. You can close this notice and carry on, or reload the app: what is already saved (the Career, the notebook, the laboratory bench, the sandbox scene) is not lost.',
    more: (p) => (p.n === 1 ? 'and one more error' : `and ${p.n} more errors`),
    details: 'Technical details',
    retry: 'Reload the app',
    copy: 'Copy the details',
    copied: 'Copied ✓',
    copyFailed: 'Copy failed: select the text in the details',
    report: 'Report',
    reportTitle: 'Opens the GitHub form to report an error, already filled in with these details',
    close: 'Close',
    logNote: 'The error is also in the app log: Help menu → Open the log folder.',
    desktop: 'desktop app',
    browser: 'browser',
  },
  eli6: {
    text: "Qualcosa nell'app non ha funzionato. Puoi chiudere questo messaggio e continuare, oppure ricaricare l'app: le cose già salvate restano.",
    details: 'Dettagli per chi ripara l’app',
  },
});

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : null;
const REOPEN_MS = 30_000; // chiusa la finestra, un errore nuovo la riapre al più ogni 30 secondi
const PLATFORMS = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };

const log = createErrorLog();
let moduleOf = () => 'tavola';
let dlg = null;
let closedAt = -Infinity;

/** Quale modulo è aperto (per i dettagli e per il modulo di GitHub): lo dice main.js. */
export function setErrorContext({ module } = {}) {
  if (module) moduleOf = module;
}

function about() {
  const d = window.desktop;
  const system = d
    ? `${PLATFORMS[d.platform] ?? d.platform} · ${t('desktop')} (Electron ${d.versions?.electron}, Chrome ${d.versions?.chrome})`
    : `${t('browser')} · ${navigator.userAgent}`;
  let module = 'tavola';
  try {
    module = moduleOf();
  } catch {
    /* il contesto stesso ha un problema: resta «tavola» */
  }
  return { version: APP_VERSION, system, gfx: getGfx(), lang: getLang(), module };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function build() {
  dlg = document.createElement('dialog');
  dlg.className = 'err-dialog';
  dlg.setAttribute('aria-labelledby', 'err-title');
  dlg.innerHTML = `
    <div class="err-dialog__inner">
      <h2 id="err-title">${t('title')}</h2>
      <p class="err-dialog__text">${t('text')}</p>
      <p class="err-dialog__error"><code></code><span class="err-dialog__more"></span></p>
      <details class="err-dialog__details"><summary>${t('details')}</summary><pre></pre></details>
      ${window.desktop ? `<p class="err-dialog__note">${t('logNote')}</p>` : ''}
      <div class="err-dialog__actions">
        <button type="button" class="btn-primary" data-act="retry">${t('retry')}</button>
        <button type="button" class="btn-ghost" data-act="copy">${t('copy')}</button>
        <button type="button" class="btn-ghost" data-act="report" title="${esc(t('reportTitle'))}">${t('report')}</button>
        <button type="button" class="btn-ghost" data-act="close">${t('close')}</button>
      </div>
    </div>`;
  dlg.addEventListener('click', (ev) => {
    const act = ev.target instanceof Element ? ev.target.closest('[data-act]')?.getAttribute('data-act') : null;
    if (act === 'retry') location.reload();
    else if (act === 'copy') copyDetails(ev.target.closest('button'));
    else if (act === 'report') window.open(issueUrl(details(), about()), '_blank', 'noopener');
    else if (act === 'close') dlg.close();
  });
  dlg.addEventListener('close', () => (closedAt = performance.now()));
  document.body.append(dlg);
}

const details = () => reportText(log.entries(), about());

function copyDetails(button) {
  const text = details();
  const done = () => {
    button.textContent = t('copied');
    setTimeout(() => (button.textContent = t('copy')), 2500);
  };
  // senza l'API degli appunti (o senza il fuoco) si prova con una casella di testo nascosta, come nel laboratorio
  const legacy = () => {
    const area = Object.assign(document.createElement('textarea'), { value: text });
    area.style.cssText = 'position:fixed;opacity:0';
    dlg.append(area);
    area.select();
    let ok;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    if (ok) done();
    else {
      button.textContent = t('copyFailed');
      dlg.querySelector('details').open = true;
    }
  };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, legacy);
  else legacy();
}

/** Aggiorna il contenuto e apre la finestra (se non è già aperta e non è stata chiusa da poco). */
function show() {
  if (!document.body) return; // la pagina non c'è ancora: l'errore resta nell'elenco e nel registro
  if (!dlg) build();
  const entries = log.entries();
  const last = entries.at(-1);
  dlg.querySelector('.err-dialog__error code').textContent =
    `${last.info.name}: ${last.info.message}${last.count > 1 ? ` (×${last.count})` : ''}`;
  dlg.querySelector('.err-dialog__more').textContent =
    entries.length > 1 ? ` — ${t('more', { n: entries.length - 1 })}` : '';
  dlg.querySelector('pre').textContent = details();
  if (dlg.open || performance.now() - closedAt < REOPEN_MS) return;
  // il simulatore blocca il puntatore: senza liberarlo non si potrebbe cliccare la finestra
  document.exitPointerLock?.();
  dlg.showModal();
  dlg.querySelector('[data-act="close"]').focus();
}

function handle(info) {
  if (isIgnorable(info)) return;
  const { fresh } = log.add(info);
  if (fresh) {
    try {
      window.desktop?.log?.(`${info.name}: ${info.message}\n${info.stack || info.source}\n(${about().module})`);
    } catch {
      /* il registro non c'è: resta la finestra */
    }
  }
  try {
    show();
  } catch {
    /* la finestra stessa non si apre: non c'è altro da fare, e non si deve finire in un ciclo */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) =>
    handle(describeError(ev.error ?? ev.message, { source: ev.filename, line: ev.lineno, col: ev.colno })),
  );
  window.addEventListener('unhandledrejection', (ev) => handle(describeError(ev.reason)));
}
