import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { acquireExpoPushToken, DEFAULT_NOTIFICATION_CHANNEL_ID } from '../usePushRegistration';

jest.mock('@/constants/config', () => ({
  Config: { PUSH_NOTIFICATIONS_ENABLED: true },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: 'project-id' } } },
    easConfig: null,
  },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 3 },
  PermissionStatus: { DENIED: 'denied', GRANTED: 'granted', UNDETERMINED: 'undetermined' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

const notifications = Notifications as jest.Mocked<typeof Notifications>;

const permission = (granted: boolean, canAskAgain = true, status?: string) =>
  ({
    granted,
    canAskAgain,
    status: status ?? (granted ? 'granted' : 'denied'),
    expires: 'never',
  }) as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
  notifications.getPermissionsAsync.mockResolvedValue(permission(true));
  notifications.requestPermissionsAsync.mockResolvedValue(permission(true));
  notifications.getExpoPushTokenAsync.mockResolvedValue({
    data: 'ExpoPushToken[test]',
    type: 'expo',
  });
  notifications.setNotificationChannelAsync.mockResolvedValue(null);
  (Constants.expoConfig!.extra!.eas as { projectId: string }).projectId = 'project-id';
});

describe('Expo push registration', () => {
  it('uses an already granted permission without prompting', async () => {
    expect(await acquireExpoPushToken()).toEqual({
      status: 'success',
      value: { token: 'ExpoPushToken[test]', platform: 'android' },
    });
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('requests an undetermined permission and continues when granted', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false, true, 'undetermined'));
    await acquireExpoPushToken();
    expect(notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-id' });
  });

  it('returns denied when the request is rejected', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false, true, 'undetermined'));
    notifications.requestPermissionsAsync.mockResolvedValue(permission(false, false));
    expect(await acquireExpoPushToken()).toEqual({ status: 'denied' });
  });

  it('does not repeatedly prompt when permission cannot be requested again', async () => {
    notifications.getPermissionsAsync.mockResolvedValue(permission(false, false));
    expect(await acquireExpoPushToken()).toEqual({ status: 'denied' });
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('reports a missing EAS project ID without acquiring a token', async () => {
    (Constants.expoConfig!.extra!.eas as { projectId: string | null }).projectId = null;
    expect(await acquireExpoPushToken()).toEqual({ status: 'missing-project-id' });
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('returns an error when token acquisition fails', async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('native failure'));
    expect(await acquireExpoPushToken()).toEqual({ status: 'error' });
  });

  it('creates the Android channel before reading permissions and token', async () => {
    await acquireExpoPushToken();
    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      DEFAULT_NOTIFICATION_CHANNEL_ID,
      expect.objectContaining({ importance: 3, sound: 'default' }),
    );
    expect(notifications.setNotificationChannelAsync.mock.invocationCallOrder[0]).toBeLessThan(
      notifications.getPermissionsAsync.mock.invocationCallOrder[0],
    );
  });
});
