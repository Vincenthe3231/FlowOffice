'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface MyAppProps {
  title?: string
}

const SocialButtons: React.FC<MyAppProps> = ({ title }) => {
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
    <>
      <div className='my-6'>
        <Button
          onClick={handleLarkSuiteLogin}
          disabled={isLoading}
          variant="outline"
          className="w-full h-10 px-4 py-2.5 border border-border flex gap-2 items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:bg-[#1c2536] dark:text-white dark:border-[#333f55] dark:hover:bg-[#2a3851]"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#5d87ff] rounded-full animate-spin mr-2" />
          ) : (
            <Image
              src="/images/logos/Lark.png"
              alt="Lark"
              width={20}
              height={20}
              className="mr-2"
            />
          )}
          <span className="font-medium text-sm">{isLoading ? 'Connecting...' : 'Lark'}</span>
        </Button>
      </div>
      {/* Divider */}
      <div className='flex items-center justify-center gap-2'>
        <hr className='grow border-border' />
        <p className='text-base text-muted-foreground font-medium'>{title}</p>
        <hr className='grow border-border' />
      </div>
    </>
  )
}

export default SocialButtons
