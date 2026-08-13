import { apiClient } from '@/api/client';
import { ApiEnvelope, PaginatedEnvelope } from '@/api/types/api-envelope.types';
import {
  Notification,
  NotificationResponse,
  UnreadCountResponse,
} from '@/api/types/notification.types';

export async function getNotifications() {
  const response = await apiClient.get<ApiEnvelope<NotificationResponse>>('/notifications');
  return response.data;
}

export async function getUnreadCount() {
  const response = await apiClient.get<ApiEnvelope<UnreadCountResponse>>(
    '/notifications/unread-count',
  );
  return response.data;
}

export async function markAsRead(notificationId: string | number) {
  const response = await apiClient.patch<ApiEnvelope<null>>(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
}

export async function markAllAsRead() {
  const response = await apiClient.patch<ApiEnvelope<null>>('/notifications/read-all');
  return response.data;
}

export async function deleteNotification(notificationId: string | number) {
  const response = await apiClient.delete<ApiEnvelope<null>>(`/notifications/${notificationId}`);
  return response.data;
}
