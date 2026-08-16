import * as Notifications from 'expo-notifications';

export function formatUnreadBadge(count: number) {
  const normalized = Math.max(0, Math.trunc(count));
  if (normalized === 0) return undefined;
  return normalized > 99 ? '99+' : String(normalized);
}

export async function setApplicationBadge(count: number) {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, Math.trunc(count)));
  } catch (error) {
    if (__DEV__) console.warn('Unable to synchronize notification badge.', error);
  }
}
