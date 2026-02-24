import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginWithEmail } from '@/shared/lib/api-client/laravel-client'
import { parseAuthSuccess } from '@/shared/lib/api-client/response-handler'
import { useAuthStore } from '@/shared/stores/auth-store'
import type { LoginFormData } from '@/shared/lib/validation/auth.schemas'
import { userSchema } from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Login Mutation Hook.
 * Backend returns { data: { user, token } }; we store both and send Bearer on subsequent requests.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient()
  const setUserAndToken = useAuthStore((state) => state.setUserAndToken)
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.LOGIN,
    mutationFn: async (data: LoginFormData) => {
      const body = await loginWithEmail(data.email, data.password)
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
      console.error('Login mutation error:', error)
    },
  })
}
