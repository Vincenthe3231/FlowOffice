import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { useAuthStore } from '@/shared/stores/auth-store'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Lark Login Mutation Hook
 * 
 * Uses TanStack Query for Lark OAuth callback API call
 * Handles loading states, errors, and success automatically
 * Properly caches the mutation for debugging
 * Updates query cache and Zustand store on success
 * 
 * IMPORTANT: This mutation does NOT retry on CSRF errors (419) to prevent infinite loops
 */
export function useLarkLoginMutation() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.LARK_LOGIN,
    mutationFn: async (code: string) => {
      // Call Laravel backend to exchange code for user session
      const response = await loginWithLark(code)
      return response
    },
    onSuccess: (data) => {
      // Store user in auth store (session-based auth)
      const user = data?.data?.user || data?.user
      if (user) {
        // Set query cache to avoid refetch
        queryClient.setQueryData(AUTH_QUERY_KEYS.ME, user)
        // Store in Zustand for persistence
        setUser(user)
        // Invalidate to trigger refetch if needed
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
      }
    },
    onError: (error: any) => {
      // Error is handled by the component
      // Log error details for debugging
      const status = error?.status || error?.response?.status
      if (status === 419) {
        console.error('Lark login mutation error: CSRF token mismatch. Please refresh the page.')
      } else {
        console.error('Lark login mutation error:', error)
      }
    },
    // Keep mutation in cache for debugging (matches global default)
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Don't retry on CSRF errors - this prevents infinite retry loops
    retry: (failureCount, error: any) => {
      const status = error?.status || error?.response?.status
      // Never retry on CSRF errors (419) or client errors (4xx)
      if (status === 419 || status === 401 || (status >= 400 && status < 500)) {
        return false
      }
      // Only retry once on server errors (5xx) or network errors
      return failureCount < 1
    },
  })
}

