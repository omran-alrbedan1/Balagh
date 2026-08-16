import { create } from 'zustand';

import { ApiError } from '@/api/client';
import { AuthUser } from '@/api/types/auth.types';
import { clearSession, getStoredUser, getToken, saveSession } from '@/lib/secureStorage';
import { extractAuthUser, me } from '@/api/endpoints/auth.api';
import { fetchConnectivityStatus } from '@/hooks/useNetworkStatus';

interface AuthState {
  isHydrated: boolean;
  token: string | null;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: AuthUser | { user: AuthUser }) => Promise<void>;
  updateUser: (user: AuthUser | { user: AuthUser }) => Promise<void>;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isHydrated: false,
  token: null,
  user: null,
  hydrate: async () => {
    const [token, cachedUser] = await Promise.all([getToken(), getStoredUser()]);
    if (!token) {
      set({ token: null, user: null, isHydrated: true });
      return;
    }

    // A previously authenticated session is usable before the network is available.
    set({ token, user: cachedUser });

    try {
      const connectivity = await fetchConnectivityStatus();
      if (connectivity === 'offline') {
        set({ isHydrated: true });
        return;
      }

      const response = await me();
      const user = response.data;
      await saveSession(token, user);
      set({ token, user, isHydrated: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearSession();
        set({ token: null, user: null, isHydrated: true });
        return;
      }

      // DNS, timeout, offline and server failures must not turn into a logout.
      set({ token, user: cachedUser, isHydrated: true });
    }
  },
  setSession: async (token, user) => {
    const normalizedUser = extractAuthUser(user);
    await saveSession(token, normalizedUser);
    set({ token, user: normalizedUser });
  },
  updateUser: async (user) => {
    const token = get().token;
    if (!token) return;

    const normalizedUser = extractAuthUser(user);
    await saveSession(token, normalizedUser);
    set({ user: normalizedUser });
  },
  clear: async () => {
    await clearSession();
    set({ token: null, user: null });
  },
}));
