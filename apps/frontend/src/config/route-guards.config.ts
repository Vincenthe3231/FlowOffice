/**
 * Declarative route-level RBAC guard (ADR-002).
 *
 * Maps sensitive dashboard route prefixes to a role tier. Evaluated in `proxy.ts`
 * (Edge middleware) so unauthorized users are redirected BEFORE the page renders
 * (no flash, no scattered per-page useEffect guards).
 *
 * ⚠️ UX / defense-in-depth ONLY — NOT the security boundary. Real enforcement lives
 * in Laravel policies on the API. Pages fetch data via the protected proxy; this guard
 * just prevents navigation + render of pages the user can't use.
 *
 * Open/closed: add a sensitive route = add ONE entry below. No logic edits needed.
 */

import {
  APPROVER_ROLE_SLUGS,
  TOP_MANAGEMENT_SLUGS,
  ROLE_HR_ADMIN,
} from '@/shared/constants/roles'

export type RouteTier = 'top' | 'admin' | 'approver'

/** top_management (+ legacy super_admin) only. */
const TOP_SET = new Set<string>(TOP_MANAGEMENT_SLUGS)
/** Org-wide admin: top_management + hr_admin (no hod). */
const ADMIN_SET = new Set<string>([...TOP_MANAGEMENT_SLUGS, ROLE_HR_ADMIN])
/** Approver chain: hod + hr_admin + top_management. */
const APPROVER_SET = APPROVER_ROLE_SLUGS as ReadonlySet<string>

const TIER_SETS: Record<RouteTier, ReadonlySet<string>> = {
  top: TOP_SET,
  admin: ADMIN_SET,
  approver: APPROVER_SET,
}

/**
 * Prefix → required tier. Order here is irrelevant; matching is most-specific-first
 * (see SORTED_GUARDS) so `/dashboard/settings/departments` (top) wins over
 * `/dashboard/settings` (approver).
 */
export const ROUTE_ROLE_GUARDS: Array<[string, RouteTier]> = [
  ['/dashboard/onboarding', 'top'],
  ['/dashboard/settings/departments', 'top'],
  ['/dashboard/settings/users', 'top'],
  ['/dashboard/settings/claim-types', 'top'],
  ['/dashboard/settings/claims/types', 'top'],
  ['/dashboard/settings/audit', 'top'],
  ['/dashboard/leave/types', 'top'],
  ['/dashboard/claims/types', 'top'],
  ['/dashboard/analytics', 'admin'],
  ['/dashboard/settings', 'approver'], // catch-all: locations, work-mode, shifts
  ['/dashboard/leave/approval', 'approver'],
  ['/dashboard/claims/approval', 'approver'],
  ['/dashboard/claims/all', 'approver'],
  ['/dashboard/log', 'approver'], // others' attendance logs
]

const SORTED_GUARDS = [...ROUTE_ROLE_GUARDS].sort(
  (a, b) => b[0].length - a[0].length,
)

/** Required tier for a pathname, or null when the route is not role-gated. */
export function requiredTierForPath(pathname: string): RouteTier | null {
  for (const [prefix, tier] of SORTED_GUARDS) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return tier
  }
  return null
}

/** True when the user's role/roles satisfy the tier. */
export function isAuthorizedForTier(
  tier: RouteTier,
  role: string | null,
  roles: string[],
): boolean {
  const set = TIER_SETS[tier]
  if (role && set.has(role)) return true
  return roles.some((r) => set.has(r))
}
