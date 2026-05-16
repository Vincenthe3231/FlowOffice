import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsLeave, AnalyticsParams } from '@/shared/lib/api-client/analytics'
import { ANALYTICS_QUERY_KEYS } from './useAnalyticsOverview'

export function useAnalyticsLeave(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.leave(params),
    queryFn: () => fetchAnalyticsLeave(params),
    staleTime: 60_000,
  })
}
