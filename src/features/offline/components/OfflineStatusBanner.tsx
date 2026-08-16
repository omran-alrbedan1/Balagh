import { CloudOff, RefreshCw } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import { isQueueItemOwnedBy } from '@/features/complaints/utils/offlineQueue';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/theme/colors';

export function OfflineStatusBanner() {
  const { t } = useTranslation();
  const { status } = useNetworkStatus();
  const userId = useAuthStore((state) => state.user?.id);
  const items = useOfflineQueueStore((state) => state.items);
  const ownerUserId = userId == null ? undefined : String(userId);
  const ownedItems = items.filter((item) => isQueueItemOwnedBy(item, ownerUserId));
  const pendingCount = ownedItems.filter((item) => item.status !== 'synced').length;
  const isSyncing = ownedItems.some((item) => item.status === 'syncing');

  if (status !== 'offline' && !isSyncing) {
    return null;
  }

  return (
    <View className="flex-row items-center gap-3 border-b border-warning-600 bg-warning-50 px-4 py-2.5">
      {isSyncing ? (
        <RefreshCw color={colors.primary} size={17} />
      ) : (
        <CloudOff color={colors.warning} size={17} />
      )}
      <Text className="flex-1 text-[13px] font-bold leading-[18px] text-base-900">
        {isSyncing
          ? t('offline.syncing', { count: pendingCount })
          : t('offline.banner', { count: pendingCount })}
      </Text>
    </View>
  );
}
