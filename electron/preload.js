const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printToPDF: (html, defaultFileName) =>
    ipcRenderer.invoke('print-to-pdf', html, defaultFileName),
});
