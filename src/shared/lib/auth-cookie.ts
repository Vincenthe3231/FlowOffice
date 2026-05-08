/**
 * Auth cookie contract for Sanctum Bearer token.
 *
 * Used by Next.js Route Handlers (login, logout, me, proxy) and middleware.
 * Cookie name and options must match middleware (route protection).
 */

export const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || 'belive_auth_token'

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  /** 7 days; align with backend token lifetime if different */
  maxAge: 60 * 60 * 24 * 7,
}

/**
 * Optional small "auth cache" cookie mirroring staff-portal.
 *
 * This is a lightweight, non-httpOnly cookie that can be used by middleware
 * or client-side logic to reflect "likely authenticated" state without
 * exposing the Bearer token itself.
 */

export const AUTH_CACHE_COOKIE_NAME =
  process.env.AUTH_CACHE_COOKIE_NAME || 'rx_staff_auth'

export const AUTH_CACHE_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  /** 7 days; align with backend token lifetime if different */
  maxAge: 60 * 60 * 24 * 7,
}
