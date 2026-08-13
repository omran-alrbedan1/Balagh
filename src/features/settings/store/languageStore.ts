import { create } from 'zustand';

import {
  AppLanguage,
  applyLanguage,
  getStoredLanguage,
} from '@/features/settings/utils/languagePreference';

interface LanguageState {
  isHydrated: boolean;
  language: AppLanguage | null;
  hydrate: () => Promise<void>;
  selectLanguage: (language: AppLanguage) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  isHydrated: false,
  language: null,
  hydrate: async () => {
    const language = await getStoredLanguage();

    if (language) {
      await applyLanguage(language);
    }

    set({ language, isHydrated: true });
  },
  selectLanguage: async (language) => {
    await applyLanguage(language);
    set({ language, isHydrated: true });
  },
}));
