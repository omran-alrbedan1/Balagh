import { deleteDeviceToken } from '@/api/endpoints/auth.api';
import { setApplicationBadge } from '@/features/notifications/utils/badge';
import { clearPushRegistration, getPushRegistration } from '@/lib/secureStorage';

export async function cleanupDeviceTokenForUser(userId: string | number | undefined) {
  try {
    const registration = await getPushRegistration();
    if (registration && userId != null && registration.userId === String(userId)) {
      await deleteDeviceToken(registration.deviceTokenId);
    }
  } catch (error) {
    if (__DEV__) console.warn('Unable to deactivate this device token during logout.', error);
  } finally {
    await clearLocalPushRegistration();
  }
}

export async function clearLocalPushRegistration() {
  await clearPushRegistration();
  await setApplicationBadge(0);
}
