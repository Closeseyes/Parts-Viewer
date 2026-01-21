import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  getParts: () => ipcRenderer.invoke('get-parts'),
  addPart: (part: any) => ipcRenderer.invoke('add-part', part),
  updatePart: (part: any) => ipcRenderer.invoke('update-part', part),
  deletePart: (id: string) => ipcRenderer.invoke('delete-part', id),
  getHistory: (partId: string) => ipcRenderer.invoke('get-history', partId),
  bulkAddParts: (rows: any[]) => ipcRenderer.invoke('bulk-add-parts', rows),
  exportToExcel: () => ipcRenderer.invoke('export-excel'),
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
});
