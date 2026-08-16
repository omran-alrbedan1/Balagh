import { useQuery } from '@tanstack/react-query';

import { getHomeDashboard } from '@/api/endpoints/home.api';
import { queryKeys } from '@/constants/queryKeys';

export function useHomeStats() {
  return useQuery({
    queryKey: queryKeys.homeDashboard,
    queryFn: getHomeDashboard,
    retry: false,
    staleTime: 60_000,
  });
}
