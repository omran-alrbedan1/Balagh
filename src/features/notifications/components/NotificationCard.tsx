import { Check, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Notification } from '@/api/types/notification.types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onPress,
}: NotificationCardProps) {
  const { i18n, t } = useTranslation();
  const isRead = !!notification.read_at;

  return (
    <View style={[styles.card, !isRead && styles.cardUnread]}>
      <Pressable
        accessibilityLabel={`${notification.title}. ${notification.body}`}
        accessibilityRole={onPress ? 'button' : 'text'}
        onPress={onPress}
        style={({ pressed }) => pressed && onPress && styles.contentPressed}
      >
        <View style={styles.header}>
          <View style={[styles.dot, !isRead && styles.dotUnread]} />
          <Text style={styles.title} numberOfLines={2}>
            {notification.title}
          </Text>
        </View>

        <Text style={styles.body}>{notification.body}</Text>

        <Text style={styles.timestamp}>
          {new Date(notification.created_at).toLocaleString(i18n.language)}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        {!isRead && onMarkAsRead && (
          <Pressable
            onPress={onMarkAsRead}
            accessibilityLabel={t('notifications.markRead')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <Check color={colors.primary} size={16} />
            <Text style={styles.actionButtonText}>{t('notifications.markRead')}</Text>
          </Pressable>
        )}
        {onDelete && (
          <Pressable
            onPress={onDelete}
            accessibilityLabel={t('notifications.delete')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          >
            <Trash2 color={colors.danger} size={16} />
            <Text style={[styles.actionButtonText, styles.deleteText]}>
              {t('notifications.delete')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
  },
  contentPressed: { opacity: 0.7 },
  deleteText: {
    color: colors.danger,
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotUnread: {
    backgroundColor: colors.primary,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timestamp: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
});
