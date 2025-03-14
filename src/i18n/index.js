import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar archivos de traducción
import translationEN from './locales/en.json';
import translationES from './locales/es.json';

// Recursos de traducciones
const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
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
    fallbackLng: 'en', // Idioma por defecto si no se detecta o no está disponible
    interpolation: {
      escapeValue: false // React ya escapa los valores
    },
    detection: {
      order: ['navigator', 'localStorage', 'htmlTag'], // Orden de detección
      caches: ['localStorage'], // Guardar preferencia en localStorage
    }
  });

// Exponer una función para cambiar el idioma manualmente
export const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  // Guardar preferencia en localStorage
  localStorage.setItem('i18nextLng', lng);
};

// Obtener el idioma actual
export const getCurrentLanguage = () => {
  return i18n.language.split('-')[0]; // Convertir 'es-ES' a 'es'
};

export default i18n;