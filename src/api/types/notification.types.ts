export interface Notification {
  id: string | number;
  title: string;
  body: string;
  type: 'complaint_update' | 'system' | 'reminder';
  data?: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count?: number;
}

export interface UnreadCountResponse {
  count: number;
}
