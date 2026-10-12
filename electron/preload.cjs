// Preload: espone al renderer solo informazioni innocue sulla piattaforma e la lingua scelta (per il menu).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  setLanguage: (code) => ipcRenderer.send('set-language', String(code)),
});
