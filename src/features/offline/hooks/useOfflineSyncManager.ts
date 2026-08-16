import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { ApiError } from '@/api/client';
import { syncOfflineComplaint } from '@/api/endpoints/complaints.api';
import { OfflineComplaintPayload } from '@/api/types/offline.types';
import { queryKeys } from '@/constants/queryKeys';
import {
  canRetry,
  MAX_RETRIES,
  useOfflineQueueStore,
} from '@/features/complaints/store/offlineQueueStore';
import {
  isQueueItemOwnedBy,
  OfflineComplaintQueueItem,
} from '@/features/complaints/utils/offlineQueue';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAppState } from '@/hooks/useAppState';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

let activeFlush: Promise<void> | null = null;

export function toSyncPayload(item: OfflineComplaintQueueItem): OfflineComplaintPayload {
  const { payload } = item;

  return {
    client_uuid: item.client_uuid,
    created_offline_at: item.createdAt,
    client_ref: payload.client_ref,
    title: payload.title,
    description: payload.description,
    department_id: payload.department_id,
    category_id: payload.category_id,
    priority_id: payload.priority_id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    address: payload.address,
    source: 'offline_sync',
  };
}

function isRetryableSyncError(error: unknown) {
  if (!(error instanceof ApiError) || !error.status) {
    return true;
  }

  return error.status === 408 || error.status === 429 || error.status >= 500;
}

export function flushOfflineQueue(queryClient: QueryClient): Promise<void> {
  if (activeFlush) {
    return activeFlush;
  }

  activeFlush = (async () => {
    const initial = useOfflineQueueStore.getState();
    const activeUserId = useAuthStore.getState().user?.id;
    const ownerUserId = activeUserId == null ? undefined : String(activeUserId);
    if (!initial.isHydrated) {
      return;
    }

    const pendingIds = initial.items
      .filter(
        (item) =>
          isQueueItemOwnedBy(item, ownerUserId) &&
          (item.status === 'queued' || item.status === 'failed') &&
          canRetry(item),
      )
      .map((item) => item.id);
    let didSync = false;

    for (const id of pendingIds) {
      const current = useOfflineQueueStore
        .getState()
        .items.find((candidate) => candidate.id === id);

      if (!current || current.status === 'syncing' || !canRetry(current)) {
        continue;
      }

      try {
        await useOfflineQueueStore.getState().markSyncing(id);
        await syncOfflineComplaint(toSyncPayload(current), current.attachments);
        didSync = true;
        await useOfflineQueueStore.getState().markSynced(id);
      } catch (error) {
        const latest = useOfflineQueueStore.getState().items.find((item) => item.id === id);
        if (latest?.status === 'syncing') {
          const message =
            error instanceof Error ? error.message : 'Offline sync failed. Please try again.';
          await useOfflineQueueStore
            .getState()
            .markFailed(id, message, isRetryableSyncError(error));
        }
      }
    }

    if (didSync) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.complaintsRoot });
    }
  })().finally(() => {
    activeFlush = null;
  });

  return activeFlush;
}

export function useOfflineSyncManager() {
  const queryClient = useQueryClient();
  const { status } = useNetworkStatus();
  const appState = useAppState();
  const isHydrated = useOfflineQueueStore((state) => state.isHydrated);
  const items = useOfflineQueueStore((state) => state.items);

  const flushQueue = useCallback(() => flushOfflineQueue(queryClient), [queryClient]);

  useEffect(() => {
    void useOfflineQueueStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (status !== 'online' || appState !== 'active' || !isHydrated) {
      return;
    }

    const now = Date.now();
    const delays = items
      .filter(
        (item) =>
          (item.status === 'queued' || item.status === 'failed') && item.retryCount < MAX_RETRIES,
      )
      .map((item) => Math.max(0, new Date(item.nextRetryAt ?? now).getTime() - now));

    if (delays.length === 0) {
      return;
    }

    const timer = setTimeout(
      () => {
        void flushQueue().catch(() => undefined);
      },
      Math.min(...delays),
    );

    return () => clearTimeout(timer);
  }, [appState, flushQueue, isHydrated, items, status]);
}
