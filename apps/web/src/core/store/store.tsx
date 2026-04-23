/**
 * Store — Centralized state management for CantonAlfa.
 *
 * Backed by the PropertyPulse API server. No browser persistence.
 *
 * Architecture:
 *   - StoreProvider — Loads state from API after auth, dispatches optimistically.
 *   - reducer() — Pure function in ./reducer.ts handling all CRUD actions.
 *   - syncActionToAPI() — API mutation sync in ./api-sync.ts.
 *   - loadStateFromAPI() — API state loader in ./api-loader.ts.
 *   - useStore() — Hook to access { state, dispatch }.
 */
import { createContext, useContext, useReducer, useEffect, useCallback, useState, type ReactNode } from 'react'
import { setTenantId } from '../../lib/api'
import { useAuth } from '../auth/AuthContext'
import { reducer, emptyState, type StoreState, type Action } from './reducer'
import { syncActionToAPI } from './api-sync'
import { loadStateFromAPI } from './api-loader'

// ─── Re-exports for backward compatibility ───────────────────────────
// Consumers can continue importing these from 'store' until migrated.
export { getMaturityTargetDate, isEffectiveDebt } from './maturity'
export { hasPermission } from './permissions'
export type { StoreState, Action } from './reducer'

// ─── Context & Provider ──────────────────────────────────────────────

const StoreContext = createContext<{
  state: StoreState
  dispatch: React.Dispatch<Action>
} | null>(null)

/**
 * StoreProvider — Loads state from API after authentication.
 * Shows loading spinner until data arrives from the backend.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, tenantId, isLoading: authLoading } = useAuth()
  const [state, dispatch] = useReducer(reducer, undefined, emptyState)
  const [isLoaded, setIsLoaded] = useState(false)

  // When authenticated, set tenant ID and load from API
  useEffect(() => {
    if (!isAuthenticated || !tenantId) return

    setTenantId(tenantId)

    loadStateFromAPI().then(apiState => {
      if (apiState) {
        // Hydrate the reducer with API data by dispatching a full reset
        dispatch({ type: 'HYDRATE_FROM_API', payload: apiState } as any)
        console.log('[Store] ✓ Loaded from API')
      } else {
        console.warn('[Store] API returned no data')
      }
      setIsLoaded(true)
    }).catch(err => {
      console.error('[Store] API load failed:', err)
      setIsLoaded(true)
    })
  }, [isAuthenticated, tenantId])

  // Run cleanup & generate monthly records after data loads
  useEffect(() => {
    if (!isLoaded || state.residents.length === 0) return
    dispatch({ type: 'CLEANUP_EXPIRED', payload: { nowIso: new Date().toISOString() } })
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    dispatch({ type: 'GENERATE_MONTHLY_RECORDS', payload: { monthKey } })
  }, [isLoaded])

  // Wrap dispatch to sync mutations to API
  const apiDispatch = useCallback((action: Action) => {
    dispatch(action)
    syncActionToAPI(action)
  }, [])

  // Show nothing while auth is loading
  if (authLoading) return null

  // Show loading while fetching data (only when authenticated)
  if (isAuthenticated && !isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#34d399', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <StoreContext.Provider value={{ state, dispatch: apiDispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

/**
 * useStore — Hook to access the centralized store.
 */
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
