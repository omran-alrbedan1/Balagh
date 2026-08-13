import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { I18nManager } from 'react-native';

import i18next from '@/lib/i18n';

export type AppLanguage = 'en' | 'ar';

export const LANGUAGE_STORAGE_KEY = 'app_language';

export const APP_LANGUAGES: {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  rtl: boolean;
}[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true },
];

export function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'en' || value === 'ar';
}

export async function getStoredLanguage() {
  const value = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(value) ? value : null;
}

export async function applyLanguage(code: AppLanguage) {
  const language = APP_LANGUAGES.find((item) => item.code === code) ?? APP_LANGUAGES[0];

  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  await i18next.changeLanguage(code);

  if (I18nManager.isRTL !== language.rtl) {
    I18nManager.allowRTL(language.rtl);
    I18nManager.forceRTL(language.rtl);

    try {
      await Updates.reloadAsync();
    } catch {
      // Reload is unavailable in some web/dev contexts.
    }
  }
}
