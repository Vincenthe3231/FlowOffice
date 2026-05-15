/**
 * PKCE (RFC 7636) helpers for public-client OAuth flows (Google, Microsoft).
 * Verifier is generated in browser, stored in sessionStorage keyed by nonce,
 * and consumed (single-use) by the callback page before exchange.
 *
 * Lark does not require PKCE (handled server-side) so these helpers are not used there.
 */

const PKCE_STORAGE_PREFIX = 'pkce:'
const VERIFIER_BYTES = 32

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('PKCE generation requires browser Web Crypto API')
  }
  const randomBytes = new Uint8Array(VERIFIER_BYTES)
  window.crypto.getRandomValues(randomBytes)
  const verifier = base64UrlEncode(randomBytes)

  const encoded = new TextEncoder().encode(verifier)
  const digest = await window.crypto.subtle.digest('SHA-256', encoded)
  const challenge = base64UrlEncode(new Uint8Array(digest))
  return { verifier, challenge }
}

export function generateNonce(): string {
  if (typeof window === 'undefined') return ''
  const buf = new Uint8Array(16)
  window.crypto.getRandomValues(buf)
  return base64UrlEncode(buf)
}

export function storeVerifier(nonce: string, verifier: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(`${PKCE_STORAGE_PREFIX}${nonce}`, verifier)
  } catch {
    /* sessionStorage may be unavailable (private mode, quota) — caller handles missing verifier */
  }
}

/**
 * Read and delete the verifier for the given nonce. Returns null when missing.
 * Single-use: subsequent reads return null even on the same browser tab.
 */
export function consumeVerifier(nonce: string): string | null {
  if (typeof window === 'undefined') return null
  const key = `${PKCE_STORAGE_PREFIX}${nonce}`
  try {
    const value = window.sessionStorage.getItem(key)
    if (value) window.sessionStorage.removeItem(key)
    return value
  } catch {
    return null
  }
}
