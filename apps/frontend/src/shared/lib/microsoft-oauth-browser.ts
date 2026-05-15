import { generateNonce, generatePkcePair, storeVerifier } from './oauth-pkce'

/**
 * Build Microsoft Entra ID (Azure AD) authorize URL with PKCE (S256).
 * Tenant defaults to 'common' (multi-tenant + personal). Buyers set
 * NEXT_PUBLIC_MICROSOFT_TENANT_ID to their tenant GUID for single-tenant apps.
 */
export async function buildMicrosoftAuthorizeUrl(from = '/dashboard'): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
  if (!clientId) return null

  const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || 'common'
  const redirectUri =
    process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI ||
    `${window.location.origin}/auth/callback`

  const nonce = generateNonce()
  const { verifier, challenge } = await generatePkcePair()
  storeVerifier(nonce, verifier)

  const state = encodeURIComponent(JSON.stringify({ from, provider: 'microsoft', nonce }))

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile User.Read offline_access',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    response_mode: 'query',
  })

  return `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize?${params.toString()}&state=${state}`
}
