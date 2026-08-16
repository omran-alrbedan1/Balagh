import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Globe2, LogOut, Mail, Phone, ShieldCheck, Bell, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { APP_VERSION } from '@/constants/appInfo';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useLogoutAll } from '@/features/auth/hooks/useLogoutAll';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LanguageSwitcher } from '@/features/settings/components/LanguageSwitcher';
import { NotificationPreferencesCard } from '@/features/notifications/components/NotificationPreferencesCard';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { formatUnreadBadge } from '@/features/notifications/utils/badge';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const logoutAll = useLogoutAll();
  const unreadCount = useUnreadCount().data?.data.count ?? 0;
  const unreadBadge = formatUnreadBadge(unreadCount);
  const initial = user?.name?.charAt(0).toUpperCase() ?? t('home.citizen').charAt(0);
  const role = user?.role ?? t('profile.citizenRole');

  const menuItems = [
    {
      icon: Bell,
      label: t('profile.notifications'),
      onPress: () => router.push('/(app)/(tabs)/notifications'),
    },
  ];

  return (
    <Screen subtitle={t('profile.subtitle')} title={t('profile.title')}>
      {/* Header Card */}
      <View className="bg-primary-600 dark:bg-primary-700 rounded-3xl p-6 mb-4 shadow-lg shadow-primary-200/50 dark:shadow-primary-900/30">
        <View className="flex-row items-center gap-4">
          {/* Avatar */}
          <View className="w-20 h-20 rounded-full bg-white/20 p-1">
            <View className="w-full h-full rounded-full bg-white items-center justify-center">
              <Text className="text-3xl font-black text-primary-600 dark:text-primary-700">
                {initial}
              </Text>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-white text-xl font-black">{user?.name ?? t('home.citizen')}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="bg-white/20 rounded-full px-3 py-1 flex-row items-center gap-1.5">
                <ShieldCheck color="#FFFFFF" size={12} />
                <Text className="text-white text-xs font-bold capitalize">{role}</Text>
              </View>
            </View>
            <View className="flex-col items-start gap-3 mt-2">
              <View className="flex-row  items-center gap-1">
                <Mail color="#FFFFFF" size={12} />
                <Text className="text-white/80 text-sm">{user?.email ?? t('profile.noEmail')}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Phone color="#FFFFFF" size={12} />
                <Text className="text-white/80 text-sm">{user?.phone ?? t('profile.noPhone')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <Card style={{ marginBottom: 16 }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              onPress={item.onPress}
              className={`flex-row items-center py-3.5 px-1 ${
                index < menuItems.length - 1 ? 'border-b border-base-200 dark:border-base-700' : ''
              }`}
            >
              <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center">
                <Icon color="#082248" size={18} />
              </View>
              <Text className="flex-1 text-base-900 dark:text-white text-base font-medium ml-3">
                {item.label}
              </Text>
              {index === 0 && unreadBadge ? (
                <View className="min-w-6 items-center justify-center rounded-full bg-danger-600 px-1.5 py-0.5">
                  <Text className="text-xs font-black text-white">{unreadBadge}</Text>
                </View>
              ) : null}
              <ChevronRight color="#9CA3AF" size={18} />
            </Pressable>
          );
        })}
      </Card>

      <NotificationPreferencesCard />

      {/* Language Section */}
      <Card style={{ marginBottom: 16 }}>
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center">
            <Globe2 color="#082248" size={18} />
          </View>
          <Text className="text-base-900 dark:text-white text-base font-bold">
            {t('profile.language')}
          </Text>
        </View>
        <LanguageSwitcher />
      </Card>

      {/* Version Info */}
      <Card style={{ marginBottom: 16 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-base-500 dark:text-base-400 text-sm">{t('common.appVersion')}</Text>
          <View className="bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
            <Text className="text-primary-600 dark:text-primary-400 font-bold text-sm">
              {APP_VERSION}
            </Text>
          </View>
        </View>
      </Card>

      {/* Logout Button */}
      <Button
        label={t('profile.logout')}
        iconLeft={<LogOut color="#DC2626" size={18} />}
        loading={logout.isPending}
        onPress={() => logout.mutate()}
        variant="danger"
      />

      {/* Logout All Button */}
      <View className="mt-2">
        <Button
          label={t('profile.logoutAll')}
          iconLeft={<LogOut color="#DC2626" size={18} />}
          loading={logoutAll.isPending}
          onPress={() => logoutAll.mutate()}
          variant="danger"
        />
      </View>
    </Screen>
  );
}
