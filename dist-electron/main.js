"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const database_js_1 = require("./database.js");
const logger_js_1 = require("./logger.js");
let mainWindow = null;
const createWindow = () => {
    // 항상 빌드 산출물(preload.js) 사용해 경로 불일치로 인한 로드 실패 방지
    const preloadPath = path.join(__dirname, 'preload.js');
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // ready-to-show에서 표시
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
        },
    });
    const startUrl = electron_is_dev_1.default
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
electron_1.app.on('ready', () => {
    (0, logger_js_1.log)('앱 시작: ready 이벤트 수신');
    (0, database_js_1.initDatabase)();
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        (0, logger_js_1.log)('모든 창 닫힘: 앱 종료');
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        (0, logger_js_1.log)('앱 활성화: 창 재생성');
        createWindow();
    }
});
//# sourceMappingURL=main.js.map