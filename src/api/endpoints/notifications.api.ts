import { apiClient } from '@/api/client';
import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import {
  Notification,
  NotificationPreferences,
  NotificationPreferenceUpdate,
  NotificationResponse,
  UnreadCountResponse,
} from '@/api/types/notification.types';

export async function getNotifications(page = 1, perPage = 15) {
  const response = await apiClient.get<PaginatedEnvelope<NotificationResponse>>('/notifications', {
    params: { page, per_page: perPage },
  });
  return response.data;
}

export async function getUnreadCount() {
  const response = await apiClient.get<ApiEnvelope<UnreadCountResponse>>(
    '/notifications/unread-count',
  );
  return response.data;
}

export async function markAsRead(notificationId: string | number) {
  const response = await apiClient.patch<ApiEnvelope<Notification>>(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllAsRead() {
  const response =
    await apiClient.patch<ApiEnvelope<{ updated: number }>>('/notifications/read-all');
  return response.data;
}

export async function getNotificationPreferences() {
  const response = await apiClient.get<ApiEnvelope<NotificationPreferences>>(
    '/notification-preferences',
  );
  return response.data;
}

export async function updateNotificationPreferences(payload: NotificationPreferenceUpdate) {
  const response = await apiClient.patch<ApiEnvelope<NotificationPreferences>>(
    '/notification-preferences',
    payload,
  );
  return response.data;
}

export async function deleteNotification(notificationId: string | number) {
  const response = await apiClient.delete<ApiEnvelope<null>>(`/notifications/${notificationId}`);
  return response.data;
}
