// electron/main.cjs
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
// Reemplazamos electron-is-dev con una comprobación manual
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const javaManager = require("./javaManager.cjs");

let mainWindow;

const appDataPath = path.join(app.getPath("userData"), "CupControl");

// Asegurarse de que existe el directorio de datos
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
}

// Archivo de registro para seguimiento
const logFile = path.join(appDataPath, "app.log");

// Función simple para registrar eventos
function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;

  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error("Error al escribir en el registro:", error);
  }

  console.log(message);
}

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      icon: path.join(__dirname, '../assets/cupcontrol.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.cjs"),
      },
    });

    // Cargar URL de desarrollo o archivo HTML de producción
    const startURL = isDev
      ? "http://localhost:5173" // Puerto por defecto de Vite
      : `file://${path.join(__dirname, "../dist/index.html")}`;

    console.log("Intentando cargar URL:", startURL);
    mainWindow.loadURL(startURL);

    // Abrir DevTools en desarrollo
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    // Registrar inicio de la aplicación
    logEvent("Aplicación iniciada");
  } catch (error) {
    console.error("Error al crear la ventana:", error);
    logEvent(`Error al crear la ventana: ${error.message}`);
  }
}

// Detectar si la aplicación se está desinstalando
const isBeingUninstalled = process.argv.includes('--uninstall');
if (isBeingUninstalled) {
  logEvent('Desinstalación detectada');
  
  try {
    // Limpiar archivos temporales creados por la aplicación
    const tempDir = path.join(os.tmpdir(), 'java-manager');
    if (fs.existsSync(tempDir)) {
      // Eliminar recursivamente el directorio temporal
      fs.rmSync(tempDir, { recursive: true, force: true });
      logEvent(`Directorio temporal eliminado: ${tempDir}`);
    }
    
    // También puedes eliminar datos de configuración si no son importantes
    // NO elimines los JDKs instalados, ya que el usuario podría querer conservarlos
    
    // Opcional: Eliminar el propio directorio de logs al final
    // No es recomendable hacerlo inmediatamente para poder registrar el proceso
    
    logEvent('Limpieza de desinstalación completada');
    
    // Salir después de la limpieza
    app.quit();
  } catch (error) {
    logEvent(`Error durante la limpieza de desinstalación: ${error.message}`);
    app.quit();
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  logEvent('Todas las ventanas cerradas');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  logEvent('Aplicación a punto de cerrarse');
  
  // Guardar cualquier configuración pendiente
  try {
    // Ejemplo: Guardar el último idioma utilizado
    const lastLanguage = global.lastUsedLanguage || 'en';
    const configFile = path.join(appDataPath, 'config.json');
    
    fs.writeFileSync(configFile, JSON.stringify({
      lastLanguage,
      lastExitTimestamp: new Date().toISOString()
    }, null, 2));
    
    logEvent('Configuración guardada correctamente');
    
    // Limpieza de archivos temporales que no sean necesarios mantener
    const tempDownloads = path.join(os.tmpdir(), 'java-manager-downloads');
    if (fs.existsSync(tempDownloads)) {
      fs.rmSync(tempDownloads, { recursive: true, force: true });
      logEvent('Archivos temporales de descarga eliminados');
    }
  } catch (error) {
    logEvent(`Error durante la limpieza al salir: ${error.message}`);
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

ipcMain.handle('set-app-language', (event, language) => {
  global.lastUsedLanguage = language;
  logEvent(`Idioma cambiado a: ${language}`);
  return true;
});

ipcMain.handle("get-current-version", async () => {
  return await javaManager.getCurrentVersion();
});

ipcMain.handle("get-available-versions", async () => {
  return await javaManager.getAvailableVersions();
});

ipcMain.handle("set-java-version", async (event, version) => {
  const result = await javaManager.setVersion(version);

  // Si el resultado indica que se necesita reiniciar para ver los cambios
  if (result.success && result.needsRestart) {
    result.message +=
      ". Es posible que necesites reiniciar algunas aplicaciones o tu sesión para ver el cambio.";
  }

  return result;
});

// En el manejador de install-java-version
ipcMain.handle("install-java-version", async (event, version) => {
  // Función para enviar actualización de estado
  const sendUpdate = (status, message) => {
    // Enviar actualización a la ventana del renderizador
    mainWindow.webContents.send("install-status", { status, message });
  };

  try {
    const result = await javaManager.installVersion(version, sendUpdate);

    // Asegurarse de enviar el estado completado al finalizar
    if (result.success) {
      sendUpdate("completed", result.message);
    } else {
      sendUpdate("error", result.message);
    }

    return result;
  } catch (error) {
    sendUpdate("error", `Error: ${error.message}`);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("uninstall-java-version", async (event, version) => {
  return await javaManager.uninstallVersion(version);
});

ipcMain.handle("get-system-language", () => {
  return app.getLocale(); // Devuelve el código de idioma del sistema, como 'es-ES', 'en-US', etc.
});
