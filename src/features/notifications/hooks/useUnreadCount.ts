import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { getUnreadCount } from '@/api/endpoints/notifications.api';
import { queryKeys } from '@/constants/queryKeys';
import { setApplicationBadge } from '@/features/notifications/utils/badge';

export function useUnreadCount() {
  const query = useQuery({
    queryKey: queryKeys.notificationUnreadCount,
    queryFn: getUnreadCount,
  });

  useEffect(() => {
    if (query.data) void setApplicationBadge(query.data.data.count);
  }, [query.data]);

  return query;
}
