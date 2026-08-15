/* eslint-disable @typescript-eslint/no-require-imports */
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useDeleteNotification } from '@/features/notifications/hooks/useDeleteNotification';
import { useMarkAllAsRead } from '@/features/notifications/hooks/useMarkAllAsRead';
import { useMarkAsRead } from '@/features/notifications/hooks/useMarkAsRead';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';

import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-notifications', () => ({ setBadgeCountAsync: jest.fn() }));
jest.mock('lucide-react-native', () => ({ Bell: () => null, RefreshCw: () => null }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    FlashList: (props: any) => (
      <View>
        {props.data.length
          ? props.data.map((item: any, index: number) => (
              <View key={String(item.id)}>{props.renderItem({ item, index })}</View>
            ))
          : props.ListEmptyComponent}
        {props.ListFooterComponent}
        <Pressable testID="refresh" onPress={props.refreshControl.props.onRefresh}>
          <Text>refresh</Text>
        </Pressable>
        <Pressable testID="load-more" onPress={props.onEndReached}>
          <Text>load more</Text>
        </Pressable>
      </View>
    ),
  };
});
jest.mock('@/components/layout/PageHeader', () => ({ PageHeader: () => null }));
jest.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));
jest.mock('@/components/ui/ErrorState', () => ({
  ErrorState: ({ message }: { message: string }) => {
    const { Text } = require('react-native');
    return <Text>{message}</Text>;
  },
}));
jest.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));
jest.mock('@/features/notifications/components/NotificationCard', () => ({
  NotificationCard: ({ notification, onDelete, onMarkAsRead, onPress }: any) => {
    const { Pressable, Text, View } = require('react-native');
    return (
      <View>
        <Pressable accessibilityLabel={`open-${notification.id}`} onPress={onPress}>
          <Text>{notification.title}</Text>
        </Pressable>
        <Pressable accessibilityLabel={`read-${notification.id}`} onPress={onMarkAsRead} />
        <Pressable accessibilityLabel={`delete-${notification.id}`} onPress={onDelete} />
      </View>
    );
  },
}));
jest.mock('@/features/notifications/hooks/useNotifications');
jest.mock('@/features/notifications/hooks/useUnreadCount');
jest.mock('@/features/notifications/hooks/useMarkAsRead');
jest.mock('@/features/notifications/hooks/useMarkAllAsRead');
jest.mock('@/features/notifications/hooks/useDeleteNotification');

const useList = useNotifications as jest.MockedFunction<typeof useNotifications>;
const useUnread = useUnreadCount as jest.MockedFunction<typeof useUnreadCount>;
const markOne = jest.fn();
const markAll = jest.fn();
const remove = jest.fn();
const refetch = jest.fn().mockResolvedValue(undefined);
const fetchNextPage = jest.fn().mockResolvedValue(undefined);

const item = {
  id: 1,
  title: 'Status updated',
  body: 'Body',
  type: 'complaint_status_updated',
  data: { complaint_id: 5 },
  complaint: null,
  read_at: null,
  created_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useUnread.mockReturnValue({ data: { success: true, data: { count: 1 } } } as ReturnType<
    typeof useUnreadCount
  >);
  (useMarkAsRead as jest.Mock).mockReturnValue({ mutate: markOne });
  (useMarkAllAsRead as jest.Mock).mockReturnValue({ mutate: markAll, isPending: false });
  (useDeleteNotification as jest.Mock).mockReturnValue({ mutate: remove });
  useList.mockReturnValue({
    data: {
      pages: [
        {
          success: true,
          data: { notifications: [item] },
          meta: { current_page: 1, last_page: 2, per_page: 15, total: 16 },
        },
      ],
      pageParams: [1],
    },
    isLoading: false,
    error: null,
    refetch,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage,
  } as unknown as ReturnType<typeof useNotifications>);
});

it('shows loading, error, and empty states', () => {
  useList.mockReturnValueOnce({ isLoading: true } as ReturnType<typeof useNotifications>);
  expect(render(<NotificationsScreen />).getByText('notifications.loading')).toBeTruthy();
  useList.mockReturnValueOnce({ isLoading: false, error: new Error('failed') } as ReturnType<
    typeof useNotifications
  >);
  expect(render(<NotificationsScreen />).getByText('failed')).toBeTruthy();
  useList.mockReturnValueOnce({
    data: { pages: [], pageParams: [] },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useNotifications>);
  expect(render(<NotificationsScreen />).getByText('notifications.emptyTitle')).toBeTruthy();
});

it('renders notifications and marks all read', () => {
  const view = render(<NotificationsScreen />);
  expect(view.getByText('Status updated')).toBeTruthy();
  fireEvent.press(view.getByText('notifications.markAllRead'));
  expect(markAll).toHaveBeenCalled();
});

it('marks an unread complaint notification and navigates on tap', () => {
  const view = render(<NotificationsScreen />);
  fireEvent.press(view.getByLabelText('open-1'));
  expect(markOne).toHaveBeenCalledWith(1);
  expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ params: { id: '5' } }));
});

it('asks for confirmation before deleting', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation();
  const view = render(<NotificationsScreen />);
  fireEvent.press(view.getByLabelText('delete-1'));
  expect(alert).toHaveBeenCalledWith(
    'notifications.deleteTitle',
    'notifications.deleteMessage',
    expect.any(Array),
  );
});

it('supports pull-to-refresh and next-page loading', () => {
  const view = render(<NotificationsScreen />);
  fireEvent.press(view.getByTestId('refresh'));
  fireEvent.press(view.getByTestId('load-more'));
  expect(refetch).toHaveBeenCalled();
  expect(fetchNextPage).toHaveBeenCalled();
});
