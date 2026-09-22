import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      'zh-HK': { translation: zhTW },
      'zh-MO': { translation: zhTW },
      zh: { translation: zhCN }, // Default to Simplified for generic 'zh'
    },
    fallbackLng: 'en',
    // Ensure English is used for any non-Chinese locale
    // The browser detector returns locales like 'en-US', 'fr', 'jp', etc.
    // If it's not explicitly 'zh', 'zh-CN', 'zh-TW', etc., we want it to fall back to 'en'.
    // BUT 'zh' generic needs to be handled carefully.
    
    supportedLngs: ['en', 'zh-CN', 'zh-TW', 'zh-HK', 'zh-MO', 'zh'],
    nonExplicitSupportedLngs: true, // Allow 'en-US' to match 'en'
    
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Prioritize navigator (browser setting)
      order: ['querystring', 'navigator', 'localStorage', 'htmlTag'],
      
      // Only cache if user explicitly changes language
      // If we cache automatically, a user who visits with Chinese browser but then switches to English browser
      // might still see Chinese because of localStorage.
      // Better to NOT cache 'navigator' detection results permanently unless user clicks a button.
      caches: ['localStorage'],
      
      // Transform all 'zh-*' to supported variants, everything else to 'en'
      // Actually i18next does this via fallbackLng, but let's be strict.
      convertDetectedLanguage: (lng) => {
        if (lng.startsWith('zh')) {
            // Keep specific Chinese variants
            return lng; 
        }
        // Force everything else to English
        return 'en';
      },
    },
  });

export default i18n;
