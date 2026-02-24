/**
 * Axios instance for Next.js API (auth + proxy)
 *
 * All requests go same-origin. The browser only ever talks to Next.js:
 * - Auth: /api/auth/login, /api/auth/me, /api/auth/lark/callback, /api/auth/logout
 * - Other API: /api/proxy/...
 *
 * Next.js Route Handlers then:
 * - Read Laravel session / CSRF cookies from the browser
 * - Optionally read the Sanctum Bearer token from an httpOnly cookie
 * - Call Laravel with `Cookie` (+ `X-XSRF-TOKEN` for login/logout) and optional `Authorization: Bearer <token>`
 *
 * The browser never sees the raw Bearer token and never calls Laravel directly.
 */

import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import { keysToCamel, keysToSnake } from './transform'

// Same-origin; auth cookies are sent via withCredentials
const BASE_URL = ''

/** Transform outgoing request data to snake_case */
const transformRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (
    config.data &&
    typeof config.data === 'object' &&
    !(config.data instanceof FormData)
  ) {
    config.data = keysToSnake(config.data)
  }
  return config
}

/** Transform incoming response data to camelCase */
const transformResponse = (response: AxiosResponse): AxiosResponse => {
  if (response.data && typeof response.data === 'object') {
    response.data = keysToCamel(response.data)
  }
  return response
}

/**
 * Main API instance – use for auth and proxied API (same-origin).
 * Cookie (httpOnly) is sent automatically with credentials: 'include'.
 */
export const laravelApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

laravelApi.interceptors.request.use(transformRequest)
laravelApi.interceptors.response.use(transformResponse)

/**
 * @deprecated No longer used (no direct Laravel or CSRF from client). Kept for compatibility.
 */
export const laravelRootApi = laravelApi
