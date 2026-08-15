import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteNotification } from '@/api/endpoints/notifications.api';
import { queryKeys } from '@/constants/queryKeys';

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot });
    },
  });
}
