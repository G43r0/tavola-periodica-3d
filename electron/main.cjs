// Processo principale Electron: crea la finestra e carica l'interfaccia (offline).
const { app, BrowserWindow, Menu, shell, ipcMain, net, session, dialog } = require('electron');
const { setupUpdater } = require('./updater.cjs');
const { createSaveFile } = require('./save-file.cjs');
const { menuTemplate } = require('./menu.cjs');
const { lockDownSession, lockWebContents } = require('./security.cjs');
const { watchRenderer } = require('./recover.cjs');
const path = require('node:path');

// Cartella dei dati dell'utente scelta da fuori: serve all'E2E (una cartella temporanea, mai i dati veri di chi sviluppa)
// ed è la base per l'app su chiavetta. Va impostata prima di `ready` e prima che qualcosa legga userData (blocco
// dell'istanza unica, salvataggi, impostazioni dell'aggiornatore).
if (process.env.TP3D_USER_DATA) app.setPath('userData', path.resolve(process.env.TP3D_USER_DATA));

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(DEV_URL);

let mainWindow = null;
let uiLang = 'it';

// Ogni webContents creato dall'app (la finestra e qualunque altro) non può agganciare una <webview>.
app.on('web-contents-created', (_event, contents) => lockWebContents(contents));

// Messaggio quando il renderer si richiude subito dopo il ricaricamento (electron/recover.cjs).
const GIVE_UP_TEXT = {
  it: (reason) =>
    `L'app si è chiusa per un errore (${reason}) e si è richiusa subito dopo il ricaricamento.\nChiudila e riaprila.`,
  en: (reason) =>
    `The app closed because of an error (${reason}) and closed again right after being reloaded.\nClose it and open it again.`,
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#080d15',
    title: 'Tavola Periodica 3D',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      spellcheck: false,
    },
  });

  // Se il renderer si chiude (crash, memoria esaurita) la pagina si ricarica una volta; se si richiude subito, errore.
  const renderer = watchRenderer(mainWindow, {
    onGiveUp: (details) => dialog.showErrorBox('Tavola Periodica 3D', GIVE_UP_TEXT[uiLang](details.reason)),
  });
  mainWindow.webContents.on('render-process-gone', (_event, details) => renderer.handle(details));

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Nessuna navigazione esterna: l'app è completamente offline.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });

  if (isDev) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

// Voci del menu nella lingua scelta nell'app (electron/menu.cjs).
function buildMenu(lang = 'it') {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate(lang, { isDev })));
}

ipcMain.on('set-language', (_event, code) => {
  uiLang = code === 'en' ? 'en' : 'it';
  buildMenu(uiLang);
});

// Salvataggi del simulatore (electron/save-file.cjs): un file JSON nella cartella dei dati dell'utente.
let saves = null;
const saveStore = () => (saves ??= createSaveFile(path.join(app.getPath('userData'), 'simulatore-salvataggio.json')));
ipcMain.handle('game-save:read', () => saveStore().read());
ipcMain.on('game-save:write', (_event, json) => {
  saveStore().write(json);
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    lockDownSession(session.defaultSession);
    app.setAboutPanelOptions({
      applicationName: 'Tavola Periodica 3D',
      applicationVersion: app.getVersion(),
      version: `Electron ${process.versions.electron} · Chrome ${process.versions.chrome}`,
      credits: `Electron ${process.versions.electron} · Chrome ${process.versions.chrome} · Node.js ${process.versions.node}`,
    });
    buildMenu();
    createWindow();
    setupUpdater({ app, ipcMain, shell, net, getWindow: () => mainWindow, isDev }).schedule();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
