// Permessi della pagina: l'app non usa fotocamera, microfono, posizione, notifiche né altro, quindi li nega tutti
// (Electron per impostazione predefinita li concede). Si prova con npm test, senza Electron.

function lockDownSession(session) {
  session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
}

module.exports = { lockDownSession };
