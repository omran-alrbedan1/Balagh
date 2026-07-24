import { useQuery } from '@tanstack/react-query';

import { getComplaintStatuses } from '@/api/endpoints/lookups.api';
import { queryKeys } from '@/constants/queryKeys';

const SIXTY_MIN = 60 * 60 * 1000;

export function useComplaintStatuses() {
  return useQuery({
    queryKey: queryKeys.complaintStatuses,
    queryFn: async () => (await getComplaintStatuses()).data.statuses,
    staleTime: SIXTY_MIN,
  });
}
