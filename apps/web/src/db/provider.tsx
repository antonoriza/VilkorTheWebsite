/**
 * DatabaseProvider — React context provider that initializes the SQLite
 * database and provides a loading state while WASM boots.
 *
 * This provider wraps the existing StoreProvider and ensures the DB is
 * ready before any store operations happen.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { initDatabase } from './database'

interface DatabaseContextValue {
  /** Whether the database has finished initializing */
  ready: boolean
  /** Any error that occurred during initialization */
  error: Error | null
}

const DatabaseContext = createContext<DatabaseContextValue>({
  ready: false,
  error: null,
})

/**
 * Wraps children with database initialization. Renders a loading
 * indicator until the WASM database is fully ready.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    initDatabase()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err) => {
        console.error('[DatabaseProvider] Init failed:', err)
        if (!cancelled) setError(err)
      })
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        color: '#ef4444',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Error al inicializar la base de datos</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{error.message}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        color: '#6b7280',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p>Iniciando base de datos…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <DatabaseContext.Provider value={{ ready, error }}>
      {children}
    </DatabaseContext.Provider>
  )
}

/**
 * Hook to check database readiness from any component.
 */
export function useDatabase() {
  return useContext(DatabaseContext)
}
