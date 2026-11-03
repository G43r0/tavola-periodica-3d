// Permessi della pagina: Electron per impostazione predefinita li concede tutti. L'app usa solo il blocco del puntatore
// (per guardarsi intorno nel simulatore), lo schermo intero e la scrittura negli appunti (copia la SMILES o la formula
// nel laboratorio); fotocamera, microfono, posizione, notifiche, lettura degli appunti e il resto sono negati.
// Niente <webview>: l'app non ne usa e una pagina non deve poterne agganciare una. Si prova con npm test, senza Electron.

const ALLOWED = new Set(['pointerLock', 'fullscreen', 'clipboard-sanitized-write']);

function lockDownSession(session) {
  session.setPermissionRequestHandler((_webContents, permission, callback) => callback(ALLOWED.has(permission)));
  session.setPermissionCheckHandler((_webContents, permission) => ALLOWED.has(permission));
}

/** Blocca l'aggancio di un <webview> (will-attach-webview) a ogni webContents creato dall'app. */
function lockWebContents(contents) {
  contents.on('will-attach-webview', (event) => event.preventDefault());
}

module.exports = { lockDownSession, lockWebContents, ALLOWED };
