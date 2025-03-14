import React from 'react';

function CurrentVersion({ currentVersion, loading }) {
  if (loading) {
    return <div className="loading">Cargando versión actual...</div>;
  }

  if (!currentVersion) {
    return (
      <div className="current-version not-set">
        <h3>No hay ninguna versión de Java establecida</h3>
        <p>No se ha configurado ninguna versión de Java como activa.</p>
      </div>
    );
  }

  return (
    <div className="current-version">
      <h3>Versión actual de Java</h3>
      <div className="version-badge">{currentVersion.name}</div>
      <div className="version-details">
        <p><strong>Versión:</strong> {currentVersion.version}</p>
        <p><strong>Ruta:</strong> {currentVersion.path}</p>
      </div>
    </div>
  );
}

export default CurrentVersion;