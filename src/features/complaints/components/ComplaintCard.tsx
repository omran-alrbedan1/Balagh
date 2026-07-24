import { router } from 'expo-router';
import { AlertTriangle, CalendarDays, ChevronRight, Clock3 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Complaint } from '@/api/types/complaint.types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/features/complaints/components/StatusBadge';
import {
  formatDate,
  getPriorityLabel,
  getSlaCountdown,
} from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface ComplaintCardProps {
  complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const slaCountdown = getSlaCountdown(complaint.sla_due_at);
  const isBreached = slaCountdown?.includes('breached') || complaint.sla_status === 'breached';
  const priorityColor = complaint.priority?.color ?? colors.primary;

  return (
    <Pressable
      accessibilityLabel={`Open complaint ${complaint.title}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/(app)/(tabs)/complaints/[id]',
          params: { id: complaint.id },
        })
      }
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text numberOfLines={2} style={styles.title}>
              {complaint.title}
            </Text>
            <View style={styles.metaRow}>
              <CalendarDays color={colors.textMuted} size={14} />
              <Text style={styles.meta}>{formatDate(complaint.created_at)}</Text>
            </View>
          </View>
          <ChevronRight color={colors.textMuted} size={20} />
        </View>

        <View style={styles.footer}>
          <StatusBadge status={complaint.status} />
          <View style={styles.priorityPill}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text numberOfLines={1} style={styles.priorityText}>
              {getPriorityLabel(complaint)}
            </Text>
          </View>
        </View>

        {slaCountdown ? (
          <View style={[styles.slaRow, isBreached ? styles.slaBreached : null]}>
            {isBreached ? (
              <AlertTriangle color={colors.danger} size={15} />
            ) : (
              <Clock3 color={colors.warning} size={15} />
            )}
            <Text style={[styles.slaText, isBreached ? styles.slaTextBreached : null]}>
              {slaCountdown}
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  pressable: {
    marginBottom: spacing.md,
  },
  priorityDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  priorityPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '58%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  priorityText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  slaBreached: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  slaRow: {
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderColor: '#FDE68A',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slaText: {
    color: colors.warning,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  slaTextBreached: {
    color: colors.danger,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  titleWrap: {
    flex: 1,
  },
});
