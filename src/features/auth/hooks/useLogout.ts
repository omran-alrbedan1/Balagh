import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logout } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cleanupDeviceTokenForUser } from '@/features/notifications/utils/deviceTokenLifecycle';
import { queryClient } from '@/lib/queryClient';
import { clearPersistedPrivateQueries } from '@/lib/queryPersistence';

export function useLogout() {
  const clear = useAuthStore((state) => state.clear);
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation({
    mutationFn: async () => {
      await cleanupDeviceTokenForUser(userId);
      return logout();
    },
    onSettled: async () => {
      await clearPersistedPrivateQueries(userId);
      await clear();
      queryClient.clear();
      router.replace('/(auth)/login');
    },
  });
}
