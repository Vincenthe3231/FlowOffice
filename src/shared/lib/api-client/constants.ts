/**
 * Centralised API route constants
 *
 * Single source of truth for every backend endpoint.
 * Keeps route strings out of individual service files.
 */

export const API_ROUTES = {
  // Sanctum / session
  CSRF_COOKIE: '/sanctum/csrf-cookie',

  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/user',
    LARK_CALLBACK: '/api/auth/lark/callback',
    LOGOUT: '/api/auth/logout',
  },
} as const
