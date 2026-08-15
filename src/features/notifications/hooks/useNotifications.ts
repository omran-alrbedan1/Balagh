import { useInfiniteQuery } from '@tanstack/react-query';

import { getNotifications } from '@/api/endpoints/notifications.api';
import { queryKeys } from '@/constants/queryKeys';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
  });
}
