import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';
import { PushNotificationGate } from '@/features/notifications/components/PushNotificationGate';
import { useOfflineSyncManager } from '@/features/offline/hooks/useOfflineSyncManager';
import { OfflineStatusBanner } from '@/features/offline/components/OfflineStatusBanner';
import { useOfflineLookupWarmup } from '@/features/offline/hooks/useOfflineLookupWarmup';

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);
  useOfflineSyncManager();
  useOfflineLookupWarmup();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <PushNotificationGate />
      <OfflineStatusBanner />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
