"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFilePath = exports.error = exports.log = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ensureDir = (dir) => {
    try {
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
    }
    catch { }
};
const getLogPath = () => {
    const userDir = electron_1.app.getPath('userData');
    ensureDir(userDir);
    return path_1.default.join(userDir, 'parts-viewer.log');
};
const write = (level, msg) => {
    const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
    try {
        fs_1.default.appendFileSync(getLogPath(), line);
    }
    catch { }
};
const log = (msg) => write('INFO', msg);
exports.log = log;
const error = (msg) => write('ERROR', msg);
exports.error = error;
const logFilePath = () => getLogPath();
exports.logFilePath = logFilePath;
//# sourceMappingURL=logger.js.map