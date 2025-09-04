import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { validateColorConfig, getColorWithFallback } from './utils/colors';

const isDev = process.env.NODE_ENV === 'development';

function setupContentSecurityPolicy(): void {
  const cspHeader = isDev
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000 ws://localhost:3000; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; style-src 'self' 'unsafe-inline' http://localhost:3000; font-src 'self' data:; img-src 'self' data: http://localhost:3000; connect-src 'self' http://localhost:3000 ws://localhost:3000 http://localhost:8000;"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self';";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspHeader],
        'X-Frame-Options': ['DENY'],
        'X-Content-Type-Options': ['nosniff'],
      },
    });
  });
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: {
      color: getColorWithFallback('primary', '500', '#667eea'),
      symbolColor: getColorWithFallback('neutral', 'white', '#ffffff'),
      height: 32,
    },
    trafficLightPosition: { x: 20, y: 22 },
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

app.whenReady().then(() => {
  if (!validateColorConfig()) {
    console.error('Color configuration validation failed');
  }
  setupContentSecurityPolicy();
  createWindow();
});

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
