import React, { useState, useEffect } from "react";

function InstallVersion({ onInstallVersion }) {
  const [availableVersions, setAvailableVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAvailableVersions();

    // Escucha actualizaciones de estado de instalación
    const handleInstallUpdate = (event) => {
      const { status, message } = event.detail;
      console.log(`Actualización de estado: ${status} - ${message}`);
      setInstallStatus(message);

      if (status === "completed") {
        setTimeout(() => {
          setInstalling(false);
          setSelectedVersion(""); // Resetear la selección cuando termina
          setInstallStatus("");
          // Recargar las versiones instaladas
          loadAvailableVersions();
        }, 1500); // Pequeño retraso para que el usuario vea el mensaje final
      } else if (status === "error") {
        setTimeout(() => {
          setInstalling(false);
          setError(message || "Error durante la instalación");
          setInstallStatus("");
        }, 1500);
      }
    };

    document.addEventListener("install-status-update", handleInstallUpdate);

    return () => {
      document.removeEventListener(
        "install-status-update",
        handleInstallUpdate
      );
    };
  }, []);

  // En la función loadAvailableVersions después de recibir las versiones
  async function loadAvailableVersions() {
    setLoading(true);
    setError("");

    try {
      if (window.electronAPI) {
        const versions = await window.electronAPI.getAvailableVersions();

        // Ordenar versiones de menor a mayor (8, 11, 17, 21)
        const sortedVersions = [...versions].sort((a, b) => {
          // Extraer el número de versión del ID (openjdk-XX)
          const versionA = parseInt(a.id.split("-")[1]);
          const versionB = parseInt(b.id.split("-")[1]);
          return versionA - versionB;
        });

        setAvailableVersions(sortedVersions);
      } else {
        // Datos de ejemplo para desarrollo sin Electron (ya ordenados)
        setTimeout(() => {
          setAvailableVersions([
            { id: "openjdk-8", name: "OpenJDK 8 (LTS)" },
            { id: "openjdk-11", name: "OpenJDK 11 (LTS)" },
            { id: "openjdk-17", name: "OpenJDK 17 (LTS)" },
            { id: "openjdk-21", name: "OpenJDK 21 (LTS)" },
          ]);
        }, 800); // Simulación de carga en modo desarrollo
      }
    } catch (error) {
      console.error("Error al cargar versiones disponibles:", error);
      setError(
        "No se pudieron cargar las versiones. Verifica tu conexión a internet."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleInstall() {
    if (!selectedVersion) return;

    // Limpiar cualquier error previo
    setError("");

    // Información aproximada del tamaño de descarga
    const sizeInfo = {
      "openjdk-17": "~180 MB",
      "openjdk-21": "~190 MB",
      "zulu-11": "~200 MB",
      "zulu-8": "~160 MB",
      "liberica-11": "~190 MB",
      "liberica-8": "~150 MB",
    };

    setInstalling(true);
    setInstallStatus(
      `Preparando descarga... Tamaño aproximado: ${
        sizeInfo[selectedVersion] || "desconocido"
      }`
    );

    // Llamar a la función de instalación del componente padre
    onInstallVersion(selectedVersion);
  }

  function handleSelectChange(e) {
    setSelectedVersion(e.target.value);
    setError(""); // Limpiar errores al cambiar la selección
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
          {error ||
            "No se pudieron cargar las versiones disponibles. Verifica tu conexión a internet o si necesitas permisos de administrador."}
          <button
            className="install-btn"
            style={{ marginTop: "1rem" }}
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
