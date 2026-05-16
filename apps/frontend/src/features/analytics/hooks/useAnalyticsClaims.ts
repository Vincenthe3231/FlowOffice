import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsClaims, AnalyticsParams } from '@/shared/lib/api-client/analytics'
import { ANALYTICS_QUERY_KEYS } from './useAnalyticsOverview'

export function useAnalyticsClaims(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.claims(params),
    queryFn: () => fetchAnalyticsClaims(params),
    staleTime: 60_000,
  })
}
