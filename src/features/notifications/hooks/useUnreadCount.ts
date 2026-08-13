import { useQuery } from '@tanstack/react-query';

import { getUnreadCount } from '@/api/endpoints/notifications.api';

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
  });
}
