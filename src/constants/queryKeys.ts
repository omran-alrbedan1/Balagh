export const queryKeys = {
  complaintStatuses: ['lookups', 'complaint-statuses'] as const,
  complaint: (id: string) => ['complaints', id] as const,
  complaints: (params?: { sort?: string; status?: string }) =>
    ['complaints', params?.status ?? 'all', params?.sort ?? 'newest'] as const,
  complaintsRoot: ['complaints'] as const,
  categories: (departmentId?: string) => ['lookups', 'categories', departmentId ?? 'all'] as const,
  departments: ['lookups', 'departments'] as const,
  priorities: ['lookups', 'priorities'] as const,
};
