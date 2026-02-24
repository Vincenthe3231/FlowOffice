import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginWithEmail } from '@/shared/lib/api-client/laravel-client'
import { useAuthStore } from '@/shared/stores/auth-store'
import type { LoginFormData } from '@/shared/lib/validation/auth.schemas'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Login Mutation Hook
 * 
 * Uses TanStack Query for login API call
 * Handles loading states, errors, and success automatically
 * Updates query cache and Zustand store on success
 */
export function useLoginMutation() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.LOGIN,
    mutationFn: async (data: LoginFormData) => {
      // Call Laravel backend directly
      const response = await loginWithEmail(data.email, data.password)
      return response
    },
    onSuccess: (data) => {
      // Store user in auth store
      const user = data?.user
      if (user) {
        // Set query cache to avoid refetch
        queryClient.setQueryData(AUTH_QUERY_KEYS.ME, user)
        // Store in Zustand for persistence
        setUser(user)
        // Invalidate to trigger refetch if needed
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
      }
    },
    onError: (error: unknown) => {
      // Error is handled by the component
      console.error('Login mutation error:', error)
    },
  })
}
