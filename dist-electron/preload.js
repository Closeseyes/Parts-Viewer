"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    getParts: () => electron_1.ipcRenderer.invoke('get-parts'),
    addPart: (part) => electron_1.ipcRenderer.invoke('add-part', part),
    updatePart: (part) => electron_1.ipcRenderer.invoke('update-part', part),
    deletePart: (id) => electron_1.ipcRenderer.invoke('delete-part', id),
    getHistory: (partId) => electron_1.ipcRenderer.invoke('get-history', partId),
    bulkAddParts: (rows) => electron_1.ipcRenderer.invoke('bulk-add-parts', rows),
    exportToExcel: () => electron_1.ipcRenderer.invoke('export-excel'),
    getStatistics: () => electron_1.ipcRenderer.invoke('get-statistics'),
});
//# sourceMappingURL=preload.js.map