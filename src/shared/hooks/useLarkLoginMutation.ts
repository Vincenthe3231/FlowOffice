import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { parseAuthSuccess } from '@/shared/lib/api-client/response-handler'
import { useAuthStore } from '@/shared/stores/auth-store'
import { userSchema } from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Lark Login Mutation Hook.
 * Next.js auth route sets httpOnly cookie and returns user only; we store user for UI.
 */
export function useLarkLoginMutation() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.LARK_LOGIN,
    mutationFn: async (code: string) => {
      const body = await loginWithLark(code)
      return body
    },
    onSuccess: (body) => {
      const { user } = parseAuthSuccess(body)
      if (!user) return
      const validated = userSchema.parse(user)
      setUser(validated, 'lark')
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, validated)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
    },
    onError: (error: unknown) => {
      console.error('Lark login error:', error)
    },
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status && status >= 400 && status < 500) return false
      }
      return failureCount < 1
    },
  })
}
