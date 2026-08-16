import { useQuery } from '@tanstack/react-query';

import { getComplaints, GetComplaintsParams } from '@/api/endpoints/complaints.api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useComplaints(params?: GetComplaintsParams) {
  const userId = useAuthStore((state) => state.user?.id);
  const ownerUserId = userId == null ? undefined : String(userId);

  return useQuery({
    queryKey: queryKeys.complaints(params, ownerUserId),
    queryFn: () => getComplaints(params),
    retry: false,
  });
}
