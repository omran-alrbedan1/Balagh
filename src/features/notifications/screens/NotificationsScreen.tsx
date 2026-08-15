import { FlashList } from '@shopify/flash-list';
import { Bell, RefreshCw } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useDeleteNotification } from '@/features/notifications/hooks/useDeleteNotification';
import { useMarkAllAsRead } from '@/features/notifications/hooks/useMarkAllAsRead';
import { useMarkAsRead } from '@/features/notifications/hooks/useMarkAsRead';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { NotificationCard } from '@/features/notifications/components/NotificationCard';
import { colors } from '@/theme/colors';
import { queryKeys } from '@/constants/queryKeys';
import { resolveNotificationDestination } from '@/features/notifications/utils/notificationNavigation';

export function NotificationsScreen() {
  const { t } = useTranslation();
  const notificationsQuery = useNotifications();
  const unreadCountQuery = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();
  const queryClient = useQueryClient();

  const notifications = useMemo(() => {
    const byId = new Map(
      notificationsQuery.data?.pages
        .flatMap((page) => page.data.notifications)
        .map((notification) => [String(notification.id), notification]),
    );
    return [...byId.values()];
  }, [notificationsQuery.data]);

  const unreadCount = useMemo(
    () => unreadCountQuery.data?.data.count ?? 0,
    [unreadCountQuery.data],
  );

  const handleRefresh = async () => {
    const firstPage = notificationsQuery.data?.pages[0];
    if (firstPage) {
      queryClient.setQueryData(queryKeys.notifications, {
        pages: [firstPage],
        pageParams: [1],
      });
    }
    await notificationsQuery.refetch();
  };

  const handlePress = (notification: (typeof notifications)[number]) => {
    if (!notification.read_at) markAsReadMutation.mutate(notification.id);
    const destination = resolveNotificationDestination({
      ...notification.data,
      type: notification.type,
      complaint_id: notification.data.complaint_id ?? notification.complaint?.id,
    });
    if (destination) router.push(destination);
  };

  const confirmDelete = (id: string | number) =>
    Alert.alert(t('notifications.deleteTitle'), t('notifications.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('notifications.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);

  return (
    <View className="flex-1 bg-surface-light">
      <PageHeader subtitle={t('notifications.subtitle')} title={t('notifications.title')} />

      {unreadCount > 0 && (
        <View className="px-6 py-3">
          <Button
            iconLeft={<RefreshCw color="#FFFFFF" size={16} />}
            label={t('notifications.markAllRead')}
            loading={markAllAsReadMutation.isPending}
            onPress={() => markAllAsReadMutation.mutate()}
            variant="secondary"
          />
        </View>
      )}

      {notificationsQuery.isLoading ? (
        <LoadingSpinner label={t('notifications.loading')} />
      ) : notificationsQuery.error ? (
        <View className="gap-4 px-6 pt-6">
          <ErrorState message={notificationsQuery.error.message} />
          <Button
            label={t('common.tryAgain')}
            iconLeft={<RefreshCw color="#FFFFFF" size={18} />}
            onPress={() => void notificationsQuery.refetch()}
          />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 24 }}
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View className="gap-4 pt-6">
              <EmptyState
                icon={Bell}
                title={t('notifications.emptyTitle')}
                message={t('notifications.emptyMessage')}
              />
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => void handleRefresh()}
              refreshing={notificationsQuery.isRefetching && !notificationsQuery.isFetchingNextPage}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onMarkAsRead={() => markAsReadMutation.mutate(item.id)}
              onDelete={() => confirmDelete(item.id)}
              onPress={() => handlePress(item)}
            />
          )}
          onEndReached={() => {
            if (notificationsQuery.hasNextPage && !notificationsQuery.isFetchingNextPage) {
              void notificationsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            notificationsQuery.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
