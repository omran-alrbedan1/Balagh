import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import '../global.css';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { configureNotificationHandlers } from '@/features/notifications/utils/notificationHandlers';
import { useLanguageStore } from '@/features/settings/store/languageStore';
import { AppProviders } from '@/lib/AppProviders';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { t } = useTranslation();
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);
  const hydrateLanguage = useLanguageStore((state) => state.hydrate);
  const isLanguageHydrated = useLanguageStore((state) => state.isHydrated);

  useEffect(() => {
    configureNotificationHandlers();
    Promise.all([hydrate(), hydrateLanguage()]).finally(() => {
      void SplashScreen.hideAsync();
    });
  }, [hydrate, hydrateLanguage]);

  if (!isHydrated || !isLanguageHydrated) {
    return <LoadingSpinner label={`${t('common.loading')} ${t('appName')}`} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
