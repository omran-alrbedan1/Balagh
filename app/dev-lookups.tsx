import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DepartmentCategoryPicker } from '@/features/lookups/components/DepartmentCategoryPicker';
import { useComplaintStatuses } from '@/features/lookups/hooks/useComplaintStatuses';
import { usePriorities } from '@/features/lookups/hooks/usePriorities';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DevLookupsScreen() {
  const [departmentId, setDepartmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const {
    data: priorities,
    isError: prioritiesError,
    isLoading: loadingPriorities,
    refetch: refetchPriorities,
  } = usePriorities();
  const {
    data: statuses,
    isError: statusesError,
    isLoading: loadingStatuses,
    refetch: refetchStatuses,
  } = useComplaintStatuses();

  return (
    <Screen title="Lookups">
      <Card>
        <Text style={styles.sectionTitle}>Department to Category</Text>
        <DepartmentCategoryPicker
          categoryId={categoryId}
          departmentId={departmentId}
          onCategoryChange={setCategoryId}
          onDepartmentChange={setDepartmentId}
        />
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Priorities</Text>
          <Button
            fullWidth={false}
            iconLeft={<RefreshCw color={colors.primary} size={16} />}
            label="Refresh"
            onPress={() => void refetchPriorities()}
            size="md"
            variant="ghost"
          />
        </View>
        {loadingPriorities ? (
          <LoadingSpinner label="Loading priorities..." />
        ) : prioritiesError ? (
          <ErrorState message="Failed to load priorities." />
        ) : (
          <View style={styles.stack}>
            {priorities?.map((priority) => (
              <View key={priority.id} style={styles.priorityRow}>
                <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
                <Text style={styles.itemText}>
                  {priority.name} (level {priority.level})
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Complaint Statuses</Text>
          <Button
            fullWidth={false}
            iconLeft={<RefreshCw color={colors.primary} size={16} />}
            label="Refresh"
            onPress={() => void refetchStatuses()}
            size="md"
            variant="ghost"
          />
        </View>
        {loadingStatuses ? (
          <LoadingSpinner label="Loading statuses..." />
        ) : statusesError ? (
          <ErrorState message="Failed to load complaint statuses." />
        ) : (
          <View style={styles.pills}>
            {statuses?.map((status) => (
              <View key={status} style={styles.pill}>
                <Text style={styles.pillText}>{status.replaceAll('_', ' ')}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemText: {
    color: colors.text,
    fontSize: 15,
  },
  pill: {
    backgroundColor: '#E0E8F3',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  priorityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  stack: {
    gap: spacing.sm,
  },
});
