import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addComplaintAttachments, AttachmentUpload } from '@/api/endpoints/complaints.api';
import { queryKeys } from '@/constants/queryKeys';

interface AddComplaintAttachmentsVariables {
  complaintId: string;
  attachments: AttachmentUpload[];
}

export function useAddComplaintAttachments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attachments, complaintId }: AddComplaintAttachmentsVariables) =>
      addComplaintAttachments(complaintId, attachments),
    onSuccess: async (_result, { complaintId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.complaint(complaintId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.complaintsRoot }),
      ]);
    },
  });
}
