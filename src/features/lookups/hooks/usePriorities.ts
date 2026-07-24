import { useQuery } from '@tanstack/react-query';

import { getPriorities } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';

const SIXTY_MIN = 60 * 60 * 1000;

export function usePriorities() {
  return useQuery({
    queryKey: queryKeys.priorities,
    queryFn: async () => (await getPriorities()).data.priorities,
    staleTime: SIXTY_MIN,
  });
}
