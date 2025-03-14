import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CurrentVersion from './components/CurrentVersion/CurrentVersion';
import JavaVersionList from './components/JavaVersionList/JavaVersionList';
import InstallVersion from './components/InstallVersion/InstallVersion';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';
function App() {
  const { t } = useTranslation();
  const [installedVersions, setInstalledVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Mostrar mensaje de bienvenida solo la primera vez
    const firstTime = localStorage.getItem('firstTimeVisit') !== 'false';
    if (firstTime) {
      showNotification(
        t('notifications.welcome'),
        'info',
        8000
      );
      localStorage.setItem('firstTimeVisit', 'false');
    }
    
    loadData();
  }, [t]);

  async function loadData() {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const versions = await window.electronAPI.getJavaVersions();
        const current = await window.electronAPI.getCurrentVersion();

        // Ordenar versiones por número de versión
        const sortedVersions = [...(versions || [])].sort((a, b) => {
          // Extraer el número de versión del ID o version (openjdk-XX o openjdk@XX)
          const versionAMatch = a.version.match(/(\d+)/);
          const versionBMatch = b.version.match(/(\d+)/);

          const versionA = versionAMatch ? parseInt(versionAMatch[1]) : 0;
          const versionB = versionBMatch ? parseInt(versionBMatch[1]) : 0;

          return versionA - versionB;
        });

        // Asegurarse de que la propiedad active se establezca correctamente
        if (current) {
          // Marcar explícitamente la versión activa basada en el path
          for (const version of sortedVersions) {
            // Normalizar las rutas para comparación
            const normalizedVersionPath = version.path
              .toLowerCase()
              .replace(/\\+$/, "");
            const normalizedCurrentPath = current.path
              .toLowerCase()
              .replace(/\\+$/, "");

            // Comparar las rutas normalizadas
            version.active = normalizedVersionPath === normalizedCurrentPath;

            // También comparar por versión si las rutas no coinciden
            if (!version.active && version.version === current.version) {
              version.active = true;
            }
          }
        }

        setInstalledVersions(sortedVersions || []);
        setCurrentVersion(current);
      } else {
        // Datos de ejemplo para desarrollo sin Electron
        // [código de datos de ejemplo...]
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showNotification("Error al cargar datos: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetVersion(versionId) {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setJavaVersion(versionId);

        if (result.success) {
          showNotification(
            result.message,
            "success",
            result.needsRestart ? 8000 : 5000
          );
          await loadData(); // Recargar datos
        } else {
          showNotification(result.message, "error");
        }
      } else {
        // Simulación en desarrollo
        showNotification("Versión cambiada (simulación)", "success");

        // Simulamos cambiar la versión activa
        const newVersions = installedVersions.map((v) => ({
          ...v,
          active: v.version === versionId,
        }));

        setInstalledVersions(newVersions);
        const newActive = installedVersions.find(
          (v) => v.version === versionId
        );
        if (newActive) {
          setCurrentVersion(newActive);
        }
      }
    } catch (error) {
      showNotification("Error al cambiar versión: " + error.message, "error");
    }
  }

  async function handleInstallVersion(versionId) {
    try {
      console.log("Instalando versión:", versionId);

      if (window.electronAPI) {
        const result = await window.electronAPI.installJavaVersion(versionId);

        if (result.success) {
          showNotification(result.message, "success");
          await loadData();
        } else {
          showNotification(result.message, "error");
        }
      } else {
        // Simulación en desarrollo
        showNotification(
          `Simulando instalación de la versión ${versionId}`,
          "success"
        );

        // Simulamos agregar la versión instalada
        setTimeout(() => {
          const newVersion = {
            version: versionId,
            path: `C:\\Users\\user\\.jabba\\jdk\\${versionId}`,
            name: `Java ${versionId.replace(/^[^@]+@/, "")} (${
              versionId.split("@")[0]
            })`,
            active: false,
            vendor: versionId.split("@")[0],
          };

          setInstalledVersions([...installedVersions, newVersion]);
          showNotification(
            `Versión ${versionId} instalada (simulación)`,
            "success"
          );
        }, 2000);
      }
    } catch (error) {
      console.error("Error en la instalación:", error);
      showNotification("Error al instalar: " + error.message, "error");
    }
  }

  async function handleUninstallVersion(versionId) {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.uninstallJavaVersion(versionId);

        if (result.success) {
          showNotification(result.message, "success");
          await loadData(); // Recargar datos
        } else {
          showNotification(result.message, "error");
        }
      } else {
        // Simulación en desarrollo
        showNotification("Versión desinstalada (simulación)", "success");

        // Simulamos eliminar la versión
        const newVersions = installedVersions.filter(
          (v) => v.version !== versionId
        );
        setInstalledVersions(newVersions);
      }
    } catch (error) {
      showNotification("Error al desinstalar: " + error.message, "error");
    }
  }

  function showNotification(message, type = "info", duration = 5000) {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{t('app.title')}</h1>
        <LanguageSelector />
      </header>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="app-content">
        <div className="app-section">
          <h2>{t('sections.currentVersion')}</h2>
          <CurrentVersion 
            currentVersion={currentVersion} 
            loading={loading} 
          />
        </div>

        <div className="app-section">
          <h2>{t('sections.installedVersions')}</h2>
          <JavaVersionList 
            versions={installedVersions}
            onSetVersion={handleSetVersion}
            onUninstallVersion={handleUninstallVersion}
            loading={loading}
          />
        </div>

        <div className="app-section">
          <h2>{t('sections.installNewVersion')}</h2>
          <InstallVersion 
            onInstallVersion={handleInstallVersion} 
          />
        </div>
      </main>
    </div>
  );
}

export default App;
