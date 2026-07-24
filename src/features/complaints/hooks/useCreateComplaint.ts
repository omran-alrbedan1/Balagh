import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createComplaint, extractComplaint } from '@/api/endpoints/complaints.api';
import { CreateComplaintPayload } from '@/api/types/complaint.types';
import { queryKeys } from '@/constants/queryKeys';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const enqueue = useOfflineQueueStore((state) => state.enqueue);

  return useMutation({
    mutationFn: async () => {
      const draft = useDraftComplaintStore.getState();

      const payload: CreateComplaintPayload = {
        client_ref: draft.clientRef,
        department_id: draft.departmentId ?? '',
        category_id: draft.categoryId ?? '',
        title: draft.title,
        description: draft.description,
        location: draft.location,
      };
      const attachmentUris = draft.attachments.map((attachment) => attachment.uri);

      if (!isOnline) {
        enqueue({ payload, attachmentUris });
        return { queued: true as const };
      }

      const result = await createComplaint(payload, attachmentUris);
      return { complaint: extractComplaint(result), queued: false as const };
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.complaintsRoot });

      if (!result.queued && result.complaint) {
        useDraftComplaintStore.getState().reset();
      }
    },
  });
}
