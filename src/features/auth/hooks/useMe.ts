import { useQuery } from '@tanstack/react-query';

import { me } from '@/api/endpoints/auth.api';
import { queryKeys } from '@/constants/queryKeys';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.authMe,
    queryFn: me,
    staleTime: 10 * 60_000,
  });
}
