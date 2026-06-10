import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/shared/lib/auth-cookie'
import { parseUserResponse } from '@/shared/lib/api-client/response-handler'

const LARAVEL_API_URL =
  process.env.LARAVEL_API_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
  'http://localhost:8000'

const FACE_VERIFY_ENABLED = process.env.FACE_VERIFY_ENABLED === 'true'
const HUMAN_API_BASE = process.env.HUMAN_API_URL || process.env.NEXT_PUBLIC_HUMAN_API_URL || ''

function buildCookieHeader(request: NextRequest): string | undefined {
  const parts = request.cookies
    .getAll()
    .filter((cookie) => cookie.name !== AUTH_COOKIE_NAME)
    .map((cookie) => `${cookie.name}=${cookie.value}`)

  if (parts.length === 0) return undefined
  return parts.join('; ')
}

async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  const bearerToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const cookieHeader = buildCookieHeader(request)

  if (!cookieHeader && !bearerToken) {
    return null
  }

  const headers: HeadersInit = { Accept: 'application/json' }
  if (cookieHeader) headers.Cookie = cookieHeader
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`

  const res = await fetch(`${LARAVEL_API_URL}/api/user`, {
    method: 'GET',
    headers,
  })

  if (!res.ok) return null

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return null
  }

  const user = parseUserResponse(data) as { id?: number } | null
  return user?.id ?? null
}

export async function POST(request: NextRequest) {
  if (!FACE_VERIFY_ENABLED) {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'disabled', message: 'Face verification is not enabled. Set FACE_VERIFY_ENABLED=true and configure HUMAN_API_URL.', requestId: '', timestamp: new Date().toISOString() } },
      { status: 501 }
    )
  }

  if (!HUMAN_API_BASE) {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'error', message: 'HUMAN_API_URL is not configured.', requestId: '', timestamp: new Date().toISOString() } },
      { status: 503 }
    )
  }

  if (request.headers.get('content-type')?.includes('application/json') !== true) {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'error', message: 'Content-Type must be application/json', requestId: '', timestamp: new Date().toISOString() } },
      { status: 400 }
    )
  }

  let body: { selfieBase64?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'error', message: 'Invalid JSON', requestId: '', timestamp: new Date().toISOString() } },
      { status: 400 }
    )
  }

  const selfieBase64 = body?.selfieBase64
  if (!selfieBase64 || typeof selfieBase64 !== 'string') {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'error', message: 'selfieBase64 is required', requestId: '', timestamp: new Date().toISOString() } },
      { status: 400 }
    )
  }

  const userId = await getCurrentUserId(request)
  if (userId == null) {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'error', message: 'Unauthorized', requestId: '', timestamp: new Date().toISOString() } },
      { status: 401 }
    )
  }

  const image = selfieBase64.startsWith('data:')
    ? selfieBase64
    : `data:image/jpeg;base64,${selfieBase64}`

  const humanRes = await fetch(`${HUMAN_API_BASE}/api/v1/recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: String(userId), image }),
  })

  let data: unknown
  try {
    data = await humanRes.json()
  } catch {
    return NextResponse.json(
      { humanFace: false, match: false, debug: { status: 'error', message: 'Face verification service unavailable', requestId: '', timestamp: new Date().toISOString() } },
      { status: 502 }
    )
  }

  return NextResponse.json(data, { status: humanRes.status })
}
