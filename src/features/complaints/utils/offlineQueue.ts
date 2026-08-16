import { AttachmentUpload } from '@/api/endpoints/complaints.api';
import { CreateComplaintPayload } from '@/api/types/complaint.types';

export type OfflineQueueStatus = 'queued' | 'syncing' | 'failed' | 'synced';

export interface OfflineComplaintQueueItem {
  id: string;
  ownerUserId?: string;
  client_uuid: string;
  payload: CreateComplaintPayload;
  attachments: AttachmentUpload[];
  attachmentDirectoryUri?: string;
  status: OfflineQueueStatus;
  createdAt: string;
  syncedAt?: string;
  lastError?: string;
  nextRetryAt?: string;
  retryCount: number;
}

export function isQueueItemOwnedBy(item: OfflineComplaintQueueItem, userId?: string) {
  return !item.ownerUserId || item.ownerUserId === userId;
}
