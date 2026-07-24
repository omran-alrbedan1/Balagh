import { create } from 'zustand';

import { CreateComplaintPayload } from '@/api/types/complaint.types';

interface QueueItem {
  attachmentUris: string[];
  payload: CreateComplaintPayload;
}

interface OfflineQueueState {
  enqueue: (item: QueueItem) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>(() => ({
  enqueue: () => {
    // Persisted offline queue and background sync land in Phase 9.
  },
}));
