import { registerDeviceToken } from '@/api/endpoints/auth.api';
import * as Notifications from 'expo-notifications';
import { act, render, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { acquireExpoPushToken } from '@/features/notifications/hooks/usePushRegistration';
import { useAuthStore } from '@/features/auth/store/authStore';
import { queryClient } from '@/lib/queryClient';
import { getPushRegistration, savePushRegistration } from '@/lib/secureStorage';

import { PushNotificationGate, registerCurrentDevice } from '../PushNotificationGate';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addPushTokenListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { deviceName: 'Test Phone', expoConfig: { version: '1.0.0' } },
}));
jest.mock('@/api/endpoints/auth.api', () => ({ registerDeviceToken: jest.fn() }));
jest.mock('@/api/endpoints/notifications.api', () => ({
  getUnreadCount: jest.fn().mockResolvedValue({ success: true, data: { count: 4 } }),
}));
jest.mock('@/features/notifications/hooks/useUnreadCount', () => ({
  useUnreadCount: jest.fn(),
}));
jest.mock('@/features/notifications/hooks/usePushRegistration', () => ({
  acquireExpoPushToken: jest.fn(),
}));
jest.mock('@/lib/secureStorage', () => ({
  clearPushRegistration: jest.fn(),
  getPushRegistration: jest.fn(),
  savePushRegistration: jest.fn(),
}));

const acquire = acquireExpoPushToken as jest.MockedFunction<typeof acquireExpoPushToken>;
const register = registerDeviceToken as jest.MockedFunction<typeof registerDeviceToken>;
const getStored = getPushRegistration as jest.MockedFunction<typeof getPushRegistration>;
const saveStored = savePushRegistration as jest.MockedFunction<typeof savePushRegistration>;
const notifications = Notifications as jest.Mocked<typeof Notifications>;
const addAppStateListener = jest.spyOn(AppState, 'addEventListener');

beforeEach(() => {
  jest.clearAllMocks();
  acquire.mockResolvedValue({
    status: 'success',
    value: { token: 'ExpoPushToken[first]', platform: 'android' },
  });
  register.mockResolvedValue({
    success: true,
    data: {
      id: 31,
      platform: 'android',
      device_name: 'Test Phone',
      app_version: '1.0.0',
      last_used_at: null,
      is_active: true,
      created_at: null,
      updated_at: null,
    },
  });
  getStored.mockResolvedValue(null);
  useAuthStore.setState({
    isHydrated: true,
    token: 'token',
    user: { id: 8, name: 'Test User' },
  });
  notifications.getLastNotificationResponseAsync.mockResolvedValue(null);
  notifications.clearLastNotificationResponseAsync.mockResolvedValue();
  const subscription = () => ({ remove: jest.fn() });
  notifications.addNotificationReceivedListener.mockImplementation(subscription);
  notifications.addNotificationResponseReceivedListener.mockImplementation(subscription);
  notifications.addPushTokenListener.mockImplementation(subscription);
  addAppStateListener.mockReturnValue({ remove: jest.fn() });
});

it('does not register for a logged-out user', async () => {
  await registerCurrentDevice(null);
  expect(acquire).not.toHaveBeenCalled();
  expect(register).not.toHaveBeenCalled();
});

it('registers an authenticated user and persists the exact backend record ID', async () => {
  await registerCurrentDevice('8');
  expect(register).toHaveBeenCalledWith(
    expect.objectContaining({ token: 'ExpoPushToken[first]', platform: 'android' }),
  );
  expect(saveStored).toHaveBeenCalledWith(
    expect.objectContaining({ userId: '8', deviceTokenId: 31 }),
  );
});

it('does not POST repeatedly when registration metadata is unchanged', async () => {
  getStored.mockResolvedValue({
    appVersion: '1.0.0',
    deviceTokenId: 31,
    platform: 'android',
    token: 'ExpoPushToken[first]',
    userId: '8',
  });
  await registerCurrentDevice('8');
  expect(register).not.toHaveBeenCalled();
});

it('registers again when the Expo token changes', async () => {
  getStored.mockResolvedValue({
    appVersion: '1.0.0',
    deviceTokenId: 31,
    platform: 'android',
    token: 'ExpoPushToken[old]',
    userId: '8',
  });
  await registerCurrentDevice('8');
  expect(register).toHaveBeenCalledTimes(1);
});

it('invalidates the inbox and refreshes unread count for a foreground notification', async () => {
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const fetch = jest
    .spyOn(queryClient, 'fetchQuery')
    .mockResolvedValue({ success: true, data: { count: 4 } });
  render(<PushNotificationGate />);
  const listener = notifications.addNotificationReceivedListener.mock.calls[0][0];
  await act(async () => listener({} as Notifications.Notification));
  expect(invalidate).toHaveBeenCalled();
  expect(fetch).toHaveBeenCalled();
});

it('retries device registration after returning from OS notification settings', async () => {
  render(<PushNotificationGate />);
  await waitFor(() => expect(saveStored).toHaveBeenCalledTimes(1));
  await act(async () => Promise.resolve());
  const listener = addAppStateListener.mock.calls[0][1];

  act(() => listener('active'));

  await waitFor(() => expect(acquire).toHaveBeenCalledTimes(2));
});

it('handles a response once and removes all runtime listeners on cleanup', async () => {
  const remove = jest.fn();
  notifications.addNotificationReceivedListener.mockReturnValue({ remove });
  notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove });
  notifications.addPushTokenListener.mockReturnValue({ remove });
  const view = render(<PushNotificationGate />);
  await waitFor(() =>
    expect(notifications.addNotificationResponseReceivedListener).toHaveBeenCalled(),
  );
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(3);
});
