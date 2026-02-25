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

type LaravelLarkCallbackResponse = {
  message?: string
  data?: { user?: unknown; token?: string }
  token?: string
  user?: unknown
}

export async function POST(request: NextRequest) {
  try {
    let body: { code?: string }
    try {
      body = (await request.json()) as { code?: string }
    } catch {
      return NextResponse.json(
        { message: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const { code } = body
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 },
      )
    }

    // Step 1: Bootstrap CSRF + session from Laravel (same as email login)
    let csrfRes: Response
    try {
      csrfRes = await fetch(`${LARAVEL_API_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
    } catch (fetchErr) {
      console.error('Auth Lark callback: cannot reach Laravel CSRF endpoint', fetchErr)
      return NextResponse.json(
        { message: 'Auth server unreachable' },
        { status: 502 },
      )
    }

    const csrfSetCookies = getSetCookieValues(csrfRes)
    if (csrfSetCookies.length === 0) {
      console.error('Auth Lark callback: Laravel CSRF endpoint did not return cookies')
      return NextResponse.json(
        { message: 'Auth server CSRF setup failed' },
        { status: 502 },
      )
    }

    const csrfCookieHeader = extractCookiesFromSetCookie(csrfSetCookies)
    const xsrfToken = extractXsrfTokenFromCookieHeader(csrfCookieHeader)

    if (!xsrfToken) {
      console.error('Auth Lark callback: XSRF-TOKEN cookie missing from CSRF response')
      return NextResponse.json(
        { message: 'Auth server CSRF token missing' },
        { status: 502 },
      )
    }

    // Step 2: Call Laravel Lark callback with Cookie + X-XSRF-TOKEN
    let callbackRes: Response
    try {
      callbackRes = await fetch(`${LARAVEL_API_URL}/api/auth/lark/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: csrfCookieHeader,
          'X-XSRF-TOKEN': xsrfToken,
        },
        body: JSON.stringify({ code }),
      })
    } catch (fetchErr) {
      console.error('Auth Lark callback: cannot reach Laravel callback endpoint', fetchErr)
      return NextResponse.json(
        { message: 'Auth server unreachable' },
        { status: 502 },
      )
    }

    let data: LaravelLarkCallbackResponse
    try {
      data = (await callbackRes.json()) as LaravelLarkCallbackResponse
    } catch (err) {
      console.error('Auth Lark callback: Laravel response was not JSON', err)
      return NextResponse.json(
        { message: 'Auth server returned invalid response' },
        { status: 502 },
      )
    }

    const allSetCookies = [
      ...csrfSetCookies,
      ...getSetCookieValues(callbackRes),
    ]

    if (!callbackRes.ok) {
      const errorResponse = NextResponse.json(data, {
        status: callbackRes.status,
      })
      forwardSetCookies(allSetCookies, errorResponse)
      return errorResponse
    }

    const token = data.data?.token ?? data.token
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Lark callback succeeded but no token returned' },
        { status: 502 },
      )
    }

    const user = data.data?.user ?? data.user
    const response = NextResponse.json(
      { data: { user } },
      { status: 200 },
    )

    forwardSetCookies(allSetCookies, response)
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)

    return response
  } catch (err) {
    console.error('Auth Lark callback route error:', err)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    )
  }
}
