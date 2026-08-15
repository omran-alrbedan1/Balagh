import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { AttachmentUpload } from '@/api/endpoints/complaints.api';
import { CreateComplaintPayload } from '@/api/types/complaint.types';
import {
  OfflineComplaintQueueItem,
  OfflineQueueStatus,
} from '@/features/complaints/utils/offlineQueue';
import { generateUUID } from '@/features/offline/utils/uuid';

const STORAGE_KEY = 'balagh.offlineQueue.v1';
export const MAX_RETRIES = 5;

export interface EnqueueInput {
  attachments: AttachmentUpload[];
  payload: CreateComplaintPayload;
}

interface OfflineQueueState {
  items: OfflineComplaintQueueItem[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  enqueue: (input: EnqueueInput) => Promise<OfflineComplaintQueueItem>;
  markSyncing: (id: string) => Promise<void>;
  markFailed: (id: string, error: string) => Promise<void>;
  markSynced: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function readItems(): Promise<OfflineComplaintQueueItem[]> {
  return AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);

      return Array.isArray(parsed) ? (parsed as OfflineComplaintQueueItem[]) : [];
    })
    .catch(() => []);
}

function persistItems(items: OfflineComplaintQueueItem[]) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
    // Non-fatal: queue stays in memory for the current session.
  });
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => ({
  items: [],
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    const items = await readItems();
    set({ items, isHydrated: true });
  },

  enqueue: async ({ attachments, payload }) => {
    const id = await generateUUID();
    const item: OfflineComplaintQueueItem = {
      id,
      client_uuid: payload.client_ref || id,
      payload,
      attachments,
      status: 'queued',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    const items = [...get().items, item];
    set({ items });
    void persistItems(items);

    return item;
  },

  markSyncing: async (id) => {
    const items = get().items.map((item) =>
      item.id === id ? { ...item, status: 'syncing' as OfflineQueueStatus } : item,
    );
    set({ items });
    void persistItems(items);
  },

  markFailed: async (id, error) => {
    const items = get().items.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'failed' as OfflineQueueStatus,
            lastError: error,
            retryCount: item.retryCount + 1,
          }
        : item,
    );
    set({ items });
    void persistItems(items);
  },

  markSynced: async (id) => {
    const items = get().items.map((item) =>
      item.id === id
        ? {
            ...item,
            status: 'synced' as OfflineQueueStatus,
            syncedAt: new Date().toISOString(),
          }
        : item,
    );
    set({ items });
    void persistItems(items);

    void get().remove(id);
  },

  remove: async (id) => {
    const items = get().items.filter((item) => item.id !== id);
    set({ items });
    void persistItems(items);
  },
}));

export function canRetry(item: OfflineComplaintQueueItem) {
  return item.retryCount < MAX_RETRIES;
}
