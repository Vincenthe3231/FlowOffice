import { useQuery, useQueryClient, queryOptions } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/auth-store'
import { useHydration } from './useHydration'
import { getCurrentUser } from '@/shared/lib/api-client/laravel-client'
import { userSchema, authResponseSchema } from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS, AUTH_CONFIG } from '@/shared/lib/api-client/auth-constants'

/**
 * Query options factory for auth/me endpoint
 * 
 * Uses queryOptions pattern (TanStack Query v5 best practice)
 * Query is always registered, ensuring visibility in devtools
 */
export const authQueryOptions = queryOptions({
  queryKey: AUTH_QUERY_KEYS.ME,
  queryFn: async () => {
    // Use safeFetch with validation
    const response = await getCurrentUser()
    
    // Validate response structure
    // The API might return { user } or just user directly
    if (response?.user) {
      const validated = authResponseSchema.parse(response)
      return validated.user
    } else {
      // If response is user directly
      return userSchema.parse(response)
    }
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
  const { user: storedUser, setUser, logout: storeLogout } = useAuthStore()

  // Query is always active (no conditional enabling)
  // This ensures it's always registered in the cache and visible in devtools
  // API will return 401 if not authenticated, which we handle gracefully
  const query = useQuery(authQueryOptions)

  // Handle 401: clear store but don't treat as error
  // This allows the query to remain visible in devtools even when not authenticated
  useEffect(() => {
    if (query.error) {
      const status = (query.error as any)?.status || (query.error as any)?.response?.status
      if (status === 401) {
        // User is not authenticated - clear store
        // Don't treat this as an error state, just clear the stored user
        storeLogout()
      }
    }
  }, [query.error, storeLogout])

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


