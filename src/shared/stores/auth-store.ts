import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createEncryptedStorage } from '@/shared/lib/secure-storage'

/**
 * User object returned from backend
 */
export interface User {
  id: number
  name: string
  email: string
  roles?: string[]
  [key: string]: unknown
}

/**
 * Authentication method type
 * - 'email': Email/password (superadmin)
 * - 'lark': Lark OAuth (regular employees)
 */
export type AuthMethod = 'email' | 'lark' | null

/**
 * Auth store state interface
 * Token lives in httpOnly cookie; store holds user only for UI.
 */
interface AuthState {
  user: User | null
  authMethod: AuthMethod

  setUser: (user: User, authMethod?: AuthMethod) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      authMethod: null,

      setUser: (user: User, authMethod?: AuthMethod) => {
        set((s) => ({
          user,
          authMethod: authMethod ?? s.authMethod,
        }))
      },

      logout: () => {
        set({
          user: null,
          authMethod: null,
        })
      },

      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'auth-storage',
      skipHydration: typeof window === 'undefined',
      storage: createJSONStorage(() =>
        createEncryptedStorage(
          typeof window !== 'undefined' ? window.localStorage : (null as unknown as Storage),
          process.env.NEXT_PUBLIC_AUTH_STORE_SECRET ?? 'fallback-dev-key-min-32-chars'
        )
      ),
      partialize: (state) => ({
        user: state.user,
        authMethod: state.authMethod,
      }),
      version: 1,
      migrate: (persistedState, _version) => {
        // Discard unencrypted v0 data; user will re-login or refetch
        if (_version < 1) return { user: null, authMethod: null }
        return persistedState as { user: User | null; authMethod: AuthMethod }
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('Error rehydrating auth store:', error)
      },
    }
  )
)
