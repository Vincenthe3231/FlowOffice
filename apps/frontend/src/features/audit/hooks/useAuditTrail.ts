import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchAuditTrail, type AuditFilter } from '@/shared/lib/api-client/audit'

export const AUDIT_QUERY_KEYS = {
  list: (filters: AuditFilter, page: number) => ['audit', filters, page] as const,
}

export function useAuditTrail(filters: AuditFilter = {}, page = 1) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.list(filters, page),
    queryFn: () => fetchAuditTrail(filters, page),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })
}
