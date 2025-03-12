// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

function sendInstallStatusUpdate(status, message) {
  document.dispatchEvent(new CustomEvent('install-status-update', { 
    detail: { status, message } 
  }));
}

// Escuchar eventos desde el proceso principal y reenviarlos a la ventana
ipcRenderer.on('install-status', (event, data) => {
  // Enviar como evento del DOM para que React pueda escucharlo
  document.dispatchEvent(new CustomEvent('install-status-update', { 
    detail: data 
  }));
});

// Expone APIs específicas de IPC al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // APIs de Java
  getJavaVersions: () => ipcRenderer.invoke('get-java-versions'),
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  getAvailableVersions: () => ipcRenderer.invoke('get-available-versions'),
  setJavaVersion: (version) => ipcRenderer.invoke('set-java-version', version),
  uninstallJavaVersion: (version) => ipcRenderer.invoke('uninstall-java-version', version),
  updateInstallStatus: (status, message) => sendInstallStatusUpdate(status, message),
  installJavaVersion: (version) => ipcRenderer.invoke('install-java-version', version)

  
});