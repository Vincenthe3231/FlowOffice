'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLarkLoginMutation } from '@/shared/hooks/useLarkLoginMutation'
import { parseAuthSuccess, extractError } from '@/shared/lib/api-client/response-handler'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const larkLoginMutation = useLarkLoginMutation()
  
  // Mutation handles cache updates automatically via onSuccess
  // useAuth in authenticated layout will pick up the cached data automatically
  
  const hasProcessed = useRef(false) // Prevent multiple executions
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const stateParam = searchParams.get('state')

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return
    }

    const handleCallback = async () => {
      // Mark as processed immediately to prevent re-execution
      hasProcessed.current = true

      try {
        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`)
        }

        // Validate code parameter
        if (!code) {
          throw new Error('Missing authorization code. Please try logging in again.')
        }

        const body = await larkLoginMutation.mutateAsync(code)
        const { user, token } = parseAuthSuccess(body)

        if (!user || !token) {
          console.error('Response structure:', body)
          throw new Error('Authentication succeeded but user data or token was not returned.')
        }

        // Mutation's onSuccess already stored user + token and updated cache

        setStatus('success')
        setMessage('Login successful! Redirecting...')

        // Parse redirect target from OAuth state (relative path only to prevent open redirect)
        let redirectTo = '/dashboard'
        if (stateParam) {
          try {
            const parsed = JSON.parse(decodeURIComponent(stateParam))
            if (
              parsed?.from &&
              typeof parsed.from === 'string' &&
              parsed.from.startsWith('/')
            ) {
              redirectTo = parsed.from
            }
          } catch {
            /* ignore invalid state */
          }
        }

        setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      } catch (err) {
        console.error('Lark OAuth callback error:', err)

        const apiErr = extractError(err)
        let errorMessage = apiErr.message || 'Authentication failed. Please try again.'

        if (apiErr.status === 419) {
          errorMessage = 'CSRF token mismatch. Please refresh the page and try logging in again.'
        } else if (apiErr.status === 429 && apiErr.retryAfter != null) {
          errorMessage = `Too many requests. Try again in ${apiErr.retryAfter} seconds.`
        } else if (apiErr.status === 423 && apiErr.remainingSeconds != null) {
          errorMessage = `Account locked. Try again in ${apiErr.remainingSeconds} seconds.`
        } else if (err instanceof Error && !apiErr.error) {
          errorMessage = err.message
        }

        setStatus('error')
        setMessage(errorMessage)
      }
    }

    handleCallback()
    // Only depend on the actual values we need, not the mutation object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, error, errorDescription]) // Only re-run if these values change

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

