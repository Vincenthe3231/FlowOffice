import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/shared/lib/auth-cookie'

const PROTECTED_PREFIXES = ['/dashboard']

function isPublicPath(pathname: string): boolean {
  if (pathname === '/login') return true
  if (pathname.startsWith('/auth/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/api/')) return true
  return false
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/') return true
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.has(AUTH_COOKIE_NAME)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname) && !isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const isAuthenticated = hasAuthCookie(request)

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
