import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/shared/lib/auth-cookie'

const LARAVEL_API_URL =
  process.env.LARAVEL_API_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
  'http://localhost:8000'

function buildLaravelPath(
  pathSegments: string[],
  searchParams: URLSearchParams,
): string {
  const path = pathSegments.join('/')
  const query = searchParams.toString()
  return `/api/${path}${query ? `?${query}` : ''}`
}

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

async function handleRequest(request: NextRequest, method: string) {
  const bearerToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const cookieHeader = buildCookieHeader(request)

  const pathSegments = (
    request.nextUrl.pathname.match(/^\/api\/proxy\/(.+)$/)?.[1] || ''
  )
    .split('/')
    .filter(Boolean)

  if (pathSegments.length === 0) {
    return NextResponse.json(
      { message: 'Proxy path required' },
      { status: 400 },
    )
  }

  const url = new URL(
    buildLaravelPath(pathSegments, request.nextUrl.searchParams),
    LARAVEL_API_URL,
  )

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'authorization' || lower === 'cookie' || lower === 'host') {
      return
    }
    headers.set(key, value)
  })
  headers.set('Accept', 'application/json')

  if (cookieHeader) {
    headers.set('Cookie', cookieHeader)
  }

  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`)
  }

  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text()
    } catch {
      // no body
    }
  }

  if (
    body &&
    (!headers.get('Content-Type') ||
      headers.get('Content-Type')?.includes('application/json'))
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body || undefined,
  })

  const responseBody = await res.text()
  let parsed: unknown
  try {
    parsed = responseBody ? JSON.parse(responseBody) : null
  } catch {
    parsed = responseBody
  }

  const response = NextResponse.json(parsed, { status: res.status })
  forwardSetCookie(res, response)

  return response
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT')
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH')
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE')
}
