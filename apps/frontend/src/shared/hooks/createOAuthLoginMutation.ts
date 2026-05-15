import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { parseMeResponse } from '@/shared/lib/api-client/response-handler'
import { useAuthStore, type AuthMethod } from '@/shared/stores/auth-store'
import {
  coerceAccessStatus,
  meSessionSchema,
  userSchema,
} from '@/shared/lib/validation/api.schemas'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'

/**
 * Shared OAuth login mutation factory.
 *
 * All OAuth providers (Lark, Google, Microsoft) share the same post-exchange flow:
 *   - call provider-specific exchange function
 *   - parse / validate `/me`-style response
 *   - sync Zustand auth store with user + provider tag
 *   - prime + invalidate React Query `AUTH_QUERY_KEYS.ME`
 *   - retry policy: skip 4xx, max 1 retry on transient failures
 *
 * Each provider hook supplies its own `mutationKey`, `provider`, and `exchange` callable.
 */

export type OAuthExchangeArgs = { code: string; verifier?: string }
export type OAuthExchangeFn = (args: OAuthExchangeArgs) => Promise<unknown>

export interface OAuthMutationConfig {
  provider: NonNullable<AuthMethod>
  mutationKey: readonly unknown[]
  exchange: OAuthExchangeFn
  /** Logger label used for `console.error` on failure. Defaults to `<provider> login`. */
  label?: string
}

export function useOAuthLoginMutation(config: OAuthMutationConfig) {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const label = config.label ?? `${config.provider} login`

  return useMutation({
    mutationKey: config.mutationKey,
    mutationFn: async (args: OAuthExchangeArgs) => {
      return config.exchange(args)
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
      setUser(validatedUser, config.provider)
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, session)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
    },
    onError: (error: unknown) => {
      console.error(`${label} error:`, error)
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
