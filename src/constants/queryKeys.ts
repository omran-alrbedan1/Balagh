export const queryKeys = {
  notifications: ['notifications', 'list'] as const,
  notificationsRoot: ['notifications'] as const,
  notificationUnreadCount: ['notifications', 'unread-count'] as const,
  notificationPreferences: ['notification-preferences'] as const,
  complaintStatuses: ['lookups', 'complaint-statuses'] as const,
  complaint: (id: string) => ['complaints', id] as const,
  complaints: (params?: { sort?: string; status?: string }) =>
    ['complaints', params?.status ?? 'all', params?.sort ?? 'newest'] as const,
  complaintsRoot: ['complaints'] as const,
  categories: (departmentId?: string, language = 'en') =>
    ['lookups', 'categories', language, departmentId ?? 'all'] as const,
  departments: (language = 'en') => ['lookups', 'departments', language] as const,
  priorities: ['lookups', 'priorities'] as const,
};
