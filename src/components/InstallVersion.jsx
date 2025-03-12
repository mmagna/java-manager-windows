import React, { useState, useEffect } from 'react';
import './InstallVersion.css';

function InstallVersion({ onInstallVersion }) {
 const [availableVersions, setAvailableVersions] = useState([]);
 const [selectedVersion, setSelectedVersion] = useState('');
 const [loading, setLoading] = useState(true);
 const [installing, setInstalling] = useState(false);
 const [installStatus, setInstallStatus] = useState('');
 
 useEffect(() => {
   loadAvailableVersions();
   
   // Escucha actualizaciones de estado de instalación
   const handleInstallUpdate = (event) => {
     const { status, message } = event.detail;
     console.log(`Actualización de estado: ${status} - ${message}`);
     setInstallStatus(message);
     
     if (status === 'completed' || status === 'error') {
       setTimeout(() => {
         setInstalling(false);
         setSelectedVersion(''); // Resetear la selección cuando termina
       }, 1000); // Pequeño retraso para que el usuario vea el mensaje final
     }
   };
   
   document.addEventListener('install-status-update', handleInstallUpdate);
   
   return () => {
     document.removeEventListener('install-status-update', handleInstallUpdate);
   };
 }, []);
 
 async function loadAvailableVersions() {
   setLoading(true);
   try {
     if (window.electronAPI) {
       const versions = await window.electronAPI.getAvailableVersions();
       setAvailableVersions(versions);
     } else {
       // Datos de ejemplo para desarrollo sin Electron
       setAvailableVersions([
         { id: 'openjdk-17', name: 'Java 17 (OpenJDK)' },
         { id: 'openjdk-21', name: 'Java 21 (OpenJDK)' },
         { id: 'zulu-11', name: 'Java 11 (Azul Zulu)' },
         { id: 'zulu-8', name: 'Java 8 (Azul Zulu)' }
       ]);
     }
   } catch (error) {
     console.error('Error al cargar versiones disponibles:', error);
   } finally {
     setLoading(false);
   }
 }

 function handleInstall() {
   if (selectedVersion) {
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
     
     onInstallVersion(selectedVersion);
     // No resetear la selección hasta que se complete - ahora lo hacemos según el evento
   }
 }

 return (
   <div className="install-version">
     {loading ? (
       <div className="loading">Cargando versiones disponibles...</div>
     ) : availableVersions.length > 0 ? (
       <>
         <div className="select-container">
           <select 
             className="version-select"
             value={selectedVersion}
             onChange={(e) => setSelectedVersion(e.target.value)}
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
         
         {installing ? (
           <div className="install-status">
             <div className="spinner"></div>
             <p>{installStatus || "Instalando..."}</p>
           </div>
         ) : (
           <button 
             className="btn btn-primary install-btn"
             onClick={handleInstall}
             disabled={!selectedVersion || installing}
           >
             Instalar versión seleccionada
           </button>
         )}
       </>
     ) : (
       <div className="empty-list">
         No se pudieron cargar las versiones disponibles. 
         Verifica tu conexión a internet o si necesitas permisos de administrador.
       </div>
     )}
   </div>
 );
}

export default InstallVersion;