import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { registerDeviceToken } from '@/api/endpoints/auth.api';
import { getUnreadCount as fetchUnreadCount } from '@/api/endpoints/notifications.api';
import { APP_VERSION } from '@/constants/appInfo';
import { queryKeys } from '@/constants/queryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';
import { acquireExpoPushToken } from '@/features/notifications/hooks/usePushRegistration';
import { useUnreadCount } from '@/features/notifications/hooks/useUnreadCount';
import { setApplicationBadge } from '@/features/notifications/utils/badge';
import { resolveNotificationDestination } from '@/features/notifications/utils/notificationNavigation';
import { queryClient } from '@/lib/queryClient';
import {
  clearPushRegistration,
  getPushRegistration,
  savePushRegistration,
} from '@/lib/secureStorage';

const handledResponseIds = new Set<string>();
let registrationInFlight: Promise<void> | null = null;

async function synchronizeNotificationQueries() {
  await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  const result = await queryClient.fetchQuery({
    queryKey: queryKeys.notificationUnreadCount,
    queryFn: fetchUnreadCount,
  });
  await setApplicationBadge(result.data.count);
}

export async function registerCurrentDevice(userId: string | null) {
  if (!userId) return;
  const pushResult = await acquireExpoPushToken();
  if (pushResult.status !== 'success') return;

  const value = pushResult.value;
  const stored = await getPushRegistration();
  if (
    stored?.userId === userId &&
    stored.token === value.token &&
    stored.platform === value.platform &&
    stored.appVersion === APP_VERSION
  ) {
    return;
  }

  if (stored?.userId !== userId) await clearPushRegistration();

  const response = await registerDeviceToken({
    ...value,
    device_name: Constants.deviceName ?? `mobile-${Platform.OS}`,
    app_version: APP_VERSION,
  });
  await savePushRegistration({
    appVersion: APP_VERSION,
    deviceTokenId: response.data.id,
    platform: value.platform,
    token: value.token,
    userId,
  });
}

function safelyRegister(userId: string) {
  if (!registrationInFlight) {
    registrationInFlight = registerCurrentDevice(userId)
      .catch((error) => {
        if (__DEV__) console.warn('Device-token registration failed.', error);
      })
      .finally(() => {
        registrationInFlight = null;
      });
  }
  return registrationInFlight;
}

function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const identifier = response.notification.request.identifier;
  if (handledResponseIds.has(identifier)) return false;

  const destination = resolveNotificationDestination(response.notification.request.content.data);
  handledResponseIds.add(identifier);
  if (handledResponseIds.size > 100)
    handledResponseIds.delete(handledResponseIds.values().next().value!);
  if (!destination) return false;

  router.push(destination);
  return true;
}

export function PushNotificationGate() {
  useUnreadCount();
  const userId = useAuthStore((state) => state.user?.id);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (userId != null) void safelyRegister(String(userId));
    return () => {
      mounted.current = false;
    };
  }, [userId]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userId != null) {
        void safelyRegister(String(userId));
      }
    });
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void synchronizeNotificationQueries().catch((error) => {
        if (__DEV__) console.warn('Unable to refresh notification state.', error);
      });
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
        void synchronizeNotificationQueries();
      },
    );
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      if (userId != null) {
        void clearPushRegistration().then(() => safelyRegister(String(userId)));
      }
    });

    void Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (!mounted.current || !response) return;
      handleNotificationResponse(response);
      await Notifications.clearLastNotificationResponseAsync();
      void synchronizeNotificationQueries();
    });

    return () => {
      appStateSubscription.remove();
      receivedSubscription.remove();
      responseSubscription.remove();
      tokenSubscription.remove();
    };
  }, [userId]);

  return null;
}
