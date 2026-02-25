import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/shared/lib/auth-cookie'

const LARAVEL_API_URL =
  process.env.LARAVEL_API_URL ||
  process.env.NEXT_PUBLIC_LARAVEL_API_URL ||
  'http://localhost:8000'

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

    let res: Response
    try {
      res = await fetch(`${LARAVEL_API_URL}/api/auth/lark/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code }),
      })
    } catch (fetchErr) {
      console.error('Auth Lark callback: cannot reach Laravel', fetchErr)
      return NextResponse.json(
        { message: 'Auth server unreachable' },
        { status: 502 },
      )
    }

    let data: { message?: string; data?: { user?: unknown; token?: string }; token?: string; user?: unknown }
    try {
      data = (await res.json()) as typeof data
    } catch (err) {
      console.error('Auth Lark callback: Laravel response was not JSON', err)
      return NextResponse.json(
        { message: 'Auth server returned invalid response' },
        { status: 502 },
      )
    }
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
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
