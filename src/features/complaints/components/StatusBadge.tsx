import { StyleSheet, Text, View } from 'react-native';

import { ComplaintStatus } from '@/api/types/lookups.types';
import { getStatusLabel, STATUS_TONES } from '@/features/complaints/utils/complaintDisplay';
import { spacing } from '@/theme/spacing';

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const tone = STATUS_TONES[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <Text style={[styles.label, { color: tone.foreground }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontWeight: '700',
  },
});
