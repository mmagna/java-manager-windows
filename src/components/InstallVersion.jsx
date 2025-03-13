import React, { useState, useEffect } from 'react';
import './InstallVersion.css';

function InstallVersion({ onInstallVersion }) {
  const [availableVersions, setAvailableVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    loadAvailableVersions();
    
    // Escucha actualizaciones de estado de instalación
    const handleInstallUpdate = (event) => {
      const { status, message } = event.detail;
      console.log(`Actualización de estado: ${status} - ${message}`);
      setInstallStatus(message);
      
      if (status === 'completed') {
        setTimeout(() => {
          setInstalling(false);
          setSelectedVersion(''); // Resetear la selección cuando termina
          setInstallStatus('');
          // Recargar las versiones instaladas
          loadAvailableVersions();
        }, 1500); // Pequeño retraso para que el usuario vea el mensaje final
      } else if (status === 'error') {
        setTimeout(() => {
          setInstalling(false);
          setError(message || 'Error durante la instalación');
          setInstallStatus('');
        }, 1500);
      }
    };
    
    document.addEventListener('install-status-update', handleInstallUpdate);
    
    return () => {
      document.removeEventListener('install-status-update', handleInstallUpdate);
    };
  }, []);
  
  async function loadAvailableVersions() {
    setLoading(true);
    setError('');
    
    try {
      if (window.electronAPI) {
        const versions = await window.electronAPI.getAvailableVersions();
        setAvailableVersions(versions);
      } else {
        // Datos de ejemplo para desarrollo sin Electron
        setTimeout(() => {
          setAvailableVersions([
            { id: 'openjdk-17', name: 'Java 17 (OpenJDK)' },
            { id: 'openjdk-21', name: 'Java 21 (OpenJDK)' },
            { id: 'zulu-11', name: 'Java 11 (Azul Zulu)' },
            { id: 'zulu-8', name: 'Java 8 (Azul Zulu)' },
            { id: 'liberica-11', name: 'Java 11 (BellSoft Liberica)' },
            { id: 'liberica-8', name: 'Java 8 (BellSoft Liberica)' }
          ]);
        }, 800); // Simulación de carga en modo desarrollo
      }
    } catch (error) {
      console.error('Error al cargar versiones disponibles:', error);
      setError('No se pudieron cargar las versiones. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  }

  function handleInstall() {
    if (!selectedVersion) return;
    
    // Limpiar cualquier error previo
    setError('');
    
    // Información aproximada del tamaño de descarga
    const sizeInfo = {
      'openjdk-17': '~180 MB',
      'openjdk-21': '~190 MB',
      'zulu-11': '~200 MB',
      'zulu-8': '~160 MB',
      'liberica-11': '~190 MB',
      'liberica-8': '~150 MB'
    };
    
    setInstalling(true);
    setInstallStatus(`Preparando descarga... Tamaño aproximado: ${sizeInfo[selectedVersion] || 'desconocido'}`);
    
    // Llamar a la función de instalación del componente padre
    onInstallVersion(selectedVersion);
  }

  function handleSelectChange(e) {
    setSelectedVersion(e.target.value);
    setError(''); // Limpiar errores al cambiar la selección
  }

  return (
    <div className="install-version">
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando versiones disponibles...</p>
        </div>
      ) : availableVersions.length > 0 ? (
        <>
          <div className="select-container">
            <select 
              className="version-select"
              value={selectedVersion}
              onChange={handleSelectChange}
              disabled={installing}
            >
              <option value="">Selecciona una versión...</option>
              {availableVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name}
                </option>
              ))}
            </select>
          </div>
          
          {error && <div className="empty-list">{error}</div>}
          
          {installing ? (
            <div className="install-status">
              <div className="spinner"></div>
              <p>{installStatus || "Instalando..."}</p>
            </div>
          ) : (
            <button 
              className="install-btn"
              onClick={handleInstall}
              disabled={!selectedVersion || installing}
            >
              Instalar versión seleccionada
            </button>
          )}
        </>
      ) : (
        <div className="empty-list">
          {error || 'No se pudieron cargar las versiones disponibles. Verifica tu conexión a internet o si necesitas permisos de administrador.'}
          <button 
            className="install-btn" 
            style={{ marginTop: '1rem' }}
            onClick={loadAvailableVersions}
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

export default InstallVersion;