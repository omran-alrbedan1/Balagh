export const queryKeys = {
  homeDashboard: ['home', 'dashboard'] as const,
  notifications: ['notifications', 'list'] as const,
  notificationsRoot: ['notifications'] as const,
  notificationUnreadCount: ['notifications', 'unread-count'] as const,
  notificationPreferences: ['notification-preferences'] as const,
  complaintStatuses: ['lookups', 'complaint-statuses'] as const,
  complaint: (id: string, ownerUserId?: string) =>
    ['complaints', ownerUserId ?? 'anonymous', 'detail', id] as const,
  complaints: (params?: { sort?: string; status?: string }, ownerUserId?: string) =>
    [
      'complaints',
      ownerUserId ?? 'anonymous',
      'list',
      params?.status ?? 'all',
      params?.sort ?? 'newest',
    ] as const,
  complaintsRoot: ['complaints'] as const,
  categories: (departmentId?: string, language = 'en') =>
    ['lookups', 'categories', language, departmentId ?? 'all'] as const,
  departments: (language = 'en') => ['lookups', 'departments', language] as const,
  priorities: ['lookups', 'priorities'] as const,
};
