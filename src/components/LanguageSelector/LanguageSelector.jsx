import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.scss'; // Asumiendo que estás usando SCSS

// Importa las imágenes SVG directamente
import gbFlag from '../../assets/flags/gb.svg';
import esFlag from '../../assets/flags/es.svg';

function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.split('-')[0]; // Convertir 'es-ES' a 'es'
  
  const languages = [
    { code: 'en', name: 'English', flag: gbFlag },
    { code: 'es', name: 'Español', flag: esFlag }
  ];
  
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
  };
  
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];
  
  return (
    <div className="language-selector">
      <div className="language-display">
        <img 
          src={currentLanguage.flag} 
          alt={`${currentLanguage.name} flag`} 
          className="flag-icon"
        />
        <select 
          value={currentLang} 
          onChange={handleLanguageChange}
          className="language-select"
          aria-label="Select language"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LanguageSelector;