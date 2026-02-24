import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { parseAuthSuccess } from '@/shared/lib/api-client/response-handler'
import { useAuthStore } from '@/shared/stores/auth-store'
import { userSchema } from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Lark Login Mutation Hook.
 * Backend returns { data: { user, token } }; we store both and send Bearer on subsequent requests.
 */
export function useLarkLoginMutation() {
  const queryClient = useQueryClient()
  const setUserAndToken = useAuthStore((state) => state.setUserAndToken)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.LARK_LOGIN,
    mutationFn: async (code: string) => {
      const body = await loginWithLark(code)
      return body
    },
    onSuccess: (body) => {
      const { user, token } = parseAuthSuccess(body)
      if (!user) return
      const validated = userSchema.parse(user)
      if (token) {
        setUserAndToken(validated, token)
      } else {
        setUser(validated)
      }
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, validated)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
    },
    onError: (error: unknown) => {
      // Error is handled by the component
      if (axios.isAxiosError(error) && error.response?.status === 419) {
        console.error('Lark login: CSRF token mismatch. Please refresh the page.')
      } else {
        console.error('Lark login error:', error)
      }
    },
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Don't retry on client errors – prevents infinite retry loops
    retry: (failureCount, error: unknown) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status && status >= 400 && status < 500) return false
      }
      return failureCount < 1
    },
  })
}

