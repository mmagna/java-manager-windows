import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar archivos de traducción
import translationEN from './locales/en.json';
import translationES from './locales/es.json';
import translationFR from './locales/fr.json';
import translationDE from './locales/de.json';
import translationPT from './locales/pt.json';

// Recursos de traducciones
const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  fr: { translation: translationFR },
  de: { translation: translationDE },
  pt: { translation: translationPT }
};

// Configuración de i18next
i18n
  // Detector de idioma del navegador
  .use(LanguageDetector)
  // Integración con React
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

// Exponer una función para cambiar el idioma manualmente
export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
};

// Obtener el idioma actual
export const getCurrentLanguage = () => {
  return i18n.language.split('-')[0];
};

export default i18n;