'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loginWithLark } from '@/shared/lib/api-client/laravel-client'
import { useAuthStore } from '@/shared/stores/auth-store'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setTokens, setUser } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`)
        }

        // Validate code parameter
        if (!code) {
          throw new Error('Missing authorization code. Please try logging in again.')
        }

        // Exchange code for tokens
        let response
        try {
          response = await loginWithLark(code)
        } catch (apiError: any) {
          // Log full error details for debugging
          console.error('loginWithLark API error (full):', {
            error: apiError,
            status: apiError?.status,
            message: apiError?.message,
            errorField: apiError?.error,
            errors: apiError?.errors,
            data: apiError?.data,
            networkError: apiError?.networkError,
            parseError: apiError?.parseError,
            stringified: JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2),
          })
          
          // Extract meaningful error message with status code
          let errorMessage = 'Failed to authenticate with Lark. Please try again.'
          
          // Handle Error instances
          if (apiError instanceof Error) {
            errorMessage = apiError.message
          } else if (apiError?.status === 500) {
            // Backend returned 500 - check for error field or message
            errorMessage = apiError?.error || apiError?.message || 'Server error during authentication. Please check backend logs.'
          } else if (apiError?.status === 401) {
            errorMessage = apiError?.error || apiError?.message || 'Authentication failed. Invalid authorization code or Lark credentials.'
          } else if (apiError?.status === 0) {
            errorMessage = apiError?.message || 'Network error: Unable to connect to server. Please check your connection.'
          } else if (apiError?.error) {
            errorMessage = apiError.error
          } else if (apiError?.message) {
            errorMessage = apiError.message
          } else if (apiError?.errors?.message) {
            errorMessage = apiError.errors.message
          } else if (typeof apiError === 'string') {
            errorMessage = apiError
          }
          
          throw new Error(errorMessage)
        }

        // Handle response structure - backend uses session-based auth
        // Expected: { user, message } or { data: { user, message } }
        const user = response?.data?.user || response?.user

        if (!user) {
          console.error('Response structure:', response)
          throw new Error('Authentication succeeded but user data was not returned.')
        }

        // Backend uses session-based auth (Sanctum SPA mode)
        // Session cookies are automatically set by the API call
        // Just store the user in the auth store
        setUser(user)

        setStatus('success')
        setMessage('Login successful! Redirecting to dashboard...')

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } catch (error) {
        console.error('Lark OAuth callback error:', error)
        
        // Extract error message with better handling
        let errorMessage = 'Authentication failed. Please try again.'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          const err = error as any
          errorMessage = err.message || err.error || JSON.stringify(error)
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        
        setStatus('error')
        setMessage(errorMessage)
      }
    }

    handleCallback()
  }, [searchParams, router, setTokens, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-gray-600 dark:text-gray-400">
                Authenticating with Lark...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 text-center">
                {message}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}

