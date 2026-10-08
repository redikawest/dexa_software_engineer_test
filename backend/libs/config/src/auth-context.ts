export const USER_ID_HEADER = 'x-user-id';
export const USER_ROLE_HEADER = 'x-user-role';

export const ROLES = ['EMPLOYEE', 'HR_ADMIN'] as const;
export type Role = (typeof ROLES)[number];
