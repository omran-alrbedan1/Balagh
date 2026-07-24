import { useQuery } from '@tanstack/react-query';

import { getComplaints, GetComplaintsParams } from '@/api/endpoints/complaints.api';
import { queryKeys } from '@/constants/queryKeys';

export function useComplaints(params?: GetComplaintsParams) {
  return useQuery({
    queryKey: queryKeys.complaints(params),
    queryFn: () => getComplaints(params),
    retry: false,
  });
}
