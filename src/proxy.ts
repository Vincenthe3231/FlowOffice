import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/shared/lib/auth-cookie'
import {
  getAccessStatusFromMeJson,
  getUserFromMeJson,
  isNonGrantedAllowedPath,
} from '@/shared/lib/middleware-me'
import { featuresConfig, FeatureKey } from '@/config/features.config'

const FEATURE_ROUTE_MAP: Array<[string, FeatureKey]> = [
  ['/dashboard/attendnance', 'attendance'],
  ['/dashboard/log', 'attendance'],
  ['/dashboard/claims', 'claims'],
  ['/dashboard/leave', 'leave'],
  ['/dashboard/onboarding', 'onboarding'],
  ['/dashboard/overtime', 'overtime'],
  ['/dashboard/reports', 'reports'],
]

function isDisabledFeatureRoute(pathname: string): boolean {
  for (const [prefix, feature] of FEATURE_ROUTE_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      if (!featuresConfig[feature]) return true
    }
  }
  return false
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/login') return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname === '/favicon.ico') return true
  return false
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname === '/dashboard') return true
  if (pathname.startsWith('/dashboard/')) return true
  return false
}

function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.has(AUTH_COOKIE_NAME)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (!hasAuthCookie(request)) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  const cookieHeader = request.headers.get('cookie') ?? ''
  let meRes: Response
  try {
    meRes = await fetch(new URL('/api/auth/me', request.nextUrl.origin), {
      headers: { cookie: cookieHeader, accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return NextResponse.next()
  }

  if (meRes.status === 401) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  let body: unknown
  try {
    body = await meRes.json()
  } catch {
    return NextResponse.next()
  }

  const user = getUserFromMeJson(body)
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  const accessStatus = getAccessStatusFromMeJson(body)
  if (accessStatus !== 'granted' && !isNonGrantedAllowedPath(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isDisabledFeatureRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
