import { generateNonce, generatePkcePair, storeVerifier } from './oauth-pkce'

/**
 * Build Google OAuth 2.0 authorize URL with PKCE (S256).
 * Browser is treated as a public client; the verifier never leaves the user's browser
 * until it is forwarded through the Next.js Route Handler to Laravel.
 */
export async function buildGoogleAuthorizeUrl(from = '/dashboard'): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) return null

  const redirectUri =
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`

  const nonce = generateNonce()
  const { verifier, challenge } = await generatePkcePair()
  storeVerifier(nonce, verifier)

  const state = encodeURIComponent(JSON.stringify({ from, provider: 'google', nonce }))

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'select_account',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}&state=${state}`
}
