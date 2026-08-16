/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from '@testing-library/react-native';

import { router } from 'expo-router';
import { useHomeStats } from '@/features/home/hooks/useHomeStats';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';

import HomeScreen from '../index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setBadgeCountAsync: jest.fn() }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { title?: string }) =>
      values?.title ? `${key}:${values.title}` : key,
  }),
}));
jest.mock('@/lib/i18n', () => ({ __esModule: true, default: { language: 'en' } }));
jest.mock('lucide-react-native', () => ({
  CheckCircle2: () => null,
  Clock3: () => null,
  FilePlus2: () => null,
  Inbox: () => null,
  ShieldCheck: () => null,
}));
jest.mock('@/components/layout/Screen', () => ({
  Screen: ({ children, refreshControl }: any) => {
    const { Pressable, View } = require('react-native');
    return (
      <View>
        <Pressable testID="refresh" onPress={refreshControl.props.onRefresh} />
        {children}
      </View>
    );
  },
}));
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/components/ui/Button', () => ({
  Button: ({ label, onPress }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={label} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title }: any) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@/features/complaints/components/StatusBadge', () => ({
  StatusBadge: ({ status }: { status: string }) => {
    const { Text } = require('react-native');
    return <Text>{`status:${status}`}</Text>;
  },
}));
jest.mock('@/features/complaints/utils/complaintDisplay', () => ({
  formatDate: (date: string) => date,
}));
jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { name: string } }) => unknown) =>
    selector({ user: { name: 'Amina' } }),
}));
jest.mock('@/features/home/hooks/useHomeStats');
jest.mock('@/features/notifications/hooks/useUnreadCount');

const dashboard = {
  counts: { total: 4, active: 2, waiting_citizen: 1, completed: 1 },
  action_required: [
    {
      id: '1',
      complaint_number: 'CMP-1',
      title: 'Send a photo',
      status: 'waiting_citizen',
      created_at: '2026-08-01',
    },
  ],
  recent_complaints: [
    {
      id: '2',
      complaint_number: 'CMP-2',
      title: 'Broken light',
      status: 'submitted',
      created_at: '2026-08-02',
    },
  ],
};
const refetch = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  (useHomeStats as jest.MockedFunction<typeof useHomeStats>).mockReturnValue({
    data: { data: dashboard },
    isError: false,
    isLoading: false,
    isRefetching: false,
    refetch,
  } as unknown as ReturnType<typeof useHomeStats>);
  (useUnreadCount as jest.MockedFunction<typeof useUnreadCount>).mockReturnValue({
    isRefetching: false,
    refetch,
  } as unknown as ReturnType<typeof useUnreadCount>);
});

it('shows backend summary values, action required, and recent complaints without Home shortcuts', () => {
  const view = render(<HomeScreen />);

  expect(view.getByText('2')).toBeTruthy();
  expect(view.getAllByText('1')).toHaveLength(2);
  expect(view.getByText('home.actionRequired')).toBeTruthy();
  expect(view.getByText('home.recentComplaints')).toBeTruthy();
  expect(view.queryByText('notifications.title')).toBeNull();
  expect(view.queryByText('profile.title')).toBeNull();
  expect(view.getByText('status:waiting_citizen')).toBeTruthy();
  expect(view.getByText('status:submitted')).toBeTruthy();
});

it('opens the action-required and recent complaint detail routes', () => {
  const view = render(<HomeScreen />);

  fireEvent.press(view.getByLabelText('home.openActionRequired:Send a photo'));
  fireEvent.press(view.getByLabelText('home.openComplaint:Broken light'));

  expect(router.push).toHaveBeenCalledWith({
    pathname: '/(app)/(tabs)/complaints/[id]',
    params: { id: '1' },
  });
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/(app)/(tabs)/complaints/[id]',
    params: { id: '2' },
  });
});

it('does not render fake zeroes after a dashboard failure and retries dashboard plus unread data', async () => {
  (useHomeStats as jest.MockedFunction<typeof useHomeStats>).mockReturnValue({
    data: undefined,
    isError: true,
    isLoading: false,
    isRefetching: false,
    refetch,
  } as unknown as ReturnType<typeof useHomeStats>);

  const view = render(<HomeScreen />);
  expect(view.getByText('home.dashboardUnavailable')).toBeTruthy();
  expect(view.queryByText('0')).toBeNull();

  fireEvent.press(view.getByTestId('refresh'));
  expect(refetch).toHaveBeenCalledTimes(2);
});
