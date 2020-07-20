import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import languages from './locales';

i18n.use(LanguageDetector).init({
  // we init with resources
  resources: loadResources(languages),
  fallbackLng: 'en',
  debug: true,
  // have a common namespace used around the full app
  ns: ['translations'],
  defaultNS: 'translations',
  keySeparator: false, // we use content as keys
  interpolation: {
    escapeValue: false, // not needed for react!!
    formatSeparator: ',',
  },
  react: {
    wait: true,
  },
});

function loadResources (languages) {
  const result = {};
  if (languages) {
    Object.keys(languages).forEach(languageRef => {
      result[languages[languageRef].key] = {
        translations: languages[languageRef].translations,
      };
    });
  }
  console.debug('Translations Loaded Successfully', result);
  return result;
}

export default i18n;
