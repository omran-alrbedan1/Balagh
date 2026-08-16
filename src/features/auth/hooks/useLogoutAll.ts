import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logoutAll } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { clearLocalPushRegistration } from '@/features/notifications/utils/deviceTokenLifecycle';
import { queryClient } from '@/lib/queryClient';
import { clearPersistedPrivateQueries } from '@/lib/queryPersistence';

export function useLogoutAll() {
  const clear = useAuthStore((state) => state.clear);
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: async () => {
      return logoutAll();
    },
    networkMode: 'always',
    onSuccess: async () => {
      await clearLocalPushRegistration();
      await clearPersistedPrivateQueries(userId);
      await clear();
      queryClient.clear();
      router.replace('/(auth)/login');
    },
  });
}
