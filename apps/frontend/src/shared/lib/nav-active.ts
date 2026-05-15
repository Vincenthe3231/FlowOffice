/**
 * Sidebar / mobile nav: highlight parent item for nested routes (e.g. /users/[id] under /users).
 */
export function isRouteActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  const h = href.replace(/\/$/, '') || '/'
  if (h === '/dashboard') return p === '/dashboard'
  return p === h || p.startsWith(`${h}/`)
}
