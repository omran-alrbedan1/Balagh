import { useMutation } from '@tanstack/react-query';

import { previewClassification } from '@/api/endpoints/classification.api';
import { ClassificationPreviewPayload } from '@/api/types/classification.types';
import { useDraftComplaintStore } from '@/features/complaints/store/draftComplaintStore';
import { normalizeClassificationConfidence } from '@/features/complaints/utils/classificationConfidence';

export function useClassifyComplaint() {
  const setClassification = useDraftComplaintStore((state) => state.setClassification);

  return useMutation({
    mutationFn: (payload: ClassificationPreviewPayload) => previewClassification(payload),
    onSuccess: (response) => {
      const { data } = response;

      setClassification({
        status: 'success',
        departmentId: data.department ? String(data.department.id) : undefined,
        departmentName: data.department?.name,
        categoryId: data.category ? String(data.category.id) : undefined,
        categoryName: data.category?.name,
        confidence: normalizeClassificationConfidence(data.confidence),
        method: data.method,
        error: undefined,
      });
    },
    onError: (error) => {
      setClassification({
        status: 'error',
        error: error instanceof Error ? error.message : 'Classification failed.',
      });
    },
  });
}
