import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { resetPassword } from '@/api/endpoints/auth.api';

export function useResetPassword() {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });
}
