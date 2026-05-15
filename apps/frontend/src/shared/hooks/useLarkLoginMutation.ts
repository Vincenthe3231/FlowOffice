import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { parseMeResponse } from '@/shared/lib/api-client/response-handler'
import { useAuthStore } from '@/shared/stores/auth-store'
import {
  coerceAccessStatus,
  meSessionSchema,
  userSchema,
} from '@/shared/lib/validation/api.schemas'
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
      const parsed = parseMeResponse(body)
      if (!parsed.user) return
      const validatedUser = userSchema.parse(parsed.user)
      const session = meSessionSchema.parse({
        user: validatedUser,
        accessStatus: coerceAccessStatus(parsed.accessStatus),
        rejectionReason: parsed.rejectionReason ?? null,
        onboarding: parsed.onboarding ?? null,
      })
      setUser(validatedUser, 'lark')
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, session)
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
