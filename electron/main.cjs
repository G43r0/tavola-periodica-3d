// Processo principale Electron: crea la finestra e carica l'interfaccia (offline).
const { app, BrowserWindow, Menu, shell, ipcMain, net, session } = require('electron');
const { setupUpdater } = require('./updater.cjs');
const { createSaveFile } = require('./save-file.cjs');
const { menuTemplate } = require('./menu.cjs');
const { lockDownSession } = require('./security.cjs');
const path = require('node:path');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(DEV_URL);

let mainWindow = null;

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
      spellcheck: false,
    },
  });

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

ipcMain.on('set-language', (_event, code) => buildMenu(code === 'en' ? 'en' : 'it'));

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
