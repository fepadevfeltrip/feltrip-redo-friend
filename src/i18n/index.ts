import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importações com a extensão .json (obrigatório agora)
import ptData from './locales/pt.json';
import enData from './locales/en.json';
import esData from './locales/es.json';

const resources = {
  en: { translation: enData },
  pt: { translation: ptData },
  es: { translation: esData },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Mantive exatamente a sua lógica de IFs originais
      convertDetectedLanguage: (lng: string) => {
        if (lng.startsWith('pt')) return 'pt';
        if (lng.startsWith('es')) return 'es';
        if (lng.startsWith('en')) return 'en';
        return lng.substring(0, 2);
      },
    },
  });

export default i18n;