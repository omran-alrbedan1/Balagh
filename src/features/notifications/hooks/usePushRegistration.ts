import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useCallback } from 'react';

import { Config } from '@/constants/config';
import { DeviceTokenPayload } from '@/api/types/device.types';

export interface PushTokenResult {
  token: string;
  platform: 'ios' | 'android';
}

export function usePushRegistration() {
  return useCallback(async (): Promise<PushTokenResult | null> => {
    // Disable push notifications in development
    const isDevelopment =
      Config.API_BASE_URL.includes('127.0.0.1') ||
      Config.API_BASE_URL.includes('localhost') ||
      Config.API_BASE_URL.includes('192.168.') ||
      Config.API_BASE_URL.includes('10.');

    if (isDevelopment) {
      return null;
    }

    try {
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
    } catch (error) {
      console.warn('Push notification registration failed:', error);
      return null;
    }
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
