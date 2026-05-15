import { useEffect, useState } from 'react'

/**
 * useHydration Hook
 * 
 * Detects when the component has mounted on the client side.
 * This prevents hydration mismatches by ensuring we only access
 * browser APIs (like localStorage) after hydration is complete.
 * 
 * @returns {boolean} True when component has mounted on client
 * 
 * @example
 * ```tsx
 * const isHydrated = useHydration()
 * if (!isHydrated) return <Loading />
 * return <ComponentThatUsesLocalStorage />
 * ```
 */
export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated after first client-side render
    setIsHydrated(true)
  }, [])

  return isHydrated
}


