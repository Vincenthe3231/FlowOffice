import { useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuthStore } from '@/shared/stores/auth-store'
import { useHydration } from './useHydration'
import { getCurrentUser } from '@/shared/lib/api-client/laravel-client'
import { parseUserResponse } from '@/shared/lib/api-client/response-handler'
import { userSchema } from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS, AUTH_CONFIG } from '@/shared/lib/api-client/auth-constants'

/**
 * Query options factory for auth/me endpoint.
 * Backend returns { message?, data: { user } }; we parse and validate user.
 */
export const authQueryOptions = queryOptions({
  queryKey: AUTH_QUERY_KEYS.ME,
  queryFn: async () => {
    const body = await getCurrentUser()
    const user = parseUserResponse(body)
    return userSchema.parse(user)
  },
  retry: AUTH_CONFIG.RETRY,
  staleTime: AUTH_CONFIG.STALE_TIME,
})

/**
 * useAuth Hook
 * 
 * Comprehensive authentication hook that:
 * - Fetches current user from API using TanStack Query
 * - Syncs with Zustand store for persistence
 * - Handles hydration to prevent mismatches
 * - Provides loading and error states
 * 
 * Query is always registered (not conditionally enabled) to ensure
 * visibility in TanStack Query Devtools and proper cache management.
 * 
 * @returns Auth state and actions
 * 
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated } = useAuth()
 * 
 * if (isLoading) return <Loading />
 * if (!isAuthenticated) return <Login />
 * return <Dashboard user={user} />
 * ```
 */
export function useAuth() {
  const isHydrated = useHydration()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user: storedUser, setUser, logout: storeLogout } = useAuthStore()

  const query = useQuery(authQueryOptions)

  // On 401: clear store, clear auth query cache, redirect to login
  // (e.g. cookies cleared, token expired, or session invalid)
  useEffect(() => {
    if (!query.error) return
    const status = axios.isAxiosError(query.error)
      ? query.error.response?.status
      : undefined
    if (status !== 401) return

    storeLogout()
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME })
    router.replace('/login')
  }, [query.error, storeLogout, queryClient, router])

  // Sync query data with store when it updates
  useEffect(() => {
    if (query.data && query.data !== storedUser) {
      setUser(query.data)
      // Also update query cache to keep it in sync
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, query.data)
    }
  }, [query.data, storedUser, setUser, queryClient])

  return {
    // Use query data if available, fallback to stored user
    user: query.data ?? storedUser,
    // Loading if not hydrated, query is loading, or query is fetching
    isLoading: !isHydrated || query.isLoading || query.isFetching,
    // Authenticated if we have a user (from query or store)
    isAuthenticated: !!(query.data ?? storedUser),
    // Error state
    error: query.error,
    // Refetch function
    refetch: query.refetch,
  }
}


