import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/shared/lib/auth-cookie'
import {
  getAccessStatusFromMeJson,
  getUserFromMeJson,
  getRoleFromMeJson,
  getRolesFromMeJson,
  isNonGrantedAllowedPath,
} from '@/shared/lib/middleware-me'
import { featuresConfig, FEATURE_ROUTE_MAP } from '@/config/features.config'
import { APPROVER_ROLE_SLUGS } from '@/shared/constants/roles'

/** Routes that require an approver role — staff are redirected away. */
const APPROVER_ONLY_PREFIXES = ['/dashboard/leave/approval']

function isApproverOnlyPath(pathname: string): boolean {
  return APPROVER_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

function hasApproverRole(body: unknown): boolean {
  const role = getRoleFromMeJson(body)
  const roles = getRolesFromMeJson(body)
  return (
    (role != null && APPROVER_ROLE_SLUGS.has(role)) ||
    roles.some((r) => APPROVER_ROLE_SLUGS.has(r))
  )
}

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

  // Role-based route guard: approver-only paths redirect non-approvers
  if (isApproverOnlyPath(pathname) && !hasApproverRole(body)) {
    return NextResponse.redirect(new URL('/dashboard/leave', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
