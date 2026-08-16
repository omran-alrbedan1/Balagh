import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

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
  const requestQueue = useRef<Promise<void>>(Promise.resolve());

  return useMutation({
    mutationFn: (payload: NotificationPreferenceUpdate) => {
      const request = requestQueue.current.then(() => updateNotificationPreferences(payload));
      requestQueue.current = request.then(
        () => undefined,
        () => undefined,
      );
      return request;
    },
    networkMode: 'always',
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, response);
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notificationPreferences });
    },
  });
}
