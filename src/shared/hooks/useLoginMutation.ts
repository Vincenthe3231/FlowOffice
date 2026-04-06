import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginWithEmail } from '@/shared/lib/api-client/laravel-client'
import { parseMeResponse } from '@/shared/lib/api-client/response-handler'
import { useAuthStore } from '@/shared/stores/auth-store'
import type { LoginFormData } from '@/shared/lib/validation/auth.schemas'
import {
  coerceAccessStatus,
  meSessionSchema,
  userSchema,
} from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Login Mutation Hook.
 * Next.js auth route sets httpOnly cookie and returns user only; we store user for UI.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.LOGIN,
    mutationFn: async (data: LoginFormData) => {
      const body = await loginWithEmail(data.email, data.password)
      return body
    },
    onSuccess: (body) => {
      const parsed = parseMeResponse(body)
      if (!parsed.user) return
      const validatedUser = userSchema.parse(parsed.user)
      const session = meSessionSchema.parse({
        user: validatedUser,
        accessStatus: coerceAccessStatus(parsed.accessStatus),
        rejectionReason: parsed.rejectionReason ?? null,
        onboarding: parsed.onboarding ?? null,
      })
      setUser(validatedUser, 'email')
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, session)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
    },
    onError: (error: unknown) => {
      console.error('Login mutation error:', error)
    },
  })
}
