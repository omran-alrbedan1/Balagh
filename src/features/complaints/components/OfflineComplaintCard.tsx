import { AlertTriangle, Clock3, RefreshCw, Trash2 } from 'lucide-react-native';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { useOfflineQueueStore } from '@/features/complaints/store/offlineQueueStore';
import { OfflineComplaintQueueItem } from '@/features/complaints/utils/offlineQueue';
import { colors } from '@/theme/colors';

export function OfflineComplaintCard({ item }: { item: OfflineComplaintQueueItem }) {
  const { t } = useTranslation();
  const retry = useOfflineQueueStore((state) => state.retry);
  const remove = useOfflineQueueStore((state) => state.remove);
  const failed = item.status === 'failed';
  const syncing = item.status === 'syncing';

  const discard = () => {
    Alert.alert(t('offline.discardTitle'), t('offline.discardMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('offline.discard'),
        style: 'destructive',
        onPress: () => void remove(item.id),
      },
    ]);
  };

  return (
    <View className="mb-4 rounded-2xl border-2 border-warning-600 bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-warning-50">
          {failed ? (
            <AlertTriangle color={colors.danger} size={19} />
          ) : syncing ? (
            <RefreshCw color={colors.primary} size={19} />
          ) : (
            <Clock3 color={colors.warning} size={19} />
          )}
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-[16px] font-black text-base-900" numberOfLines={2}>
            {item.payload.title}
          </Text>
          <Text className="text-[13px] font-extrabold text-warning-600">
            {failed
              ? t('offline.syncFailed')
              : syncing
                ? t('offline.pendingSyncing')
                : t('offline.pendingSync')}
          </Text>
          {failed && item.lastError ? (
            <Text className="text-xs leading-[17px] text-base-500" numberOfLines={2}>
              {item.lastError}
            </Text>
          ) : null}
        </View>
      </View>

      {failed ? (
        <View className="mt-4 flex-row gap-3">
          <Button
            fullWidth={false}
            iconLeft={<RefreshCw color="#FFFFFF" size={16} />}
            label={t('offline.retry')}
            onPress={() => void retry(item.id)}
          />
          <Button
            fullWidth={false}
            iconLeft={<Trash2 color="#FFFFFF" size={16} />}
            label={t('offline.discard')}
            onPress={discard}
            variant="danger"
          />
        </View>
      ) : null}
    </View>
  );
}
