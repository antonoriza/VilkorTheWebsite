/**
 * Store — Centralized state management for CantonAlfa.
 *
 * Uses React's useReducer + Context to provide a single source of truth
 * for all operational data. State is persisted to localStorage under
 * the key "cantonalfa_store" and auto-saved on every state change.
 *
 * Architecture:
 *   - loadInitialState() — Loads from localStorage or falls back to seed data.
 *     Includes migration logic for legacy schemas (old settings key, missing
 *     towers, staff role normalization, voter format upgrades).
 *   - reducer() — Pure function handling all CRUD actions.
 *   - StoreProvider — React context provider wrapping the app.
 *   - useStore() — Hook to access { state, dispatch }.
 */
import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import {
  seedAvisos, seedPagos, seedPaquetes, seedReservaciones, seedVotaciones,
  seedNotificaciones, seedResidents, seedStaff, seedAmenities, seedBuildingConfig,
  seedTickets, seedTicketCounter,
  type Aviso, type Pago, type Paquete, type Reservacion, type Votacion,
  type Notificacion, type Resident, type StaffMember, type Amenity, type BuildingConfig,
  type Ticket, type TicketActivity
} from './seed'

// ─── State Shape ─────────────────────────────────────────────────────

/** Complete application state stored in context */
export interface StoreState {
  notificaciones: Notificacion[]
  avisos: Aviso[]
  pagos: Pago[]
  paquetes: Paquete[]
  reservaciones: Reservacion[]
  votaciones: Votacion[]
  residents: Resident[]
  staff: StaffMember[]
  amenities: Amenity[]
  buildingConfig: BuildingConfig
  /** Service request / incident tickets */
  tickets: Ticket[]
  /** Auto-incrementing counter for ticket display numbers */
  ticketCounter: number
}

// ─── Action Types ────────────────────────────────────────────────────

/** Union of all dispatchable actions */
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
  | { type: 'UPDATE_RESIDENT'; payload: Resident }
  | { type: 'DELETE_RESIDENT'; payload: string }
  | { type: 'ADD_STAFF'; payload: StaffMember }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'ADD_AMENITY'; payload: Amenity }
  | { type: 'DELETE_AMENITY'; payload: string }
  | { type: 'UPDATE_BUILDING_CONFIG'; payload: Partial<BuildingConfig> }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'UPDATE_TICKET'; payload: Ticket }
  | { type: 'ADD_TICKET_ACTIVITY'; payload: { ticketId: string; activity: TicketActivity } }
  | { type: 'SET_TICKET_COUNTER'; payload: number }
  | { type: 'CLEANUP_EXPIRED'; payload: { nowIso: string } }
  | { type: 'RESET' }

/** localStorage key for persisting state */
const STORAGE_KEY = 'cantonalfa_store'

/**
 * Normalizes legacy staff role strings into the three allowed categories.
 * Handles various Spanish spelling variations from older data schemas.
 */
function migrateStaffRole(role: string): 'Jardinero' | 'Limpieza' | 'Guardia' {
  const r = role.toLowerCase()
  if (r.includes('seguridad') || r.includes('guardia')) return 'Guardia'
  if (r.includes('jardin')) return 'Jardinero'
  if (r.includes('limpieza') || r.includes('limp')) return 'Limpieza'
  if (r.includes('manten')) return 'Jardinero'
  return 'Limpieza'
}

/**
 * Loads the initial state from localStorage, applying migrations
 * for schema changes from previous versions. Falls back to seed
 * data if no stored state exists or if parsing fails.
 */
function loadInitialState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)

      // Ensure all slices exist (handles upgrades from older schemas)
      if (!parsed.notificaciones) parsed.notificaciones = []
      if (!parsed.residents) parsed.residents = seedResidents
      if (!parsed.staff) parsed.staff = seedStaff
      if (!parsed.amenities) parsed.amenities = seedAmenities

      // Migrate from the old separate "cantonalfa_settings" localStorage key
      if (!parsed.buildingConfig) {
        let bc = { ...seedBuildingConfig }
        try {
          const oldSettings = localStorage.getItem('cantonalfa_settings')
          if (oldSettings) {
            const os = JSON.parse(oldSettings)
            bc.adminName = os.adminName || bc.adminName
            bc.adminEmail = os.adminEmail || bc.adminEmail
            bc.adminPhone = os.adminPhone || bc.adminPhone
            bc.buildingName = os.buildingName || bc.buildingName
            bc.buildingAddress = os.buildingAddress || bc.buildingAddress
            bc.managementCompany = os.managementCompany || bc.managementCompany
            bc.totalUnits = os.totalUnits || bc.totalUnits
            localStorage.removeItem('cantonalfa_settings')
          }
        } catch { /* ignore legacy parse errors */ }
        parsed.buildingConfig = bc
      }

      // Migrate residents: infer tower from apartment prefix if missing
      if (parsed.residents) {
        parsed.residents = parsed.residents.map((r: any) => {
          if (!r.tower) {
            const match = r.apartment?.match(/^([A-Za-z]+)/)
            return { ...r, tower: match ? match[1].toUpperCase() : 'A' }
          }
          return r
        })
      }

      // Migrate staff: remove deprecated "location" field, normalize role
      if (parsed.staff) {
        parsed.staff = parsed.staff.map((s: any) => {
          const { location: _loc, ...rest } = s
          return { ...rest, role: migrateStaffRole(s.role || 'Limpieza') }
        })
      }

      // Migrate voters: upgrade from old string-only format to object format
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

      // Migrate: add tickets slice if missing (upgrade from pre-ticket schema)
      if (!parsed.tickets) parsed.tickets = seedTickets
      if (!parsed.ticketCounter && parsed.ticketCounter !== 0) parsed.ticketCounter = seedTicketCounter

      return parsed
    }
  } catch { /* fall through to seed data on any error */ }

  // No stored state found — return fresh seed data
  return {
    notificaciones: seedNotificaciones,
    avisos: seedAvisos,
    pagos: seedPagos,
    paquetes: seedPaquetes,
    reservaciones: seedReservaciones,
    votaciones: seedVotaciones,
    residents: seedResidents,
    staff: seedStaff,
    amenities: seedAmenities,
    buildingConfig: seedBuildingConfig,
    tickets: seedTickets,
    ticketCounter: seedTicketCounter,
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────

/** Pure reducer handling all state transitions */
function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    // Notifications
    case 'ADD_NOTIFICACION':
      return { ...state, notificaciones: [action.payload, ...state.notificaciones] }
    case 'MARK_NOTIFICACION_READ':
      return { ...state, notificaciones: state.notificaciones.map(n => n.id === action.payload ? { ...n, read: true } : n) }

    // Announcements (Avisos)
    case 'ADD_AVISO':
      return { ...state, avisos: [action.payload, ...state.avisos] }
    case 'UPDATE_AVISO':
      return { ...state, avisos: state.avisos.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_AVISO':
      return { ...state, avisos: state.avisos.filter(a => a.id !== action.payload) }

    // Payments
    case 'ADD_PAGO':
      return { ...state, pagos: [...state.pagos, action.payload] }
    case 'UPDATE_PAGO':
      return { ...state, pagos: state.pagos.map(p => p.id === action.payload.id ? action.payload : p) }

    // Packages
    case 'ADD_PAQUETE':
      return { ...state, paquetes: [action.payload, ...state.paquetes] }
    case 'UPDATE_PAQUETE':
      return { ...state, paquetes: state.paquetes.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PAQUETA':
      return { ...state, paquetes: state.paquetes.filter(p => p.id !== action.payload) }
    case 'DELETE_PAQUETES_DELIVERED':
      return { ...state, paquetes: state.paquetes.filter(p => p.status !== 'Entregado') }

    // Amenity Reservations
    case 'ADD_RESERVACION':
      return { ...state, reservaciones: [...state.reservaciones, action.payload] }
    case 'UPDATE_RESERVACION':
      return { ...state, reservaciones: state.reservaciones.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_RESERVACION':
      return { ...state, reservaciones: state.reservaciones.filter(r => r.id !== action.payload) }

    // Voting
    case 'ADD_VOTACION':
      return { ...state, votaciones: [action.payload, ...state.votaciones] }
    case 'DELETE_VOTACION':
      return { ...state, votaciones: state.votaciones.filter(v => v.id !== action.payload) }
    case 'VOTE': {
      // Enforce one vote per apartment
      const { votacionId, voter } = action.payload
      return {
        ...state,
        votaciones: state.votaciones.map(v => {
          if (v.id !== votacionId) return v
          if (v.voters.some(vot => vot.apartment === voter.apartment)) return v
          return {
            ...v,
            voters: [...v.voters, voter],
            options: v.options.map(o => o.label === voter.optionLabel ? { ...o, votes: o.votes + 1 } : o),
          }
        }),
      }
    }

    // Residents
    case 'ADD_RESIDENT':
      return { ...state, residents: [...state.residents, action.payload] }
    case 'UPDATE_RESIDENT':
      return { ...state, residents: state.residents.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_RESIDENT':
      return { ...state, residents: state.residents.filter(r => r.id !== action.payload) }

    // Staff
    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] }
    case 'DELETE_STAFF':
      return { ...state, staff: state.staff.filter(s => s.id !== action.payload) }

    // Amenities
    case 'ADD_AMENITY':
      return { ...state, amenities: [...state.amenities, action.payload] }
    case 'DELETE_AMENITY':
      return { ...state, amenities: state.amenities.filter(a => a.id !== action.payload) }

    // Building Configuration
    case 'UPDATE_BUILDING_CONFIG':
      return { ...state, buildingConfig: { ...state.buildingConfig, ...action.payload } }

    // Tickets — service request lifecycle management
    case 'ADD_TICKET':
      return {
        ...state,
        tickets: [action.payload, ...state.tickets],
        ticketCounter: Math.max(state.ticketCounter, action.payload.number),
      }
    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(t => t.id === action.payload.id ? action.payload : t),
      }
    case 'ADD_TICKET_ACTIVITY': {
      const { ticketId, activity } = action.payload
      return {
        ...state,
        tickets: state.tickets.map(t => {
          if (t.id !== ticketId) return t
          return {
            ...t,
            activities: [...t.activities, activity],
            updatedAt: activity.createdAt,
          }
        }),
      }
    }
    case 'SET_TICKET_COUNTER':
      return { ...state, ticketCounter: action.payload }

    // Auto-cleanup of expired/delivered packages
    case 'CLEANUP_EXPIRED': {
      const now = new Date(action.payload.nowIso)
      const pqs = state.paquetes.filter(p => {
        // Remove packages delivered more than 24 hours ago
        if (p.status === 'Entregado' && p.deliveredDate) {
          return (now.getTime() - new Date(p.deliveredDate).getTime()) / (1000 * 60 * 60) < 24
        }
        // Remove packages past their expiration window
        if (p.status === 'Pendiente' && p.expirationDays) {
          return (now.getTime() - new Date(p.receivedDate).getTime()) / (1000 * 60 * 60 * 24) <= p.expirationDays
        }
        return true
      })
      return { ...state, paquetes: pqs }
    }

    // Full system reset to seed data
    case 'RESET':
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('cantonalfa_settings')
      return {
        notificaciones: seedNotificaciones,
        avisos: seedAvisos,
        pagos: seedPagos,
        paquetes: seedPaquetes,
        reservaciones: seedReservaciones,
        votaciones: seedVotaciones,
        residents: seedResidents,
        staff: seedStaff,
        amenities: seedAmenities,
        buildingConfig: seedBuildingConfig,
        tickets: seedTickets,
        ticketCounter: seedTicketCounter,
      }

    default:
      return state
  }
}

// ─── Context & Provider ──────────────────────────────────────────────

const StoreContext = createContext<{
  state: StoreState
  dispatch: React.Dispatch<Action>
} | null>(null)

/**
 * StoreProvider — Wraps the app to provide centralized state.
 * Runs expired-package cleanup on mount and auto-saves to localStorage.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  // Run cleanup for expired packages on initial mount
  useEffect(() => {
    dispatch({ type: 'CLEANUP_EXPIRED', payload: { nowIso: new Date().toISOString() } })
  }, [])

  // Persist state to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

/**
 * useStore — Hook to access the centralized store.
 * Returns { state, dispatch } for reading data and dispatching actions.
 * Throws if used outside of a StoreProvider.
 */
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
