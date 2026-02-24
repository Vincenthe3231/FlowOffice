import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * User object returned from backend
 */
export interface User {
  id: number
  name: string
  email: string
  roles?: string[]
  [key: string]: any
}

/**
 * Authentication method type
 * - 'email': Session-based auth (superadmin)
 * - 'lark': Token-based OAuth (regular employees)
 */
export type AuthMethod = 'email' | 'lark' | null

/**
 * Auth store state interface
 */
interface AuthState {
  // User data (shared by both auth methods)
  user: User | null

  // Auth method currently used
  authMethod: AuthMethod

  // Tokens (only for Lark OAuth)
  apiToken: string | null
  supabaseToken: string | null

  // Actions
  setUser: (user: User) => void
  setUserAndToken: (user: User, token: string) => void
  setTokens: (tokens: { apiToken: string; supabaseToken: string }, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

/**
 * Zustand auth store with persistence
 * 
 * Supports dual authentication:
 * 1. Email/Password (session-based) - for superadmin
 * 2. Lark OAuth (token-based) - for regular employees
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      authMethod: null,
      apiToken: null,
      supabaseToken: null,

      /**
       * Set user only (e.g. from GET /user refresh). Does not clear token.
       */
      setUser: (user: User) => {
        set({ user })
      },

      /**
       * Set user and Bearer token after login or Lark callback.
       * Token is sent on all API requests via Axios interceptor.
       */
      setUserAndToken: (user: User, token: string) => {
        set({
          user,
          authMethod: 'email',
          apiToken: token,
          supabaseToken: null,
        })
      },

      /**
       * Set tokens and user for Lark OAuth (token-based)
       * Used when logging in with Lark OAuth
       */
      setTokens: (tokens: { apiToken: string; supabaseToken: string }, user: User) => {
        set({
          user,
          authMethod: 'lark',
          apiToken: tokens.apiToken,
          supabaseToken: tokens.supabaseToken,
        })
      },

      /**
       * Clear all auth data
       */
      logout: () => {
        set({
          user: null,
          authMethod: null,
          apiToken: null,
          supabaseToken: null,
        })
      },

      /**
       * Check if user is authenticated
       * Returns true if user exists (regardless of auth method)
       */
      isAuthenticated: () => {
        const state = get()
        return !!state.user
      },
    }),
    {
      name: 'auth-storage',
      // Skip hydration on server-side to prevent mismatches
      skipHydration: typeof window === 'undefined',
      // Persist everything to localStorage
      partialize: (state) => ({
        user: state.user,
        authMethod: state.authMethod,
        apiToken: state.apiToken,
        supabaseToken: state.supabaseToken,
      }),
      // Callback when rehydration completes
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating auth store:', error)
        } else if (state) {
          // Store has been successfully rehydrated
          // You can add any post-rehydration logic here
        }
      },
    }
  )
)
