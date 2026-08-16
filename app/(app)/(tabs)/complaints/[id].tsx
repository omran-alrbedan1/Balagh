import { useLocalSearchParams } from 'expo-router';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flag,
  Hash,
  ImageIcon,
  MapPin,
  TimerReset,
  UserCheck,
} from 'lucide-react-native';
import { ReactNode, useEffect } from 'react';
import { Image, RefreshControl, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { extractComplaint } from '@/api/endpoints/complaints.api';
import { Complaint } from '@/api/types/complaint.types';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ComplaintTimeline } from '@/features/complaints/components/ComplaintTimeline';
import { ComplaintInformationRequestSection } from '@/features/complaints/components/ComplaintInformationRequestSection';
import { StatusBadge } from '@/features/complaints/components/StatusBadge';
import { useComplaintDetail } from '@/features/complaints/hooks/useComplaintDetail';
import {
  formatDate,
  getAttachmentUri,
  getDepartmentCategoryLabel,
  getPriorityLabel,
  getSlaCountdown,
  getSlaStatus,
} from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';
import { normalizeComplaintId } from '@/features/complaints/utils/complaintId';

export default function ComplaintDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const rawComplaintId = Array.isArray(id) ? id[0] : id;
  const complaintId = normalizeComplaintId(rawComplaintId);
  const complaintQuery = useComplaintDetail(complaintId);
  const complaint = extractComplaint(complaintQuery.data);

  useEffect(() => {
    if (__DEV__ && rawComplaintId != null && !complaintId) {
      console.warn('Blocked invalid complaint detail route parameter.');
    }
  }, [complaintId, rawComplaintId]);

  return (
    <Screen
      keyboardAware
      refreshControl={
        complaintId ? (
          <RefreshControl
            onRefresh={() => void complaintQuery.refetch()}
            refreshing={complaintQuery.isRefetching}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      subtitle={
        complaint
          ? t('complaints.createdAt', { date: formatDate(complaint.created_at) })
          : undefined
      }
      title={t('complaints.detailTitle')}
    >
      {!complaintId ? (
        <EmptyState
          title={t('complaints.invalidIdTitle')}
          message={t('complaints.invalidIdMessage')}
        />
      ) : null}

      {complaintId && complaintQuery.isLoading ? (
        <LoadingSpinner label={t('complaints.detailLoading')} />
      ) : null}

      {complaintId && complaintQuery.error ? (
        <ErrorState message={complaintQuery.error.message} />
      ) : null}

      {complaintId && !complaintQuery.isLoading && !complaintQuery.error && !complaint ? (
        <EmptyState
          title={t('complaints.notFoundTitle')}
          message={t('complaints.notFoundMessage')}
        />
      ) : null}

      {complaint ? (
        <ComplaintDetailContent
          complaint={complaint}
          refreshComplaint={async () => extractComplaint((await complaintQuery.refetch()).data)}
        />
      ) : null}
    </Screen>
  );
}

function ComplaintDetailContent({
  complaint,
  refreshComplaint,
}: {
  complaint: Complaint;
  refreshComplaint: () => Promise<Complaint | undefined>;
}) {
  const { t } = useTranslation();
  const slaCountdown = getSlaCountdown(complaint.due_at);
  const slaStatus = getSlaStatus(complaint.due_at, complaint.is_sla_breached);
  const isBreached = slaStatus === 'breached';
  const isDueSoon = slaStatus === 'due_soon';
  const attachmentUris = complaint.attachments
    .map((attachment) => ({
      id: attachment.id,
      uri: getAttachmentUri(attachment),
    }))
    .filter((attachment): attachment is { id: string; uri: string } => Boolean(attachment.uri));

  return (
    <View className="gap-4">
      <ComplaintInformationRequestSection
        complaint={complaint}
        refreshComplaint={refreshComplaint}
      />

      <Animated.View entering={ZoomIn.duration(240).springify().damping(18)}>
        <Card>
          <View className="gap-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
                    <FileText color={colors.primary} size={19} />
                  </View>
                  <Text className="text-xs font-black uppercase text-primary-600">
                    {t('complaints.caseDetails')}
                  </Text>
                </View>
                <Text className="text-2xl font-black leading-8 text-base-900">
                  {complaint.title}
                </Text>
              </View>
              <View className="gap-2">
                <StatusBadge status={complaint.status} />
                {slaStatus && (
                  <View
                    className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
                      isBreached ? 'bg-danger-100' : isDueSoon ? 'bg-warning-100' : 'bg-success-100'
                    }`}
                  >
                    {isBreached ? (
                      <AlertTriangle color={colors.danger} size={12} />
                    ) : isDueSoon ? (
                      <TimerReset color={colors.warning} size={12} />
                    ) : (
                      <CheckCircle2 color={colors.success} size={12} />
                    )}
                    <Text
                      className={`text-xs font-black ${
                        isBreached
                          ? 'text-danger-700'
                          : isDueSoon
                            ? 'text-warning-700'
                            : 'text-success-700'
                      }`}
                    >
                      {t(`complaints.slaStatus.${slaStatus}`)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text className="text-[15px] leading-6 text-base-700">{complaint.description}</Text>

            <View className="flex-row items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2">
              <Hash color={colors.primary} size={16} />
              <Text className="text-sm font-extrabold text-primary-700">
                {complaint.complaint_number
                  ? t('complaints.complaintNumber', { number: complaint.complaint_number })
                  : t('complaints.ref', { ref: complaint.client_ref })}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <AnimatedSection delay={80}>
        <Card>
          <SectionTitle
            icon={<Building2 color={colors.primary} size={19} />}
            title={t('complaints.caseDetails')}
          />
          <View className="gap-3">
            <DetailRow
              icon={<Building2 color={colors.primary} size={18} />}
              label={t('complaintReview.departmentCategory')}
              value={getDepartmentCategoryLabel(complaint)}
            />
            <DetailRow
              icon={<Flag color={complaint.priority?.color ?? colors.warning} size={18} />}
              label={t('common.priority')}
              markerColor={complaint.priority?.color}
              value={getPriorityLabel(complaint)}
            />
            <DetailRow
              icon={<CalendarDays color={colors.primary} size={18} />}
              label={t('complaints.created')}
              value={formatDate(complaint.created_at)}
            />
            {complaint.assigned_employee ? (
              <DetailRow
                icon={<UserCheck color={colors.primary} size={18} />}
                label={t('complaints.assignedEmployee')}
                value={complaint.assigned_employee.name}
              />
            ) : null}
            {complaint.address ? (
              <DetailRow
                icon={<MapPin color={colors.primary} size={18} />}
                label={t('complaints.location')}
                value={complaint.address}
              />
            ) : null}
          </View>

          {slaCountdown ? (
            <Animated.View
              className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
                isBreached ? 'border-danger-600 bg-danger-50' : 'border-warning-600 bg-warning-50'
              }`}
              entering={ZoomIn.delay(180).duration(260)}
            >
              {isBreached ? (
                <AlertTriangle color={colors.danger} size={20} />
              ) : (
                <TimerReset color={colors.warning} size={20} />
              )}
              <Text
                className={`flex-1 font-black ${
                  isBreached ? 'text-danger-600' : 'text-warning-600'
                }`}
              >
                {slaCountdown}
              </Text>
            </Animated.View>
          ) : null}
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={160}>
        <Card>
          <SectionTitle
            icon={<ImageIcon color={colors.primary} size={19} />}
            title={t('complaints.attachments')}
          />
          {attachmentUris.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {attachmentUris.map((attachment, index) => (
                <Animated.View
                  className="aspect-square w-[31%] overflow-hidden rounded-xl border border-base-200 bg-base-50"
                  entering={ZoomIn.delay(120 + index * 50).duration(240)}
                  key={attachment.id}
                >
                  <Image
                    className="h-full w-full"
                    resizeMode="cover"
                    source={{ uri: attachment.uri }}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <Text className="text-[15px] leading-[21px] text-base-500">
              {t('complaints.noAttachments')}
            </Text>
          )}
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={240}>
        <Card>
          <SectionTitle
            icon={<TimerReset color={colors.primary} size={19} />}
            title={t('complaints.timeline')}
          />
          <ComplaintTimeline entries={complaint.timeline ?? []} />
        </Card>
      </AnimatedSection>
    </View>
  );
}

function AnimatedSection({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(240)}
      layout={LinearTransition.duration(180)}
    >
      {children}
    </Animated.View>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-50">{icon}</View>
      <Text className="text-lg font-black text-base-900">{title}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  markerColor,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  markerColor?: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-base-200 bg-base-50 px-3 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-white">{icon}</View>
      {markerColor ? (
        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: markerColor }} />
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text className="text-xs font-extrabold text-base-500">{label}</Text>
        <Text className="text-[15px] font-extrabold text-base-900">{value}</Text>
      </View>
    </View>
  );
}
