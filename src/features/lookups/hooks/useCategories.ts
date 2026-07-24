import { useQuery } from '@tanstack/react-query';

import { getCategories } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';

const THIRTY_MIN = 30 * 60 * 1000;

export function useCategories(departmentId?: string) {
  return useQuery({
    enabled: Boolean(departmentId),
    queryKey: queryKeys.categories(departmentId),
    queryFn: async () => (await getCategories(departmentId)).data.categories,
    staleTime: THIRTY_MIN,
  });
}
