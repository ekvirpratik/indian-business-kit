import type { UserRole } from '@/types/auth';

/**
 * Role constants for PeakHR.
 * Always use these — never raw strings like "admin".
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin' as UserRole,
  COMPANY_ADMIN: 'company_admin' as UserRole,
  MANAGER: 'manager' as UserRole,
  EMPLOYEE: 'employee' as UserRole,
} as const;

/** Roles that can manage company settings */
export const ADMIN_ROLES: UserRole[] = [ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN];

/** Roles that can manage employees */
export const MANAGER_ROLES: UserRole[] = [
  ROLES.SUPER_ADMIN,
  ROLES.COMPANY_ADMIN,
  ROLES.MANAGER,
];
