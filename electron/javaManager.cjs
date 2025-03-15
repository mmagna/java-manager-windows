// javaManager.cjs (simplificado, sin Jabba)
const { exec } = require("child_process");
const util = require("util");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const execAsync = util.promisify(exec);
const fsPromises = fs.promises;

class JavaManager {
  constructor() {
    this.userHome = os.homedir();
    this.javaBaseDir = path.join(this.userHome, ".jdks");

    // En javaManager.cjs, dentro del constructor
    this.availableVersions = [
      {
        id: "openjdk-8",
        name: "OpenJDK 8 (LTS)",
        url: "https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u392-b08/OpenJDK8U-jdk_x64_windows_hotspot_8u392b08.zip",
        type: "zip",
      },
      {
        id: "openjdk-11",
        name: "OpenJDK 11 (LTS)",
        url: "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.21%2B9/OpenJDK11U-jdk_x64_windows_hotspot_11.0.21_9.zip",
        type: "zip",
      },
      {
        id: "openjdk-17",
        name: "OpenJDK 17 (LTS)",
        url: "https://download.oracle.com/java/17/archive/jdk-17.0.2_windows-x64_bin.zip",
        type: "zip",
      },
      {
        id: "openjdk-21",
        name: "OpenJDK 21 (LTS)",
        url: "https://download.oracle.com/java/21/latest/jdk-21_windows-x64_bin.zip",
        type: "zip",
      },
    ];
    // Asegurarse de que el directorio base existe
    if (!fs.existsSync(this.javaBaseDir)) {
      fs.mkdirSync(this.javaBaseDir, { recursive: true });
    }
  }

  // Obtener versiones disponibles para instalar
  async getAvailableVersions() {
    console.log("Obteniendo versiones disponibles para instalar...");
    return this.availableVersions;
  }

  // Buscar instalaciones de Java en el sistema
  async getInstalledVersions() {
    console.log("Buscando instalaciones de Java...");
    const installedVersions = [];

    try {
      // 1. Buscar en nuestro directorio personalizado
      if (fs.existsSync(this.javaBaseDir)) {
        const dirs = await fsPromises.readdir(this.javaBaseDir);

        for (const dir of dirs) {
          const javaDir = path.join(this.javaBaseDir, dir);
          const javaExe = path.join(javaDir, "bin", "java.exe");

          if (fs.existsSync(javaExe)) {
            try {
              // Obtener la versión ejecutando java -version
              const { stderr } = await execAsync(`"${javaExe}" -version`);
              const versionMatch = stderr.match(/version "([^"]+)"/);

              if (versionMatch && versionMatch[1]) {
                // Determinar si es la versión activa
                const isActive = await this.isActiveVersion(javaDir);

                installedVersions.push({
                  version: dir,
                  path: javaDir,
                  name: `Java ${versionMatch[1]} (${dir})`,
                  active: isActive,
                });
              }
            } catch (error) {
              console.error(`Error al obtener versión de ${javaExe}:`, error);
            }
          }
        }
      }

      // 2. Buscar instalaciones estándar (Program Files)
      const programFiles = [
        "C:\\Program Files\\Java",
        "C:\\Program Files (x86)\\Java",
      ];

      for (const javaRoot of programFiles) {
        if (fs.existsSync(javaRoot)) {
          try {
            const dirs = await fsPromises.readdir(javaRoot);

            for (const dir of dirs) {
              const javaDir = path.join(javaRoot, dir);
              const javaExe = path.join(javaDir, "bin", "java.exe");

              if (fs.existsSync(javaExe)) {
                try {
                  // Obtener la versión ejecutando java -version
                  const { stderr } = await execAsync(`"${javaExe}" -version`);
                  const versionMatch = stderr.match(/version "([^"]+)"/);

                  if (versionMatch && versionMatch[1]) {
                    // Determinar si es la versión activa
                    const isActive = await this.isActiveVersion(javaDir);

                    installedVersions.push({
                      version: dir,
                      path: javaDir,
                      name: `Java ${versionMatch[1]}`,
                      active: isActive,
                    });
                  }
                } catch (error) {
                  console.error(
                    `Error al obtener versión de ${javaExe}:`,
                    error
                  );
                }
              }
            }
          } catch (error) {
            console.error(`Error al leer directorio ${javaRoot}:`, error);
          }
        }
      }

      // 3. Buscar por JAVA_HOME
      try {
        const { stdout: javaHome } = await execAsync("echo %JAVA_HOME%");
        const trimmedJavaHome = javaHome.trim();

        if (trimmedJavaHome && fs.existsSync(trimmedJavaHome)) {
          const javaExe = path.join(trimmedJavaHome, "bin", "java.exe");

          if (
            fs.existsSync(javaExe) &&
            !installedVersions.some((v) => v.path === trimmedJavaHome)
          ) {
            try {
              // Obtener la versión ejecutando java -version
              const { stderr } = await execAsync(`"${javaExe}" -version`);
              const versionMatch = stderr.match(/version "([^"]+)"/);

              if (versionMatch && versionMatch[1]) {
                const dirName = path.basename(trimmedJavaHome);

                installedVersions.push({
                  version: dirName,
                  path: trimmedJavaHome,
                  name: `Java ${versionMatch[1]} (JAVA_HOME)`,
                  active: true, // Si está en JAVA_HOME, debe estar activo
                });
              }
            } catch (error) {
              console.error(`Error al obtener versión de ${javaExe}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener JAVA_HOME:", error);
      }

      console.log("Versiones de Java encontradas:", installedVersions);
      return installedVersions;
    } catch (error) {
      console.error("Error general al buscar versiones de Java:", error);
      return [];
    }
  }

  // Verificar si una versión es la activa actualmente
  async isActiveVersion(javaPath) {
    try {
      // Obtener el JAVA_HOME del sistema
      const { stdout } = await execAsync("echo %JAVA_HOME%");
      const javaHome = stdout.trim();

      // Normalizar las rutas para comparación (eliminar barras finales, convertir a minúsculas)
      const normalizedJavaHome = javaHome.toLowerCase().replace(/\\+$/, "");
      const normalizedPath = javaPath.toLowerCase().replace(/\\+$/, "");

      console.log(
        `Comparando rutas: ${normalizedJavaHome} vs ${normalizedPath}`
      );

      // Comprobar si las rutas normalizadas coinciden
      return normalizedJavaHome === normalizedPath;
    } catch (error) {
      console.error("Error al verificar versión activa:", error);
      return false;
    }
  }

  async getCurrentVersion() {
    try {
      console.log("Buscando versión actual de Java...");

      // Verificar primero consultando directamente java --version
      try {
        const { stderr: javaVersionOutput } = await execAsync("java --version");
        console.log("Output de java --version:", javaVersionOutput);

        // Analizar la salida para determinar la versión
        const installedVersions = await this.getInstalledVersions();

        // Extraer el número de la versión de la salida
        const outputVersionMatch = javaVersionOutput.match(/version "([^"]+)"/);
        if (outputVersionMatch && outputVersionMatch[1]) {
          const outputVersion = outputVersionMatch[1];
          console.log("Versión detectada en output:", outputVersion);

          // Buscar una versión instalada que coincida con este número de versión
          for (const version of installedVersions) {
            // Comparar el nombre de la versión con la salida
            if (version.name.includes(outputVersion)) {
              version.active = true;
              console.log("Versión activa encontrada:", version);
              return version;
            }
          }
        }
      } catch (error) {
        console.log("Error al ejecutar java --version:", error);
      }
      // Si no se puede determinar por el comando, verificar JAVA_HOME
      const { stdout: javaHome } = await execAsync("echo %JAVA_HOME%");
      const trimmedJavaHome = javaHome.trim();

      if (trimmedJavaHome) {
        const installedVersions = await this.getInstalledVersions();

        for (const version of installedVersions) {
          if (
            path.normalize(version.path).toLowerCase() ===
            path.normalize(trimmedJavaHome).toLowerCase()
          ) {
            version.active = true;
            console.log("Versión actual detectada por JAVA_HOME:", version);
            return version;
          }
        }
      }

      // Resto de la función actual...
    } catch (error) {
      console.error("Error general al obtener versión actual:", error);
      return null;
    }
  }

  // Mejora del método downloadFile en javaManager.cjs
  // Reemplaza todo el método downloadFile que ya existe en javaManager.cjs
  async downloadFile(url, destPath) {
    console.log(`Descargando desde ${url}...`);

    // Usar una ruta más simple sin caracteres especiales
    const simpleDestPath = path.join(
      os.tmpdir(),
      `java-download-${Date.now()}.zip`
    );

    console.log(`Guardando en: ${simpleDestPath}`);

    try {
      // Comando PowerShell simplificado
      const cmd = `powershell -Command "(New-Object Net.WebClient).DownloadFile('${url}', '${simpleDestPath}')"`;
      await execAsync(cmd);

      // Si llegamos aquí, la descarga fue exitosa
      console.log("Descarga completada");

      // Copiar el archivo a la ubicación final si es diferente
      if (simpleDestPath !== destPath) {
        fs.copyFileSync(simpleDestPath, destPath);
        fs.unlinkSync(simpleDestPath);
      }

      return destPath;
    } catch (error) {
      console.error("Error en la descarga:", error);
      return null;
    }
  }
  // Instalar una versión de Java
  async installVersion(versionId, updateStatus = () => {}) {
    try {
      updateStatus(
        "preparing",
        `Preparando instalación de Java ${versionId}...`
      );

      console.log(`Instalando Java ${versionId}...`);

      // Buscar la versión en la lista de disponibles
      const targetVersion = this.availableVersions.find(
        (v) => v.id === versionId
      );
      if (!targetVersion) {
        throw new Error(
          `Versión ${versionId} no encontrada en la lista de disponibles`
        );
      }

      // Definir la ruta de descarga y la ruta de instalación
      const tempDir = path.join(os.tmpdir(), "java-manager");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const installDir = path.join(this.javaBaseDir, versionId);
      const fileName = path.basename(targetVersion.url);
      // Usar una ruta más simple sin caracteres especiales
      const downloadPath = path.join(
        tempDir,
        `java-download-${Date.now()}.zip`
      );

      // Verificar si ya existe
      if (fs.existsSync(installDir)) {
        const files = await fsPromises.readdir(installDir);
        if (files.length > 0) {
          console.log(
            `La versión ${versionId} ya está instalada en ${installDir}`
          );
          updateStatus(
            "completed",
            `Java ${targetVersion.name} ya está instalado. Puedes activarlo como versión actual.`
          );
          return {
            success: true,
            message: `Java ${targetVersion.name} ya está instalado. Puedes activarlo como versión actual.`,
          };
        }
      } else {
        // Crear el directorio de instalación
        fs.mkdirSync(installDir, { recursive: true });
      }

      // Descargar el archivo
      updateStatus(
        "downloading",
        `Descargando Java ${targetVersion.name}... (puede tardar varios minutos)`
      );
      console.log(`Descargando desde ${targetVersion.url}...`);

      try {
        // Comando PowerShell simplificado
        const cmd = `powershell -Command "(New-Object Net.WebClient).DownloadFile('${targetVersion.url}', '${downloadPath}')"`;
        await execAsync(cmd);

        // Si llegamos aquí, la descarga fue exitosa
        console.log("Descarga completada");
        updateStatus("downloaded", `Descarga completada.`);
      } catch (error) {
        console.error("Error en la descarga:", error);
        updateStatus(
          "error",
          `Error en la descarga. Intenta descargarlo manualmente.`
        );

        console.log(
          `No se pudo descargar automáticamente. Intente descargar manualmente desde ${targetVersion.url}`
        );
        try {
          // Abrir el navegador con la URL
          await execAsync(`start ${targetVersion.url}`);
        } catch (error) {
          console.error("Error al abrir navegador:", error);
        }

        return {
          success: false,
          message: `No se pudo descargar automáticamente. Por favor, descargue manualmente desde el navegador.`,
          manualDownload: true,
        };
      }

      // Verificar que el archivo existe
      if (!fs.existsSync(downloadPath)) {
        updateStatus("error", `El archivo descargado no existe.`);
        throw new Error(`El archivo descargado no existe: ${downloadPath}`);
      }

      // Obtener el tamaño del archivo
      const stats = fs.statSync(downloadPath);
      console.log(`Archivo descargado: ${downloadPath} (${stats.size} bytes)`);

      // Extraer el ZIP
      if (targetVersion.type === "zip") {
        updateStatus(
          "extracting",
          `Extrayendo archivos... (puede tardar un momento)`
        );
        console.log(`Extrayendo ${downloadPath} a ${installDir}...`);

        try {
          // Usar PowerShell con rutas absolutas
          const expandCmd = `powershell -Command "Expand-Archive -LiteralPath '${downloadPath}' -DestinationPath '${installDir}' -Force"`;
          await execAsync(expandCmd);
        } catch (err) {
          console.error("Error al extraer:", err);
          updateStatus("error", `Error al extraer el archivo: ${err.message}`);
          throw new Error(`No se pudo extraer el archivo: ${err.message}`);
        }

        // Buscar la estructura correcta del JDK
        updateStatus(
          "configuring",
          `Configurando Java ${targetVersion.name}...`
        );
        const findJavaCmd = `powershell -command "Get-ChildItem -Path '${installDir}' -Recurse -Filter java.exe | Select-Object -First 1 | ForEach-Object { $_.FullName }"`;
        const { stdout: javaExePath } = await execAsync(findJavaCmd);

        if (javaExePath.trim()) {
          // Encontramos java.exe, vamos a determinar la estructura de directorios
          const binPath = path.dirname(javaExePath.trim());
          const jdkRootPath = path.dirname(binPath); // Un nivel arriba de bin

          // Si el JDK no está directamente en installDir
          if (path.normalize(jdkRootPath) !== path.normalize(installDir)) {
            console.log(
              `Encontrado JDK en subdirectorio: ${path.relative(
                installDir,
                jdkRootPath
              )}`
            );

            updateStatus("organizing", `Organizando archivos de Java...`);

            // Mover los archivos al directorio principal
            const moveFilesCmd = `powershell -command "Get-ChildItem -Path '${jdkRootPath}' | Move-Item -Destination '${installDir}' -Force"`;
            await execAsync(moveFilesCmd);

            // Eliminar la estructura innecesaria
            const removeEmptyDirsCmd = `powershell -command "Get-ChildItem -Path '${installDir}' -Directory | Where-Object { $_.Name -ne 'bin' -and $_.Name -ne 'lib' -and $_.Name -ne 'jre' } | Remove-Item -Recurse -Force"`;
            await execAsync(removeEmptyDirsCmd);
          }
        }
      }

      // Limpiar el archivo descargado
      updateStatus("cleaning", `Limpiando archivos temporales...`);
      try {
        await fsPromises.unlink(downloadPath);
      } catch (err) {
        console.error("Error al eliminar archivo temporal:", err);
        // No interrumpimos la instalación si no se puede borrar el archivo temporal
      }

      console.log(`Java ${versionId} instalado correctamente en ${installDir}`);
      updateStatus(
        "completed",
        `Java ${targetVersion.name} instalado correctamente.`
      );

      return {
        success: true,
        message: `Java ${targetVersion.name} instalado correctamente`,
      };
    } catch (error) {
      console.error("Error al instalar la versión:", error);
      updateStatus("error", `Error: ${error.message}`);
      return {
        success: false,
        message: error.message,
        requiresPermission:
          error.message.includes("acceso denegado") ||
          error.message.includes("access denied"),
      };
    }
  }

  // Establecer una versión como la actual
  // En javaManager.cjs - Función setVersion mejorada
  async setVersion(versionId) {
    try {
      const installedVersions = await this.getInstalledVersions();
      const targetVersion = installedVersions.find(
        (v) => v.version === versionId
      );

      if (!targetVersion) {
        throw new Error(
          `Versión ${versionId} no encontrada entre las instaladas`
        );
      }

      console.log(`Estableciendo Java ${versionId} como versión actual...`);

      // 1. Modificar JAVA_HOME a nivel de usuario (sin /M)
      const command = `setx JAVA_HOME "${targetVersion.path}"`;
      await execAsync(command);

      // 2. Actualizar PATH para incluir bin explícitamente
      const binPath = path.join(targetVersion.path, "bin");
      const { stdout: currentPath } = await execAsync("echo %PATH%");

      // Eliminar otras rutas de Java en el PATH si existen
      const javaPathsRegex =
        /[A-Z]:\\(?:Program Files\\Java|Users\\[^\\]+\\\.jdks)\\[^\\]+\\bin;?/gi;
      let newPath = currentPath.replace(javaPathsRegex, "");

      // Añadir la nueva ruta al inicio
      newPath = `${binPath};${newPath}`;

      const pathUpdateCommand = `setx PATH "${newPath}"`;
      await execAsync(pathUpdateCommand);

      // 3. También agregar al PATH del proceso actual
      process.env.PATH = `${binPath};${process.env.PATH}`;
      process.env.JAVA_HOME = targetVersion.path;

      return {
        success: true,
        message: `Java ${targetVersion.name} establecido como versión actual. Es posible que necesites reiniciar la línea de comandos para ver los cambios.`,
        needsRestart: true,
      };
    } catch (error) {
      console.error("Error al establecer la versión:", error);
      return { success: false, message: error.message };
    }
  }
  // Desinstalar una versión de Java
  async uninstallVersion(versionId) {
    try {
      const installedVersions = await this.getInstalledVersions();
      const targetVersion = installedVersions.find(
        (v) => v.version === versionId
      );

      if (!targetVersion) {
        throw new Error(
          `Versión ${versionId} no encontrada entre las instaladas`
        );
      }

      // Verificar que no es la versión activa
      if (targetVersion.active) {
        throw new Error("No se puede desinstalar la versión activa de Java");
      }

      console.log(`Desinstalando Java ${versionId}...`);

      // Eliminar el directorio
      await fsPromises.rmdir(targetVersion.path, { recursive: true });

      return {
        success: true,
        message: `Java ${targetVersion.name} desinstalado correctamente`,
      };
    } catch (error) {
      console.error("Error al desinstalar la versión:", error);
      return {
        success: false,
        message: error.message,
        requiresPermission:
          error.message.includes("acceso denegado") ||
          error.message.includes("access denied"),
      };
    }
  }
}

module.exports = new JavaManager();
