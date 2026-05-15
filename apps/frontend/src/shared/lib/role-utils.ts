/**
 * Role helpers for nav visibility and feature gating.
 */

import {
  ROLE_HR_ADMIN,
  ROLE_HOD,
  ROLE_STAFF,
  ROLE_SUPER_ADMIN_LEGACY,
  ROLE_TOP_MANAGEMENT,
  TOP_MANAGEMENT_SLUGS,
  isTopManagementSlug,
} from '@/shared/constants/roles'

const SETTINGS_NAV_ROLES = [
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
] as const

/** Roles that may reject from the personal Claims list (not normal staff submitters). */
const CLAIM_REJECT_ON_MY_LIST_ROLES = [
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
] as const

const ONBOARDING_ADMIN_ROLES = TOP_MANAGEMENT_SLUGS
const DEPARTMENT_MANAGE_ROLES = TOP_MANAGEMENT_SLUGS

function hasRole(
  role: string | undefined | null,
  roles: readonly string[]
): boolean {
  if (role && roles.includes(role)) return true
  return false
}

function hasAnyRole(
  rolesArray: string[] | undefined | null,
  allowed: readonly string[]
): boolean {
  if (!rolesArray?.length) return false
  return rolesArray.some((r) => allowed.includes(r))
}

/**
 * True when the user can see the Settings nav group (Work Locations, Work Mode,
 * Shift Scheduling, Audit Trail). Allowed: hod, hr_admin, top_management.
 */
export function canSeeSettingsNav(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return (
    hasRole(role, SETTINGS_NAV_ROLES) || hasAnyRole(roles, SETTINGS_NAV_ROLES)
  )
}

/**
 * Expanded Claims sidebar (Submit hub, All my claims, optional Manage types for Top Management).
 * All roles that use the authenticated dashboard get the same submenu shape.
 */
export function canSeeExpandedClaimsNav(): boolean {
  return true
}

/**
 * Personal `/dashboard/claims` table: only HOD / HR / Top Management may reject from this list.
 * Normal staff only view (and resubmit when rejected).
 */
export function canRejectClaimFromMyClaimsList(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return (
    hasRole(role, CLAIM_REJECT_ON_MY_LIST_ROLES) ||
    hasAnyRole(roles, CLAIM_REJECT_ON_MY_LIST_ROLES)
  )
}

/**
 * Leave approval queue visibility. Same roles as claim rejection: hod, hr_admin, top_management.
 */
export function canApproveLeaves(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return (
    hasRole(role, CLAIM_REJECT_ON_MY_LIST_ROLES) ||
    hasAnyRole(roles, CLAIM_REJECT_ON_MY_LIST_ROLES)
  )
}

/**
 * Attendance page: show role chips (Top Management / Admin·HR / HOD) and org-wide admin dashboards.
 * Staff and other roles see only personal attendance (no extra chips).
 */
export function canAccessAttendanceAdminPortal(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return canRejectClaimFromMyClaimsList(role, roles)
}

/**
 * Onboarding admin queue (approve / reject). Top Management only.
 */
export function canSeeOnboardingAdmin(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return (
    hasRole(role, ONBOARDING_ADMIN_ROLES) ||
    hasAnyRole(roles, ONBOARDING_ADMIN_ROLES)
  )
}

/**
 * Create / update departments (including activate & deactivate). Top Management only.
 */
export function canManageDepartments(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return (
    hasRole(role, DEPARTMENT_MANAGE_ROLES) ||
    hasAnyRole(roles, DEPARTMENT_MANAGE_ROLES)
  )
}

/** Top Management–only UI (e.g. Manage Claim Types). */
export function isTopManagement(
  role?: string | null,
  roles?: string[] | null
): boolean {
  if (isTopManagementSlug(role)) return true
  if (!roles?.length) return false
  return roles.some((r) => isTopManagementSlug(r))
}

/**
 * @deprecated Use {@link isTopManagement}. Kept for transitional imports.
 */
export const isSuperAdmin = isTopManagement

const ROLE_DISPLAY_LABELS: Record<string, string> = {
  [ROLE_TOP_MANAGEMENT]: 'Top Management',
  [ROLE_SUPER_ADMIN_LEGACY]: 'Top Management',
  [ROLE_HR_ADMIN]: 'HR',
  [ROLE_HOD]: 'HOD',
  [ROLE_STAFF]: 'Staff',
  employee: 'Staff',
  manager: 'Manager',
}

/**
 * Human-readable label for a single API role key (profile or Spatie).
 */
export function formatProfileRoleLabel(roleKey?: string | null): string {
  if (roleKey == null || String(roleKey).trim() === '') return '—'
  const k = String(roleKey).trim()
  const mapped = ROLE_DISPLAY_LABELS[k]
  if (mapped) return mapped
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Prefer Laravel profile primary role; otherwise first Spatie role from `/me`.
 */
export function resolvePrimaryRoleKey(
  profileRole?: string | null,
  roles?: string[] | null
): string | null {
  if (profileRole != null && String(profileRole).trim() !== '') {
    return String(profileRole).trim()
  }
  const first = roles?.find((r) => r != null && String(r).trim() !== '')
  return first != null ? String(first).trim() : null
}

/** Combined label for UI (profile page, shell header, etc.). */
export function formatUserRoleForDisplay(
  profileRole?: string | null,
  roles?: string[] | null
): string {
  return formatProfileRoleLabel(resolvePrimaryRoleKey(profileRole, roles))
}
