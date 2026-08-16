import { Href } from 'expo-router';

import { COMPLAINT_NOTIFICATION_TYPES } from '@/api/types/notification.types';
import { normalizeComplaintId } from '@/features/complaints/utils/complaintId';

export interface NotificationNavigationData {
  type?: unknown;
  complaint_id?: unknown;
  complaint_number?: unknown;
  click_action?: unknown;
  url_hint?: unknown;
  [key: string]: unknown;
}

export function resolveNotificationDestination(data: unknown): Href | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const payload = data as NotificationNavigationData;
  const complaintId = normalizeComplaintId(payload.complaint_id);
  if (!complaintId) return null;

  const isComplaintEvent =
    typeof payload.type === 'string' &&
    COMPLAINT_NOTIFICATION_TYPES.includes(
      payload.type as (typeof COMPLAINT_NOTIFICATION_TYPES)[number],
    );
  const hasTrustedAction = payload.click_action === 'OPEN_COMPLAINT';
  if (!isComplaintEvent && !hasTrustedAction) return null;

  return {
    pathname: '/(app)/(tabs)/complaints/[id]',
    params: { id: complaintId },
  };
}
