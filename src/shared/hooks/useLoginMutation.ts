import { useMutation } from '@tanstack/react-query'
import { loginWithEmail } from '@/shared/lib/api-client/laravel-client'
import { useAuthStore } from '@/shared/stores/auth-store'
import type { LoginFormData } from '@/shared/lib/validation/auth.schemas'

/**
 * Login Mutation Hook
 * 
 * Uses TanStack Query for login API call
 * Handles loading states, errors, and success automatically
 */
export function useLoginMutation() {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: ['login'],
    mutationFn: async (data: LoginFormData) => {
      // Call Laravel backend directly
      const response = await loginWithEmail(data.email, data.password)
      return response
    },
    onSuccess: (data) => {
      // Store user in auth store
      if (data?.user) {
        setUser(data.user)
      }
    },
    onError: (error: any) => {
      // Error is handled by the component
      console.error('Login mutation error:', error)
    },
  })
}
