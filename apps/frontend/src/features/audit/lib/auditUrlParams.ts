import type { AuditFilter } from '@/shared/lib/api-client/audit'

export function parseAuditFilters(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): AuditFilter {
  const get = (key: string): string | undefined => {
    const v = searchParams?.[key]
    if (typeof v === 'string') return v || undefined
    if (Array.isArray(v) && v[0]) return v[0]
    return undefined
  }

  return {
    module: get('module'),
    event: get('event'),
    userId: get('userId') ? Number(get('userId')) : undefined,
    from: get('from'),
    to: get('to'),
  }
}

export function parseAuditPage(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): number {
  const v = searchParams?.['page']
  const raw = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined
  const n = raw ? parseInt(raw, 10) : 1
  return isNaN(n) || n < 1 ? 1 : n
}

export function buildAuditSearchParams(filters: AuditFilter, page: number): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.module) params.set('module', filters.module)
  if (filters.event) params.set('event', filters.event)
  if (filters.userId) params.set('userId', String(filters.userId))
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (page > 1) params.set('page', String(page))
  return params
}
