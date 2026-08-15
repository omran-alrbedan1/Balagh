import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markAsRead } from '@/api/endpoints/notifications.api';
import { queryKeys } from '@/constants/queryKeys';

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot });
    },
  });
}
