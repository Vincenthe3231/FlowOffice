'use client'

import { useEffect, useState, Suspense, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Loader2, Clock, Ban, ShieldOff } from 'lucide-react'
import { useLarkLoginMutation } from '@/shared/hooks/useLarkLoginMutation'
import { useGoogleLoginMutation } from '@/shared/hooks/useGoogleLoginMutation'
import { useMicrosoftLoginMutation } from '@/shared/hooks/useMicrosoftLoginMutation'
import { consumeVerifier } from '@/shared/lib/oauth-pkce'
import type { AuthMethod } from '@/shared/stores/auth-store'
import {
  parseMeResponse,
  extractError,
  type MeEnvelope,
} from '@/shared/lib/api-client/response-handler'
import { getCurrentUser, logoutUser } from '@/shared/lib/api-client/laravel-client'
import { laravelApi } from '@/shared/lib/api-client/axios'
import { API_ROUTES } from '@/shared/lib/api-client/constants'
import { useAuthStore } from '@/shared/stores/auth-store'
import { AUTH_QUERY_KEYS } from '@/shared/lib/api-client/auth-constants'
import {
  coerceAccessStatus,
  type AccessStatus,
  userSchema,
  meSessionSchema,
} from '@/shared/lib/validation/api.schemas'
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

/** Poll GET /api/user (via BFF) while verifying; backend keeps session after approve. */
const PENDING_POLL_INTERVAL_MS = 8000

type CallbackUiState =
  | 'loading'
  | 'success'
  | 'error'
  | 'verification-pending'
  | 'account-rejected'
  | 'deactivated'

function providerLabel(provider: NonNullable<AuthMethod>): string {
  switch (provider) {
    case 'lark':
      return 'Lark'
    case 'google':
      return 'Google'
    case 'microsoft':
      return 'Microsoft'
    default:
      return 'your provider'
  }
}

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
  const setUser = useAuthStore((s) => s.setUser)
  const larkLoginMutation = useLarkLoginMutation()
  const googleLoginMutation = useGoogleLoginMutation()
  const microsoftLoginMutation = useMicrosoftLoginMutation()

  const code = searchParams.get('code')
  const urlError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const urlMessage = searchParams.get('message')
  const stateParam = searchParams.get('state')

  const parsedState = (() => {
    if (!stateParam) return null
    try {
      return JSON.parse(decodeURIComponent(stateParam)) as {
        from?: string
        provider?: AuthMethod
        nonce?: string
      }
    } catch {
      return null
    }
  })()
  const provider: NonNullable<AuthMethod> = parsedState?.provider ?? 'lark'

  const syncSessionFromMeBody = useCallback(
    (body: unknown) => {
      const parsed = parseMeResponse(body)
      if (!parsed.user) return
      const validatedUser = userSchema.parse(parsed.user)
      const session = meSessionSchema.parse({
        user: validatedUser,
        accessStatus: coerceAccessStatus(parsed.accessStatus),
        rejectionReason: parsed.rejectionReason ?? null,
        onboarding: parsed.onboarding ?? null,
      })
      setUser(validatedUser, provider)
      queryClient.setQueryData(AUTH_QUERY_KEYS.ME, session)
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.ME })
    },
    [queryClient, setUser, provider],
  )

  /** Remove ?code / ?state so reload does not replay a single-use OAuth code. */
  const stripOAuthQuery = useCallback(() => {
    router.replace('/auth/callback')
  }, [router])

  const applyAccessGate = useCallback(
    (parsed: MeEnvelope) => {
      if (!parsed.user) {
        setStatus('error')
        setMessage('Authentication succeeded but user data was not returned.')
        return
      }
      const access: AccessStatus = coerceAccessStatus(parsed.accessStatus)

      if (access === 'pending') {
        setStatus('verification-pending')
        setMessage(
          'Your account is currently under verification by an administrator. You can stay on this page — when your account is approved, you will be redirected to the dashboard automatically.',
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

      if (redirectTo === '/') {
        redirectTo = '/dashboard'
      }

      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    },
    [router, stateParam],
  )

  const hasProcessed = useRef(false)

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
            'Your account is currently under verification by an administrator. After approval, this page will redirect you to the dashboard when your session is active.',
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

        // No OAuth code: resolve existing session (reload on /auth/callback, or post-redirect).
        if (!code) {
          try {
            const body = await getCurrentUser()
            syncSessionFromMeBody(body)
            const parsed = parseMeResponse(body)
            applyAccessGate(parsed)
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              logout()
              queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME })
              queryClient.clear()
              router.replace('/login')
              return
            }
            throw err
          }
          return
        }

        let body: unknown
        if (provider === 'google') {
          const verifier = parsedState?.nonce ? consumeVerifier(parsedState.nonce) : null
          if (!verifier) {
            throw new Error(
              'Google sign-in session expired or was started in a different browser tab. Return to login and try again.',
            )
          }
          body = await googleLoginMutation.mutateAsync({ code, verifier })
        } else if (provider === 'microsoft') {
          const verifier = parsedState?.nonce ? consumeVerifier(parsedState.nonce) : null
          if (!verifier) {
            throw new Error(
              'Microsoft sign-in session expired or was started in a different browser tab. Return to login and try again.',
            )
          }
          body = await microsoftLoginMutation.mutateAsync({ code, verifier })
        } else {
          body = await larkLoginMutation.mutateAsync(code)
        }
        stripOAuthQuery()

        const parsed = parseMeResponse(body)
        if (!parsed.user) {
          console.error('Response structure:', body)
          throw new Error('Authentication succeeded but user data was not returned.')
        }

        applyAccessGate(parsed)
      } catch (err) {
        console.error(`${provider} OAuth callback error:`, err)

        const apiErr = extractError(err)
        let errorMessage = apiErr.message || 'Authentication failed. Please try again.'

        if (apiErr.status === 401) {
          errorMessage =
            'This sign-in link was already used or expired. Return to login and sign in again.'
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
  }, [
    code,
    urlError,
    errorDescription,
    urlMessage,
    stateParam,
    provider,
    parsedState,
    applyAccessGate,
    stripOAuthQuery,
    syncSessionFromMeBody,
    larkLoginMutation,
    googleLoginMutation,
    microsoftLoginMutation,
    logout,
    queryClient,
    router,
  ])

  /** While pending, poll /me until access is granted (session kept after approve). */
  useEffect(() => {
    if (status !== 'verification-pending') return

    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const body = await getCurrentUser()
        if (cancelled) return
        const parsed = parseMeResponse(body)
        syncSessionFromMeBody(body)
        const access = coerceAccessStatus(parsed.accessStatus)
        if (access === 'pending') return
        applyAccessGate(parsed)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout()
          queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME })
          queryClient.clear()
          router.replace('/login')
        }
      }
    }

    void poll()
    const id = window.setInterval(poll, PENDING_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [
    status,
    applyAccessGate,
    syncSessionFromMeBody,
    logout,
    queryClient,
    router,
  ])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        {status === 'loading' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-center">
                Authenticating with {providerLabel(provider)}...
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
              <p className="text-xs text-muted-foreground pt-2">
                Checking for approval every few seconds…
              </p>
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
