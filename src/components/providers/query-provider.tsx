'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

/**
 * TanStack Query Provider
 * 
 * Provides React Query client to the entire app
 * Handles data fetching, caching, and state management
 * Includes React Query Devtools for debugging (development only)
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - Garbage collection for unused queries
 * - Global error handling
 * - Mutation tracking
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Create a client instance per component tree
  // This ensures SSR works correctly
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            // Garbage collection time (formerly cacheTime)
            // Queries are kept in cache for 10 minutes after they become unused
            // Longer gcTime ensures queries show up in devtools even after component unmounts
            gcTime: 10 * 60 * 1000, // 10 minutes
            // Retry configuration with exponential backoff
            // Don't retry on 401 (unauthorized) or 419 (CSRF token mismatch) errors
            retry: (failureCount, error: unknown) => {
              const err = error as { status?: number; response?: { status?: number } }
              const status = err?.status ?? err?.response?.status
              // Don't retry on authentication or CSRF errors
              if (status === 401 || status === 419) {
                return false
              }
              // Don't retry on client errors (4xx) except specific cases
              if (status != null && status >= 400 && status < 500) {
                return false
              }
              // Retry up to 2 times for server errors (5xx) and network errors
              return failureCount < 2
            },
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Refetch on mount if data is stale
            refetchOnMount: true,
          },
          mutations: {
            // Don't retry mutations on client errors (4xx) or CSRF errors
            retry: (failureCount, error: unknown) => {
              const err = error as { status?: number; response?: { status?: number } }
              const status = err?.status ?? err?.response?.status
              // Never retry on authentication, CSRF, or client errors
              if (status === 401 || status === 419 || (status != null && status >= 400 && status < 500)) {
                return false
              }
              // Only retry once on server errors (5xx) or network errors
              return failureCount < 1
            },
            // Retry delay for mutations (if retry is enabled)
            retryDelay: 1000,
            // Cache mutations for debugging
            // Longer gcTime ensures mutations show up in devtools
            gcTime: 10 * 60 * 1000, // Keep mutation results in cache for 10 minutes
          },
        },
      })
  )

  // Track mutation/query errors in development for debugging (event types may extend beyond typed union)
  if (process.env.NODE_ENV === 'development') {
    queryClient.getMutationCache().subscribe((event: { type?: string; mutation?: { options?: { mutationKey?: unknown } }; error?: unknown }) => {
      if (event?.type === 'error') {
        const mutationKey = event?.mutation?.options?.mutationKey ?? 'unknown'
        console.error('[TanStack Query] Mutation error:', mutationKey, event.error)
      }
    })

    queryClient.getQueryCache().subscribe((event: { type?: string; query?: { queryKey?: unknown }; error?: unknown }) => {
      if (event?.type === 'error') {
        const queryKey = event?.query?.queryKey ?? 'unknown'
        console.error('[TanStack Query] Query error:', queryKey, event.error)
      }
    })
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - only shows in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
          // Ensure devtools can see all queries and mutations
          // position="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
