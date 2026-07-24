import { FlashList } from '@shopify/flash-list';
import { ClipboardCheck, PlusCircle, RefreshCw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { extractComplaints } from '@/api/endpoints/complaints.api';
import { Complaint } from '@/api/types/complaint.types';
import { ComplaintStatus } from '@/api/types/lookups.types';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ComplaintCard } from '@/features/complaints/components/ComplaintCard';
import { useComplaints } from '@/features/complaints/hooks/useComplaints';
import { SortMode, STATUS_LABELS } from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const STATUS_FILTERS: ('all' | ComplaintStatus)[] = [
  'all',
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'waiting_citizen',
  'resolved',
  'rejected',
  'closed',
  'escalated',
];

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'SLA', value: 'sla' },
];

export default function MyComplaintsScreen() {
  const [status, setStatus] = useState<'all' | ComplaintStatus>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const complaintsQuery = useComplaints({ sort, status });
  const rawComplaints = useMemo(
    () => extractComplaints(complaintsQuery.data),
    [complaintsQuery.data],
  );

  const complaints = useMemo(() => {
    const filtered =
      status === 'all'
        ? rawComplaints
        : rawComplaints.filter((complaint) => complaint.status === status);

    return [...filtered].sort((first, second) => sortComplaints(first, second, sort));
  }, [rawComplaints, sort, status]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRule} />
        <Text style={styles.title}>My Complaints</Text>
        <Text style={styles.subtitle}>
          Follow submitted complaints, updates, and resolution status.
        </Text>
      </View>

      <View style={styles.controls}>
        <FlashList
          data={STATUS_FILTERS}
          horizontal
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <FilterChip
              active={item === status}
              label={item === 'all' ? 'All' : STATUS_LABELS[item]}
              onPress={() => setStatus(item)}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => (
            <FilterChip
              active={option.value === sort}
              key={option.value}
              label={option.label}
              onPress={() => setSort(option.value)}
            />
          ))}
        </View>
      </View>

      {complaintsQuery.isLoading ? (
        <LoadingSpinner label="Loading complaints" />
      ) : complaintsQuery.error ? (
        <View style={styles.stateWrap}>
          <ErrorState message={complaintsQuery.error.message} />
          <Button
            label="Try again"
            iconLeft={<RefreshCw color="#FFFFFF" size={18} />}
            onPress={() => void complaintsQuery.refetch()}
          />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={styles.listContent}
          data={complaints}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.stateWrap}>
              <EmptyState
                icon={ClipboardCheck}
                title="Nothing filed yet"
                message="Complaints you submit will appear here with live status and SLA tracking."
              />
              <Button
                href="/(app)/(tabs)/complaints/new"
                iconLeft={<PlusCircle color="#FFFFFF" size={19} />}
                label="File your first complaint"
              />
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => void complaintsQuery.refetch()}
              refreshing={complaintsQuery.isRefetching}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => <ComplaintCard complaint={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function sortComplaints(first: Complaint, second: Complaint, sort: SortMode) {
  if (sort === 'oldest') {
    return dateValue(first.created_at) - dateValue(second.created_at);
  }

  if (sort === 'sla') {
    return dateValue(first.sla_due_at) - dateValue(second.sla_due_at);
  }

  return dateValue(second.created_at) - dateValue(first.created_at);
}

function dateValue(value?: string) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const date = new Date(value).getTime();
  return Number.isNaN(date) ? Number.MAX_SAFE_INTEGER : date;
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  controls: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  headerRule: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 4,
    width: 42,
  },
  listContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sortRow: {
    flexDirection: 'row',
  },
  stateWrap: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
  },
});
