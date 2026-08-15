import { AttachmentUpload } from '@/api/endpoints/complaints.api';
import { CreateComplaintPayload } from '@/api/types/complaint.types';

export type OfflineQueueStatus = 'queued' | 'syncing' | 'failed' | 'synced';

export interface OfflineComplaintQueueItem {
  id: string;
  client_uuid: string;
  payload: CreateComplaintPayload;
  attachments: AttachmentUpload[];
  status: OfflineQueueStatus;
  createdAt: string;
  syncedAt?: string;
  lastError?: string;
  retryCount: number;
}
