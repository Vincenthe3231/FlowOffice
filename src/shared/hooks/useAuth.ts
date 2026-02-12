import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/auth-store'
import { useHydration } from './useHydration'
import { getCurrentUser } from '@/shared/lib/api-client/laravel-client'
import { userSchema, authResponseSchema } from '@/shared/lib/validation/api.schemas'

/**
 * useAuth Hook
 * 
 * Comprehensive authentication hook that:
 * - Fetches current user from API using TanStack Query
 * - Syncs with Zustand store for persistence
 * - Handles hydration to prevent mismatches
 * - Provides loading and error states
 * 
 * @returns Auth state and actions
 * 
 * @example
 * ```tsx
 * const { user, isLoading, isAuthenticated, logout } = useAuth()
 * 
 * if (isLoading) return <Loading />
 * if (!isAuthenticated) return <Login />
 * return <Dashboard user={user} />
 * ```
 */
export function useAuth() {
  const isHydrated = useHydration()
  const { user: storedUser, setUser, logout: storeLogout, isAuthenticated: storeIsAuthenticated } = useAuthStore()

  // Fetch current user from API if we have a stored user (session-based auth)
  // Only fetch if hydrated and we have a stored user (indicates potential session)
  const query = useQuery({
    queryKey: ['auth', 'user'],
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
    // Only fetch if hydrated and we think we're authenticated
    enabled: isHydrated && storeIsAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      const status = error?.status || error?.response?.status
      // Don't retry on 401 (unauthorized) or 419 (CSRF) - user is not authenticated or session expired
      if (status === 401 || status === 419) {
        // Clear stored user if API says we're not authenticated
        if (status === 401) {
          storeLogout()
        }
        return false
      }
      // Don't retry on other client errors (4xx)
      if (status >= 400 && status < 500) {
        return false
      }
      // Only retry once on server errors (5xx) or network errors
      return failureCount < 1
    },
  })

  // Sync query data with store when it updates
  useEffect(() => {
    if (query.data && query.data !== storedUser) {
      setUser(query.data)
    }
  }, [query.data, storedUser, setUser])

  // Handle logout - clear both query cache and store
  const logout = async () => {
    // Clear query cache
    query.remove()
    // Clear store
    storeLogout()
    // Optionally call logout API endpoint
    try {
      const { logoutUser } = await import('@/shared/lib/api-client/laravel-client')
      await logoutUser()
    } catch (error) {
      // Log but don't fail logout if API call fails
      // This ensures logout always succeeds even if API is unavailable
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout API call failed:', error)
      }
    }
  }

  return {
    // Use query data if available, fallback to stored user
    user: query.data ?? storedUser,
    // Loading if not hydrated, query is loading, or query is fetching
    isLoading: !isHydrated || query.isLoading || query.isFetching,
    // Authenticated if we have a user (from query or store)
    isAuthenticated: !!(query.data ?? storedUser),
    // Error state
    error: query.error,
    // Logout function
    logout,
    // Refetch function
    refetch: query.refetch,
  }
}


