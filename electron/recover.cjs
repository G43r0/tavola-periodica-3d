// Il processo del renderer che si chiude (crash, memoria esaurita, processo ucciso…): la finestra resterebbe bianca.
// Si ricarica la pagina una volta e il renderer avvisa l'utente (canale `app:recovered`); se il processo si richiude
// entro 30 s dal ricaricamento non si riprova (sarebbe un ciclo infinito) e si chiama `onGiveUp`, che in `main.cjs`
// mostra un messaggio d'errore. La logica non tocca Electron: si prova con npm test, con finte finestre.

const RELOAD_WINDOW_MS = 30_000;

/**
 * @param {{ isDestroyed?(): boolean, webContents: { isDestroyed?(): boolean, reload(): void, once(event: string, fn: () => void): void, send(channel: string): void } }} win
 * @param {{ now?: () => number, onGiveUp?: (details: { reason: string }) => void }} [options]
 * @returns {{ handle(details: { reason: string }): void }} `handle` va collegato a `render-process-gone`
 */
function watchRenderer(win, { now = Date.now, onGiveUp = () => {} } = {}) {
  let lastReload = null;

  return {
    handle(details) {
      // uscita normale (la finestra si sta chiudendo): niente da recuperare
      if (details.reason === 'clean-exit') return;
      // il renderer può morire mentre l'app si chiude: finestra o pagina già distrutte, `reload()` lancerebbe
      if (win.isDestroyed?.() || win.webContents.isDestroyed?.()) return;
      const t = now();
      if (lastReload === null || t - lastReload > RELOAD_WINDOW_MS) {
        lastReload = t;
        const { webContents } = win;
        webContents.once('did-finish-load', () => webContents.send('app:recovered'));
        webContents.reload();
      } else {
        onGiveUp(details);
      }
    },
  };
}

module.exports = { watchRenderer, RELOAD_WINDOW_MS };
