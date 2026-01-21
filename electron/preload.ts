import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getParts: async () => {
    try {
      const result = await ipcRenderer.invoke('get-parts');
      console.log('[preload] getParts result:', result);
      return result;
    } catch (err) {
      console.error('[preload] getParts error:', err);
      throw err;
    }
  },
  addPart: (part: any) => ipcRenderer.invoke('add-part', part),
  updatePart: (part: any) => ipcRenderer.invoke('update-part', part),
  deletePart: (id: string) => ipcRenderer.invoke('delete-part', id),
  getHistory: (partId: string) => ipcRenderer.invoke('get-history', partId),
  bulkAddParts: (rows: any[]) => ipcRenderer.invoke('bulk-add-parts', rows),
  exportToExcel: () => ipcRenderer.invoke('export-excel'),
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
});

// 콘솔 로그를 main process로 보냄
const originalLog = console.log;
const originalError = console.error;
console.log = (...args: any[]) => {
  ipcRenderer.send('console-log', 'log', ...args);
  originalLog(...args);
};
console.error = (...args: any[]) => {
  ipcRenderer.send('console-log', 'error', ...args);
  originalError(...args);
};
