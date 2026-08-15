import { apiClient } from '@/api/client';
import {
  deleteNotification,
  getNotificationPreferences,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  updateNotificationPreferences,
} from '@/api/endpoints/notifications.api';
import { deleteDeviceToken, getDeviceTokens, registerDeviceToken } from '@/api/endpoints/auth.api';

jest.mock('@/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const client = apiClient as jest.Mocked<typeof apiClient>;
const envelope = { data: { success: true, data: {} } };

beforeEach(() => {
  jest.clearAllMocks();
  client.get.mockResolvedValue(envelope);
  client.post.mockResolvedValue(envelope);
  client.patch.mockResolvedValue(envelope);
  client.delete.mockResolvedValue(envelope);
});

describe('notification API contracts', () => {
  it('lists a requested notification page', async () => {
    await getNotifications(3, 20);
    expect(client.get).toHaveBeenCalledWith('/notifications', {
      params: { page: 3, per_page: 20 },
    });
  });

  it('gets unread count', async () => {
    await getUnreadCount();
    expect(client.get).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('marks one notification read', async () => {
    await markAsRead(9);
    expect(client.patch).toHaveBeenCalledWith('/notifications/9/read');
  });

  it('marks all notifications read', async () => {
    await markAllAsRead();
    expect(client.patch).toHaveBeenCalledWith('/notifications/read-all');
  });

  it('deletes one notification', async () => {
    await deleteNotification('abc');
    expect(client.delete).toHaveBeenCalledWith('/notifications/abc');
  });

  it('registers a device token with backend fields', async () => {
    const payload = { token: 'ExpoPushToken[x]', platform: 'android' as const };
    await registerDeviceToken(payload);
    expect(client.post).toHaveBeenCalledWith('/device-tokens', payload);
  });

  it('lists device token records', async () => {
    await getDeviceTokens();
    expect(client.get).toHaveBeenCalledWith('/device-tokens');
  });

  it('deletes the exact device token record', async () => {
    await deleteDeviceToken(12);
    expect(client.delete).toHaveBeenCalledWith('/device-tokens/12');
  });

  it('gets notification preferences', async () => {
    await getNotificationPreferences();
    expect(client.get).toHaveBeenCalledWith('/notification-preferences');
  });

  it('patches only supplied notification preferences', async () => {
    await updateNotificationPreferences({ push_enabled: false });
    expect(client.patch).toHaveBeenCalledWith('/notification-preferences', {
      push_enabled: false,
    });
  });
});
