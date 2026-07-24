import { useQuery } from '@tanstack/react-query';

import { getDepartments } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';

const THIRTY_MIN = 30 * 60 * 1000;

export function useDepartments() {
  return useQuery({
    gcTime: 60 * 60 * 1000,
    queryKey: queryKeys.departments,
    queryFn: async () => (await getDepartments()).data.departments,
    staleTime: THIRTY_MIN,
  });
}
