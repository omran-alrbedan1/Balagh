import { Complaint, ComplaintTimelineEntry } from '@/api/types/complaint.types';
import { ComplaintStatus } from '@/api/types/lookups.types';
import { Config } from '@/constants/config';
import i18next from '@/lib/i18n';
import { colors } from '@/theme/colors';

export type SortMode = 'newest' | 'oldest' | 'sla';

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  assigned: 'Assigned',
  closed: 'Closed',
  in_progress: 'In Progress',
  in_review: 'In Review',
  under_review: 'Under Review',
  waiting_citizen: 'Waiting on Citizen',
  rejected: 'Rejected',
  resolved: 'Resolved',
  escalated: 'Escalated',
  submitted: 'Submitted',
};

export function getStatusLabel(status: ComplaintStatus) {
  return i18next.t(`status.${status}`, { defaultValue: STATUS_LABELS[status] });
}

export const STATUS_TONES: Record<
  ComplaintStatus,
  { background: string; border: string; foreground: string }
> = {
  assigned: {
    background: colors.primarySoft,
    border: colors.primaryLight,
    foreground: colors.primary,
  },
  closed: {
    background: colors.surfaceMuted,
    border: colors.border,
    foreground: colors.textMuted,
  },
  in_progress: {
    background: colors.primary,
    border: colors.primary,
    foreground: '#FFFFFF',
  },
  in_review: {
    background: colors.primarySoft,
    border: colors.primaryLight,
    foreground: colors.primaryDark,
  },
  under_review: {
    background: colors.primarySoft,
    border: colors.primaryLight,
    foreground: colors.primaryDark,
  },
  waiting_citizen: {
    background: colors.warningLight,
    border: '#FDE68A',
    foreground: colors.warning,
  },
  rejected: {
    background: colors.dangerLight,
    border: colors.danger,
    foreground: colors.danger,
  },
  resolved: {
    background: colors.successLight,
    border: colors.success,
    foreground: colors.success,
  },
  submitted: {
    background: colors.surfaceMuted,
    border: colors.border,
    foreground: colors.text,
  },
  escalated: {
    background: colors.dangerLight,
    border: colors.danger,
    foreground: colors.danger,
  },
};

export function formatDate(value?: string) {
  if (!value) {
    return i18next.t('common.notAvailable');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(i18next.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value?: string) {
  if (!value) {
    return i18next.t('common.notAvailable');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(i18next.language, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(date);
}

export const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SlaStatus = 'on_track' | 'due_soon' | 'breached';

export function getSlaStatus(dueAt?: string, isBreached?: boolean): SlaStatus | undefined {
  if (isBreached) {
    return 'breached';
  }

  if (!dueAt) {
    return undefined;
  }

  const due = new Date(dueAt).getTime();

  if (Number.isNaN(due)) {
    return undefined;
  }

  const diffMs = due - Date.now();

  if (diffMs < 0) {
    return 'breached';
  }

  return diffMs <= DUE_SOON_WINDOW_MS ? 'due_soon' : 'on_track';
}

export function getSlaCountdown(slaDueAt?: string) {
  if (!slaDueAt) {
    return undefined;
  }

  const due = new Date(slaDueAt).getTime();

  if (Number.isNaN(due)) {
    return undefined;
  }

  const diffMs = due - Date.now();
  const absHours = Math.ceil(Math.abs(diffMs) / 3_600_000);
  const short = formatHours(absHours);

  return diffMs < 0
    ? i18next.t('time.slaBreachedBy', { time: short })
    : i18next.t('time.slaDueIn', { time: short });
}

export function getPriorityLabel(complaint: Complaint) {
  return (
    complaint.priority?.name ?? complaint.priority_id ?? i18next.t('complaints.priorityPending')
  );
}

export function getDepartmentCategoryLabel(complaint: Complaint) {
  const department = complaint.department?.name ?? complaint.department_id;
  const category = complaint.category?.name ?? complaint.category_id;

  return [department, category].filter(Boolean).join(' / ');
}

export function getAttachmentUri(attachment: Complaint['attachments'][number]) {
  const rawUri =
    attachment.full_url ??
    attachment.original_url ??
    attachment.url ??
    attachment.uri ??
    attachment.file_path ??
    attachment.path;

  if (!rawUri) {
    return undefined;
  }

  if (/^(https?:|file:|content:|data:)/i.test(rawUri)) {
    return rawUri;
  }

  const apiRoot = Config.API_BASE_URL.replace(/\/api\/?.*$/i, '').replace(/\/$/, '');
  const normalizedPath = rawUri.startsWith('/') ? rawUri : `/${rawUri}`;

  return `${apiRoot}${normalizedPath}`;
}

export function sortTimeline(entries: ComplaintTimelineEntry[]) {
  return [...entries].sort(
    (first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
  );
}

export function formatDurationBetween(
  entry: ComplaintTimelineEntry,
  next?: ComplaintTimelineEntry,
) {
  if (typeof entry.duration_minutes === 'number') {
    return formatHours(entry.duration_minutes / 60);
  }

  if (!next) {
    return i18next.t('time.currentStatus');
  }

  const start = new Date(entry.created_at).getTime();
  const end = new Date(next.created_at).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return undefined;
  }

  return formatHours((end - start) / 3_600_000);
}

function formatHours(totalHours: number) {
  if (totalHours < 1) {
    return i18next.t('time.lessThanHour');
  }

  const rounded = Math.round(totalHours);
  const days = Math.floor(rounded / 24);
  const hours = rounded % 24;

  if (days === 0) {
    return i18next.t('time.hours', { hours });
  }

  return hours > 0
    ? i18next.t('time.daysHours', { days, hours })
    : i18next.t('time.daysOnly', { days });
}
