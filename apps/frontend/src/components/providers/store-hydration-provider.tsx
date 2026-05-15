'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * StoreHydrationProvider
 * 
 * Ensures Zustand stores with persistence are properly hydrated
 * before rendering children. This prevents hydration mismatches
 * between server and client.
 * 
 * The provider waits for the client-side mount before allowing
 * children to render, ensuring localStorage is available.
 */
export function StoreHydrationProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Zustand persist hydrates synchronously on client-side mount
    // We just need to wait for the component to mount (client-side)
    // before allowing children to access localStorage
    setIsHydrated(true)
  }, [])

  // Show nothing until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null
  }

  return <>{children}</>
}

