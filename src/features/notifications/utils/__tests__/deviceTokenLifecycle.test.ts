import { deleteDeviceToken } from '@/api/endpoints/auth.api';
import { setApplicationBadge } from '@/features/notifications/utils/badge';
import { clearPushRegistration, getPushRegistration } from '@/lib/secureStorage';

import { cleanupDeviceTokenForUser } from '../deviceTokenLifecycle';

jest.mock('@/api/endpoints/auth.api', () => ({ deleteDeviceToken: jest.fn() }));
jest.mock('@/features/notifications/utils/badge', () => ({ setApplicationBadge: jest.fn() }));
jest.mock('@/lib/secureStorage', () => ({
  clearPushRegistration: jest.fn(),
  getPushRegistration: jest.fn(),
}));

const remove = deleteDeviceToken as jest.MockedFunction<typeof deleteDeviceToken>;
const getRegistration = getPushRegistration as jest.MockedFunction<typeof getPushRegistration>;
const clearRegistration = clearPushRegistration as jest.MockedFunction<
  typeof clearPushRegistration
>;
const setBadge = setApplicationBadge as jest.MockedFunction<typeof setApplicationBadge>;

beforeEach(() => {
  jest.clearAllMocks();
  clearRegistration.mockResolvedValue();
  setBadge.mockResolvedValue();
});

it('unregisters only the locally recorded token for the authenticated user before normal logout', async () => {
  getRegistration.mockResolvedValue({
    appVersion: '1.0.0',
    deviceTokenId: 51,
    platform: 'android',
    token: 'ExpoPushToken[current]',
    userId: 'citizen-1',
  });
  remove.mockResolvedValue({ success: true, data: null });

  await cleanupDeviceTokenForUser('citizen-1');

  expect(remove).toHaveBeenCalledWith(51);
  expect(clearRegistration).toHaveBeenCalledTimes(1);
  expect(setBadge).toHaveBeenCalledWith(0);
});

it('never deletes a token recorded for another user and still clears local bookkeeping', async () => {
  getRegistration.mockResolvedValue({
    appVersion: '1.0.0',
    deviceTokenId: 51,
    platform: 'android',
    token: 'ExpoPushToken[other]',
    userId: 'another-user',
  });

  await cleanupDeviceTokenForUser('citizen-1');

  expect(remove).not.toHaveBeenCalled();
  expect(clearRegistration).toHaveBeenCalledTimes(1);
});

it('does not prevent normal logout cleanup when device-token deletion fails', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation();
  getRegistration.mockResolvedValue({
    appVersion: '1.0.0',
    deviceTokenId: 51,
    platform: 'android',
    token: 'ExpoPushToken[current]',
    userId: 'citizen-1',
  });
  remove.mockRejectedValue(new Error('offline'));

  await expect(cleanupDeviceTokenForUser('citizen-1')).resolves.toBeUndefined();

  expect(clearRegistration).toHaveBeenCalledTimes(1);
  warning.mockRestore();
});
