// Processo principale Electron: crea la finestra e carica l'interfaccia (offline).
const { app, BrowserWindow, Menu, shell } = require('electron');
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

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit', label: 'Esci' }],
    },
    {
      label: 'Visualizza',
      submenu: [
        { role: 'reload', label: 'Ricarica' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom predefinito' },
        { role: 'zoomIn', label: 'Aumenta zoom' },
        { role: 'zoomOut', label: 'Riduci zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Schermo intero' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools', label: 'Strumenti per sviluppatori' }] : []),
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

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
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
