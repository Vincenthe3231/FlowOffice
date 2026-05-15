'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { buildMicrosoftAuthorizeUrl } from '@/shared/lib/microsoft-oauth-browser'

export default function MicrosoftButton() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const handleMicrosoftLogin = async () => {
    setIsLoading(true)
    try {
      const authUrl = await buildMicrosoftAuthorizeUrl(from)
      if (!authUrl) {
        console.error('Microsoft OAuth not configured')
        alert('Microsoft OAuth not configured. Please set NEXT_PUBLIC_MICROSOFT_CLIENT_ID.')
        setIsLoading(false)
        return
      }
      window.location.href = authUrl
    } catch (err) {
      console.error('Microsoft OAuth init failed:', err)
      alert('Could not start Microsoft sign-in. Try again.')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleMicrosoftLogin}
      disabled={isLoading}
      variant="outline"
      className="w-full h-10 px-4 py-2.5 border border-border flex gap-2 items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:bg-[#1c2536] dark:text-white dark:border-[#333f55] dark:hover:bg-[#2a3851]"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0078d4] rounded-full animate-spin mr-2" />
      ) : (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" aria-hidden="true">
          <rect x="1" y="1" width="10" height="10" fill="#F25022" />
          <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
          <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
          <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
        </svg>
      )}
      <span className="font-medium text-sm">{isLoading ? 'Connecting...' : 'Microsoft'}</span>
    </Button>
  )
}
