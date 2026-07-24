import { create } from 'zustand';

import { AuthUser } from '@/api/types/auth.types';
import { clearSession, getToken, saveSession } from '@/lib/secureStorage';
import { me } from '@/api/endpoints/auth.api';

interface AuthState {
  isHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  token: null,
  user: null,
  hydrate: async () => {
    const token = await getToken();
    if (!token) {
      set({ token: null, user: null, isHydrated: true });
      return;
    }

    try {
      const response = await me();
      const user = response.data;
      await saveSession(token, user);
      set({ token, user, isHydrated: true });
    } catch {
      await clearSession();
      set({ token: null, user: null, isHydrated: true });
    }
  },
  setSession: async (token, user) => {
    await saveSession(token, user);
    set({ token, user });
  },
  clear: async () => {
    await clearSession();
    set({ token: null, user: null });
  },
}));
