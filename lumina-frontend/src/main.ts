import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { colors } from './utils/colors';

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: {
      color: colors.primary[500],
      symbolColor: colors.neutral.white,
      height: 32
    },
    trafficLightPosition: { x: 20, y: 22 }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
