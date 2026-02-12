import { useMutation } from '@tanstack/react-query'
import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { useAuthStore } from '@/shared/stores/auth-store'

/**
 * Lark Login Mutation Hook
 * 
 * Uses TanStack Query for Lark OAuth callback API call
 * Handles loading states, errors, and success automatically
 * Properly caches the mutation for debugging
 * 
 * IMPORTANT: This mutation does NOT retry on CSRF errors (419) to prevent infinite loops
 */
export function useLarkLoginMutation() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: ['auth', 'lark', 'login'],
    mutationFn: async (code: string) => {
      // Call Laravel backend to exchange code for user session
      const response = await loginWithLark(code)
      return response
    },
    onSuccess: (data) => {
      // Store user in auth store (session-based auth)
      const user = data?.data?.user || data?.user
      if (user) {
        setUser(user)
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

