import { useQuery } from '@tanstack/react-query';

import { getComplaint } from '@/api/endpoints/complaints.api';
import { queryKeys } from '@/constants/queryKeys';

export function useComplaintDetail(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.complaint(id),
    queryFn: () => getComplaint(id),
    refetchOnMount: 'always',
    retry: false,
    staleTime: 30 * 1000,
  });
}
