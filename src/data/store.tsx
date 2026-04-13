import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import {
  seedAvisos, seedPagos, seedPaquetes, seedReservaciones, seedVotaciones,
  type Aviso, type Pago, type Paquete, type Reservacion, type Votacion
} from './seed'

// ── State shape ──
export interface StoreState {
  avisos: Aviso[]
  pagos: Pago[]
  paquetes: Paquete[]
  reservaciones: Reservacion[]
  votaciones: Votacion[]
}

// ── Actions ──
type Action =
  | { type: 'ADD_AVISO'; payload: Aviso }
  | { type: 'DELETE_AVISO'; payload: string }
  | { type: 'ADD_PAGO'; payload: Pago }
  | { type: 'UPDATE_PAGO'; payload: Pago }
  | { type: 'ADD_PAQUETE'; payload: Paquete }
  | { type: 'UPDATE_PAQUETE'; payload: Paquete }
  | { type: 'DELETE_PAQUETES_DELIVERED' }
  | { type: 'ADD_RESERVACION'; payload: Reservacion }
  | { type: 'UPDATE_RESERVACION'; payload: Reservacion }
  | { type: 'DELETE_RESERVACION'; payload: string }
  | { type: 'ADD_VOTACION'; payload: Votacion }
  | { type: 'VOTE'; payload: { votacionId: string; optionLabel: string; voterId: string } }
  | { type: 'RESET' }

const STORAGE_KEY = 'cantonalfa_store'

function loadInitialState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* use seed */ }
  return {
    avisos: seedAvisos,
    pagos: seedPagos,
    paquetes: seedPaquetes,
    reservaciones: seedReservaciones,
    votaciones: seedVotaciones,
  }
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'ADD_AVISO':
      return { ...state, avisos: [action.payload, ...state.avisos] }
    case 'DELETE_AVISO':
      return { ...state, avisos: state.avisos.filter(a => a.id !== action.payload) }

    case 'ADD_PAGO':
      return { ...state, pagos: [...state.pagos, action.payload] }
    case 'UPDATE_PAGO':
      return { ...state, pagos: state.pagos.map(p => p.id === action.payload.id ? action.payload : p) }

    case 'ADD_PAQUETE':
      return { ...state, paquetes: [action.payload, ...state.paquetes] }
    case 'UPDATE_PAQUETE':
      return { ...state, paquetes: state.paquetes.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PAQUETES_DELIVERED':
      return { ...state, paquetes: state.paquetes.filter(p => p.status !== 'Entregado') }

    case 'ADD_RESERVACION':
      return { ...state, reservaciones: [...state.reservaciones, action.payload] }
    case 'UPDATE_RESERVACION':
      return { ...state, reservaciones: state.reservaciones.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_RESERVACION':
      return { ...state, reservaciones: state.reservaciones.filter(r => r.id !== action.payload) }

    case 'ADD_VOTACION':
      return { ...state, votaciones: [action.payload, ...state.votaciones] }
    case 'VOTE': {
      const { votacionId, optionLabel, voterId } = action.payload
      return {
        ...state,
        votaciones: state.votaciones.map(v => {
          if (v.id !== votacionId) return v
          if (v.voters.includes(voterId)) return v // already voted
          return {
            ...v,
            voters: [...v.voters, voterId],
            options: v.options.map(o =>
              o.label === optionLabel ? { ...o, votes: o.votes + 1 } : o
            ),
          }
        }),
      }
    }
    case 'RESET':
      return loadInitialState()
    default:
      return state
  }
}

// ── Context ──
const StoreContext = createContext<{
  state: StoreState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
