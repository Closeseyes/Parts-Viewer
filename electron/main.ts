import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import { initDatabase } from './database.js';
import { log } from './logger.js';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // 항상 빌드 산출물(preload.js) 사용해 경로 불일치로 인한 로드 실패 방지
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // ready-to-show에서 표시
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  // 개발 모드에서도 디버그 창 자동 오픈 방지
  // mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow?.center();
    mainWindow?.show();
    mainWindow?.focus();
  });
  
};

app.on('ready', () => {
  log('앱 시작: ready 이벤트 수신');
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    log('모든 창 닫힘: 앱 종료');
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    log('앱 활성화: 창 재생성');
    createWindow();
  }
});
