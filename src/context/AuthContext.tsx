import { createContext, useContext, useState, type ReactNode } from 'react'

export type Role = 'resident' | 'admin'

interface AuthState {
  user: string
  apartment: string
  email: string
  role: Role
  isAuthenticated: boolean
  setAuth: (user: string, apartment: string, email: string, role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
