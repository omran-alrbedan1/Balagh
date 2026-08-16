import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { AttachmentUpload } from '@/api/endpoints/complaints.api';
import { CreateComplaintPayload } from '@/api/types/complaint.types';
import {
  persistOfflineAttachments,
  removeOfflineAttachments,
} from '@/features/complaints/utils/offlineAttachmentStorage';
import { OfflineComplaintQueueItem } from '@/features/complaints/utils/offlineQueue';
import { generateUUID } from '@/features/offline/utils/uuid';

const STORAGE_KEY = 'balagh.offlineQueue.v2';
const LEGACY_STORAGE_KEY = 'balagh.offlineQueue.v1';
const SCHEMA_VERSION = 2;
export const MAX_RETRIES = 5;

interface PersistedQueue {
  version: number;
  items: OfflineComplaintQueueItem[];
}

export interface EnqueueInput {
  attachments: AttachmentUpload[];
  ownerUserId?: string;
  payload: CreateComplaintPayload;
}

interface OfflineQueueState {
  items: OfflineComplaintQueueItem[];
  isHydrated: boolean;
  hydrationError?: string;
  hydrate: () => Promise<void>;
  enqueue: (input: EnqueueInput) => Promise<OfflineComplaintQueueItem>;
  markSyncing: (id: string) => Promise<void>;
  markFailed: (id: string, error: string, retryable: boolean) => Promise<void>;
  markSynced: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

let writeChain: Promise<void> = Promise.resolve();

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeChain.then(operation, operation);
  writeChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readItems(): Promise<OfflineComplaintQueueItem[]> {
  const current = await AsyncStorage.getItem(STORAGE_KEY);
  if (current) {
    const parsed = JSON.parse(current) as Partial<PersistedQueue>;
    return parsed.version === SCHEMA_VERSION && Array.isArray(parsed.items) ? parsed.items : [];
  }

  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) {
    return [];
  }

  const parsed: unknown = JSON.parse(legacy);
  return Array.isArray(parsed) ? (parsed as OfflineComplaintQueueItem[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isQueueItem(value: unknown): value is OfflineComplaintQueueItem {
  if (!isRecord(value) || !isRecord(value.payload)) return false;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.client_uuid === 'string' &&
    value.client_uuid.length > 0 &&
    typeof value.payload.title === 'string' &&
    typeof value.payload.description === 'string' &&
    Array.isArray(value.attachments) &&
    ['queued', 'syncing', 'failed', 'synced'].includes(String(value.status)) &&
    typeof value.createdAt === 'string' &&
    typeof value.retryCount === 'number'
  );
}

export function sanitizeOfflineQueueItems(items: unknown[]): OfflineComplaintQueueItem[] {
  const seenIds = new Set<string>();
  const seenClientUuids = new Set<string>();

  return items.filter((item): item is OfflineComplaintQueueItem => {
    if (!isQueueItem(item)) return false;
    const ownerClientKey = `${item.ownerUserId ?? 'legacy'}:${item.client_uuid}`;
    if (seenIds.has(item.id) || seenClientUuids.has(ownerClientKey)) return false;
    seenIds.add(item.id);
    seenClientUuids.add(ownerClientKey);
    return true;
  });
}

async function persistItems(items: OfflineComplaintQueueItem[]) {
  const queue: PersistedQueue = { version: SCHEMA_VERSION, items };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

function backoffMs(retryCount: number) {
  return [2_000, 5_000, 15_000, 30_000, 60_000][Math.min(retryCount, 4)];
}

export const useOfflineQueueStore = create<OfflineQueueState>((set, get) => {
  const update = (transform: (items: OfflineComplaintQueueItem[]) => OfflineComplaintQueueItem[]) =>
    serializeWrite(async () => {
      const items = transform(get().items);
      await persistItems(items);
      set({ items });
    });

  return {
    items: [],
    isHydrated: false,

    hydrate: async () => {
      if (get().isHydrated) {
        return;
      }

      try {
        const persistedItems = await readItems();
        let items = sanitizeOfflineQueueItems(persistedItems);
        if (items.length !== persistedItems.length) {
          await persistItems(items);
        }
        const recovered = items.map((item) =>
          item.status === 'syncing'
            ? {
                ...item,
                status: 'queued' as const,
                lastError: item.lastError ?? 'Synchronization was interrupted and will retry.',
                nextRetryAt: undefined,
              }
            : item,
        );

        if (recovered.some((item, index) => item !== items[index])) {
          await persistItems(recovered);
        }
        items = recovered;

        const synced = items.filter((item) => item.status === 'synced');
        for (const item of synced) {
          try {
            await removeOfflineAttachments(item.attachmentDirectoryUri);
            items = items.filter((candidate) => candidate.id !== item.id);
            await persistItems(items);
          } catch {
            // Retain the hidden synced item so cleanup can be retried on a later startup.
          }
        }

        set({ items, isHydrated: true, hydrationError: undefined });
      } catch (error) {
        set({
          isHydrated: true,
          hydrationError: error instanceof Error ? error.message : 'Offline queue could not load.',
        });
      }
    },

    enqueue: async ({ attachments, ownerUserId, payload }) => {
      const id = await generateUUID();
      const owned = await persistOfflineAttachments(id, attachments);
      const item: OfflineComplaintQueueItem = {
        id,
        ownerUserId,
        client_uuid: payload.client_ref || id,
        payload,
        attachments: owned.attachments,
        attachmentDirectoryUri: owned.directoryUri,
        status: 'queued',
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };

      try {
        await update((items) => [...items, item]);
        return item;
      } catch (error) {
        await removeOfflineAttachments(owned.directoryUri).catch(() => undefined);
        throw error;
      }
    },

    markSyncing: (id) =>
      update((items) =>
        items.map((item) =>
          item.id === id ? { ...item, status: 'syncing' as const, nextRetryAt: undefined } : item,
        ),
      ),

    markFailed: (id, error, retryable) =>
      update((items) =>
        items.map((item) => {
          if (item.id !== id) {
            return item;
          }

          const retryCount = retryable ? item.retryCount + 1 : MAX_RETRIES;
          return {
            ...item,
            status: 'failed' as const,
            lastError: error,
            retryCount,
            nextRetryAt:
              retryable && retryCount < MAX_RETRIES
                ? new Date(Date.now() + backoffMs(retryCount - 1)).toISOString()
                : undefined,
          };
        }),
      ),

    markSynced: async (id) => {
      await update((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status: 'synced' as const, syncedAt: new Date().toISOString() }
            : item,
        ),
      );
      const item = get().items.find((candidate) => candidate.id === id);
      await removeOfflineAttachments(item?.attachmentDirectoryUri);
      await update((items) => items.filter((candidate) => candidate.id !== id));
    },

    retry: (id) =>
      update((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'queued' as const,
                retryCount: 0,
                lastError: undefined,
                nextRetryAt: undefined,
              }
            : item,
        ),
      ),

    remove: async (id) => {
      const item = get().items.find((candidate) => candidate.id === id);
      await update((items) =>
        items.map((candidate) =>
          candidate.id === id ? { ...candidate, status: 'synced' as const } : candidate,
        ),
      );
      await removeOfflineAttachments(item?.attachmentDirectoryUri);
      await update((items) => items.filter((candidate) => candidate.id !== id));
    },
  };
});

export function canRetry(item: OfflineComplaintQueueItem, now = Date.now()) {
  if (item.retryCount >= MAX_RETRIES) {
    return false;
  }

  return !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now;
}
