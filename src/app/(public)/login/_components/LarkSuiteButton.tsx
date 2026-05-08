'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function LarkSuiteButton() {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const handleLarkSuiteLogin = () => {
    setIsLoading(true)

    const appId = process.env.NEXT_PUBLIC_LARK_APP_ID
    const redirectUri =
      process.env.NEXT_PUBLIC_LARK_REDIRECT_URI ||
      `${window.location.origin}/auth/callback`

    if (!appId) {
      console.error('NEXT_PUBLIC_LARK_APP_ID not configured')
      alert('Lark OAuth not configured. Please set environment variables.')
      setIsLoading(false)
      return
    }

    const state = encodeURIComponent(JSON.stringify({ from }))
    const authUrl = `https://open.larksuite.com/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`

    window.location.href = authUrl
  }

  return (
    <Button
      onClick={handleLarkSuiteLogin}
      disabled={isLoading}
      variant="outline"
      className="w-full h-10 bg-white hover:bg-gray-50 text-gray-900 border-gray-300 dark:bg-[#1c2536] dark:text-white dark:border-[#333f55] dark:hover:bg-[#2a3851]"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#5d87ff] rounded-full animate-spin mr-2" />
      ) : (
        <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded mr-2"></div>
      )}
      <span className="font-medium text-sm">{isLoading ? 'Connecting...' : 'LarkSuite'}</span>
    </Button>
  )
}

