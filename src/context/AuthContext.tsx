import { createContext, useContext, useState, type ReactNode } from 'react'

export type Role = 'resident' | 'admin'

interface AuthState {
  user: string
  apartment: string
  email: string
  role: Role
  toggleRole: () => void
  setAuth: (user: string, apartment: string, email: string, role: Role) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState('Juan Antonio')
  const [apartment, setApartment] = useState('A201')
  const [email, setEmail] = useState('juan@property.com')
  const [role, setRole] = useState<Role>('resident')

  const toggleRole = () => setRole(r => r === 'resident' ? 'admin' : 'resident')

  const setAuth = (u: string, a: string, e: string, r: Role) => {
    setUser(u)
    setApartment(a)
    setEmail(e)
    setRole(r)
  }

  return (
    <AuthContext.Provider value={{ user, apartment, email, role, toggleRole, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
