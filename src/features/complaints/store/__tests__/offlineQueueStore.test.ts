/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import {
  persistOfflineAttachments,
  removeOfflineAttachments,
} from '@/features/complaints/utils/offlineAttachmentStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/features/offline/utils/uuid', () => ({ generateUUID: jest.fn(() => 'queue-1') }));
jest.mock('@/features/complaints/utils/offlineAttachmentStorage', () => ({
  persistOfflineAttachments: jest.fn(),
  removeOfflineAttachments: jest.fn(),
}));

const mockedPersistAttachments = persistOfflineAttachments as jest.MockedFunction<
  typeof persistOfflineAttachments
>;
const mockedRemoveAttachments = removeOfflineAttachments as jest.MockedFunction<
  typeof removeOfflineAttachments
>;
const payload = {
  client_ref: 'stable-client-ref',
  department_id: 'department-1',
  category_id: 'category-1',
  title: 'Broken streetlight',
  description: 'The streetlight has been out for several nights.',
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useOfflineQueueStore.setState({
    items: [],
    isHydrated: true,
    hydrationError: undefined,
  });
  mockedPersistAttachments.mockResolvedValue({
    attachments: [
      { uri: 'file:///documents/offline-complaints/queue-1/1-photo.jpg', name: 'photo.jpg' },
    ],
    directoryUri: 'file:///documents/offline-complaints/queue-1',
  });
  mockedRemoveAttachments.mockResolvedValue();
});

it('does not report enqueue success or update memory until durable persistence completes', async () => {
  let resolveWrite!: () => void;
  (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(
    () => new Promise<void>((resolve) => (resolveWrite = resolve)),
  );

  const enqueuePromise = useOfflineQueueStore.getState().enqueue({
    attachments: [{ uri: 'file:///cache/photo.jpg', name: 'photo.jpg' }],
    payload,
  });
  await waitFor(() => expect(resolveWrite).toEqual(expect.any(Function)));

  expect(useOfflineQueueStore.getState().items).toHaveLength(0);
  resolveWrite();
  const item = await enqueuePromise;

  expect(item.client_uuid).toBe('stable-client-ref');
  expect(item.attachments[0].uri).toContain('/offline-complaints/queue-1/');
  expect(useOfflineQueueStore.getState().items).toEqual([item]);
});

it('keeps memory empty and cleans copied files when queue persistence fails', async () => {
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('storage full'));

  await expect(
    useOfflineQueueStore.getState().enqueue({ attachments: [], payload }),
  ).rejects.toThrow('storage full');

  expect(useOfflineQueueStore.getState().items).toHaveLength(0);
  expect(mockedRemoveAttachments).toHaveBeenCalledWith(
    'file:///documents/offline-complaints/queue-1',
  );
});

it('does not queue anything when an attachment cannot be copied durably', async () => {
  mockedPersistAttachments.mockRejectedValueOnce(new Error('attachment unavailable'));

  await expect(
    useOfflineQueueStore.getState().enqueue({
      attachments: [{ uri: 'file:///cache/missing.jpg' }],
      payload,
    }),
  ).rejects.toThrow('attachment unavailable');

  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  expect(useOfflineQueueStore.getState().items).toHaveLength(0);
});

it('hydrates a durable complaint after a simulated restart', async () => {
  const item = await useOfflineQueueStore.getState().enqueue({ attachments: [], payload });
  useOfflineQueueStore.setState({ items: [], isHydrated: false });

  await useOfflineQueueStore.getState().hydrate();

  expect(useOfflineQueueStore.getState().items).toEqual([item]);
});

it('recovers a stale syncing item to queued during hydration', async () => {
  const stale = {
    id: 'stale-1',
    client_uuid: 'stable-id',
    payload,
    attachments: [],
    status: 'syncing',
    createdAt: '2026-01-01T00:00:00.000Z',
    retryCount: 2,
  };
  await AsyncStorage.setItem(
    'balagh.offlineQueue.v2',
    JSON.stringify({ version: 2, items: [stale] }),
  );
  useOfflineQueueStore.setState({ items: [], isHydrated: false });

  await useOfflineQueueStore.getState().hydrate();

  expect(useOfflineQueueStore.getState().items[0]).toEqual(
    expect.objectContaining({ status: 'queued', retryCount: 2 }),
  );
});

it('manual retry resets a terminal failed item without changing its client UUID', async () => {
  const item = await useOfflineQueueStore.getState().enqueue({ attachments: [], payload });
  await useOfflineQueueStore.getState().markFailed(item.id, 'bad request', false);
  await useOfflineQueueStore.getState().retry(item.id);

  expect(useOfflineQueueStore.getState().items[0]).toEqual(
    expect.objectContaining({
      status: 'queued',
      retryCount: 0,
      client_uuid: 'stable-client-ref',
    }),
  );
});

it('removes owned attachment files only after a successful sync state is persisted', async () => {
  const item = await useOfflineQueueStore.getState().enqueue({ attachments: [], payload });
  await useOfflineQueueStore.getState().markSynced(item.id);

  expect(mockedRemoveAttachments).toHaveBeenCalledWith(item.attachmentDirectoryUri);
  expect(useOfflineQueueStore.getState().items).toHaveLength(0);
});

it('persists a cleanup tombstone before manually discarding owned files', async () => {
  const item = await useOfflineQueueStore.getState().enqueue({ attachments: [], payload });
  await useOfflineQueueStore.getState().remove(item.id);

  expect(mockedRemoveAttachments).toHaveBeenCalledWith(item.attachmentDirectoryUri);
  expect(useOfflineQueueStore.getState().items).toHaveLength(0);
});
