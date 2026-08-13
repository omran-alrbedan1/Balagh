import { useMutation, useQueryClient } from '@tanstack/react-query';

import { syncOfflineComplaint } from '@/api/endpoints/complaints.api';
import { OfflineComplaintPayload } from '@/api/types/offline.types';

export function useSyncOfflineComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OfflineComplaintPayload) => syncOfflineComplaint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
}
