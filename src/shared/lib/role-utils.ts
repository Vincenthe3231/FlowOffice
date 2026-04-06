/**
 * Role helpers for nav visibility and feature gating.
 * Single source of truth for Settings nav and Manage Claims visibility.
 */

const SETTINGS_NAV_ROLES = ['hod', 'hr_admin', 'super_admin'] as const
const MANAGE_CLAIMS_ROLES = ['hr_admin', 'super_admin'] as const
const ONBOARDING_ADMIN_ROLES = ['super_admin'] as const

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
 * Shift Scheduling, Audit Trail). Allowed: hod, hr_admin, super_admin.
 */
export function canSeeSettingsNav(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return hasRole(role, SETTINGS_NAV_ROLES) || hasAnyRole(roles, SETTINGS_NAV_ROLES)
}

/**
 * True when the user can see the Manage Claims nav item.
 * Allowed: hr_admin, super_admin.
 */
export function canSeeManageClaims(
  role?: string | null,
  roles?: string[] | null
): boolean {
  return hasRole(role, MANAGE_CLAIMS_ROLES) || hasAnyRole(roles, MANAGE_CLAIMS_ROLES)
}

/**
 * Onboarding admin queue (approve / reject). Super admin only.
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
