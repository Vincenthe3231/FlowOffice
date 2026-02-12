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
            retry: (failureCount, error: any) => {
              const status = error?.status || error?.response?.status
              // Don't retry on authentication or CSRF errors
              if (status === 401 || status === 419) {
                return false
              }
              // Don't retry on client errors (4xx) except specific cases
              if (status >= 400 && status < 500) {
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
            retry: (failureCount, error: any) => {
              const status = error?.status || error?.response?.status
              // Never retry on authentication, CSRF, or client errors
              if (status === 401 || status === 419 || (status >= 400 && status < 500)) {
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
        // Global error handler
        mutationCache: undefined, // Will be set if needed
        queryCache: undefined, // Will be set if needed
      })
  )

  // Add comprehensive logging in development to track ALL queries and mutations
  if (process.env.NODE_ENV === 'development') {
    // Track all mutation events (added, updated, removed, error, success)
    queryClient.getMutationCache().subscribe((event) => {
      const mutation = event?.mutation
      if (mutation) {
        const mutationKey = mutation.options.mutationKey || 'unknown'
        switch (event?.type) {
          case 'added':
            console.log('[TanStack Query] Mutation added:', mutationKey, mutation.state)
            break
          case 'updated':
            console.log('[TanStack Query] Mutation updated:', mutationKey, {
              status: mutation.state.status,
              error: mutation.state.error,
              data: mutation.state.data,
            })
            break
          case 'removed':
            console.log('[TanStack Query] Mutation removed:', mutationKey)
            break
          case 'error':
            console.error('[TanStack Query] Mutation error:', mutationKey, event.error)
            break
        }
      }
    })

    // Track all query events (added, updated, removed, error, success)
    queryClient.getQueryCache().subscribe((event) => {
      const query = event?.query
      if (query) {
        const queryKey = query.queryKey || 'unknown'
        switch (event?.type) {
          case 'added':
            console.log('[TanStack Query] Query added:', queryKey, {
              enabled: query.options.enabled,
              staleTime: query.options.staleTime,
            })
            break
          case 'updated':
            console.log('[TanStack Query] Query updated:', queryKey, {
              status: query.state.status,
              fetchStatus: query.state.fetchStatus,
              dataUpdatedAt: query.state.dataUpdatedAt,
              error: query.state.error,
            })
            break
          case 'removed':
            console.log('[TanStack Query] Query removed:', queryKey)
            break
          case 'error':
            console.error('[TanStack Query] Query error:', queryKey, event.error)
            break
        }
      }
    })

    // Log cache state periodically for debugging
    setInterval(() => {
      const queries = queryClient.getQueryCache().getAll()
      const mutations = queryClient.getMutationCache().getAll()
      if (queries.length > 0 || mutations.length > 0) {
        console.log('[TanStack Query] Cache state:', {
          queries: queries.length,
          mutations: mutations.length,
          queryKeys: queries.map(q => q.queryKey),
          mutationKeys: mutations.map(m => m.options.mutationKey),
        })
      }
    }, 10000) // Log every 10 seconds
  }

  // Expose queryClient to window for debugging in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    ;(window as any).__REACT_QUERY_CLIENT__ = queryClient
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
