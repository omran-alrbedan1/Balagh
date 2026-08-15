import { FlashList } from '@shopify/flash-list';
import { Bell, RefreshCw } from 'lucide-react-native';
import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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

export function NotificationsScreen() {
  const { t } = useTranslation();
  const notificationsQuery = useNotifications();
  const unreadCountQuery = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = useMemo(
    () => notificationsQuery.data?.data.notifications ?? [],
    [notificationsQuery.data],
  );

  const unreadCount = useMemo(
    () => unreadCountQuery.data?.data.count ?? 0,
    [unreadCountQuery.data],
  );

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <View className="flex-1 bg-surface-light">
      <PageHeader subtitle={t('notifications.subtitle')} title={t('notifications.title')} />

      {unreadCount > 0 && (
        <View className="px-6 py-3">
          <Button
            iconLeft={<RefreshCw color="#FFFFFF" size={16} />}
            label={t('notifications.markAllRead')}
            onPress={handleMarkAllAsRead}
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
              onRefresh={() => void notificationsQuery.refetch()}
              refreshing={notificationsQuery.isRefetching}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onMarkAsRead={() => markAsReadMutation.mutate(item.id)}
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
