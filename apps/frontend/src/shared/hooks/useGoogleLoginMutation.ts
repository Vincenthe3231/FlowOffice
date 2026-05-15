import { loginWithGoogle } from '@/shared/lib/api-client/laravel-client'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'
import { useOAuthLoginMutation } from './createOAuthLoginMutation'

/**
 * Google OAuth Login Mutation Hook (PKCE).
 * Caller must pass `{ code, verifier }`; verifier is consumed from sessionStorage
 * by the /auth/callback page before this mutation fires.
 */
export function useGoogleLoginMutation() {
  const mutation = useOAuthLoginMutation({
    provider: 'google',
    mutationKey: AUTH_QUERY_KEYS.GOOGLE_LOGIN,
    exchange: ({ code, verifier }) => {
      if (!verifier) throw new Error('PKCE verifier missing for Google OAuth')
      return loginWithGoogle(code, verifier)
    },
    label: 'Google login',
  })

  return {
    ...mutation,
    mutate: (args: { code: string; verifier: string }) => mutation.mutate(args),
    mutateAsync: (args: { code: string; verifier: string }) => mutation.mutateAsync(args),
  }
}
