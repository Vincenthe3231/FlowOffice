import { NextResponse } from 'next/server'

/**
 * Helpers for Laravel Sanctum CSRF + session handshake in Next.js auth routes.
 * Used by /api/auth/login and /api/auth/lark/callback so Laravel receives
 * Cookie + X-XSRF-TOKEN and returns 200 instead of 419.
 */

export function getSetCookieValues(res: Response): string[] {
  const anyHeaders = res.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const fromHelper = anyHeaders.getSetCookie?.()
  if (Array.isArray(fromHelper) && fromHelper.length > 0) {
    return fromHelper
  }
  const single = res.headers.get('set-cookie')
  return single ? [single] : []
}

export function extractCookiesFromSetCookie(setCookieValues: string[]): string {
  return setCookieValues
    .map((value) => value.split(';', 1)[0])
    .filter(Boolean)
    .join('; ')
}

export function extractXsrfTokenFromCookieHeader(
  cookieHeader: string,
): string | undefined {
  const xsrfTokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='))

  if (!xsrfTokenCookie) return undefined
  const [, value] = xsrfTokenCookie.split('=', 2)
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function forwardSetCookies(
  setCookieValues: string[],
  response: NextResponse,
): void {
  setCookieValues.forEach((value) => {
    response.headers.append('Set-Cookie', value)
  })
}
