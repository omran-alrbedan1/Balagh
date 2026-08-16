/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useComplaints } from '@/features/complaints/hooks/useComplaints';

import MyComplaintsScreen, { ErrorBoundary } from '../index';

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
jest.mock('@/features/complaints/components/ComplaintFilters', () => ({
  ComplaintFilters: () => null,
}));
jest.mock('@/features/complaints/components/ComplaintCard', () => ({
  ComplaintCard: ({ complaint }: any) => {
    const { Text } = require('react-native');
    return <Text>{`card:${complaint.id}:${complaint.title}`}</Text>;
  },
}));
jest.mock('@/features/complaints/components/OfflineComplaintCard', () => ({
  OfflineComplaintCard: () => null,
}));
jest.mock('@/features/complaints/hooks/useComplaints', () => ({ useComplaints: jest.fn() }));
jest.mock('@/features/complaints/store/offlineQueueStore', () => ({
  useOfflineQueueStore: (selector: any) => selector({ items: [] }),
}));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ user: { id: 'user-1' } }),
}));
jest.mock('@/lib/logger', () => ({ logError: jest.fn() }));

const mockedComplaints = useComplaints as jest.MockedFunction<typeof useComplaints>;
const serverComplaint = (id: unknown, title = 'Pothole') => ({
  id,
  client_ref: `ref-${String(id)}`,
  title,
  status: 'submitted',
  department_id: 1,
  category_id: 2,
  created_at: '2026-08-01T00:00:00Z',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedComplaints.mockReturnValue({
    data: { success: true, data: [serverComplaint(123)] },
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaints>);
});

it('renders a valid backend complaint with a stable normalized ID', () => {
  const view = render(<MyComplaintsScreen />);
  expect(view.getByText('card:123:Pothole')).toBeTruthy();
});

it('quarantines malformed and duplicate cached records without crashing the list', () => {
  mockedComplaints.mockReturnValue({
    data: {
      success: true,
      data: [null, { id: 'index' }, serverComplaint(123), serverComplaint(123, 'Duplicate')],
    },
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaints>);

  const view = render(<MyComplaintsScreen />);
  expect(view.getAllByText(/card:123:/)).toHaveLength(1);
});

it('renders a localized error and retry instead of a blank screen', () => {
  mockedComplaints.mockReturnValue({
    data: undefined,
    error: new Error('Server unavailable'),
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaints>);

  const view = render(<MyComplaintsScreen />);
  expect(view.getByText('error:Server unavailable')).toBeTruthy();
  expect(view.getByText('common.tryAgain')).toBeTruthy();
});

it('renders the controlled empty state for an empty offline cache', () => {
  mockedComplaints.mockReturnValue({
    data: { success: true, data: [] },
    error: null,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useComplaints>);

  const view = render(<MyComplaintsScreen />);
  expect(view.getByText('complaints.listEmptyTitle')).toBeTruthy();
});

it('contains list render failures with retry and home recovery actions', () => {
  const retry = jest.fn();
  const view = render(<ErrorBoundary error={new Error('unsafe record')} retry={retry} />);

  expect(view.getByText('error:complaints.displayError')).toBeTruthy();
  fireEvent.press(view.getByLabelText('common.tryAgain'));
  fireEvent.press(view.getByLabelText('common.home'));

  expect(retry).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith('/(app)/(tabs)');
});
