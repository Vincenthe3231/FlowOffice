'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { buildGoogleAuthorizeUrl } from '@/shared/lib/google-oauth-browser'

export default function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const authUrl = await buildGoogleAuthorizeUrl(from)
      if (!authUrl) {
        console.error('Google OAuth not configured')
        alert('Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.')
        setIsLoading(false)
        return
      }
      window.location.href = authUrl
    } catch (err) {
      console.error('Google OAuth init failed:', err)
      alert('Could not start Google sign-in. Try again.')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      variant="outline"
      className="w-full h-10 px-4 py-2.5 border border-border flex gap-2 items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:bg-[#1c2536] dark:text-white dark:border-[#333f55] dark:hover:bg-[#2a3851]"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#4285f4] rounded-full animate-spin mr-2" />
      ) : (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.7 34.5 27 35.5 24 35.5c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.3 36.4 44 30.6 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
      )}
      <span className="font-medium text-sm">{isLoading ? 'Connecting...' : 'Google'}</span>
    </Button>
  )
}
