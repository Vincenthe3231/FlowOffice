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

export async function POST(request: NextRequest) {
  const bearerToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const cookieHeader = buildCookieHeader(request)

  let res: Response | undefined
  try {
    if (cookieHeader || bearerToken) {
      const headers: HeadersInit = {
        Accept: 'application/json',
      }

      if (cookieHeader) {
        headers.Cookie = cookieHeader

        const xsrfCookie = request.cookies.get('XSRF-TOKEN')?.value
        if (xsrfCookie) {
          try {
            headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfCookie)
          } catch {
            headers['X-XSRF-TOKEN'] = xsrfCookie
          }
        }
      }

      if (bearerToken) {
        headers.Authorization = `Bearer ${bearerToken}`
      }

      res = await fetch(`${LARAVEL_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
      })
    }
  } catch (err) {
    console.error('Laravel logout error (cookies will still be cleared):', err)
  }

  const response = NextResponse.json(
    { message: 'Logged out' },
    { status: 200 },
  )

  if (res) {
    forwardSetCookie(res, response)
  }

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  })
  response.cookies.set(AUTH_CACHE_COOKIE_NAME, '', {
    ...AUTH_CACHE_COOKIE_OPTIONS,
    maxAge: 0,
  })

  return response
}
