/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { ApiError } from '@/api/client';
import { syncOfflineComplaint } from '@/api/endpoints/complaints.api';
import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import { removeOfflineAttachments } from '@/features/complaints/utils/offlineAttachmentStorage';
import { OfflineComplaintQueueItem } from '@/features/complaints/utils/offlineQueue';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAppState } from '@/hooks/useAppState';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { flushOfflineQueue, useOfflineSyncManager } from '../useOfflineSyncManager';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/api/client', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly mockStatus?: number,
    ) {
      super(message);
      Object.defineProperty(this, 'status', { value: mockStatus });
    }
  },
}));
jest.mock('@/api/endpoints/complaints.api', () => ({ syncOfflineComplaint: jest.fn() }));
jest.mock('@/features/complaints/utils/offlineAttachmentStorage', () => ({
  persistOfflineAttachments: jest.fn(),
  removeOfflineAttachments: jest.fn(),
}));
jest.mock('@/hooks/useNetworkStatus', () => ({ useNetworkStatus: jest.fn() }));
jest.mock('@/hooks/useAppState', () => ({ useAppState: jest.fn() }));

const mockedSync = syncOfflineComplaint as jest.MockedFunction<typeof syncOfflineComplaint>;
const mockedNetwork = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
const mockedAppState = useAppState as jest.MockedFunction<typeof useAppState>;
const mockedRemoveAttachments = removeOfflineAttachments as jest.MockedFunction<
  typeof removeOfflineAttachments
>;
let queryClient: QueryClient;

function queueItem(overrides: Partial<OfflineComplaintQueueItem> = {}): OfflineComplaintQueueItem {
  return {
    id: 'queue-1',
    client_uuid: 'stable-client-uuid',
    payload: {
      client_ref: 'stable-client-uuid',
      department_id: 'department-1',
      category_id: 'category-1',
      title: 'Pothole',
      description: 'Large pothole in the road',
    },
    attachments: [{ uri: 'file:///documents/offline-complaints/queue-1/photo.jpg' }],
    attachmentDirectoryUri: 'file:///documents/offline-complaints/queue-1',
    status: 'queued',
    createdAt: '2026-01-01T00:00:00.000Z',
    retryCount: 0,
    ...overrides,
  };
}

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useOfflineQueueStore.setState({ items: [queueItem()], isHydrated: true });
  useAuthStore.setState({ user: { id: 'user-1', name: 'Citizen' } });
  mockedSync.mockResolvedValue({} as Awaited<ReturnType<typeof syncOfflineComplaint>>);
  mockedRemoveAttachments.mockResolvedValue();
  mockedNetwork.mockReturnValue({ status: 'online', isOnline: true } as ReturnType<
    typeof useNetworkStatus
  >);
  mockedAppState.mockReturnValue('active');
});

afterEach(() => queryClient.clear());

it('uses one single-flight flush and uploads a stable client UUID once', async () => {
  let resolveSync!: (value: any) => void;
  mockedSync.mockReturnValueOnce(new Promise((resolve) => (resolveSync = resolve)));

  const first = flushOfflineQueue(queryClient);
  const second = flushOfflineQueue(queryClient);
  expect(second).toBe(first);

  await waitFor(() => expect(mockedSync).toHaveBeenCalledTimes(1));
  expect(mockedSync).toHaveBeenCalledWith(
    expect.objectContaining({ client_uuid: 'stable-client-uuid' }),
    expect.any(Array),
  );
  resolveSync({});
  await first;

  expect(useOfflineQueueStore.getState().items).toHaveLength(0);
  expect(mockedRemoveAttachments).toHaveBeenCalledWith(
    'file:///documents/offline-complaints/queue-1',
  );
});

it('retains the item and files after a transient failure with a backoff', async () => {
  mockedSync.mockRejectedValueOnce(new ApiError('temporarily unavailable', 503));

  await flushOfflineQueue(queryClient);

  expect(useOfflineQueueStore.getState().items[0]).toEqual(
    expect.objectContaining({ status: 'failed', retryCount: 1 }),
  );
  expect(useOfflineQueueStore.getState().items[0].nextRetryAt).toEqual(expect.any(String));
  expect(mockedRemoveAttachments).not.toHaveBeenCalled();

  await flushOfflineQueue(queryClient);
  expect(mockedSync).toHaveBeenCalledTimes(1);

  useOfflineQueueStore.setState((state) => ({
    items: state.items.map((item) => ({
      ...item,
      nextRetryAt: new Date(Date.now() - 1).toISOString(),
    })),
  }));
  await flushOfflineQueue(queryClient);
  expect(mockedSync).toHaveBeenCalledTimes(2);
});

it('keeps a max-retry item visible until the user manually retries', async () => {
  useOfflineQueueStore.setState({ items: [queueItem({ status: 'failed', retryCount: 5 })] });

  await flushOfflineQueue(queryClient);

  expect(mockedSync).not.toHaveBeenCalled();
  expect(useOfflineQueueStore.getState().items[0].status).toBe('failed');
});

it('does not upload a queued complaint owned by another signed-in user', async () => {
  useOfflineQueueStore.setState({ items: [queueItem({ ownerUserId: 'user-2' })] });

  await flushOfflineQueue(queryClient);

  expect(mockedSync).not.toHaveBeenCalled();
  expect(useOfflineQueueStore.getState().items[0].status).toBe('queued');
});

it('manual retry reuses the same client UUID after a permanent failure', async () => {
  mockedSync
    .mockRejectedValueOnce(new ApiError('invalid payload', 422))
    .mockResolvedValueOnce({} as any);

  await flushOfflineQueue(queryClient);
  expect(useOfflineQueueStore.getState().items[0]).toEqual(
    expect.objectContaining({ status: 'failed', retryCount: 5 }),
  );
  await useOfflineQueueStore.getState().retry('queue-1');
  await flushOfflineQueue(queryClient);

  expect(mockedSync).toHaveBeenCalledTimes(2);
  expect(mockedSync.mock.calls[0][0].client_uuid).toBe('stable-client-uuid');
  expect(mockedSync.mock.calls[1][0].client_uuid).toBe('stable-client-uuid');
});

it('automatically flushes on an offline-to-online transition', async () => {
  mockedNetwork.mockReturnValue({ status: 'offline', isOnline: false } as ReturnType<
    typeof useNetworkStatus
  >);
  const view = renderHook(() => useOfflineSyncManager(), { wrapper });
  expect(mockedSync).not.toHaveBeenCalled();

  mockedNetwork.mockReturnValue({ status: 'online', isOnline: true } as ReturnType<
    typeof useNetworkStatus
  >);
  view.rerender({});

  await waitFor(() => expect(mockedSync).toHaveBeenCalledTimes(1));
});

it('automatically flushes when the app returns to the foreground while online', async () => {
  mockedAppState.mockReturnValue('background');
  const view = renderHook(() => useOfflineSyncManager(), { wrapper });
  expect(mockedSync).not.toHaveBeenCalled();

  mockedAppState.mockReturnValue('active');
  view.rerender({});

  await waitFor(() => expect(mockedSync).toHaveBeenCalledTimes(1));
});

it('automatically flushes a queue that finishes hydrating while already online', async () => {
  const persisted = queueItem();
  await AsyncStorage.setItem(
    'balagh.offlineQueue.v2',
    JSON.stringify({ version: 2, items: [persisted] }),
  );
  useOfflineQueueStore.setState({ items: [], isHydrated: false });

  renderHook(() => useOfflineSyncManager(), { wrapper });

  await waitFor(() => expect(mockedSync).toHaveBeenCalledTimes(1));
  expect(useOfflineQueueStore.getState().isHydrated).toBe(true);
});
