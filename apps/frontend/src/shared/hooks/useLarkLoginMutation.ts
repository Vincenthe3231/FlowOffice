import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'
import { useOAuthLoginMutation } from './createOAuthLoginMutation'

/**
 * Lark Login Mutation Hook.
 * Next.js auth route sets httpOnly cookie and returns user only; we store user for UI.
 *
 * `mutate(code)` accepts the bare authorization code string for backwards compatibility
 * with existing call sites; PKCE is not used by Lark.
 */
export function useLarkLoginMutation() {
  const mutation = useOAuthLoginMutation({
    provider: 'lark',
    mutationKey: AUTH_QUERY_KEYS.LARK_LOGIN,
    exchange: ({ code }) => loginWithLark(code),
    label: 'Lark login',
  })

  return {
    ...mutation,
    mutate: (code: string) => mutation.mutate({ code }),
    mutateAsync: (code: string) => mutation.mutateAsync({ code }),
  }
}
