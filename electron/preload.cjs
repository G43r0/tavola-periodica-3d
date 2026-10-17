// Preload: espone al renderer solo informazioni innocue sulla piattaforma, la lingua scelta (per il menu) e il file dei
// salvataggi del simulatore (un solo file JSON nella cartella dei dati dell'utente, letto e scritto dal processo
// principale: il renderer non sceglie il percorso).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  setLanguage: (code) => ipcRenderer.send('set-language', String(code)),
  gameSave: {
    read: () => ipcRenderer.invoke('game-save:read'),
    write: (json) => ipcRenderer.send('game-save:write', String(json)),
  },
});
