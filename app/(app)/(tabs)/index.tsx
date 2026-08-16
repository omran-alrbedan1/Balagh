import { router } from 'expo-router';
import { CheckCircle2, Clock3, FilePlus2, Inbox, ShieldCheck } from 'lucide-react-native';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DashboardComplaint, HomeDashboard } from '@/api/endpoints/home.api';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/features/auth/store/authStore';
import { StatusBadge } from '@/features/complaints/components/StatusBadge';
import { normalizeComplaintId } from '@/features/complaints/utils/complaintId';
import { formatDate } from '@/features/complaints/utils/complaintDisplay';
import { useHomeStats } from '@/features/home/hooks/useHomeStats';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const dashboardQuery = useHomeStats();
  const unreadQuery = useUnreadCount();
  const dashboard = dashboardQuery.data?.data;
  const isInitialLoading = dashboardQuery.isLoading && !dashboard;

  const refresh = async () => {
    await Promise.all([dashboardQuery.refetch(), unreadQuery.refetch()]);
  };

  return (
    <Screen
      subtitle={t('home.subtitle')}
      title={t('home.title')}
      refreshControl={
        <RefreshControl
          onRefresh={() => void refresh()}
          refreshing={dashboardQuery.isRefetching || unreadQuery.isRefetching}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <ShieldCheck color={colors.primary} size={24} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.welcome}>{t('home.welcome')}</Text>
          <Text style={styles.name}>{user?.name ?? t('home.citizen')}</Text>
        </View>
      </View>

      {isInitialLoading ? <SummaryCards /> : null}

      {!dashboard && dashboardQuery.isError ? (
        <View style={styles.section}>
          <EmptyState
            icon={Inbox}
            title={t('home.dashboardUnavailable')}
            message={t('home.dashboardUnavailableMessage')}
          />
          <Button label={t('common.retry')} onPress={() => void refresh()} variant="secondary" />
        </View>
      ) : null}

      {dashboard ? <HomeDashboardContent dashboard={dashboard} /> : null}

      <Button
        label={t('home.newComplaint')}
        iconLeft={<FilePlus2 color="#FFFFFF" size={19} />}
        onPress={() => router.push('/(app)/(tabs)/complaints/new')}
      />
    </Screen>
  );
}

function HomeDashboardContent({ dashboard }: { dashboard: HomeDashboard }) {
  const { t } = useTranslation();
  const actionRequired = dashboard.action_required;

  return (
    <>
      <SummaryCards counts={dashboard.counts} />

      {dashboard.counts.waiting_citizen > 0 && actionRequired.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.actionRequired')}</Text>
          {actionRequired.map((complaint) => (
            <ActionRequiredCard complaint={complaint} key={complaint.id} />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.recentComplaints')}</Text>
        {dashboard.recent_complaints.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t('home.noComplaintsTitle')}
            message={t('home.noComplaintsMessage')}
          />
        ) : (
          dashboard.recent_complaints.map((complaint) => (
            <RecentComplaintCard complaint={complaint} key={complaint.id} />
          ))
        )}
      </View>
    </>
  );
}

function SummaryCards({ counts }: { counts?: HomeDashboard['counts'] }) {
  const { t } = useTranslation();

  const cards = [
    { icon: FilePlus2, label: t('home.activeComplaints'), value: counts?.active },
    { icon: Clock3, label: t('home.waitingForResponse'), value: counts?.waiting_citizen },
    { icon: CheckCircle2, label: t('home.completedComplaints'), value: counts?.completed },
  ];

  return (
    <View style={styles.statsGrid}>
      {cards.map(({ icon: Icon, label, value }) => (
        <Card key={label} style={styles.statCard}>
          <View style={styles.statHeader}>
            <Icon color={colors.primary} size={18} />
          </View>
          <Text style={styles.statValue}>{typeof value === 'number' ? value : '-'}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </Card>
      ))}
    </View>
  );
}

function ActionRequiredCard({ complaint }: { complaint: DashboardComplaint }) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityLabel={t('home.openActionRequired', { title: complaint.title })}
      accessibilityRole="button"
      onPress={() => openComplaint(complaint.id)}
      style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardText}>
          {complaint.complaint_number ? (
            <Text style={styles.reference}>{complaint.complaint_number}</Text>
          ) : null}
          <Text numberOfLines={2} style={styles.complaintTitle}>
            {complaint.title}
          </Text>
        </View>
        <StatusBadge status={complaint.status} />
      </View>
      <Text style={styles.actionMessage}>{t('home.additionalInformationRequired')}</Text>
      <Text style={styles.openAction}>{t('home.openComplaintAction')}</Text>
    </Pressable>
  );
}

function RecentComplaintCard({ complaint }: { complaint: DashboardComplaint }) {
  const { t } = useTranslation();
  const location = [complaint.department?.name, complaint.category?.name]
    .filter(Boolean)
    .join(' / ');

  return (
    <Pressable
      accessibilityLabel={t('home.openComplaint', { title: complaint.title })}
      accessibilityRole="button"
      onPress={() => openComplaint(complaint.id)}
      style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardText}>
          {complaint.complaint_number ? (
            <Text style={styles.reference}>{complaint.complaint_number}</Text>
          ) : null}
          <Text numberOfLines={2} style={styles.complaintTitle}>
            {complaint.title}
          </Text>
        </View>
        <StatusBadge status={complaint.status} />
      </View>
      <View style={styles.cardFooter}>
        <Text numberOfLines={1} style={styles.meta}>
          {location || t('common.notAvailable')}
        </Text>
        <Text style={styles.meta}>{formatDate(complaint.created_at)}</Text>
      </View>
    </Pressable>
  );
}

function openComplaint(id: string) {
  const complaintId = normalizeComplaintId(id);
  if (!complaintId) return;
  router.push({ pathname: '/(app)/(tabs)/complaints/[id]', params: { id: complaintId } });
}

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  actionMessage: { color: colors.text, fontSize: 14, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  cardText: { flex: 1, gap: spacing.xs },
  complaintTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  heroText: { flex: 1 },
  meta: { color: colors.textMuted, flex: 1, fontSize: 12, fontWeight: '600' },
  name: { color: colors.text, fontSize: 30, fontWeight: '900' },
  openAction: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.72 },
  recentCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  reference: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statCard: { flex: 1, gap: spacing.xs, minWidth: '30%' },
  statHeader: { alignItems: 'flex-end' },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  statValue: { color: colors.text, fontSize: 28, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  welcome: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
