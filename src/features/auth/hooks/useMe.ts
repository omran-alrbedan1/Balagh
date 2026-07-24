import { useQuery } from '@tanstack/react-query';

import { me } from '@/api/endpoints/auth.api';

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: me,
    staleTime: 10 * 60_000,
  });
}
