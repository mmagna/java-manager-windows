import React from 'react';
import { useTranslation } from 'react-i18next';

function CurrentVersion({ currentVersion, loading }) {
  const { t } = useTranslation();
  
  if (loading) {
    return <div className="loading">{t('installVersion.loading')}</div>;
  }

  if (!currentVersion) {
    return (
      <div className="current-version not-set">
        <h3>{t('currentVersion.notSet')}</h3>
        <p>{t('currentVersion.notSetDescription')}</p>
      </div>
    );
  }

  return (
    <div className="current-version">
      <h3>{t('sections.currentVersion')}</h3>
      <div className="version-badge">{currentVersion.name}</div>
      <div className="version-details">
        <p><strong>{t('currentVersion.version')}:</strong> {currentVersion.version}</p>
        <p><strong>{t('currentVersion.path')}:</strong> {currentVersion.path}</p>
      </div>
    </div>
  );
}

export default CurrentVersion;