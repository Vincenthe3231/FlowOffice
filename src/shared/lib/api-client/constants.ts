/**
 * Centralised API route constants
 *
 * Auth routes target Next.js API (same-origin); proxy path prefix for Laravel via Next.js.
 */

export const API_ROUTES = {
  // Authentication (Next.js Route Handlers; cookie-based, no client token)
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
    LARK_CALLBACK: '/api/auth/lark/callback',
    LOGOUT: '/api/auth/logout',
  },
  /** Prefix for proxied Laravel API (e.g. /api/proxy/attendance/clock-in → Laravel /api/attendance/clock-in) */
  PROXY_PREFIX: '/api/proxy',
} as const
