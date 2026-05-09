/**
 * Build Lark OAuth authorize URL (client-only; uses NEXT_PUBLIC_* env).
 */
export function buildLarkAuthorizeUrl(from = '/dashboard'): string | null {
  if (typeof window === 'undefined') return null
  const appId = process.env.NEXT_PUBLIC_LARK_APP_ID
  const redirectUri = `${window.location.origin}/auth/callback`
  if (!appId) return null
  const state = encodeURIComponent(JSON.stringify({ from }))
  return `https://open.larksuite.com/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
}
