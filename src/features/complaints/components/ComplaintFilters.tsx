import { FlashList } from '@shopify/flash-list';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  CheckCircle2,
  ClipboardList,
  Eye,
  ListFilter,
  Lock,
  MessageCircle,
  Send,
  Timer,
  UserCheck,
  Wrench,
  XCircle,
} from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ComplaintStatus } from '@/api/types/lookups.types';
import { getStatusLabel, SortMode } from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';

export type ComplaintStatusFilter = 'all' | ComplaintStatus;

const STATUS_FILTERS: ComplaintStatusFilter[] = [
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

const SORT_OPTIONS: SortMode[] = ['newest', 'oldest', 'sla'];

interface ComplaintFiltersProps {
  sort: SortMode;
  status: ComplaintStatusFilter;
  onSortChange: (sort: SortMode) => void;
  onStatusChange: (status: ComplaintStatusFilter) => void;
}

export function ComplaintFilters({
  onSortChange,
  onStatusChange,
  sort,
  status,
}: ComplaintFiltersProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-3 px-6 pb-3 pt-4">
      <View className="flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
          <ListFilter color={colors.primary} size={18} />
        </View>
        <Text className="text-base font-black text-base-900">{t('complaints.listTitle')}</Text>
      </View>

      <FlashList
        data={STATUS_FILTERS}
        horizontal
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const active = item === status;

          return (
            <FilterChip
              active={active}
              icon={getStatusFilterIcon(item, active)}
              label={item === 'all' ? t('common.all') : getStatusLabel(item)}
              onPress={() => onStatusChange(item)}
            />
          );
        }}
        showsHorizontalScrollIndicator={false}
      />

      <View className="flex-row gap-2">
        {SORT_OPTIONS.map((option) => {
          const active = option === sort;

          return (
            <FilterChip
              active={active}
              icon={getSortIcon(option, active)}
              key={option}
              label={t(`sort.${option}`)}
              onPress={() => onSortChange(option)}
            />
          );
        })}
      </View>
    </View>
  );
}

function FilterChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`mr-2 min-h-[40px] flex-row items-center gap-2 rounded-full border px-3.5 ${
        active ? 'border-primary-600 bg-primary-600' : 'border-base-200 bg-white'
      }`}
      onPress={onPress}
    >
      {icon}
      <Text className={`text-[13px] font-black ${active ? 'text-white' : 'text-primary-600'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

function getStatusFilterIcon(status: ComplaintStatusFilter, active: boolean) {
  const color = active ? '#FFFFFF' : colors.primary;
  const size = 15;

  switch (status) {
    case 'all':
      return <ClipboardList color={color} size={size} />;
    case 'submitted':
      return <Send color={color} size={size} />;
    case 'under_review':
    case 'in_review':
      return <Eye color={color} size={size} />;
    case 'assigned':
      return <UserCheck color={color} size={size} />;
    case 'in_progress':
      return <Wrench color={color} size={size} />;
    case 'waiting_citizen':
      return <MessageCircle color={color} size={size} />;
    case 'resolved':
      return <CheckCircle2 color={color} size={size} />;
    case 'rejected':
      return <XCircle color={color} size={size} />;
    case 'closed':
      return <Lock color={color} size={size} />;
    case 'escalated':
      return <AlertTriangle color={color} size={size} />;
    default:
      return <ClipboardList color={color} size={size} />;
  }
}

function getSortIcon(sort: SortMode, active: boolean) {
  const color = active ? '#FFFFFF' : colors.primary;

  switch (sort) {
    case 'oldest':
      return <ArrowUpWideNarrow color={color} size={15} />;
    case 'sla':
      return <Timer color={color} size={15} />;
    case 'newest':
    default:
      return <ArrowDownWideNarrow color={color} size={15} />;
  }
}
