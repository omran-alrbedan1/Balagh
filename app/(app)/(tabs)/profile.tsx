import { StyleSheet, Text, View } from 'react-native';
import { Globe2, LogOut, Mail, Phone, ShieldCheck } from 'lucide-react-native';

import { APP_VERSION } from '@/constants/appInfo';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const initial = user?.name?.charAt(0).toUpperCase() ?? 'C';

  return (
    <Screen subtitle="Manage your account, language, and session." title="Profile">
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{user?.name ?? 'Citizen'}</Text>
            <View style={styles.metaRow}>
              <Mail color={colors.textMuted} size={14} />
              <Text style={styles.meta}>{user?.email ?? 'No email added'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Phone color={colors.textMuted} size={14} />
              <Text style={styles.meta}>{user?.phone ?? 'No phone added'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rolePill}>
          <ShieldCheck color={colors.primary} size={14} />
          <Text style={styles.roleText}>{user?.role ?? 'citizen'}</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.sectionHeader}>
          <Globe2 color={colors.primary} size={18} />
          <Text style={styles.sectionTitle}>Language</Text>
        </View>
        <LanguageSwitcher />
      </Card>

      <Card>
        <Text style={styles.meta}>App version</Text>
        <Text style={styles.version}>{APP_VERSION}</Text>
      </Card>

      <Button
        label="Log out"
        iconLeft={<LogOut color={colors.primary} size={18} />}
        loading={logout.isPending}
        onPress={() => logout.mutate()}
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  rolePill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  roleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  version: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
