/**
 * Parse GET /api/auth/me JSON (Laravel shape; snake_case or camelCase).
 * Used by Edge middleware — no axios transform.
 */

export function getUserFromMeJson(body: unknown): unknown {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const data = root.data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    return d.user ?? null
  }
  return root.user ?? null
}

export function getAccessStatusFromMeJson(body: unknown): string {
  if (!body || typeof body !== 'object') return 'granted'
  const root = body as Record<string, unknown>
  const data = root.data
  const d =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : root
  const raw = d.access_status ?? d.accessStatus
  if (
    raw === 'granted' ||
    raw === 'pending' ||
    raw === 'rejected' ||
    raw === 'deactivated'
  ) {
    return raw
  }
  return 'granted'
}

/** Non-granted users may only use these dashboard paths (not claims, onboarding admin, etc.). */
export function isNonGrantedAllowedPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  if (p === '/dashboard') return true
  if (p === '/dashboard/profile') return true
  if (p.startsWith('/dashboard/profile/')) return true
  return false
}
