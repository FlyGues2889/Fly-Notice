import { createI18n } from 'vue-i18n';
import zh from './locales/zh';
import en from './locales/en';

// Define message translations
const messages = {
  zh,
  en
};

// Automatically detect the device's current language with localstorage backup
const getDeviceLanguage = (): 'zh' | 'en' => {
  // Check user manual setting from localStorage first
  const storedConfig = localStorage.getItem('m3_config');
  if (storedConfig) {
    try {
      const config = JSON.parse(storedConfig);
      if (config && (config.language === 'zh' || config.language === 'en')) {
        return config.language;
      }
    } catch (e) {
      // ignore
    }
  }

  const storedLanguage = localStorage.getItem('app_language');
  if (storedLanguage === 'zh' || storedLanguage === 'en') {
    return storedLanguage;
  }

  // Detect browser/device language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh')) {
      return 'zh';
    }
  }
  return 'en';
};

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getDeviceLanguage(), // Automatically identify current device language and sync
  fallbackLocale: 'zh',
  globalInjection: true, // Inject $t, $d, $n etc. globally
  messages
});

export default i18n;
