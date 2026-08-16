import { router } from 'expo-router';
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Clock3,
  Flag,
  MapPin,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Complaint } from '@/api/types/complaint.types';
import { StatusBadge } from '@/features/complaints/components/StatusBadge';
import {
  formatDate,
  getDepartmentCategoryLabel,
  getPriorityLabel,
  getSlaCountdown,
} from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';
import { normalizeComplaintId } from '@/features/complaints/utils/complaintId';

interface ComplaintCardProps {
  complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const { t } = useTranslation();
  const slaCountdown = getSlaCountdown(complaint.due_at);
  const isBreached =
    complaint.is_sla_breached === true || slaCountdown?.includes('breached') === true;
  const priorityColor = complaint.priority?.color ?? colors.primary;
  const location = complaint.address;
  const categoryLabel = getDepartmentCategoryLabel(complaint);
  const complaintId = normalizeComplaintId(complaint.id);

  return (
    <View>
      <Pressable
        accessibilityLabel={t('home.openComplaint', { title: complaint.title })}
        accessibilityRole="button"
        className="mb-4 active:opacity-85"
        disabled={!complaintId}
        onPress={() => {
          if (!complaintId) return;
          router.push({
            pathname: '/(app)/(tabs)/complaints/[id]',
            params: { id: complaintId },
          });
        }}
      >
        <View className="rounded-2xl border-2 border-primary-100 bg-white shadow-md shadow-base-900/10">
          <View className="gap-4 p-4">
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
                <Flag color={priorityColor} size={20} />
              </View>

              <View className="flex-1 gap-2">
                <View className="flex-row items-start justify-between gap-2">
                  <Text
                    className="flex-1 text-[17px] font-black leading-[23px] text-base-900"
                    numberOfLines={2}
                  >
                    {complaint.title}
                  </Text>
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-base-50">
                    <ChevronRight color={colors.textMuted} size={19} />
                  </View>
                </View>

                {categoryLabel ? (
                  <Text className="text-[13px] font-bold text-base-500" numberOfLines={1}>
                    {categoryLabel}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="flex-row flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} />
              <View className="flex-row items-center gap-1.5 rounded-full border border-base-200 bg-base-50 px-3 py-1.5">
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: priorityColor }}
                />
                <Text className="text-xs font-extrabold text-base-900" numberOfLines={1}>
                  {getPriorityLabel(complaint)}
                </Text>
              </View>
            </View>

            <View className="gap-2">
              <MetaRow
                icon={<CalendarDays color={colors.textMuted} size={15} />}
                text={formatDate(complaint.created_at)}
              />
              {location ? (
                <MetaRow icon={<MapPin color={colors.textMuted} size={15} />} text={location} />
              ) : null}
            </View>

            {slaCountdown ? (
              <View
                className={`flex-row items-center gap-2 rounded-xl border px-3 py-2 ${
                  isBreached ? 'border-danger-600 bg-danger-50' : 'border-warning-600 bg-warning-50'
                }`}
              >
                {isBreached ? (
                  <AlertTriangle color={colors.danger} size={16} />
                ) : (
                  <Clock3 color={colors.warning} size={16} />
                )}
                <Text
                  className={`flex-1 text-xs font-black ${
                    isBreached ? 'text-danger-600' : 'text-warning-600'
                  }`}
                >
                  {slaCountdown}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function MetaRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="flex-1 text-[13px] font-semibold text-base-500" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}
