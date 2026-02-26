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
      partialize: (state) => ({
        user: state.user,
        authMethod: state.authMethod,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('Error rehydrating auth store:', error)
      },
    }
  )
)
