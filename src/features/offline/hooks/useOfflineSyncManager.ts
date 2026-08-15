import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { syncOfflineComplaint } from '@/api/endpoints/complaints.api';
import { OfflineComplaintPayload } from '@/api/types/offline.types';
import { queryKeys } from '@/constants/queryKeys';
import { useOfflineQueueStore, canRetry } from '@/features/complaints/store/offlineQueueStore';
import { OfflineComplaintQueueItem } from '@/features/complaints/utils/offlineQueue';
import { useAppState } from '@/hooks/useAppState';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function toSyncPayload(item: OfflineComplaintQueueItem): OfflineComplaintPayload {
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

export function useOfflineSyncManager() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const appState = useAppState();
  const isHydrated = useOfflineQueueStore((state) => state.isHydrated);
  const runningRef = useRef(false);

  const flushQueue = useCallback(async () => {
    const store = useOfflineQueueStore.getState();

    if (!store.isHydrated || runningRef.current) {
      return;
    }

    const pending = store.items.filter(
      (item) => (item.status === 'queued' || item.status === 'failed') && canRetry(item),
    );

    if (pending.length === 0) {
      return;
    }

    runningRef.current = true;

    try {
      for (const item of pending) {
        const current = useOfflineQueueStore.getState().items.find((entry) => entry.id === item.id);

        if (!current || current.status === 'syncing') {
          continue;
        }

        await useOfflineQueueStore.getState().markSyncing(item.id);

        try {
          await syncOfflineComplaint(toSyncPayload(item), item.attachments);
          await useOfflineQueueStore.getState().markSynced(item.id);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Offline sync failed. Please try again.';
          await useOfflineQueueStore.getState().markFailed(item.id, message);
        }
      }
    } finally {
      runningRef.current = false;
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.complaintsRoot });
  }, [queryClient]);

  useEffect(() => {
    void useOfflineQueueStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (isOnline && appState === 'active' && isHydrated) {
      void flushQueue();
    }
  }, [appState, flushQueue, isHydrated, isOnline]);
}
