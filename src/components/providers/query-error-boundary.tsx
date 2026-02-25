'use client'

import React, { Component, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * QueryErrorBoundary
 * 
 * Error boundary component that catches React Query errors
 * and provides user-friendly error messages with retry functionality.
 * 
 * Features:
 * - Catches query and mutation errors
 * - Shows user-friendly error messages
 * - Provides retry functionality
 * - Handles 401 errors (redirects to login)
 * - Logs errors for debugging
 */
export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('QueryErrorBoundary caught an error:', error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when children change (e.g., navigation)
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Check if it's a 401 error (unauthorized)
      const error = this.state.error as any
      if (error?.status === 401) {
        return <UnauthorizedError onRetry={this.handleRetry} />
      }

      // Default error UI
      return <DefaultError error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

/**
 * Unauthorized Error Component
 * 
 * Handles 401 errors by showing a message and redirecting to login
 */
function UnauthorizedError({ onRetry }: { onRetry: () => void }) {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-destructive/50 bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Session Expired
            </h2>
            <p className="text-sm text-muted-foreground">
              Your session has expired. Please log in again to continue.
            </p>
          </div>
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={onRetry}
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Default Error Component
 * 
 * Shows a generic error message with retry functionality
 */
function DefaultError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const errorMessage =
    error?.message ||
    (error as any)?.error ||
    'An unexpected error occurred. Please try again.'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-destructive/50 bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {error.stack || JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
          </div>
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

