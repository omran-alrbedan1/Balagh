import { useMutation } from '@tanstack/react-query';

import { register } from '@/api/endpoints/auth.api';

export function useRegister() {
  return useMutation({
    mutationFn: register,
  });
}
