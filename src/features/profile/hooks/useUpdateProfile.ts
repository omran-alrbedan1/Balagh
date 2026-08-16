import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateProfile } from '@/api/endpoints/auth.api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (response) => {
      await updateUser(response.data);
      queryClient.setQueryData(queryKeys.authMe, response);
    },
  });
}
