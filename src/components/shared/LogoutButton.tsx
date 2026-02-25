'use client'

import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/shared/stores/auth-store'
import { logoutUser } from '@/shared/lib/api-client/laravel-client'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'
import { Button } from '@/components/ui/button'

/**
 * Logout button: calls backend with Bearer token, clears store and cache, redirects to /login.
 * On 401 (e.g. token expired) we still clear and redirect.
 */
export function LogoutButton() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logoutUser()
    } catch {
      // Ignore 401 or network errors; we clear state and redirect anyway
    } finally {
      logout()
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME })
      queryClient.clear()
      window.location.href = '/login'
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Log out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
