const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // 기존 부품 관리
  getParts: () => ipcRenderer.invoke('get-parts'),
  addPart: (part) => ipcRenderer.invoke('add-part', part),
  updatePart: (part) => ipcRenderer.invoke('update-part', part),
  deletePart: (id) => ipcRenderer.invoke('delete-part', id),
  getHistory: (partId) => ipcRenderer.invoke('get-history', partId),
  bulkAddParts: (rows) => ipcRenderer.invoke('bulk-add-parts', rows),
  searchParts: (keyword) => ipcRenderer.invoke('search-parts', keyword),
  exportToExcel: () => ipcRenderer.invoke('export-excel'),
  
  // 카테고리
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (category) => ipcRenderer.invoke('add-category', category),
  deleteCategory: (categoryId) => ipcRenderer.invoke('delete-category', categoryId),
  updatePartCategory: (partId, categoryId) => ipcRenderer.invoke('update-part-category', { partId, categoryId }),
  
  // 사용자
  registerUser: (userData) => ipcRenderer.invoke('register-user', userData),
  loginUser: (credentials) => ipcRenderer.invoke('login-user', credentials),
  
  // 알림
  getNotifications: (limit) => ipcRenderer.invoke('get-notifications', limit),
  addNotification: (notif) => ipcRenderer.invoke('add-notification', notif),
  markNotificationRead: (notifId) => ipcRenderer.invoke('mark-notification-read', notifId),
  
  // 통계
  getStatistics: () => ipcRenderer.invoke('get-statistics'),
});
