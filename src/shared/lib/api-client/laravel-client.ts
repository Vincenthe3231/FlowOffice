/**
 * API Client for auth and proxied backend
 *
 * Auth endpoints hit Next.js Route Handlers; token lives in httpOnly cookie.
 * No CSRF or client-side Bearer token.
 */

import { laravelApi } from './axios'
import { API_ROUTES } from './constants'

/**
 * Login with email and password.
 * Next.js route sets httpOnly cookie and returns user only.
 */
export async function loginWithEmail(email: string, password: string) {
  const response = await laravelApi.post(API_ROUTES.AUTH.LOGIN, {
    email,
    password,
  })
  return response.data
}

/**
 * Get current authenticated user.
 * Next.js reads cookie and calls Laravel /api/user with Bearer.
 */
export async function getCurrentUser() {
  const response = await laravelApi.get(API_ROUTES.AUTH.ME)
  return response.data
}

/**
 * Login with Lark OAuth code.
 * Next.js forwards code to Laravel, sets httpOnly cookie, returns user only.
 */
export async function loginWithLark(code: string) {
  const response = await laravelApi.post(API_ROUTES.AUTH.LARK_CALLBACK, {
    code,
  })
  return response.data
}

/**
 * Log out. Next.js revokes token on Laravel and clears cookie.
 */
export async function logoutUser(): Promise<void> {
  await laravelApi.post(API_ROUTES.AUTH.LOGOUT)
}
