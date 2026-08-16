import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { NotificationPreferences } from '@/api/types/notification.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/hooks/useNotificationPreferences';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type EditablePreference = Exclude<
  keyof NotificationPreferences,
  'id' | 'database_enabled' | 'created_at' | 'updated_at'
>;

const preferenceKeys: EditablePreference[] = [
  'push_enabled',
  'email_enabled',
  'sms_enabled',
  'complaint_created',
  'complaint_assigned',
  'complaint_status_updated',
  'sla_breached',
  'complaint_resolved',
  'complaint_closed',
];

export function NotificationPreferencesCard() {
  const { t } = useTranslation();
  const query = useNotificationPreferences();
  const mutation = useUpdateNotificationPreferences();
  const [osPermissionGranted, setOsPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const refreshPermission = () => {
      void Notifications.getPermissionsAsync().then((result) =>
        setOsPermissionGranted(result.granted),
      );
    };
    refreshPermission();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => subscription.remove();
  }, []);

  if (query.isLoading) return <LoadingSpinner label={t('notificationPreferences.loading')} />;
  if (query.isPending && query.fetchStatus === 'paused') {
    return <ErrorState message={t('notificationPreferences.offlineUnavailable')} />;
  }
  if (query.error) {
    return (
      <View style={styles.error}>
        <ErrorState message={query.error.message} />
        <Button label={t('common.tryAgain')} onPress={() => void query.refetch()} />
      </View>
    );
  }

  const preferences = query.data?.data;
  if (!preferences) {
    return (
      <View style={styles.error}>
        <ErrorState message={t('notificationPreferences.unavailable')} />
        <Button label={t('common.tryAgain')} onPress={() => void query.refetch()} />
      </View>
    );
  }

  return (
    <Card>
      <Text style={styles.title}>{t('notificationPreferences.title')}</Text>
      <Text style={styles.description}>{t('notificationPreferences.description')}</Text>
      <Text style={styles.capabilityNote}>{t('notificationPreferences.channelAvailability')}</Text>
      <Text style={styles.capabilityNote}>{t('notificationPreferences.inAppAlwaysOn')}</Text>

      {preferenceKeys.map((key) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{t(`notificationPreferences.fields.${key}`)}</Text>
          <Switch
            accessibilityLabel={t(`notificationPreferences.fields.${key}`)}
            disabled={mutation.isPending}
            onValueChange={(value) => mutation.mutate({ [key]: value })}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={preferences[key] ? colors.primary : colors.textMuted}
            value={preferences[key]}
          />
        </View>
      ))}

      {preferences.push_enabled && osPermissionGranted === false && (
        <View style={styles.permissionWarning}>
          <Text style={styles.warningText}>{t('notificationPreferences.osDisabled')}</Text>
          <Button
            label={t('notificationPreferences.openSettings')}
            onPress={() => void Linking.openSettings()}
            size="md"
            variant="secondary"
          />
        </View>
      )}
      {mutation.error && <ErrorState message={mutation.error.message} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  capabilityNote: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  description: { color: colors.textMuted, lineHeight: 20 },
  error: { gap: spacing.md },
  label: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '600' },
  permissionWarning: { gap: spacing.sm, paddingTop: spacing.sm },
  row: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
  },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  warningText: { color: colors.danger, lineHeight: 20 },
});
