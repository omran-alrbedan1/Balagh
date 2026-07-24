import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logout } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { queryClient } from '@/lib/queryClient';

export function useLogout() {
  const clear = useAuthStore((state) => state.clear);

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      await clear();
      queryClient.clear();
      router.replace('/(auth)/login');
    },
  });
}
