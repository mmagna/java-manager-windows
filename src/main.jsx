import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/main.scss';
// Importar i18n antes de cualquier componente
import './i18n';
import App from './App.jsx';

// Componente para inicializar i18n con el idioma del sistema si está disponible
function AppWithI18n() {
  useEffect(() => {
    async function initLanguage() {
      // Si estamos en Electron, intentar obtener el idioma del sistema
      if (window.electronAPI && window.electronAPI.getSystemLanguage) {
        try {
          const systemLocale = await window.electronAPI.getSystemLanguage();
          // Convertir 'es-ES' a 'es'
          const language = systemLocale.split('-')[0];
          
          // Cambiar idioma solo si es uno de los soportados
          if (['en', 'es'].includes(language)) {
            // i18n ya está configurado para usar localStorage, así que solo necesitamos
            // cambiar el idioma si es diferente del actual
            const currentLang = localStorage.getItem('i18nextLng') || 'en';
            if (currentLang !== language) {
              import('./i18n').then(module => {
                module.changeLanguage(language);
              });
            }
          }
        } catch (error) {
          console.error('Error al detectar idioma del sistema:', error);
        }
      }
    }
    
    initLanguage();
  }, []);
  
  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<AppWithI18n />);