import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useLanguageStore } from '@/features/settings/store/languageStore';

export default function AuthLayout() {
  const token = useAuthStore((state) => state.token);
  const language = useLanguageStore((state) => state.language);
  const segments = useSegments();
  const isLanguageRoute = segments.at(-1) === 'language';

  if (token) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  if (!language && !isLanguageRoute) {
    return <Redirect href="/(auth)/language" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
