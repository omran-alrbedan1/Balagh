import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/endpoints/notifications.api';
import { NotificationPreferenceUpdate } from '@/api/types/notification.types';
import { queryKeys } from '@/constants/queryKeys';

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: getNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationPreferenceUpdate) => updateNotificationPreferences(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, response);
    },
  });
}
