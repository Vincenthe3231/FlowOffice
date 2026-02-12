/**
 * Laravel API Client
 * 
 * Handles communication with Laravel Sanctum backend
 * Supports session-based authentication with CSRF protection
 */

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
 * Get CSRF cookie from Laravel Sanctum
 * Must be called before any POST/PUT/DELETE requests
 */
export async function getCsrfCookie(): Promise<void> {
  await apiFetch('/sanctum/csrf-cookie', {
    method: 'GET',
  })
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
 */
export async function loginWithLark(code: string) {
  // Step 1: Get CSRF cookie (required for POST requests)
  await getCsrfCookie()

  // Wait a tiny bit for cookie to be set (browser needs time to process Set-Cookie header)
  await new Promise(resolve => setTimeout(resolve, 100))

  // Step 2: Exchange code for tokens (CSRF token will be automatically extracted from cookie)
  const response = await apiFetch('/api/auth/lark/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  return response
}
