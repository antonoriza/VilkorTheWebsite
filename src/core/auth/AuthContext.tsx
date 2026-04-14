/**
 * AuthContext — Authentication state management.
 *
 * Provides the current user's identity, role, and apartment context
 * to the entire application via React Context. This is a client-side
 * auth layer (no backend) for demonstration purposes.
 *
 * Roles:
 *   - "admin"    — Full access to management, configuration, and user CRUD
 *   - "resident" — Access to personal dashboard, payments, packages, voting
 *
 * Usage:
 *   const { user, role, apartment, logout } = useAuth()
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

/** Supported user roles in the system */
export type Role = 'resident' | 'admin'

/** Shape of the authentication state exposed via context */
interface AuthState {
  /** Display name of the current user */
  user: string
  /** Apartment identifier (e.g. "A101") — empty for admins */
  apartment: string
  /** Email address used for login */
  email: string
  /** Current role determining UI visibility */
  role: Role
  /** Whether the user has successfully authenticated */
  isAuthenticated: boolean
  /** Sets auth state after successful login */
  setAuth: (user: string, apartment: string, email: string, role: Role) => void
  /** Clears auth state and returns to login */
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * AuthProvider — Wraps the app to provide authentication state.
 * Must be placed above any component that calls useAuth().
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState('')
  const [apartment, setApartment] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('resident')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const setAuth = (u: string, a: string, e: string, r: Role) => {
    setUser(u)
    setApartment(a)
    setEmail(e)
    setRole(r)
    setIsAuthenticated(true)
  }

  const logout = () => {
    setUser('')
    setApartment('')
    setEmail('')
    setRole('resident')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, apartment, email, role, isAuthenticated, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth — Hook to access the current authentication state.
 * Throws if used outside of an AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
