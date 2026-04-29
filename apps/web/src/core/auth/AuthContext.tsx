/**
 * AuthContext — Real authentication via Better Auth API.
 *
 * On mount: checks existing session via GET /api/me
 * Login:    POST /api/auth/sign-in/email → sets session cookie → fetches /api/me
 * Logout:   POST /api/auth/sign-out → clears state
 *
 * The tenant ID and role come from the backend (user_tenants table),
 * NOT from client-side guessing.
 *
 * Usage:
 *   const { user, role, tenantId, login, logout, isLoading } = useAuth()
 */
import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react'
import { setTenantId as setApiTenantId } from '../../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/** Supported user roles — aligned with backend user_tenants.role */
export type Role = 'residente' | 'operador' | 'administracion' | 'super_admin'

/** Shape of the authentication state exposed via context */
interface AuthState {
  /** Better Auth user ID */
  userId: string
  /** Display name of the current user */
  user: string
  /** Apartment identifier (e.g. "A101") — empty for admins */
  apartment: string
  /** Email address */
  email: string
  /** Profile image (base64 data URL or null) */
  image: string | null
  /** User role from backend */
  role: Role
  /** Tenant ID from backend */
  tenantId: string | null
  /** Whether the user has successfully authenticated */
  isAuthenticated: boolean
  /** Whether we're still checking session on mount */
  isLoading: boolean
  /** Signs in via Better Auth API */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  /** Signs out and clears state */
  logout: () => Promise<void>
  /** Refresh profile data from API (e.g. after avatar change) */
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/**
 * AuthProvider — Wraps the app to provide real authentication state.
 * Checks for existing session on mount, manages login/logout lifecycle.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('')
  const [user, setUser] = useState('')
  const [apartment, setApartment] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('residente')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  /** Fetches /api/me and populates auth state */
  const loadSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/me`, { credentials: 'include' })
      if (!res.ok) return false

      const data = await res.json()
      if (!data.user || !data.tenant) return false

      setUserId(data.user.id)
      setUser(data.user.name)
      setEmail(data.user.email)
      setImage(data.user.image || null)
      setRole(data.tenant.role as Role)
      setTenantId(data.tenant.id)
      setApiTenantId(data.tenant.id)
      setApartment(data.tenant.apartment || '')
      setIsAuthenticated(true)
      return true
    } catch {
      return false
    }
  }, [])

  // On mount: check if we already have a valid session cookie
  useEffect(() => {
    loadSession().finally(() => setIsLoading(false))
  }, [loadSession])

  /** Sign in via Better Auth email/password endpoint */
  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { ok: false, error: body.message || 'Credenciales inválidas' }
      }

      // Session cookie is now set — load user info
      const loaded = await loadSession()
      if (!loaded) {
        return { ok: false, error: 'Sesión creada pero no se pudo cargar perfil' }
      }

      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: 'Error de conexión con el servidor' }
    }
  }, [loadSession])

  /** Sign out via Better Auth */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch { /* ignore */ }

    setUserId('')
    setUser('')
    setEmail('')
    setImage(null)
    setRole('residente')
    setTenantId(null)
    setApiTenantId('demo')
    setApartment('')
    setIsAuthenticated(false)
  }, [])

  /** Refresh profile data (e.g. after avatar change) */
  const refreshProfile = useCallback(async () => {
    await loadSession()
  }, [loadSession])

  return (
    <AuthContext.Provider value={{ userId, user, apartment, email, image, role, tenantId, isAuthenticated, isLoading, login, logout, refreshProfile }}>
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
