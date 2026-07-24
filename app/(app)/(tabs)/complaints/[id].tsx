import { useLocalSearchParams } from 'expo-router';
import { AlertTriangle, CalendarDays, ImageIcon, MapPin, UserCheck } from 'lucide-react-native';
import { Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { extractComplaint } from '@/api/endpoints/complaints.api';
import { Complaint } from '@/api/types/complaint.types';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ComplaintTimeline } from '@/features/complaints/components/ComplaintTimeline';
import { StatusBadge } from '@/features/complaints/components/StatusBadge';
import { useComplaintDetail } from '@/features/complaints/hooks/useComplaintDetail';
import {
  formatDate,
  getAttachmentUri,
  getDepartmentCategoryLabel,
  getPriorityLabel,
  getSlaCountdown,
} from '@/features/complaints/utils/complaintDisplay';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const complaintId = Array.isArray(id) ? id[0] : (id ?? '');
  const complaintQuery = useComplaintDetail(complaintId);
  const complaint = extractComplaint(complaintQuery.data);

  return (
    <Screen
      refreshControl={
        <RefreshControl
          onRefresh={() => void complaintQuery.refetch()}
          refreshing={complaintQuery.isRefetching}
          tintColor={colors.primary}
        />
      }
      subtitle={complaint ? `Created ${formatDate(complaint.created_at)}` : undefined}
      title="Complaint Detail"
    >
      {complaintQuery.isLoading ? <LoadingSpinner label="Loading complaint" /> : null}

      {complaintQuery.error ? <ErrorState message={complaintQuery.error.message} /> : null}

      {!complaintQuery.isLoading && !complaintQuery.error && !complaint ? (
        <EmptyState
          title="Complaint not found"
          message="This complaint may have been removed or is unavailable to your account."
        />
      ) : null}

      {complaint ? <ComplaintDetailContent complaint={complaint} /> : null}
    </Screen>
  );
}

function ComplaintDetailContent({ complaint }: { complaint: Complaint }) {
  const slaCountdown = getSlaCountdown(complaint.sla_due_at);
  const isBreached = slaCountdown?.includes('breached') || complaint.sla_status === 'breached';

  return (
    <>
      <Card>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Text style={styles.complaintTitle}>{complaint.title}</Text>
            <Text style={styles.reference}>Ref {complaint.client_ref}</Text>
          </View>
          <StatusBadge status={complaint.status} />
        </View>
        <Text style={styles.description}>{complaint.description}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Case Details</Text>
        <DetailRow label="Department / Category" value={getDepartmentCategoryLabel(complaint)} />
        <DetailRow
          label="Priority"
          value={getPriorityLabel(complaint)}
          markerColor={complaint.priority?.color}
        />
        <DetailRow
          icon={<CalendarDays color={colors.textMuted} size={16} />}
          label="Created"
          value={formatDate(complaint.created_at)}
        />
        {complaint.assigned_employee ? (
          <DetailRow
            icon={<UserCheck color={colors.textMuted} size={16} />}
            label="Assigned Employee"
            value={complaint.assigned_employee.name}
          />
        ) : null}
        {complaint.location?.address ? (
          <DetailRow
            icon={<MapPin color={colors.textMuted} size={16} />}
            label="Location"
            value={complaint.location.address}
          />
        ) : null}
        {slaCountdown ? (
          <View style={[styles.slaBox, isBreached ? styles.slaBreached : null]}>
            <AlertTriangle color={isBreached ? colors.danger : colors.warning} size={18} />
            <Text style={[styles.slaText, isBreached ? styles.slaTextBreached : null]}>
              {slaCountdown}
            </Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <ImageIcon color={colors.primary} size={18} />
          <Text style={styles.sectionTitle}>Attachments</Text>
        </View>
        {complaint.attachments.length > 0 ? (
          <View style={styles.gallery}>
            {complaint.attachments.map((attachment) => (
              <Image
                key={attachment.id}
                source={{ uri: getAttachmentUri(attachment) }}
                style={styles.attachment}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>No attachments were submitted with this complaint.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <ComplaintTimeline entries={complaint.timeline ?? []} />
      </Card>
    </>
  );
}

function DetailRow({
  icon,
  label,
  markerColor,
  value,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  markerColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      {icon}
      {markerColor ? <View style={[styles.marker, { backgroundColor: markerColor }]} /> : null}
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attachment: {
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    width: '30%',
  },
  complaintTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  marker: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  reference: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  slaBox: {
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderColor: '#FDE68A',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  slaBreached: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  slaText: {
    color: colors.warning,
    flex: 1,
    fontWeight: '900',
  },
  slaTextBreached: {
    color: colors.danger,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
  },
});
