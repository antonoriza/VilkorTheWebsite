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
  seedTickets, seedTicketCounter, seedAdeudos, seedEgresos, CURRENT_STATE_VERSION,
  type Aviso, type Pago, type Paquete, type Reservacion, type Votacion,
  type Notificacion, type Resident, type StaffMember, type Amenity, type BuildingConfig,
  type Ticket, type TicketActivity, type Adeudo, type Egreso, type RecurringEgreso
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
  /** Administrative records: fines, warnings, and debts */
  adeudos: Adeudo[]
  /** Operational expenses for the building */
  egresos: Egreso[]
  /** Data model version to handle migrations */
  version: number
}

// ─── Action Types ────────────────────────────────────────────────────

/** Union of all dispatchable actions */
type Action =
  | { type: 'ADD_NOTIFICACION'; payload: Notificacion }
  | { type: 'MARK_NOTIFICACION_READ'; payload: string }
  | { type: 'ADD_AVISO'; payload: Aviso }
  | { type: 'UPDATE_AVISO'; payload: Aviso }
  | { type: 'DELETE_AVISO'; payload: string }
  | { type: 'TOGGLE_PIN_AVISO'; payload: string }
  | { type: 'TRACK_AVISO'; payload: { avisoId: string, apartment: string, resident: string, type: 'view' | 'confirm', timestamp: string } }
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
  | { type: 'UPDATE_STAFF'; payload: StaffMember }
  | { type: 'DELETE_STAFF'; payload: string }
  | { type: 'ADD_AMENITY'; payload: Amenity }
  | { type: 'DELETE_AMENITY'; payload: string }
  | { type: 'UPDATE_BUILDING_CONFIG'; payload: Partial<BuildingConfig> }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'UPDATE_TICKET'; payload: Ticket }
  | { type: 'ADD_TICKET_ACTIVITY'; payload: { ticketId: string; activity: TicketActivity } }
  | { type: 'SET_TICKET_COUNTER'; payload: number }
  | { type: 'ADD_ADEUDO'; payload: Adeudo }
  | { type: 'UPDATE_ADEUDO'; payload: Adeudo }
  | { type: 'DELETE_ADEUDO'; payload: string }
  | { type: 'ADD_EGRESO'; payload: Egreso }
  | { type: 'UPDATE_EGRESO'; payload: Egreso }
  | { type: 'DELETE_EGRESO'; payload: string }
  | { type: 'GENERATE_MONTHLY_RECORDS'; payload: { monthKey: string } }
  | { type: 'CLEANUP_EXPIRED'; payload: { nowIso: string } }
  | { type: 'PROCESS_MATURITY'; payload: { nowIso: string } }
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

// ─── Maturity Helper ────────────────────────────────────────────────

/**
 * Determines if a financial charge (Pago) should be treated as an effective debt
 * (Adeudo) based on its category and current date.
 * 
 * Rules:
 * - Multas / Otros: Immediately effective.
 * - Reserva Amenidad: Effective on the day of the event (00:00).
 * - Mantenimiento: Effective on the first day of the FOLLOWING month.
 */
export function isEffectiveDebt(p: Pago, nowIso: string, rules: FinancialMaturityRules): boolean {
  if (p.status === 'Pagado') return false
  if (p.status === 'Vencido') return true
  
  const now = new Date(nowIso)
  // Split by ':' or '—' and trim to get the core category
  const baseConcepto = (p.concepto || '').split(/[:—]/)[0].trim()

  // 1. Mantenimiento
  if (baseConcepto === 'Mantenimiento') {
    if (!p.monthKey) return true
    const [y, m] = p.monthKey.split('-').map(Number)
    
    let maturityTarget: Date
    if (rules.mantenimiento === 'next_month_10') {
      maturityTarget = new Date(y, m, 10) // Month 'm' is already index for next month in JS (0-indexed)
    } else if (rules.mantenimiento === 'next_month_01') {
      maturityTarget = new Date(y, m, 1)
    } else if (rules.mantenimiento === 'current_month_end') {
      // Last day of current month
      maturityTarget = new Date(y, m, 0)
    } else {
      return true // Unknown rule
    }
    
    return now.getTime() >= maturityTarget.getTime()
  }

  // 2. Reserva Amenidad
  if (baseConcepto === 'Reserva Amenidad') {
    if (rules.amenidad === 'immediate') return true
    if (!p.monthKey) return true
    
    // If we have YYYY-MM-DD
    const parts = p.monthKey.split('-').map(Number)
    let eventDate: Date
    
    if (parts.length === 3) {
      // YYYY-MM-DD
      const [y, m, d] = parts
      eventDate = new Date(y, m - 1, d)
    } else if (parts.length === 2) {
      // YYYY-MM (Fallback to end of month for grace)
      const [y, m] = parts
      eventDate = new Date(y, m, 0) // Last day of that month
    } else {
      return true
    }
    
    if (rules.amenidad === '1_day_before') {
      eventDate.setDate(eventDate.getDate() - 1)
    }
    
    return now.getTime() >= eventDate.getTime()
  }

  // 3. Multas & Otros
  if (baseConcepto === 'Multa' || baseConcepto === 'Otros') {
    if (rules.multaOtros === '7_days_grace') {
      // If we don't have createdAt, we assume it belongs to the current month's start
      const [y, m] = (p.monthKey || nowIso.slice(0, 7)).split('-').map(Number)
      const graceEnd = new Date(y, m - 1, 7) // 7th day of the month
      return now.getTime() >= graceEnd.getTime()
    }
    return true // immediate or unknown rule
  }

  // 4. Default Catch-all: No rule = Immediate Debt
  return true
}

/**
 * Returns a fresh copy of the application state from seed data.
 * Used for initial loads when storage is empty and for system resets.
 */
function getSeedState(): StoreState {
  return {
    notificaciones: [...seedNotificaciones],
    avisos: [...seedAvisos],
    pagos: [...seedPagos],
    paquetes: [...seedPaquetes],
    reservaciones: [...seedReservaciones],
    votaciones: [...seedVotaciones],
    residents: [...seedResidents],
    staff: [...seedStaff],
    amenities: [...seedAmenities],
    buildingConfig: { ...seedBuildingConfig },
    tickets: [...seedTickets],
    ticketCounter: seedTicketCounter,
    adeudos: [...seedAdeudos],
    egresos: [...seedEgresos],
    version: CURRENT_STATE_VERSION,
  }
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
      const parsed = JSON.parse(raw) as StoreState
      const version = parsed.version || 1
      // ── MIGRATION V1 -> V2 ──
      // Fixes Mensualidad -> Mantenimiento and removes legacy concept leaks
      if (version < CURRENT_STATE_VERSION) {
        // 1. Force cleanup of conceptosPago
        if (parsed.buildingConfig) {
          const FORBIDDEN = ['Mensualidad', 'Extraordinario', 'Mascota sin registro']
          parsed.buildingConfig.conceptosPago = (parsed.buildingConfig.conceptosPago || [])
            .filter((c: string) => !FORBIDDEN.includes(c))
          
          if (!parsed.buildingConfig.conceptosPago.includes('Mantenimiento')) {
            parsed.buildingConfig.conceptosPago.unshift('Mantenimiento')
          }
          
          // Sync sub-concepts with current authorized set
          parsed.buildingConfig.subConceptos = seedBuildingConfig.subConceptos
        }

        // 2. Rename legacy concepts in pagos history
        if (parsed.pagos) {
          parsed.pagos = parsed.pagos.map((p: any) => {
            if (p.concepto === 'Mensualidad' || p.concepto === 'Extraordinario') {
                return { ...p, concepto: 'Mantenimiento' }
            }
            return p
          })
        }

        // 3. MIGRATION V2 -> V3: Add maturity rules if missing
        if (version < 3) {
          if (parsed.buildingConfig && !parsed.buildingConfig.maturityRules) {
            parsed.buildingConfig.maturityRules = seedBuildingConfig.maturityRules
          }
        }

        // 4. MIGRATION V3 -> V4: Wipe financial data to clear duplicates
        if (version < 4) {
          parsed.pagos = [...seedPagos]
          parsed.adeudos = [...seedAdeudos]
          parsed.egresos = [...seedEgresos]
        }

        parsed.version = CURRENT_STATE_VERSION
      }

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

      // Migrate pagos: backfill monthKey for records that predate this field
      const MONTH_ES: Record<string, string> = {
        enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
        julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
      }
      if (parsed.pagos) {
        parsed.pagos = parsed.pagos.map((p: any) => {
          // Backfill monthKey
          if (!p.monthKey) {
            const m = (p.month || '').toLowerCase().match(/(\w+)\s+de\s+(\d{4})/)
            p.monthKey = m ? `${m[2]}-${MONTH_ES[m[1]] || '00'}` : ''
          }
          // Backfill concepto
          if (!p.concepto || p.concepto === 'Mensualidad') p.concepto = 'Mantenimiento'
          // Backfill adeudoId (new field)
          if (!('adeudoId' in p)) p.adeudoId = undefined
          return p
        })
      }

      // Migrate buildingConfig: ensure conceptosPago exists
      if (!parsed.buildingConfig.conceptosPago) {
        parsed.buildingConfig.conceptosPago = ['Mantenimiento', 'Multa', 'Otros', 'Reserva Amenidad']
      } else {
        // Stop purging 'Multa' and stop forcing legacy 'Mensualidad'
        if (!parsed.buildingConfig.conceptosPago.includes('Mantenimiento')) {
          parsed.buildingConfig.conceptosPago.unshift('Mantenimiento')
        }
      }

      // Migrate: add adeudos slice if missing
      if (!parsed.adeudos) {
        parsed.adeudos = seedAdeudos
      } else {
        // Backfill pagoId (new field)
        parsed.adeudos = parsed.adeudos.map((a: any) => {
          if (!('pagoId' in a)) a.pagoId = undefined
          return a
        })
      }

      // Migrate: add egresos slice if missing
      if (!parsed.egresos) parsed.egresos = seedEgresos

      // Migrate buildingConfig: ensure categoriasEgreso exists
      if (!parsed.buildingConfig.categoriasEgreso) {
        parsed.buildingConfig.categoriasEgreso = ['nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros']
      }

      // Migrate buildingConfig: ensure monthlyFee and recurringEgresos exist
      if (parsed.buildingConfig.monthlyFee == null) {
        parsed.buildingConfig.monthlyFee = seedBuildingConfig.monthlyFee
      }
      if (!parsed.buildingConfig.recurringEgresos) {
        parsed.buildingConfig.recurringEgresos = seedBuildingConfig.recurringEgresos
      }

      // Migrate egresos: backfill status field (default to 'Pagado' for existing records)
      if (parsed.egresos) {
        parsed.egresos = parsed.egresos.map((e: any) => {
          if (!e.status) e.status = 'Pagado'
          return e
        })
      }

      return parsed

    }
  } catch { /* fall through to seed data on any error */ }

  // No stored state found — return fresh seed data
  return getSeedState()
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
    case 'TOGGLE_PIN_AVISO':
      return {
        ...state,
        avisos: state.avisos.map(a =>
          a.id === action.payload ? { ...a, pinned: !a.pinned } : a
        )
      }
    case 'TRACK_AVISO':
      return {
        ...state,
        avisos: state.avisos.map(a => {
          if (a.id === action.payload.avisoId) {
            const current = (a.tracking || [])
            // check if this identical event (same resident, same type) already exists
            if (current.some(t => t.resident === action.payload.resident && t.type === action.payload.type)) {
              return a 
            }
            return {
              ...a,
              tracking: [
                ...current,
                {
                  type: action.payload.type,
                  apartment: action.payload.apartment,
                  resident: action.payload.resident,
                  timestamp: action.payload.timestamp
                }
              ]
            }
          }
          return a
        })
      }

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
    case 'UPDATE_STAFF':
      return { ...state, staff: state.staff.map(s => s.id === action.payload.id ? action.payload : s) }
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

    // Adeudos (Fines / Warnings / Debts)
    case 'ADD_ADEUDO':
      return { ...state, adeudos: [action.payload, ...state.adeudos] }
    case 'UPDATE_ADEUDO':
      return { ...state, adeudos: state.adeudos.map(a => a.id === action.payload.id ? action.payload : a) }
    case 'DELETE_ADEUDO':
      return { ...state, adeudos: state.adeudos.filter(a => a.id !== action.payload) }

    // Egresos (Operational Expenses)
    case 'ADD_EGRESO':
      return { ...state, egresos: [action.payload, ...state.egresos] }
    case 'UPDATE_EGRESO':
      return { ...state, egresos: state.egresos.map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DELETE_EGRESO':
      return { ...state, egresos: state.egresos.filter(e => e.id !== action.payload) }

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

    case 'PROCESS_MATURITY': {
      const now = action.payload.nowIso
      return {
        ...state,
        pagos: state.pagos.map(p => {
          if (p.status === 'Pendiente' && isEffectiveDebt(p, now, state.buildingConfig.maturityRules)) {
            return { ...p, status: 'Vencido' }
          }
          return p
        })
      }
    }

    // Auto-generate monthly pago + egreso records
    case 'GENERATE_MONTHLY_RECORDS': {
      const mk = action.payload.monthKey
      const MONTH_NAMES_ES = [
        'enero','febrero','marzo','abril','mayo','junio',
        'julio','agosto','septiembre','octubre','noviembre','diciembre',
      ]
      const [yearStr, monthStr] = mk.split('-')
      const monthLabel = `${MONTH_NAMES_ES[parseInt(monthStr, 10) - 1]} de ${yearStr}`
      const fee = state.buildingConfig.monthlyFee || 1700

      // 1. Generate one Mantenimiento pago per resident for this month (if missing)
      const newPagos: Pago[] = []
      state.residents.forEach(res => {
        const exists = state.pagos.some(
          p => p.apartment === res.apartment && (p.monthKey || '') === mk && (p.concepto || 'Mantenimiento') === 'Mantenimiento'
        )
        if (!exists) {
          newPagos.push({
            id: `pg-auto-${res.apartment}-${mk}`,
            apartment: res.apartment,
            resident: res.name,
            month: monthLabel,
            monthKey: mk,
            concepto: 'Mantenimiento',
            amount: fee,
            status: 'Pendiente',
            paymentDate: null,
          })
        }
      })

      // 2. Generate one egreso per recurring expense for this month (if missing)
      const newEgresos: Egreso[] = []
      const recurring = state.buildingConfig.recurringEgresos || []
      recurring.forEach((re: RecurringEgreso) => {
        const exists = state.egresos.some(
          e => e.monthKey === mk && e.concepto === re.concepto
        )
        if (!exists) {
          newEgresos.push({
            id: `eg-auto-${re.id}-${mk}`,
            categoria: re.categoria,
            concepto: re.concepto,
            description: re.description,
            amount: re.amount,
            monthKey: mk,
            date: `${mk}-01`,
            registeredBy: state.buildingConfig.adminName,
            status: 'Pendiente',
          })
        }
      })

      if (newPagos.length === 0 && newEgresos.length === 0) return state
      return {
        ...state,
        pagos: [...state.pagos, ...newPagos],
        egresos: [...state.egresos, ...newEgresos],
      }
    }

    // Full system reset to seed data
    case 'RESET':
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('cantonalfa_settings')
      return getSeedState()

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
    // Auto-generate monthly pago + egreso records for current month
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    dispatch({ type: 'GENERATE_MONTHLY_RECORDS', payload: { monthKey } })
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
