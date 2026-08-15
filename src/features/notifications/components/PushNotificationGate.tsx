import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { APP_VERSION } from '@/constants/appInfo';
import { usePushRegistration } from '@/features/notifications/hooks/usePushRegistration';
import { useRegisterDeviceToken } from '@/features/notifications/hooks/useRegisterDeviceToken';

interface PushNotificationData {
  complaint_id?: string | number;
}

function complaintIdFromData(data: PushNotificationData | undefined) {
  if (!data || data.complaint_id == null) {
    return null;
  }

  return String(data.complaint_id);
}

function openComplaintFromData(data: PushNotificationData | undefined) {
  const complaintId = complaintIdFromData(data);

  if (complaintId) {
    router.push({
      pathname: '/(app)/(tabs)/complaints/[id]',
      params: { id: complaintId },
    });
  }
}

export function PushNotificationGate() {
  const getPushToken = usePushRegistration();
  const registerToken = useRegisterDeviceToken();

  useEffect(() => {
    let cancelled = false;

    async function registerDevice() {
      const result = await getPushToken();

      if (!result || cancelled) {
        return;
      }

      registerToken.mutate({
        ...result,
        device_name: Constants.deviceName ?? `mobile-${Platform.OS}`,
        app_version: APP_VERSION,
      });
    }

    void registerDevice();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openComplaintFromData(
        response.notification.request.content.data as PushNotificationData | undefined,
      );
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [getPushToken, registerToken]);

  useEffect(() => {
    // Handle cold start: the app was opened by tapping a notification.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        openComplaintFromData(
          response.notification.request.content.data as PushNotificationData | undefined,
        );
      }
    });
  }, []);

  return null;
}
