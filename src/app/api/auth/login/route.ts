import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/shared/lib/auth-cookie'
import {
  extractCookiesFromSetCookie,
  extractXsrfTokenFromCookieHeader,
  forwardSetCookies,
  getSetCookieValues,
} from '@/shared/lib/laravel-csrf'

const LARAVEL_API_URL =
  process.env.LARAVEL_API_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
  'http://localhost:8000'

type LaravelLoginResponse = {
  message?: string
  data?: { user?: unknown; token?: string }
  token?: string
  user?: unknown
}

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string; password?: string }
    try {
      body = (await request.json()) as { email?: string; password?: string }
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 },
      )
    }

    // Step 1: Bootstrap CSRF + session from Laravel
    let csrfRes: Response
    try {
      csrfRes = await fetch(`${LARAVEL_API_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
    } catch (fetchErr) {
      console.error('Auth login: cannot reach Laravel CSRF endpoint', fetchErr)
      return NextResponse.json(
        { message: 'Auth server unreachable' },
        { status: 502 },
      )
    }

    const csrfSetCookies = getSetCookieValues(csrfRes)
    if (csrfSetCookies.length === 0) {
      console.error('Auth login: Laravel CSRF endpoint did not return cookies')
      return NextResponse.json(
        { message: 'Auth server CSRF setup failed' },
        { status: 502 },
      )
    }

    const csrfCookieHeader = extractCookiesFromSetCookie(csrfSetCookies)
    const xsrfToken = extractXsrfTokenFromCookieHeader(csrfCookieHeader)

    if (!xsrfToken) {
      console.error('Auth login: XSRF-TOKEN cookie missing from CSRF response')
      return NextResponse.json(
        { message: 'Auth server CSRF token missing' },
        { status: 502 },
      )
    }

    // Step 2: Perform login with Cookie + X-XSRF-TOKEN
    let loginRes: Response
    try {
      loginRes = await fetch(`${LARAVEL_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: csrfCookieHeader,
          'X-XSRF-TOKEN': xsrfToken,
        },
        body: JSON.stringify({ email, password }),
      })
    } catch (fetchErr) {
      console.error('Auth login: cannot reach Laravel login endpoint', fetchErr)
      return NextResponse.json(
        { message: 'Auth server unreachable' },
        { status: 502 },
      )
    }

    let data: LaravelLoginResponse
    try {
      data = (await loginRes.json()) as LaravelLoginResponse
    } catch (err) {
      console.error('Auth login: Laravel response was not JSON', err)
      return NextResponse.json(
        { message: 'Auth server returned invalid response' },
        { status: 502 },
      )
    }

    if (!loginRes.ok) {
      const errorResponse = NextResponse.json(data, {
        status: loginRes.status,
      })
      const loginSetCookies = getSetCookieValues(loginRes)
      const allSetCookies = [...csrfSetCookies, ...loginSetCookies]
      forwardSetCookies(allSetCookies, errorResponse)
      return errorResponse
    }

    const token = data.data?.token ?? data.token
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Login succeeded but no token returned' },
        { status: 502 },
      )
    }

    const user = data.data?.user ?? data.user
    const response = NextResponse.json(
      { data: { user } },
      { status: 200 },
    )

    // Forward all Laravel cookies (CSRF + session + any login updates) to the browser
    const loginSetCookies = getSetCookieValues(loginRes)
    const allSetCookies = [...csrfSetCookies, ...loginSetCookies]
    forwardSetCookies(allSetCookies, response)

    // Store Sanctum Bearer token in httpOnly cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)

    return response
  } catch (err) {
    console.error('Auth login route error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
