import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./LanguageSelector.scss";

// Importa las imágenes SVG directamente
import gbFlag from "../../assets/flags/gb.svg";
import esFlag from "../../assets/flags/es.svg";
import frFlag from "../../assets/flags/fr.svg";
import deFlag from "../../assets/flags/de.svg";
import ptFlag from "../../assets/flags/pt.svg";

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentLang = i18n.language.split("-")[0]; // Convertir 'es-ES' a 'es'

  const languages = [
    { code: "en", name: "English", flag: gbFlag },
    { code: "es", name: "Español", flag: esFlag },
    { code: "fr", name: "Français", flag: frFlag },
    { code: "de", name: "Deutsch", flag: deFlag },
    { code: "pt", name: "Português", flag: ptFlag },
  ];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
    
    // Guardar la preferencia en Electron también
    if (window.electronAPI && window.electronAPI.setAppLanguage) {
      window.electronAPI.setAppLanguage(langCode);
    }
  };

  // Cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentLanguage =
    languages.find((lang) => lang.code === currentLang) || languages[0];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <div className="current-language" onClick={() => setIsOpen(!isOpen)}>
        <img
          src={currentLanguage.flag}
          alt={`${currentLanguage.name} flag`}
          className="flag-icon"
        />
        <span className="selected-language">{currentLanguage.name}</span>
        <span className="dropdown-arrow"></span>
      </div>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`language-option ${
                lang.code === currentLang ? "active" : ""
              }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <img
                src={lang.flag}
                alt={`${lang.name} flag`}
                className="flag-icon"
              />
              <span>{lang.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
