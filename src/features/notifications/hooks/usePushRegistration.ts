import * as Notifications from 'expo-notifications';
import { useCallback } from 'react';

export function usePushRegistration() {
  return useCallback(async () => {
    const permission = await Notifications.requestPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  }, []);
}
