/**
 * Spatie / Laravel role slugs (snake_case). Single source of truth for comparisons and API payloads.
 * Backend: `top_management` replaced `super_admin` (migration).
 */

export const ROLE_TOP_MANAGEMENT = "top_management" as const
/** @deprecated Backend renamed; still accepted for dual-read during rollout */
export const ROLE_SUPER_ADMIN_LEGACY = "super_admin" as const

export const ROLE_HR_ADMIN = "hr_admin" as const
export const ROLE_HOD = "hod" as const
export const ROLE_STAFF = "staff" as const

/** Slugs that grant Top Management privileges (canonical + legacy). */
export const TOP_MANAGEMENT_SLUGS = [
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
] as const

export type TopManagementSlug = (typeof TOP_MANAGEMENT_SLUGS)[number]

export function isTopManagementSlug(role: string | undefined | null): boolean {
  if (role == null || String(role).trim() === "") return false
  return (TOP_MANAGEMENT_SLUGS as readonly string[]).includes(String(role).trim())
}

/**
 * Roles that may access privileged approval/admin routes.
 * Used by proxy middleware to gate approver-only paths.
 */
export const APPROVER_ROLE_SLUGS = new Set([
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
  ROLE_HR_ADMIN,
  ROLE_HOD,
] as const)
