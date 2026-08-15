import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useCallback } from 'react';

import { DeviceTokenPayload } from '@/api/types/device.types';

export interface PushTokenResult {
  token: string;
  platform: 'ios' | 'android';
}

export function usePushRegistration() {
  return useCallback(async (): Promise<PushTokenResult | null> => {
    const permission = await Notifications.requestPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    // The backend delivers notifications directly through FCM/APNs, so we
    // register the native device token (requires a development build).
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const token =
      typeof deviceToken.data === 'string' ? deviceToken.data : JSON.stringify(deviceToken.data);

    if (!token) {
      return null;
    }

    return {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    };
  }, []);
}

export function buildDeviceTokenPayload(
  result: PushTokenResult,
  deviceName: string,
  appVersion: string,
): DeviceTokenPayload {
  return {
    token: result.token,
    platform: result.platform,
    device_name: deviceName,
    app_version: appVersion,
  };
}
