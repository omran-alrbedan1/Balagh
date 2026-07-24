export const roles = ['citizen', 'employee', 'admin'] as const;

export type Role = (typeof roles)[number];
