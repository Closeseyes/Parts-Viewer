/// <reference types="vite/client" />

interface ElectronAPI {
  getParts: () => Promise<any[]>;
  addPart: (part: any) => Promise<any>;
  updatePart: (part: any) => Promise<any>;
  deletePart: (id: string) => Promise<any>;
  getHistory: (partId: string) => Promise<any>;
  bulkAddParts: (rows: any[]) => Promise<any>;
  exportToExcel: () => Promise<any>;
  getStatistics: () => Promise<any>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
