import { useMutation } from '@tanstack/react-query';

import { verifyOtp } from '@/api/endpoints/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useVerifyOtp() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: verifyOtp,
    onSuccess: async (response) => {
      await setSession(response.data.token, response.data.user);
    },
  });
}
