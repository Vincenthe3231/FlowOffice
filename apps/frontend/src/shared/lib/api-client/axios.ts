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

/**
 * ⚠️  TRANSFORM CONTRACT — READ BEFORE MODIFYING
 *
 * All API data crosses a snake_case ↔ camelCase boundary at this interceptor layer.
 * - Outgoing requests: camelCase → snake_case (via keysToSnake)
 * - Incoming responses: snake_case → camelCase (via keysToCamel)
 *
 * Every feature's API client, hooks, and types assume this transform runs automatically.
 * Changing or removing it will break ALL API interactions across Claims, Leave, Attendance, etc.
 *
 * Known edge cases:
 * - Acronyms: "apiURL" → "api_u_r_l" (not "api_url"). Avoid consecutive uppercase in keys.
 * - FormData: passed through as-is (no transform, no Content-Type set). The instance has no default Content-Type, so axios/browser sets multipart/form-data with boundary automatically. Do NOT add a default Content-Type to the instance — axios 1.x formDataToJSON() fires whenever Content-Type contains "application/json", serializing the file to JSON.
 * - Nested objects and arrays: recursively transformed.
 * - Non-plain objects (Date, File, etc.): passed through as-is.
 *
 * If you add a new API field with acronyms (e.g., "htmlURL"), use camelCase ("htmlUrl") instead.
 */

/** Transform outgoing request data to snake_case; FormData: leave body as-is (no Content-Type set → axios sets multipart+boundary automatically) */
const transformRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  if (config.data instanceof FormData) {
    // Do NOT set Content-Type — browser/XHR sets multipart/form-data with boundary.
    // Instance default has no Content-Type (see axios.create below), so no delete needed.
    return config
  }
  if (config.data && typeof config.data === 'object') {
    config.data = keysToSnake(config.data)
    // Explicitly set JSON content type only for object payloads.
    config.headers.set('Content-Type', 'application/json')
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
    'X-Requested-With': 'XMLHttpRequest',
    // No Content-Type default: JSON requests get it in the interceptor;
    // FormData requests get multipart+boundary set automatically by the browser.
  },
})

laravelApi.interceptors.request.use(transformRequest)
laravelApi.interceptors.response.use(transformResponse)

/**
 * @deprecated No longer used (no direct Laravel or CSRF from client). Kept for compatibility.
 */
export const laravelRootApi = laravelApi
