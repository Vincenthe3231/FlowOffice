import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsOverview, AnalyticsParams } from '@/shared/lib/api-client/analytics'

export const ANALYTICS_QUERY_KEYS = {
  overview: (params?: AnalyticsParams) => ['analytics', 'overview', params] as const,
  attendance: (params?: AnalyticsParams) => ['analytics', 'attendance', params] as const,
  leave: (params?: AnalyticsParams) => ['analytics', 'leave', params] as const,
  claims: (params?: AnalyticsParams) => ['analytics', 'claims', params] as const,
}

export function useAnalyticsOverview(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.overview(params),
    queryFn: () => fetchAnalyticsOverview(params),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
