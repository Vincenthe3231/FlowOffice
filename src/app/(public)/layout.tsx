import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  // Minimal layout for public pages (no auth required)
  return <>{children}</>
}

