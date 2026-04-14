import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import {
  seedAvisos, seedPagos, seedPaquetes, seedReservaciones, seedVotaciones, seedNotificaciones, seedResidents, seedStaff,
  type Aviso, type Pago, type Paquete, type Reservacion, type Votacion, type Notificacion, type Resident, type StaffMember
} from './seed'

// ── State shape ──
export interface StoreState {
  notificaciones: Notificacion[]
  avisos: Aviso[]
  pagos: Pago[]
  paquetes: Paquete[]
  reservaciones: Reservacion[]
  votaciones: Votacion[]
  residents: Resident[]
  staff: StaffMember[]
}

// ── Actions ──
type Action =
  | { type: 'ADD_NOTIFICACION'; payload: Notificacion }
  | { type: 'MARK_NOTIFICACION_READ'; payload: string }
  | { type: 'ADD_AVISO'; payload: Aviso }
  | { type: 'UPDATE_AVISO'; payload: Aviso }
  | { type: 'DELETE_AVISO'; payload: string }
  | { type: 'ADD_PAGO'; payload: Pago }
  | { type: 'UPDATE_PAGO'; payload: Pago }
  | { type: 'ADD_PAQUETE'; payload: Paquete }
  | { type: 'UPDATE_PAQUETE'; payload: Paquete }
  | { type: 'DELETE_PAQUETA'; payload: string }
  | { type: 'DELETE_PAQUETES_DELIVERED' }
  | { type: 'ADD_RESERVACION'; payload: Reservacion }
  | { type: 'UPDATE_RESERVACION'; payload: Reservacion }
  | { type: 'DELETE_RESERVACION'; payload: string }
  | { type: 'ADD_VOTACION'; payload: Votacion }
  | { type: 'DELETE_VOTACION'; payload: string }
  | { type: 'VOTE'; payload: { votacionId: string; optionLabel: string; voter: { name: string; apartment: string; optionLabel: string; votedAt: string } } }
  | { type: 'ADD_RESIDENT'; payload: Resident }
  | { type: 'DELETE_RESIDENT'; payload: string }
  | { type: 'ADD_STAFF'; payload: StaffMember }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'CLEANUP_EXPIRED'; payload: { nowIso: string } }
  | { type: 'RESET' }

const STORAGE_KEY = 'cantonalfa_store'

function loadInitialState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Provide defaults for old/missing slices
      if (!parsed.notificaciones) parsed.notificaciones = []
      if (!parsed.residents) parsed.residents = seedResidents
      if (!parsed.staff) parsed.staff = seedStaff
      // Migrate old voters format (string[] or {name,apartment}[] without optionLabel)
      if (parsed.votaciones) {
        parsed.votaciones = parsed.votaciones.map((v: any) => ({
          ...v,
          voters: (v.voters || []).map((vot: any) => {
            if (typeof vot === 'string') return { name: vot, apartment: 'N/A', optionLabel: 'N/A', votedAt: '' }
            if (!vot.optionLabel) return { ...vot, optionLabel: 'N/A', votedAt: vot.votedAt || '' }
            return vot
          })
        }))
      }
      return parsed
    }
  } catch { /* use seed */ }
  return {
    notificaciones: seedNotificaciones,
    avisos: seedAvisos,
    pagos: seedPagos,
    paquetes: seedPaquetes,
    reservaciones: seedReservaciones,
    votaciones: seedVotaciones,
    residents: seedResidents,
    staff: seedStaff,
  }
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'ADD_NOTIFICACION':
      return { ...state, notificaciones: [action.payload, ...state.notificaciones] }
    case 'MARK_NOTIFICACION_READ':
      return {
        ...state,
        notificaciones: state.notificaciones.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      }

    case 'ADD_AVISO':
      return { ...state, avisos: [action.payload, ...state.avisos] }
    case 'UPDATE_AVISO':
      return { ...state, avisos: state.avisos.map(a => a.id === action.payload.id ? action.payload : a) }
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
    case 'DELETE_PAQUETA':
      return { ...state, paquetes: state.paquetes.filter(p => p.id !== action.payload) }
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
    case 'DELETE_VOTACION':
      return { ...state, votaciones: state.votaciones.filter(v => v.id !== action.payload) }
    case 'VOTE': {
      const { votacionId, voter } = action.payload
      return {
        ...state,
        votaciones: state.votaciones.map(v => {
          if (v.id !== votacionId) return v
          // 1 vote per apartment
          if (v.voters.some(vot => vot.apartment === voter.apartment)) return v
          return {
            ...v,
            voters: [...v.voters, voter],
            options: v.options.map(o =>
              o.label === voter.optionLabel ? { ...o, votes: o.votes + 1 } : o
            ),
          }
        }),
      }
    }

    case 'ADD_RESIDENT':
      return { ...state, residents: [...state.residents, action.payload] }
    case 'DELETE_RESIDENT':
      return { ...state, residents: state.residents.filter(r => r.id !== action.payload) }

    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] }
    case 'DELETE_STAFF':
      return { ...state, staff: state.staff.filter(s => s.id !== action.payload) }
    
    case 'CLEANUP_EXPIRED': {
      const now = new Date(action.payload.nowIso)
      
      // Remove delivered packages older than 24h
      const pqs = state.paquetes.filter(p => {
        if (p.status === 'Entregado' && p.deliveredDate) {
          const hours = (now.getTime() - new Date(p.deliveredDate).getTime()) / (1000 * 60 * 60)
          return hours < 24
        }
        if (p.status === 'Pendiente' && p.expirationDays) {
          const days = (now.getTime() - new Date(p.receivedDate).getTime()) / (1000 * 60 * 60 * 24)
          return days <= p.expirationDays
        }
        return true
      })

      return { ...state, paquetes: pqs }
    }

    case 'RESET':
      localStorage.removeItem(STORAGE_KEY)
      return {
        notificaciones: seedNotificaciones,
        avisos: seedAvisos,
        pagos: seedPagos,
        paquetes: seedPaquetes,
        reservaciones: seedReservaciones,
        votaciones: seedVotaciones,
        residents: seedResidents,
        staff: seedStaff,
      }
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

  // Auto clean-up expired items on mount
  useEffect(() => {
    dispatch({ type: 'CLEANUP_EXPIRED', payload: { nowIso: new Date().toISOString() } })
  }, [])

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
