import { useQuery } from '@tanstack/react-query';

import { getComplaint } from '@/api/endpoints/complaints.api';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';
import { normalizeComplaintId } from '@/features/complaints/utils/complaintId';

export function useComplaintDetail(id: unknown) {
  const userId = useAuthStore((state) => state.user?.id);
  const ownerUserId = userId == null ? undefined : String(userId);
  const complaintId = normalizeComplaintId(id);

  return useQuery({
    enabled: complaintId !== null,
    queryKey: queryKeys.complaint(complaintId ?? 'invalid', ownerUserId),
    queryFn: () => getComplaint(complaintId),
    refetchOnMount: 'always',
    retry: false,
    staleTime: 30 * 1000,
  });
}
