import { useQuery } from '@tanstack/react-query'
import { fetchAnalyticsAttendance, AnalyticsParams } from '@/shared/lib/api-client/analytics'
import { ANALYTICS_QUERY_KEYS } from './useAnalyticsOverview'

export function useAnalyticsAttendance(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.attendance(params),
    queryFn: () => fetchAnalyticsAttendance(params),
    staleTime: 60_000,
  })
}
