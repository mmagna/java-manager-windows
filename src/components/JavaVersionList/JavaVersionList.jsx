import React from 'react';
import './JavaVersionList.css';

function JavaVersionList({ versions, onSetVersion, onUninstallVersion, loading }) {
  if (loading) {
    return <div className="loading">Cargando versiones instaladas...</div>;
  }

  if (!versions || versions.length === 0) {
    return <div className="empty-list">No se encontraron versiones de Java instaladas</div>;
  }

  return (
    <div className="version-list">
      {versions.map((version) => (
        <div key={version.version} className={`version-item ${version.active ? 'active' : ''}`}>
          <div className="version-info">
            <div className="version-name">{version.name}</div>
            <div className="version-path">{version.path}</div>
          </div>
          <div className="version-actions">
            {!version.active && (
              <button 
                onClick={() => onSetVersion(version.version)} 
                className="btn btn-primary"
              >
                Activar
              </button>
            )}
            <button 
              onClick={() => onUninstallVersion(version.version)}
              className="btn btn-danger"
              disabled={version.active}
            >
              Desinstalar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default JavaVersionList;