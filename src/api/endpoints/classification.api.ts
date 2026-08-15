import { apiClient } from '@/api/client';
import { ApiEnvelope } from '@/api/types/api-envelope.types';
import {
  ClassificationPreviewPayload,
  ClassificationPreviewResult,
} from '@/api/types/classification.types';

export async function previewClassification(payload: ClassificationPreviewPayload) {
  const response = await apiClient.post<ApiEnvelope<ClassificationPreviewResult>>(
    '/classification/complaints/preview',
    payload,
  );
  return response.data;
}
