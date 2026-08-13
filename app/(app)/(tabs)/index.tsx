import { router } from 'expo-router';
import { Clock3, FilePlus2, Inbox, ShieldCheck } from 'lucide-react-native';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useHomeStats } from '@/features/home/hooks/useHomeStats';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: stats, isLoading, isRefetching, refetch } = useHomeStats();

  return (
    <Screen
      subtitle={t('home.subtitle')}
      title={t('home.title')}
      refreshControl={
        <RefreshControl
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
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

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{t('home.openComplaints')}</Text>
            <FilePlus2 color={colors.primary} size={18} />
          </View>
          <Text style={styles.statValue}>{isLoading ? '-' : (stats?.openComplaints ?? 0)}</Text>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>{t('home.pendingSla')}</Text>
            <Clock3 color={colors.warning} size={18} />
          </View>
          <Text style={styles.statValue}>{isLoading ? '-' : (stats?.pendingSla ?? 0)}</Text>
        </Card>
      </View>

      <Button
        label={t('home.newComplaint')}
        iconLeft={<FilePlus2 color="#FFFFFF" size={19} />}
        onPress={() => router.push('/(app)/(tabs)/complaints/new')}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.recentActivity')}</Text>
        {!isLoading && (!stats?.recentActivity || stats.recentActivity.length === 0) ? (
          <EmptyState
            icon={Inbox}
            title={t('home.noComplaintsTitle')}
            message={t('home.noComplaintsMessage')}
          />
        ) : (
          stats?.recentActivity.map((item) => (
            <Card key={item.id}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <View style={styles.activityMeta}>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{item.status.replaceAll('_', ' ')}</Text>
                </View>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  activityDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  activityMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
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
  heroText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  statCard: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  welcome: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
