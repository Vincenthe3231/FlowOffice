/**
 * Auth API Constants
 * 
 * Centralized constants for the authentication module.
 * Includes query keys, mutation keys, and configuration values.
 */

/**
 * React Query keys for auth-related queries and mutations
 */
export const AUTH_QUERY_KEYS = {
  ME: ['auth', 'me'] as const,
  LOGIN: ['auth', 'login'] as const,
  LARK_LOGIN: ['auth', 'lark-login'] as const,
} as const

/**
 * Default configuration values for auth queries
 */
export const AUTH_CONFIG = {
  STALE_TIME: Infinity, // Auth state should never be stale
  RETRY: false, // Don't retry auth failures automatically
} as const

