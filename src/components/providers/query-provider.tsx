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
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - only shows in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
