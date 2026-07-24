import { CreateComplaintPayload } from '@/api/types/complaint.types';

export type OfflineQueueStatus = 'queued' | 'uploading' | 'synced' | 'failed';

export interface OfflineComplaintQueueItem {
  id: string;
  payload: CreateComplaintPayload;
  status: OfflineQueueStatus;
  createdAt: string;
  lastError?: string;
}
