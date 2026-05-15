import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_CACHE_COOKIE_NAME,
  AUTH_CACHE_COOKIE_OPTIONS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
} from '@/shared/lib/auth-cookie'

const LARAVEL_API_URL =
  process.env.LARAVEL_API_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
  'http://localhost:8000'

function buildCookieHeader(request: NextRequest): string | undefined {
  const parts = request.cookies
    .getAll()
    .filter((cookie) => cookie.name !== AUTH_COOKIE_NAME)
    .map((cookie) => `${cookie.name}=${cookie.value}`)

  if (parts.length === 0) return undefined
  return parts.join('; ')
}

function forwardSetCookie(from: Response, to: NextResponse) {
  // Undici exposes getSetCookie in Node runtimes; fall back to single header if unavailable.
  const anyHeaders = from.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookieValues = anyHeaders.getSetCookie?.()

  if (Array.isArray(setCookieValues) && setCookieValues.length > 0) {
    setCookieValues.forEach((value) => {
      to.headers.append('Set-Cookie', value)
    })
    return
  }

  const combined = from.headers.get('set-cookie')
  if (combined) {
    to.headers.set('Set-Cookie', combined)
  }
}

export async function GET(request: NextRequest) {
  const bearerToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const cookieHeader = buildCookieHeader(request)

  if (!cookieHeader && !bearerToken) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  let res: Response
  try {
    const headers: HeadersInit = {
      Accept: 'application/json',
    }

    if (cookieHeader) {
      headers.Cookie = cookieHeader
    }

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`
    }

    res = await fetch(`${LARAVEL_API_URL}/api/user`, {
      method: 'GET',
      headers,
    })
  } catch (fetchErr) {
    console.error('Auth me: cannot reach Laravel', fetchErr)
    return NextResponse.json(
      { message: 'Auth server unreachable' },
      { status: 502 },
    )
  }

  let data: unknown
  try {
    data = await res.json()
  } catch (err) {
    console.error('Auth me: Laravel response was not JSON', err)
    return NextResponse.json(
      { message: 'Auth server returned invalid response' },
      { status: 502 },
    )
  }

  const response = NextResponse.json(data, { status: res.status })
  forwardSetCookie(res, response)

  if (res.status === 401) {
    // Clear Bearer + cache cookies so middleware and UI reflect logged-out state.
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    })
    response.cookies.set(AUTH_CACHE_COOKIE_NAME, '', {
      ...AUTH_CACHE_COOKIE_OPTIONS,
      maxAge: 0,
    })
  }

  return response
}
