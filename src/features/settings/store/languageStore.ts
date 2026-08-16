import { create } from 'zustand';

import {
  AppLanguage,
  applyLanguage,
  getStoredLanguage,
} from '@/features/settings/utils/languagePreference';

interface LanguageState {
  isHydrated: boolean;
  language: AppLanguage | null;
  requiresRestart: boolean;
  hydrate: () => Promise<void>;
  selectLanguage: (language: AppLanguage) => Promise<boolean>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  isHydrated: false,
  language: null,
  requiresRestart: false,
  hydrate: async () => {
    const language = await getStoredLanguage();
    let requiresRestart = false;

    if (language) {
      requiresRestart = await applyLanguage(language);
    }

    set({ language, isHydrated: true, requiresRestart });
  },
  selectLanguage: async (language) => {
    const requiresRestart = await applyLanguage(language);
    set({ language, isHydrated: true, requiresRestart });
    return requiresRestart;
  },
}));
