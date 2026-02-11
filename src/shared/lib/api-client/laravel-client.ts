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
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split(';')
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i].trim()
    if (cookie.indexOf(name) === 0) {
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

  const response = await fetch(url, config)
  
  // Handle non-JSON responses (like CSRF cookie endpoint)
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return { ok: response.ok, status: response.status }
  }

  const data = await response.json()
  
  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || 'Request failed',
      errors: data.errors || null,
    }
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
  const response = await apiFetch('/api/auth/lark/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  return response
}
