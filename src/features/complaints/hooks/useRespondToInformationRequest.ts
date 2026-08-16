import { useMutation, useQueryClient } from '@tanstack/react-query';

import { respondToInformationRequest } from '@/api/endpoints/complaints.api';
import { queryKeys } from '@/constants/queryKeys';

interface RespondToInformationRequestVariables {
  complaintId: string;
  message: string;
}

export function useRespondToInformationRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ complaintId, message }: RespondToInformationRequestVariables) =>
      respondToInformationRequest(complaintId, message),
    onSuccess: async (_result, { complaintId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.complaint(complaintId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.complaintsRoot }),
      ]);
    },
  });
}
