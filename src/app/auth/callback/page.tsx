'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Clock, Ban, ShieldOff } from 'lucide-react'
import { useLarkLoginMutation } from '@/shared/hooks/useLarkLoginMutation'
import { parseMeResponse, extractError } from '@/shared/lib/api-client/response-handler'
import { logoutUser } from '@/shared/lib/api-client/laravel-client'
import { laravelApi } from '@/shared/lib/api-client/axios'
import { API_ROUTES } from '@/shared/lib/api-client/constants'
import { useAuthStore } from '@/shared/stores/auth-store'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'
import { coerceAccessStatus, type AccessStatus } from '@/shared/lib/validation/api.schemas'
import { buildLarkAuthorizeUrl } from '@/shared/lib/lark-oauth-browser'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type CallbackUiState =
  | 'loading'
  | 'success'
  | 'error'
  | 'verification-pending'
  | 'account-rejected'
  | 'deactivated'

function decodeOAuthMessage(raw: string | null): string {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

function CallbackContent() {
  const [status, setStatus] = useState<CallbackUiState>('loading')
  const [message, setMessage] = useState('')
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [resubmitting, setResubmitting] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const larkLoginMutation = useLarkLoginMutation()

  const hasProcessed = useRef(false)
  const code = searchParams.get('code')
  const urlError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const urlMessage = searchParams.get('message')
  const stateParam = searchParams.get('state')

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      /* ignore */
    } finally {
      logout()
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME })
      queryClient.clear()
      router.replace('/login')
    }
  }

  const handleResubmit = async () => {
    setResubmitting(true)
    try {
      await laravelApi.post(`${API_ROUTES.PROXY_PREFIX}/auth/resubmit`, {})
      const next = buildLarkAuthorizeUrl('/dashboard')
      if (next) {
        window.location.href = next
        return
      }
      setMessage('Lark OAuth is not configured. Contact support.')
    } catch (err) {
      const apiErr = extractError(err)
      setMessage(apiErr.message || 'Resubmit failed. Try again later.')
    } finally {
      setResubmitting(false)
    }
  }

  useEffect(() => {
    if (hasProcessed.current) return

    const handleCallback = async () => {
      hasProcessed.current = true

      const legacyRejected = urlError === 'ACCOUNT_REJECTED'
      const legacyPending = urlError === 'ACCOUNT_VERIFICATION_PENDING'
      const legacyDeactivated = urlError === 'ACCOUNT_DEACTIVATED'

      if (!code && legacyPending) {
        setStatus('verification-pending')
        setMessage(
          decodeOAuthMessage(urlMessage) ||
            'Your account is currently under verification by an administrator.',
        )
        return
      }

      if (!code && legacyRejected) {
        setStatus('account-rejected')
        setRejectionReason(decodeOAuthMessage(urlMessage) || null)
        setMessage('Your account request was not approved.')
        return
      }

      if (!code && legacyDeactivated) {
        setStatus('deactivated')
        setMessage(
          decodeOAuthMessage(urlMessage) ||
            'Your account has been deactivated. Contact an administrator.',
        )
        return
      }

      try {
        if (urlError && !legacyPending && !legacyRejected && !legacyDeactivated) {
          throw new Error(errorDescription || `OAuth error: ${urlError}`)
        }

        if (!code) {
          throw new Error('Missing authorization code. Please try logging in again.')
        }

        const body = await larkLoginMutation.mutateAsync(code)
        const parsed = parseMeResponse(body)

        if (!parsed.user) {
          console.error('Response structure:', body)
          throw new Error('Authentication succeeded but user data was not returned.')
        }

        const access: AccessStatus = coerceAccessStatus(parsed.accessStatus)

        if (access === 'pending') {
          setStatus('verification-pending')
          setMessage(
            'Your account is currently under verification by an administrator.',
          )
          return
        }

        if (access === 'rejected') {
          setStatus('account-rejected')
          setRejectionReason(parsed.rejectionReason ?? null)
          setMessage('Your account request was not approved.')
          return
        }

        if (access === 'deactivated') {
          setStatus('deactivated')
          setMessage(
            'Your account has been deactivated. Contact an administrator.',
          )
          return
        }

        setStatus('success')
        setMessage('Login successful! Redirecting...')

        let redirectTo = '/dashboard'
        if (stateParam) {
          try {
            const parsedState = JSON.parse(decodeURIComponent(stateParam))
            if (
              parsedState?.from &&
              typeof parsedState.from === 'string' &&
              parsedState.from.startsWith('/')
            ) {
              redirectTo = parsedState.from
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

        if (apiErr.status === 429 && apiErr.retryAfter != null) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, urlError, errorDescription, urlMessage, stateParam])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Authenticating with Lark...
              </p>
            </CardContent>
          </Card>
        )}

        {status === 'success' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
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
              <p className="text-muted-foreground text-center">{message}</p>
            </CardContent>
          </Card>
        )}

        {status === 'error' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
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
              <p className="text-destructive text-center">{message}</p>
              <Button onClick={() => router.push('/login')}>Return to Login</Button>
            </CardContent>
          </Card>
        )}

        {status === 'verification-pending' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                <Clock className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <CardTitle>Account verification pending</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {message}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleLogout}>
                Log out
              </Button>
              <Button className="w-full sm:w-auto" onClick={() => router.push('/login')}>
                Return to login
              </Button>
            </CardFooter>
          </Card>
        )}

        {status === 'account-rejected' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
                <Ban className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Account not approved</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {message}
              </CardDescription>
              {rejectionReason ? (
                <p className="rounded-md border border-border bg-muted/50 p-3 text-left text-sm text-foreground mt-2">
                  {rejectionReason}
                </p>
              ) : null}
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleLogout}>
                Log out
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={resubmitting}
                onClick={() => void handleResubmit()}
              >
                {resubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Resubmit & sign in again'
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {status === 'deactivated' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ShieldOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>Account deactivated</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {message}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </CardFooter>
          </Card>
        )}
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
