import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useCallback } from 'react';
import { Platform } from 'react-native';

import { DeviceTokenPayload } from '@/api/types/device.types';
import { Config } from '@/constants/config';

export interface PushTokenResult {
  token: string;
  platform: 'ios' | 'android';
}

export type PushRegistrationResult =
  | { status: 'success'; value: PushTokenResult }
  | { status: 'disabled' | 'denied' | 'missing-project-id' | 'unsupported' | 'error' };

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

export function getExpoProjectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
    name: 'Balagh notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export async function acquireExpoPushToken(): Promise<PushRegistrationResult> {
  if (!Config.PUSH_NOTIFICATIONS_ENABLED) return { status: 'disabled' };
  if (Platform.OS === 'web') return { status: 'unsupported' };

  try {
    await ensureAndroidNotificationChannel();

    let permissions = await Notifications.getPermissionsAsync();
    if (
      !permissions.granted &&
      permissions.canAskAgain &&
      permissions.status === Notifications.PermissionStatus.UNDETERMINED
    ) {
      permissions = await Notifications.requestPermissionsAsync();
    }
    if (!permissions.granted) return { status: 'denied' };

    const projectId = getExpoProjectId();
    if (!projectId) {
      if (__DEV__) console.warn('Push notifications require extra.eas.projectId in Expo config.');
      return { status: 'missing-project-id' };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (!token) return { status: 'error' };

    return {
      status: 'success',
      value: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
    };
  } catch (error) {
    if (__DEV__) console.warn('Push notification registration failed.', error);
    return { status: 'error' };
  }
}

export function usePushRegistration() {
  return useCallback(() => acquireExpoPushToken(), []);
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
