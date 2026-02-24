import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME =
  process.env.NEXT_PUBLIC_LARAVEL_SESSION_COOKIE || 'laravel-session'

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

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has(SESSION_COOKIE_NAME)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname) && !isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const isAuthenticated = hasSessionCookie(request)

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
