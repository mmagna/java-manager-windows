import { useState, useEffect } from 'react'
import './App.css'
import CurrentVersion from './components/CurrentVersion'
import JavaVersionList from './components/JavaVersionList'
import InstallVersion from './components/InstallVersion'

function App() {
  const [installedVersions, setInstalledVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);


  useEffect(() => {
    // Mostrar mensaje de bienvenida solo la primera vez
    const firstTime = localStorage.getItem('firstTimeVisit') !== 'false';
    if (firstTime) {
      showNotification(
        'Bienvenido al Gestor de Versiones de Java. Esta aplicación te permite instalar y gestionar diferentes versiones de Java fácilmente.',
        'info',
        8000
      );
      localStorage.setItem('firstTimeVisit', 'false');
    }
    
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      if (window.electronAPI) {
        const versions = await window.electronAPI.getJavaVersions();
        const current = await window.electronAPI.getCurrentVersion();
        
        setInstalledVersions(versions || []);
        setCurrentVersion(current);
      } else {
        // Datos de ejemplo para desarrollo sin Electron
        setInstalledVersions([
          {
            version: "openjdk@17.0.2",
            path: "C:\\Users\\user\\.jabba\\jdk\\openjdk@17.0.2",
            name: "Java 17.0.2 (OpenJDK)",
            active: true,
            vendor: "OpenJDK"
          },
          {
            version: "adopt@11.0.12",
            path: "C:\\Users\\user\\.jabba\\jdk\\adopt@11.0.12",
            name: "Java 11.0.12 (AdoptOpenJDK)",
            active: false,
            vendor: "AdoptOpenJDK"
          }
        ]);
        setCurrentVersion({
          version: "openjdk@17.0.2",
          path: "C:\\Users\\user\\.jabba\\jdk\\openjdk@17.0.2",
          name: "Java 17.0.2 (OpenJDK)"
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showNotification('Error al cargar datos: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }


  async function handleSetVersion(versionId) {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setJavaVersion(versionId);
        
        if (result.success) {
          showNotification(result.message, 'success', result.needsRestart ? 8000 : 5000);
          await loadData(); // Recargar datos
        } else {
          showNotification(result.message, 'error');
        }
      } else {
        // Simulación en desarrollo
        showNotification('Versión cambiada (simulación)', 'success');
        
        // Simulamos cambiar la versión activa
        const newVersions = installedVersions.map(v => ({
          ...v,
          active: v.version === versionId
        }));
        
        setInstalledVersions(newVersions);
        const newActive = installedVersions.find(v => v.version === versionId);
        if (newActive) {
          setCurrentVersion(newActive);
        }
      }
    } catch (error) {
      showNotification('Error al cambiar versión: ' + error.message, 'error');
    }
  }

  async function handleInstallVersion(versionId) {
    try {
      console.log("Instalando versión:", versionId);
      
      if (window.electronAPI) {
        const result = await window.electronAPI.installJavaVersion(versionId);
        
        if (result.success) {
          showNotification(result.message, 'success');
          await loadData();
        } else {
          showNotification(result.message, 'error');
        }
      } else {
        // Simulación en desarrollo
        showNotification(`Simulando instalación de la versión ${versionId}`, 'success');
        
        // Simulamos agregar la versión instalada
        setTimeout(() => {
          const newVersion = {
            version: versionId,
            path: `C:\\Users\\user\\.jabba\\jdk\\${versionId}`,
            name: `Java ${versionId.replace(/^[^@]+@/, '')} (${versionId.split('@')[0]})`,
            active: false,
            vendor: versionId.split('@')[0]
          };
          
          setInstalledVersions([...installedVersions, newVersion]);
          showNotification(`Versión ${versionId} instalada (simulación)`, 'success');
        }, 2000);
      }
    } catch (error) {
      console.error("Error en la instalación:", error);
      showNotification('Error al instalar: ' + error.message, 'error');
    }
  }

  async function handleUninstallVersion(versionId) {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.uninstallJavaVersion(versionId);
        
        if (result.success) {
          showNotification(result.message, 'success');
          await loadData(); // Recargar datos
        } else {
          showNotification(result.message, 'error');
        }
      } else {
        // Simulación en desarrollo
        showNotification('Versión desinstalada (simulación)', 'success');
        
        // Simulamos eliminar la versión
        const newVersions = installedVersions.filter(v => v.version !== versionId);
        setInstalledVersions(newVersions);
      }
    } catch (error) {
      showNotification('Error al desinstalar: ' + error.message, 'error');
    }
  }

  function showNotification(message, type = 'info', duration = 5000) {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Gestor de Versiones de Java</h1>
      </header>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <main className="app-content">
        <div className="app-section">
          <h2>Versión actual de Java</h2>
          <CurrentVersion 
            currentVersion={currentVersion} 
            loading={loading} 
          />
        </div>

        <div className="app-section">
          <h2>Versiones instaladas</h2>
          <JavaVersionList 
            versions={installedVersions}
            onSetVersion={handleSetVersion}
            onUninstallVersion={handleUninstallVersion}
            loading={loading}
          />
        </div>

        <div className="app-section">
          <h2>Instalar nueva versión</h2>
          <InstallVersion 
            onInstallVersion={handleInstallVersion} 
          />
        </div>
      </main>
    </div>
  );
}

export default App