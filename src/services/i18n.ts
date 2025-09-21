import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import language resources
import koCommon from '../locales/ko/common.json';
import koInventory from '../locales/ko/inventory.json';
import koCooking from '../locales/ko/cooking.json';
import koProfile from '../locales/ko/profile.json';
import koShopping from '../locales/ko/shopping.json';
import koAddItem from '../locales/ko/addItem.json';

import enCommon from '../locales/en/common.json';
import enInventory from '../locales/en/inventory.json';
import enCooking from '../locales/en/cooking.json';
import enProfile from '../locales/en/profile.json';
import enShopping from '../locales/en/shopping.json';
import enAddItem from '../locales/en/addItem.json';

// Combine resources
const resources = {
  ko: {
    common: koCommon,
    inventory: koInventory,
    cooking: koCooking,
    profile: koProfile,
    shopping: koShopping,
    addItem: koAddItem,
  },
  en: {
    common: enCommon,
    inventory: enInventory,
    cooking: enCooking,
    profile: enProfile,
    shopping: enShopping,
    addItem: enAddItem,
  },
};

// Language detection function
const detectUserLanguage = async (): Promise<string> => {
  try {
    // Check stored language preference
    const storedLanguage = await AsyncStorage.getItem('user_language');
    if (storedLanguage) {
      return storedLanguage;
    }

    // Default to Korean
    return 'ko';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'ko';
  }
};

// Initialize i18n
const initI18n = async () => {
  const language = await detectUserLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: language,
      fallbackLng: 'ko',
      defaultNS: 'common',
      ns: ['common', 'inventory', 'cooking', 'profile'],

      interpolation: {
        escapeValue: false,
      },

      react: {
        useSuspense: false,
      },

      debug: false,
    });
};

// Change language function
export const changeLanguage = async (lang: string): Promise<void> => {
  try {
    // Save language preference
    await AsyncStorage.setItem('user_language', lang);

    // Change i18n language
    await i18n.changeLanguage(lang);

    console.log('Language changed to:', lang);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'ko';
};

// Get available languages
export const getAvailableLanguages = () => [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

// Initialize on app start
initI18n();

export default i18n;