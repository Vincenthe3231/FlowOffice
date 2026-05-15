import { loginWithMicrosoft } from '@/shared/lib/api-client/laravel-client'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'
import { useOAuthLoginMutation } from './createOAuthLoginMutation'

/**
 * Microsoft Entra ID Login Mutation Hook (PKCE).
 * Caller must pass `{ code, verifier }`.
 */
export function useMicrosoftLoginMutation() {
  const mutation = useOAuthLoginMutation({
    provider: 'microsoft',
    mutationKey: AUTH_QUERY_KEYS.MICROSOFT_LOGIN,
    exchange: ({ code, verifier }) => {
      if (!verifier) throw new Error('PKCE verifier missing for Microsoft OAuth')
      return loginWithMicrosoft(code, verifier)
    },
    label: 'Microsoft login',
  })

  return {
    ...mutation,
    mutate: (args: { code: string; verifier: string }) => mutation.mutate(args),
    mutateAsync: (args: { code: string; verifier: string }) => mutation.mutateAsync(args),
  }
}
