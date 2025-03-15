import React, { useState } from "react";
import { useTranslation } from "react-i18next";

function JavaVersionList({
  versions,
  onSetVersion,
  onUninstallVersion,
  loading,
}) {
  const { t } = useTranslation();
  const [activatingVersion, setActivatingVersion] = useState(null);

  if (loading) {
    return <div className="loading">{t("versionList.loading")}</div>;
  }

  if (!versions || versions.length === 0) {
    return <div className="empty-list">{t("versionList.noVersions")}</div>;
  }

  // En el componente JavaVersionList.jsx
  const handleActivate = async (versionId) => {
    setActivatingVersion(versionId);
    try {
      await onSetVersion(versionId);
    } catch (error) {
      console.error("Error al activar la versión:", error);
    } finally {
      // Dar un retraso más largo para que el sistema termine de configurar Java
      setTimeout(() => {
        setActivatingVersion(null);
      }, 3000);
    }
  };

  return (
    <div className="version-list">
      {versions.map((version) => (
        <div
          key={version.version}
          className={`version-item ${version.active ? "active" : ""}`}
        >
          <div className="version-info">
            <div className="version-name">{version.name}</div>
            <div className="version-path">{version.path}</div>
          </div>
          <div className="version-actions">
            {!version.active ? (
              <button
                onClick={() => handleActivate(version.version)}
                className="btn btn-primary"
                disabled={activatingVersion === version.version}
              >
                {activatingVersion === version.version ? (
                  <span>
                    <span className="spinner-small"></span>{" "}
                    {t("versionList.activating")}
                  </span>
                ) : (
                  t("versionList.activate")
                )}
              </button>
            ) : (
              <div className="version-active-indicator">
                {t("versionList.active")}
              </div>
            )}
            <button
              onClick={() => onUninstallVersion(version.version)}
              className="btn btn-danger"
              disabled={version.active || activatingVersion !== null}
            >
              {t("versionList.uninstall")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default JavaVersionList;
