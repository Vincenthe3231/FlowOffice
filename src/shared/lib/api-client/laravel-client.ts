/**
 * Laravel API Client
 *
 * Handles communication with Laravel Sanctum backend.
 * Built on top of Axios instances from `./axios.ts`.
 *
 * Features inherited from Axios layer:
 * - Session-based auth (withCredentials)
 * - Auto CSRF token injection
 * - Auto CSRF 419 retry
 * - Auto camelCase ↔ snake_case transform
 */

import { laravelApi, laravelRootApi } from './axios'
import { API_ROUTES } from './constants'

// ---------------------------------------------------------------------------
// CSRF
// ---------------------------------------------------------------------------

/**
 * Fetch CSRF cookie from Laravel Sanctum.
 * Must be called before any state-changing (POST/PUT/DELETE) request.
 */
export async function getCsrfCookie(): Promise<void> {
  await laravelRootApi.get(API_ROUTES.CSRF_COOKIE)
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Login with email and password.
 * Automatically fetches CSRF cookie first.
 */
export async function loginWithEmail(email: string, password: string) {
  await getCsrfCookie()

  const response = await laravelApi.post(API_ROUTES.AUTH.LOGIN, {
    email,
    password,
  })

  return response.data
}

/**
 * Get current authenticated user.
 * Used by useAuth to verify session validity.
 */
export async function getCurrentUser() {
  const response = await laravelApi.get(API_ROUTES.AUTH.ME)
  return response.data
}

/**
 * Login with Lark OAuth code.
 * Automatically fetches CSRF cookie first.
 *
 * Use via `useLarkLoginMutation` hook for proper TanStack Query integration.
 */
export async function loginWithLark(code: string) {
  try {
    await getCsrfCookie()
  } catch {
    throw new Error(
      'Failed to initialize CSRF token. Please refresh the page and try again.',
    )
  }

  const response = await laravelApi.post(API_ROUTES.AUTH.LARK_CALLBACK, {
    code,
  })

  return response.data
}
