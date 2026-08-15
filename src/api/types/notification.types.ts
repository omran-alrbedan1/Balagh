export const COMPLAINT_NOTIFICATION_TYPES = [
  'complaint_created',
  'complaint_assigned',
  'complaint_status_updated',
  'sla_breached',
  'complaint_resolved',
  'complaint_closed',
] as const;

export type KnownComplaintNotificationType = (typeof COMPLAINT_NOTIFICATION_TYPES)[number];
export type NotificationType = KnownComplaintNotificationType | (string & {});

export interface NotificationComplaint {
  id: string | number;
  complaint_number: string;
  title: string;
  status: string;
}

export interface Notification {
  id: string | number;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown>;
  complaint?: NotificationComplaint | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count?: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferences {
  id: string | number;
  database_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  complaint_created: boolean;
  complaint_assigned: boolean;
  complaint_status_updated: boolean;
  sla_breached: boolean;
  complaint_resolved: boolean;
  complaint_closed: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type NotificationPreferenceUpdate = Partial<
  Pick<
    NotificationPreferences,
    | 'email_enabled'
    | 'push_enabled'
    | 'sms_enabled'
    | 'complaint_created'
    | 'complaint_assigned'
    | 'complaint_status_updated'
    | 'sla_breached'
    | 'complaint_resolved'
    | 'complaint_closed'
  >
>;
