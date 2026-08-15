import * as Notifications from 'expo-notifications';

export async function setApplicationBadge(count: number) {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, Math.trunc(count)));
  } catch (error) {
    if (__DEV__) console.warn('Unable to synchronize notification badge.', error);
  }
}
