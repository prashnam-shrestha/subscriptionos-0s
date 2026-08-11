import { Role } from "@prisma/client";

export const PERMISSIONS = {
  VIEW_MASTER_PASSWORDS: [Role.ADMIN],
  REVEAL_SECRETS: [Role.ADMIN],
  MANAGE_MASTER_ACCOUNTS: [Role.ADMIN],
  MANAGE_PROFILE_SLOTS: [Role.ADMIN],
  MANAGE_PRODUCTS: [Role.ADMIN],

  VIEW_DASHBOARD: [Role.ADMIN, Role.STAFF],
  VIEW_ACCOUNTS_READONLY: [Role.ADMIN, Role.STAFF],
  MANAGE_CUSTOMERS: [Role.ADMIN, Role.STAFF],
  MANAGE_SUBSCRIPTIONS: [Role.ADMIN, Role.STAFF],
  VIEW_REVENUE_ANALYTICS: [Role.ADMIN, Role.STAFF],
} as const;

export function hasPermission(
  userRole: Role | undefined | null,
  action: keyof typeof PERMISSIONS
): boolean {
  if (!userRole) return false;
  return (PERMISSIONS[action] as readonly Role[]).includes(userRole);
}
