import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/shared/lib/auth-cookie'
import {
  extractCookiesFromSetCookie,
  extractXsrfTokenFromCookieHeader,
  forwardSetCookies,
  getSetCookieValues,
} from '@/shared/lib/laravel-csrf'
import { clientAuthPayloadFromLaravel } from '@/shared/lib/sanitize-auth-client-payload'

const LARAVEL_API_URL =
  process.env.LARAVEL_API_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
  'http://localhost:8000'

type LaravelOAuthCallbackResponse = {
  message?: string
  data?: Record<string, unknown> & { user?: unknown; token?: string }
  token?: string
  user?: unknown
}

/**
 * Microsoft Entra ID OAuth callback exchange.
 *
 * TODO(backend): Implement `POST /api/auth/microsoft/callback` on Laravel:
 *   - Accept `{ code, code_verifier }`
 *   - Exchange code with Microsoft token endpoint using the verifier + tenant
 *   - Verify ID token signature/audience, upsert/lookup user, issue Sanctum token
 *   - Return `{ data: { user, token, accessStatus, ... } }` matching the Lark response shape
 * When ready, set `OAUTH_MICROSOFT_ENABLED=true` in the environment.
 */
export async function POST(request: NextRequest) {
  if (process.env.OAUTH_MICROSOFT_ENABLED !== 'true') {
    return NextResponse.json(
      {
        message:
          'Microsoft OAuth backend is not implemented yet. Set OAUTH_MICROSOFT_ENABLED=true once the Laravel route is live.',
      },
      { status: 501 },
    )
  }

  try {
    let body: { code?: string; code_verifier?: string }
    try {
      body = (await request.json()) as { code?: string; code_verifier?: string }
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    const { code, code_verifier: codeVerifier } = body
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { message: 'Authorization code is required' },
        { status: 400 },
      )
    }
    if (!codeVerifier || typeof codeVerifier !== 'string') {
      return NextResponse.json(
        { message: 'PKCE code_verifier is required' },
        { status: 400 },
      )
    }

    let csrfRes: Response
    try {
      csrfRes = await fetch(`${LARAVEL_API_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
    } catch (fetchErr) {
      console.error('Auth Microsoft callback: cannot reach Laravel CSRF endpoint', fetchErr)
      return NextResponse.json({ message: 'Auth server unreachable' }, { status: 502 })
    }

    const csrfSetCookies = getSetCookieValues(csrfRes)
    if (csrfSetCookies.length === 0) {
      return NextResponse.json(
        { message: 'Auth server CSRF setup failed' },
        { status: 502 },
      )
    }

    const csrfCookieHeader = extractCookiesFromSetCookie(csrfSetCookies)
    const xsrfToken = extractXsrfTokenFromCookieHeader(csrfCookieHeader)
    if (!xsrfToken) {
      return NextResponse.json(
        { message: 'Auth server CSRF token missing' },
        { status: 502 },
      )
    }

    let callbackRes: Response
    try {
      callbackRes = await fetch(`${LARAVEL_API_URL}/api/auth/microsoft/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: csrfCookieHeader,
          'X-XSRF-TOKEN': xsrfToken,
        },
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
      })
    } catch (fetchErr) {
      console.error('Auth Microsoft callback: cannot reach Laravel callback endpoint', fetchErr)
      return NextResponse.json({ message: 'Auth server unreachable' }, { status: 502 })
    }

    let data: LaravelOAuthCallbackResponse
    try {
      data = (await callbackRes.json()) as LaravelOAuthCallbackResponse
    } catch (err) {
      console.error('Auth Microsoft callback: Laravel response was not JSON', err)
      return NextResponse.json(
        { message: 'Auth server returned invalid response' },
        { status: 502 },
      )
    }

    const allSetCookies = [...csrfSetCookies, ...getSetCookieValues(callbackRes)]

    if (!callbackRes.ok) {
      const errorResponse = NextResponse.json(data, { status: callbackRes.status })
      forwardSetCookies(allSetCookies, errorResponse)
      return errorResponse
    }

    const token = data.data?.token ?? data.token
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Microsoft callback succeeded but no token returned' },
        { status: 502 },
      )
    }

    const payload = clientAuthPayloadFromLaravel(data)
    if (payload.data.user == null) {
      return NextResponse.json(
        { message: 'Microsoft callback succeeded but user payload was missing' },
        { status: 502 },
      )
    }

    const response = NextResponse.json(payload, { status: 200 })
    forwardSetCookies(allSetCookies, response)
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)
    return response
  } catch (err) {
    console.error('Auth Microsoft callback route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
