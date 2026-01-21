import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
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

  // CSP 헤더 설정
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"],
      },
    });
  });

  // NODE_ENV 환경 변수로 dev/prod 구분
  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  
  let startUrl: string;
  if (isDev) {
    startUrl = 'http://localhost:5173';
  } else {
    // __dirname = dist-electron 폴더, 따라서 ../dist로 접근
    const distPath = path.resolve(__dirname, '../dist/index.html');
    log(`distPath resolved: ${distPath}`);
    startUrl = pathToFileURL(distPath).toString();
  }

  log(`startUrl: ${startUrl} (isDev: ${isDev})`);
  mainWindow.loadURL(startUrl);

  // 개발 모드에서만 DevTools 표시
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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

// 렌더러 프로세스의 콘솔 로그 수신
ipcMain.on('console-log', (event, level, ...args) => {
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    return String(arg);
  }).join(' ');
  
  if (level === 'error') {
    log(`[RENDERER ERROR] ${message}`);
  } else {
    log(`[RENDERER] ${message}`);
  }
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
