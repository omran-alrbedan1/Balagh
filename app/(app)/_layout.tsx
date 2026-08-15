import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/store/authStore';
import { PushNotificationGate } from '@/features/notifications/components/PushNotificationGate';
import { useOfflineSyncManager } from '@/features/offline/hooks/useOfflineSyncManager';

export default function AppLayout() {
  const token = useAuthStore((state) => state.token);
  useOfflineSyncManager();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <PushNotificationGate />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
