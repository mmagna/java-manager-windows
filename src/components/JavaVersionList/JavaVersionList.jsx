import React from "react";
import { useTranslation } from "react-i18next";

function JavaVersionList({
  versions,
  onSetVersion,
  onUninstallVersion,
  loading,
}) {
  const { t } = useTranslation();

  if (loading) {
    return <div className="loading">{t('versionList.loading')}</div>;
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="empty-list">
        {t('versionList.noVersions')}
      </div>
    );
  }

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
                onClick={() => onSetVersion(version.version)}
                className="btn btn-primary"
              >
                {t('versionList.activate')}
              </button>
            ) : (
              <div className="version-active-indicator">{t('versionList.active')}</div>
            )}
            <button
              onClick={() => onUninstallVersion(version.version)}
              className="btn btn-danger"
              disabled={version.active}
            >
              {t('versionList.uninstall')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default JavaVersionList;