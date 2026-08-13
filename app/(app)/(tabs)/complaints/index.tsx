import { FlashList } from '@shopify/flash-list';
import { ClipboardCheck, PlusCircle, RefreshCw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { extractComplaints } from '@/api/endpoints/complaints.api';
import { Complaint } from '@/api/types/complaint.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ComplaintCard } from '@/features/complaints/components/ComplaintCard';
import {
  ComplaintFilters,
  ComplaintStatusFilter,
} from '@/features/complaints/components/ComplaintFilters';
import { useComplaints } from '@/features/complaints/hooks/useComplaints';
import { SortMode } from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';

export default function MyComplaintsScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ComplaintStatusFilter>('all');
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
    <View className="flex-1 bg-surface-light">
      <PageHeader subtitle={t('complaints.listSubtitle')} title={t('complaints.listTitle')} />

      <ComplaintFilters
        onSortChange={setSort}
        onStatusChange={setStatus}
        sort={sort}
        status={status}
      />

      {complaintsQuery.isLoading ? (
        <LoadingSpinner label={t('complaints.listLoading')} />
      ) : complaintsQuery.error ? (
        <View className="gap-4 px-6 pt-6">
          <ErrorState message={complaintsQuery.error.message} />
          <Button
            label={t('common.tryAgain')}
            iconLeft={<RefreshCw color="#FFFFFF" size={18} />}
            onPress={() => void complaintsQuery.refetch()}
          />
        </View>
      ) : (
        <FlashList
          contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 24 }}
          data={complaints}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="gap-4 pt-6">
              <EmptyState
                icon={ClipboardCheck}
                title={t('complaints.listEmptyTitle')}
                message={t('complaints.listEmptyMessage')}
              />
              <Button
                href="/(app)/(tabs)/complaints/new"
                iconLeft={<PlusCircle color="#FFFFFF" size={19} />}
                label={t('complaints.fileFirst')}
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
          renderItem={({ index, item }) => <ComplaintCard complaint={item} index={index} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
