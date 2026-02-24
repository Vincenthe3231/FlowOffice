/**
 * Axios Instances for Laravel Sanctum Backend
 *
 * Two instances:
 * - laravelApi   → versioned API requests (/api/...)
 * - laravelRootApi → root-level requests (Sanctum CSRF, health, etc.)
 *
 * Features:
 * - Auto CSRF token injection via request interceptor
 * - Auto CSRF 419 retry (refresh token and replay request)
 * - Auto camelCase ↔ snake_case transform
 * - Session cookies (withCredentials: true)
 *
 * Adapted from RenoXpert staff-portal.
 */

import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import { keysToCamel, keysToSnake } from './transform'

const BASE_URL =
  process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read XSRF-TOKEN cookie (client-side only) */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (key === 'XSRF-TOKEN' && value) {
      return decodeURIComponent(value)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Interceptor factories
// ---------------------------------------------------------------------------

/** Transform outgoing request data to snake_case */
const transformRequest = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
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

/** Attach CSRF token header to every request */
const addCsrfToken = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken
  }
  return config
}

// ---------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------

/**
 * Main API instance – use for all `/api/...` requests.
 */
export const laravelApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/**
 * Root instance – use only for Sanctum CSRF cookie & health-check endpoints.
 */
export const laravelRootApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

// ---------------------------------------------------------------------------
// 419 CSRF auto-retry (only on laravelApi)
// ---------------------------------------------------------------------------

const handleCsrfError = async (error: unknown) => {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 419
  ) {
    try {
      // Refresh CSRF cookie via root instance
      await laravelRootApi.get('/sanctum/csrf-cookie')
      // Re-attach fresh token and replay original request
      const csrfToken = getCsrfToken()
      if (csrfToken && error.config) {
        error.config.headers['X-XSRF-TOKEN'] = csrfToken
        return laravelApi.request(error.config)
      }
    } catch {
      // If refresh fails, fall through and reject with original error
    }
  }
  return Promise.reject(error)
}

// ---------------------------------------------------------------------------
// Wire interceptors
// ---------------------------------------------------------------------------

// laravelApi: transform → CSRF → response transform + 419 retry
laravelApi.interceptors.request.use(transformRequest)
laravelApi.interceptors.request.use(addCsrfToken)
laravelApi.interceptors.response.use(transformResponse, handleCsrfError)

// laravelRootApi: transform only (no CSRF injection – it's the provider)
laravelRootApi.interceptors.request.use(transformRequest)
laravelRootApi.interceptors.response.use(transformResponse)
