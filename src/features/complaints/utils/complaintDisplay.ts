import { Complaint, ComplaintTimelineEntry } from '@/api/types/complaint.types';
import { ComplaintStatus } from '@/api/types/lookups.types';
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
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value?: string) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(date);
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
  const days = Math.floor(absHours / 24);
  const hours = absHours % 24;
  const short = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

  return diffMs < 0 ? `SLA breached by ${short}` : `SLA due in ${short}`;
}

export function getPriorityLabel(complaint: Complaint) {
  return complaint.priority?.name ?? complaint.priority_id ?? 'Priority pending';
}

export function getDepartmentCategoryLabel(complaint: Complaint) {
  const department = complaint.department?.name ?? complaint.department_id;
  const category = complaint.category?.name ?? complaint.category_id;

  return [department, category].filter(Boolean).join(' / ');
}

export function getAttachmentUri(attachment: Complaint['attachments'][number]) {
  return attachment.url ?? attachment.uri;
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
  if (typeof entry.duration_hours === 'number') {
    return formatHours(entry.duration_hours);
  }

  if (!next) {
    return 'Current status';
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
    return 'Less than 1 hour';
  }

  const rounded = Math.round(totalHours);
  const days = Math.floor(rounded / 24);
  const hours = rounded % 24;

  if (days === 0) {
    return `${hours}h`;
  }

  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}
