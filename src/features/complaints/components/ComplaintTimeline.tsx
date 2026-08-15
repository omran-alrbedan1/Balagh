import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ComplaintTimelineEntry } from '@/api/types/complaint.types';
import { StatusBadge } from '@/features/complaints/components/StatusBadge';
import {
  formatDateTime,
  formatDurationBetween,
  sortTimeline,
} from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface ComplaintTimelineProps {
  entries: ComplaintTimelineEntry[];
}

export function ComplaintTimeline({ entries }: ComplaintTimelineProps) {
  const { t } = useTranslation();
  const timeline = sortTimeline(entries);

  if (timeline.length === 0) {
    return (
      <View style={styles.emptyTimeline}>
        <Text style={styles.emptyTitle}>{t('complaints.timelineEmptyTitle')}</Text>
        <Text style={styles.emptyMessage}>{t('complaints.timelineEmptyMessage')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {timeline.map((entry, index) => {
        const next = timeline[index + 1];
        const isCurrent = index === timeline.length - 1;

        return (
          <View key={entry.id} style={styles.item}>
            <View style={styles.markerColumn}>
              <View style={[styles.marker, isCurrent ? styles.markerCurrent : null]}>
                <CheckCircle2 color={isCurrent ? '#FFFFFF' : colors.primary} size={16} />
              </View>
              {index < timeline.length - 1 ? <View style={styles.line} /> : null}
            </View>

            <View style={[styles.content, isCurrent ? styles.currentContent : null]}>
              <View style={styles.row}>
                <StatusBadge status={entry.to_status ?? entry.from_status ?? 'submitted'} />
                {isCurrent ? <Text style={styles.currentLabel}>{t('common.current')}</Text> : null}
              </View>
              <Text style={styles.date}>{formatDateTime(entry.created_at)}</Text>
              {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
              {entry.changed_by ? (
                <Text style={styles.meta}>
                  {t('complaints.timelineBy', { name: entry.changed_by })}
                </Text>
              ) : null}
              <Text style={styles.duration}>{formatDurationBetween(entry, next)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  content: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  currentContent: {
    borderColor: colors.primary,
  },
  currentLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  date: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  duration: {
    color: colors.textMuted,
    fontSize: 13,
  },
  emptyMessage: {
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTimeline: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  line: {
    backgroundColor: colors.border,
    flex: 1,
    width: 2,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  markerColumn: {
    alignItems: 'center',
  },
  markerCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  note: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
