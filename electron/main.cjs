// electron/main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// Reemplazamos electron-is-dev con una comprobación manual
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const javaManager = require('./javaManager.cjs');

let mainWindow;

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs')
      }
    });

    // Cargar URL de desarrollo o archivo HTML de producción
    const startURL = isDev
      ? 'http://localhost:5173'  // Puerto por defecto de Vite
      : `file://${path.join(__dirname, '../dist/index.html')}`;
    
    console.log('Intentando cargar URL:', startURL);
    mainWindow.loadURL(startURL);

    // Abrir DevTools en desarrollo
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    console.error('Error al crear la ventana:', error);
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Manejadores IPC para la gestión de Java
ipcMain.handle('get-java-versions', async () => {
  try {
    console.log('Solicitando versiones de Java instaladas...');
    const versions = await javaManager.getInstalledVersions();
    console.log('Versiones de Java recibidas:', versions);
    return versions;
  } catch (error) {
    console.error('Error en get-java-versions:', error);
    return [];
  }
});

ipcMain.handle('get-current-version', async () => {
  return await javaManager.getCurrentVersion();
});

ipcMain.handle('get-available-versions', async () => {
  return await javaManager.getAvailableVersions();
});

ipcMain.handle('set-java-version', async (event, version) => {
  const result = await javaManager.setVersion(version);
  
  // Si el resultado indica que se necesita reiniciar para ver los cambios
  if (result.success && result.needsRestart) {
    result.message += '. Es posible que necesites reiniciar algunas aplicaciones o tu sesión para ver el cambio.';
  }
  
  return result;
});

// En el manejador de install-java-version
ipcMain.handle('install-java-version', async (event, version) => {
  // Función para enviar actualización de estado
  const sendUpdate = (status, message) => {
    // Enviar actualización a la ventana del renderizador
    mainWindow.webContents.send('install-status', { status, message });
  };
  
  try {
    const result = await javaManager.installVersion(version, sendUpdate);
    
    // Asegurarse de enviar el estado completado al finalizar
    if (result.success) {
      sendUpdate('completed', result.message);
    } else {
      sendUpdate('error', result.message);
    }
    
    return result;
  } catch (error) {
    sendUpdate('error', `Error: ${error.message}`);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('uninstall-java-version', async (event, version) => {
  return await javaManager.uninstallVersion(version);
});

ipcMain.handle('get-system-language', () => {
  return app.getLocale(); // Devuelve el código de idioma del sistema, como 'es-ES', 'en-US', etc.
});