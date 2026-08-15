import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markAllAsRead } from '@/api/endpoints/notifications.api';
import { queryKeys } from '@/constants/queryKeys';
import { setApplicationBadge } from '@/features/notifications/utils/badge';

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.notificationUnreadCount, {
        success: true,
        data: { count: 0 },
      });
      void setApplicationBadge(0);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsRoot });
    },
  });
}
