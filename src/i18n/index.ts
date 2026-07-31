import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import nl from './locales/nl';
import id from './locales/id';
import { resolveDeviceLanguage } from './language';

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    nl: { translation: nl },
    id: { translation: id },
  },
  lng: resolveDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18next;
