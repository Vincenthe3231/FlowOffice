/**
 * Laravel API Client
 * 
 * Handles communication with Laravel Sanctum backend
 * Supports session-based authentication with CSRF protection
 */

import { z } from 'zod'
import { ZodError } from 'zod'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

/**
 * Get CSRF token from cookie
 * Laravel sets the token as XSRF-TOKEN cookie (URL encoded)
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null // SSR - no cookies available
  }

  const name = 'XSRF-TOKEN='
  const decodedCookie = decodeURIComponent(document.cookie || '')
  const cookieArray = decodedCookie.split(';')
  
  for (let i = 0; i < cookieArray.length; i++) {
    const cookie = cookieArray[i]?.trim()
    if (cookie && cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length)
    }
  }
  
  return null
}

/**
 * Base fetch wrapper with credentials and CSRF protection
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${LARAVEL_API_URL}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }

  // Get CSRF token from cookie and add as header
  const csrfToken = getCsrfTokenFromCookie()
  if (csrfToken) {
    defaultHeaders['X-XSRF-TOKEN'] = csrfToken
  }

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Critical for session cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  let response: Response
  try {
    response = await fetch(url, config)
  } catch (networkError) {
    // Network error (CORS, connection refused, etc.)
    const error = new Error('Network error: Failed to connect to server') as any
    error.status = 0
    error.networkError = networkError
    error.message = networkError instanceof Error ? networkError.message : 'Network error'
    throw error
  }
  
  // Handle non-JSON responses (like CSRF cookie endpoint)
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as any
      error.status = response.status
      error.message = `HTTP ${response.status}: ${response.statusText}`
      throw error
    }
    return { ok: response.ok, status: response.status }
  }

  let data: any
  try {
    const text = await response.text()
    if (!text) {
      // Empty response
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: Empty response`) as any
        error.status = response.status
        error.message = `HTTP ${response.status}: Empty response`
        throw error
      }
      return {}
    }
    data = JSON.parse(text)
  } catch (parseError) {
    // JSON parse error
    const error = new Error('Invalid JSON response from server') as any
    error.status = response.status
    error.parseError = parseError
    error.message = 'Invalid JSON response from server'
    throw error
  }
  
  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP ${response.status}: Request failed`) as any
    error.status = response.status
    error.message = data.message || data.error || `HTTP ${response.status}: Request failed`
    error.error = data.error || null
    error.errors = data.errors || null
    error.data = data // Include full response for debugging
    throw error
  }

  return data
}

/**
 * Safe Fetch with Zod Validation
 * 
 * Wraps apiFetch with runtime validation using Zod schemas.
 * Ensures API responses match expected structure and catches
 * API contract violations at runtime.
 * 
 * @param endpoint - API endpoint path
 * @param schema - Zod schema to validate response against
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Validated and typed response data
 * @throws ZodError if response doesn't match schema
 * 
 * @example
 * ```ts
 * const user = await safeFetch('/api/user', userSchema)
 * // user is now typed and validated
 * ```
 */
export async function safeFetch<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await apiFetch(endpoint, options)
    
    // Validate response against schema
    const validated = schema.parse(response)
    
    // Log successful validation in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[safeFetch] Validated response from ${endpoint}`)
    }
    
    return validated
  } catch (error) {
    // If it's a Zod validation error, provide better error message
    if (error instanceof ZodError) {
      const validationError = new Error(
        `API response validation failed for ${endpoint}: ${error.message}`
      ) as any
      validationError.status = 422 // Unprocessable Entity
      validationError.zodError = error
      validationError.errors = error.errors
      
      // Log validation errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[safeFetch] Validation error:', {
          endpoint,
          errors: error.errors,
          response: error,
        })
      }
      
      throw validationError
    }
    
    // Re-throw other errors (network, API errors, etc.)
    throw error
  }
}

/**
 * Get CSRF cookie from Laravel Sanctum
 * Must be called before any POST/PUT/DELETE requests
 * 
 * This function ensures the CSRF cookie is properly set and available
 */
export async function getCsrfCookie(): Promise<void> {
  try {
    const response = await apiFetch('/sanctum/csrf-cookie', {
      method: 'GET',
    })
    
    // Wait for cookie to be set in browser
    // This is critical for the cookie to be available in subsequent requests
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return response
  } catch (error) {
    // If CSRF cookie fetch fails, log but don't throw
    // This allows the calling code to handle the error appropriately
    console.error('Failed to get CSRF cookie:', error)
    throw error
  }
}

/**
 * Login with email and password
 * Returns user object on success
 */
export async function loginWithEmail(email: string, password: string) {
  // Step 1: Get CSRF cookie
  await getCsrfCookie()

  // Wait a tiny bit for cookie to be set (browser needs time to process Set-Cookie header)
  await new Promise(resolve => setTimeout(resolve, 100))

  // Step 2: Login (CSRF token will be automatically extracted from cookie and added as header)
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  return response
}

/**
 * Get current authenticated user
 * Used to verify session is still valid
 */
export async function getCurrentUser() {
  const response = await apiFetch('/api/user', {
    method: 'GET',
  })

  return response
}

/**
 * Logout current user
 * Destroys session on backend
 */
export async function logoutUser(): Promise<void> {
  await apiFetch('/api/auth/logout', {
    method: 'POST',
  })
}

/**
 * Login with Lark OAuth code
 * Returns tokens and user object
 * 
 * IMPORTANT: This function must be called within a TanStack Query mutation
 * to be properly tracked and cached. Use useLarkLoginMutation hook instead.
 */
export async function loginWithLark(code: string) {
  // Step 1: Get CSRF cookie (required for POST requests)
  // Only fetch once - don't retry if it fails
  try {
    await getCsrfCookie()
  } catch (error) {
    // If CSRF cookie fetch fails, throw immediately to prevent infinite retries
    throw new Error('Failed to initialize CSRF token. Please refresh the page and try again.')
  }

  // Step 2: Exchange code for tokens (CSRF token will be automatically extracted from cookie)
  // The apiFetch function will automatically include the CSRF token from the cookie
  const response = await apiFetch('/api/auth/lark/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  return response
}
