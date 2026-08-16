/* eslint-disable @typescript-eslint/no-require-imports */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useComplaints } from '@/features/complaints/hooks/useComplaints';
import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import { OfflineComplaintQueueItem } from '@/features/complaints/utils/offlineQueue';

import MyComplaintsScreen from '../index';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, keyExtractor, ListEmptyComponent, ListHeaderComponent, renderItem }: any) => {
    const { View } = require('react-native');
    return (
      <View>
        {ListHeaderComponent}
        {data.length === 0 ? ListEmptyComponent : null}
        {data.map((item: any, index: number) => (
          <View key={keyExtractor(item, index)}>{renderItem({ item, index })}</View>
        ))}
      </View>
    );
  },
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/lib/i18n', () => ({ __esModule: true, default: { language: 'en' } }));
jest.mock('lucide-react-native', () => ({
  ClipboardCheck: () => null,
  PlusCircle: () => null,
  RefreshCw: () => null,
}));
jest.mock('@/components/layout/PageHeader', () => ({ PageHeader: () => null }));
jest.mock('@/components/ui/Button', () => ({
  Button: ({ label, onPress }: { label: string; onPress?: () => void }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={label} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@/components/ui/ErrorState', () => ({
  ErrorState: ({ message }: { message: string }) => {
    const { Text } = require('react-native');
    return <Text>{`error:${message}`}</Text>;
  },
}));
jest.mock('@/components/ui/LoadingSpinner', () => ({ LoadingSpinner: () => null }));

const screenRenderCount = { current: 0 };

jest.mock('@/features/complaints/components/ComplaintFilters', () => ({
  ComplaintFilters: () => {
    const { Text } = require('react-native');
    screenRenderCount.current += 1;
    return <Text>{`filters-render:${screenRenderCount.current}`}</Text>;
  },
}));
jest.mock('@/features/complaints/components/ComplaintCard', () => ({
  ComplaintCard: ({ complaint }: any) => {
    const { Text } = require('react-native');
    return <Text>{`card:${complaint.id}:${complaint.title}`}</Text>;
  },
}));
jest.mock('@/features/complaints/components/OfflineComplaintCard', () => ({
  OfflineComplaintCard: ({ item }: { item: OfflineComplaintQueueItem }) => {
    const { Text } = require('react-native');
    return <Text>{`offline:${item.id}:${item.status}`}</Text>;
  },
}));
jest.mock('@/features/complaints/hooks/useComplaints', () => ({ useComplaints: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }));

const mockedComplaints = useComplaints as jest.MockedFunction<typeof useComplaints>;

function queueItem(
  overrides: Partial<OfflineComplaintQueueItem> & Pick<OfflineComplaintQueueItem, 'id'>,
): OfflineComplaintQueueItem {
  return {
    id: overrides.id,
    ownerUserId: overrides.ownerUserId,
    client_uuid: overrides.client_uuid ?? `client-${overrides.id}`,
    payload: {
      client_ref: overrides.client_uuid ?? `client-${overrides.id}`,
      department_id: '1',
      category_id: '2',
      title: overrides.payload?.title ?? `Queued ${overrides.id}`,
      description: overrides.payload?.description ?? 'Offline complaint body',
    },
    attachments: overrides.attachments ?? [],
    status: overrides.status ?? 'queued',
    createdAt: overrides.createdAt ?? '2026-08-01T00:00:00Z',
    retryCount: overrides.retryCount ?? 0,
    lastError: overrides.lastError,
    nextRetryAt: overrides.nextRetryAt,
    syncedAt: overrides.syncedAt,
    attachmentDirectoryUri: overrides.attachmentDirectoryUri,
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  screenRenderCount.current = 0;
  await AsyncStorage.clear();
  useOfflineQueueStore.setState({
    items: [],
    isHydrated: true,
    hydrationError: undefined,
  });
  useAuthStore.setState({
    isHydrated: true,
    token: 'token',
    user: {
      id: 'user-1',
      name: 'Citizen',
      email: 'citizen@example.com',
      phone: null,
      national_id: null,
    },
  });
  mockedComplaints.mockReturnValue({
    data: { success: true, data: [] },
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaints>);
});

it('mounts MyComplaintsScreen without entering a Zustand update loop', async () => {
  useOfflineQueueStore.setState({
    items: [
      queueItem({ id: 'q1', ownerUserId: 'user-1', status: 'queued' }),
      queueItem({ id: 'q2', ownerUserId: 'user-1', status: 'failed', lastError: 'offline' }),
      queueItem({ id: 'q3', ownerUserId: 'user-1', status: 'synced' }),
    ],
  });

  const view = render(<MyComplaintsScreen />);

  await waitFor(() => {
    expect(view.getByText('offline:q1:queued')).toBeTruthy();
    expect(view.getByText('offline:q2:failed')).toBeTruthy();
  });
  expect(view.queryByText('offline:q3:synced')).toBeNull();
  expect(screenRenderCount.current).toBeLessThan(5);
});

it('keeps a stable render count while the offline queue reference is unchanged', async () => {
  useOfflineQueueStore.setState({
    items: [queueItem({ id: 'stable', ownerUserId: 'user-1', status: 'queued' })],
  });

  const view = render(<MyComplaintsScreen />);

  await waitFor(() => expect(view.getByText('offline:stable:queued')).toBeTruthy());
  const afterMount = screenRenderCount.current;

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(screenRenderCount.current).toBe(afterMount);
});

it('rerenders once when a queue item is added and filters by owner', async () => {
  useOfflineQueueStore.setState({
    items: [queueItem({ id: 'mine', ownerUserId: 'user-1', status: 'queued' })],
  });

  const view = render(<MyComplaintsScreen />);

  await waitFor(() => expect(view.getByText('offline:mine:queued')).toBeTruthy());
  const afterMount = screenRenderCount.current;

  await act(async () => {
    useOfflineQueueStore.setState({
      items: [
        queueItem({ id: 'mine', ownerUserId: 'user-1', status: 'queued' }),
        queueItem({ id: 'theirs', ownerUserId: 'user-2', status: 'queued' }),
        queueItem({ id: 'pending', ownerUserId: 'user-1', status: 'queued' }),
      ],
    });
  });

  await waitFor(() => expect(view.getByText('offline:pending:queued')).toBeTruthy());
  expect(view.queryByText('offline:theirs:queued')).toBeNull();
  expect(screenRenderCount.current).toBe(afterMount + 1);
});

it('renders the empty offline queue and empty server list without looping', async () => {
  const view = render(<MyComplaintsScreen />);

  await waitFor(() => expect(view.getByText('complaints.listEmptyTitle')).toBeTruthy());
  expect(screenRenderCount.current).toBeLessThan(5);
});

it('shows a pending queue item above server complaints without looping', async () => {
  mockedComplaints.mockReturnValue({
    data: {
      success: true,
      data: [
        {
          id: 99,
          client_ref: 'server-99',
          title: 'Server complaint',
          status: 'submitted',
          department_id: 1,
          category_id: 2,
          created_at: '2026-08-02T00:00:00Z',
        },
      ],
    },
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaints>);

  useOfflineQueueStore.setState({
    items: [queueItem({ id: 'pending-1', ownerUserId: 'user-1', status: 'queued' })],
  });

  const view = render(<MyComplaintsScreen />);

  await waitFor(() => {
    expect(view.getByText('offline:pending-1:queued')).toBeTruthy();
    expect(view.getByText('card:99:Server complaint')).toBeTruthy();
  });
  expect(screenRenderCount.current).toBeLessThan(5);
});
