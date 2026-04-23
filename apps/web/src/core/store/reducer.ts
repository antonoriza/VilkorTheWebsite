/**
 * reducer.ts — Pure reducer function for centralized state management.
 *
 * Contains:
 *   - StoreState interface
 *   - Action union type
 *   - EMPTY_BUILDING_CONFIG + emptyState()
 *   - reducer()
 */
import { MONTH_NAMES_ES } from '../../lib/month-utils'
import { isEffectiveDebt, getMaturityTargetDate } from './maturity'
import type {
  Aviso, Pago, Paquete, Reservacion, Votacion,
  Notificacion, Resident, StaffMember, Amenity, BuildingConfig,
  Ticket, TicketActivity, Adeudo, Egreso, RecurringEgreso,
  GroupingMode, InventoryItem, UserGroup, ShiftOverride
} from '../../types'

// ═══════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════

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
  /** Building inventory items */
  inventory: InventoryItem[]
  /** Planned and reactive staff schedule overrides */
  shiftOverrides: ShiftOverride[]
  /** Data model version to handle migrations */
  version: number
}

// ═══════════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════════

/** Union of all dispatchable actions */
export type Action =
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
  | { type: 'ADD_INVENTORY'; payload: InventoryItem }
  | { type: 'UPDATE_INVENTORY'; payload: InventoryItem }
  | { type: 'DELETE_INVENTORY'; payload: string }
  | { type: 'ADD_SHIFT_OVERRIDE'; payload: ShiftOverride }
  | { type: 'REMOVE_SHIFT_OVERRIDE'; payload: string }  // id
  | { type: 'UPDATE_SHIFT_OVERRIDE'; payload: ShiftOverride }
  | { type: 'UPDATE_PERMISSIONS_MATRIX'; payload: { resource: string; action: string; groups: UserGroup[] } }
  | { type: 'HYDRATE_FROM_API'; payload: StoreState }
  | { type: 'RESET'; payload?: { groupingMode: GroupingMode } }

// ═══════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════

export const EMPTY_BUILDING_CONFIG: BuildingConfig = {
  propertyCategory: 'residencial', type: 'towers', groupingMode: 'vertical',
  towers: [], buildingName: '', buildingAddress: '', managementCompany: '',
  totalUnits: 0, adminName: '', adminEmail: '', adminPhone: '',
  conceptosPago: [], monthlyFee: 0, recurringEgresos: [],
  maturityRules: { mantenimiento: 'next_month_01', amenidad: 'day_of_event', multaOtros: 'immediate' },
  surcharge: { enabled: false, type: 'percent', amount: 0, graceDays: 0, frequency: 'monthly' },
  banking: { clabe: '', bankName: '', accountHolder: '', acceptsTransfer: false, acceptsCash: false, acceptsOxxo: false, referenceFormat: 'apartment' },
  zoning: [], topology: { containers: [], unitNomenclature: '' },
  defaultUnitDna: { privateArea: 0, totalArea: 0, ownershipCoefficient: 0, usageType: 'propietario' },
  equipment: [], vendors: [], permissionsMatrix: {},
} as any

export function emptyState(): StoreState {
  return {
    notificaciones: [], avisos: [], pagos: [], paquetes: [],
    reservaciones: [], votaciones: [], residents: [], staff: [],
    amenities: [], buildingConfig: EMPTY_BUILDING_CONFIG,
    tickets: [], ticketCounter: 0, adeudos: [], egresos: [],
    inventory: [], shiftOverrides: [], version: 1,
  }
}

// ═══════════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════════

export function reducer(state: StoreState, action: Action): StoreState {
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
    
    // Inventory
    case 'ADD_INVENTORY':
      return { ...state, inventory: [action.payload, ...(state.inventory || [])] }
    case 'UPDATE_INVENTORY':
      return { ...state, inventory: (state.inventory || []).map(i => i.id === action.payload.id ? action.payload : i) }
    case 'DELETE_INVENTORY':
      return { ...state, inventory: (state.inventory || []).filter(i => i.id !== action.payload) }

    // Shift overrides
    case 'ADD_SHIFT_OVERRIDE':
      return { ...state, shiftOverrides: [action.payload, ...(state.shiftOverrides || [])] }
    case 'UPDATE_SHIFT_OVERRIDE':
      return { ...state, shiftOverrides: (state.shiftOverrides || []).map(o => o.id === action.payload.id ? action.payload : o) }
    case 'REMOVE_SHIFT_OVERRIDE':
      return { ...state, shiftOverrides: (state.shiftOverrides || []).filter(o => o.id !== action.payload) }

    case 'UPDATE_PERMISSIONS_MATRIX': {
      const { resource, action: permAction, groups } = action.payload
      return {
        ...state,
        buildingConfig: {
          ...state.buildingConfig,
          permissionsMatrix: {
            ...state.buildingConfig.permissionsMatrix,
            [resource]: {
              ...(state.buildingConfig.permissionsMatrix[resource] || {}),
              [permAction]: groups
            }
          }
        }
      }
    }

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
      const nowDate = new Date(now)
      const rules = state.buildingConfig.maturityRules
      const surcharge = state.buildingConfig.surcharge

      // 1. Mark as 'Vencido'
      const updatedPagos = state.pagos.map(p => {
        if (p.status === 'Pendiente' && isEffectiveDebt(p, now, rules)) {
          return { ...p, status: 'Vencido' as const }
        }
        return p
      })

      // 2. Apply Surcharges if enabled
      let newRecargos: Pago[] = []
      if (surcharge && surcharge.enabled) {
        updatedPagos.forEach(p => {
          if (p.status === 'Vencido' && !p.concepto.startsWith('Recargo Moratorio')) {
            const target = getMaturityTargetDate(p, rules, now)
            if (target) {
              const graceTarget = new Date(target)
              graceTarget.setDate(graceTarget.getDate() + surcharge.graceDays)
              
              if (nowDate.getTime() >= graceTarget.getTime()) {
                const baseConcepto = p.concepto || 'Mantenimiento'
                const isMonthly = !!p.monthKey && baseConcepto === 'Mantenimiento'
                const recargoConcepto = `Recargo Moratorio — ${isMonthly ? p.month : baseConcepto}`
                
                // Only generate if it doesn't already exist for this monthKey/source
                const existing = updatedPagos.some(
                  ep => ep.apartment === p.apartment && ep.concepto === recargoConcepto && ep.monthKey === p.monthKey
                )
                
                if (!existing) {
                  const amount = surcharge.type === 'fixed' 
                    ? surcharge.amount 
                    : p.amount * (surcharge.amount / 100)
                  
                  newRecargos.push({
                    id: `pg-recargo-${p.id}-${Date.now()}`,
                    apartment: p.apartment,
                    resident: p.resident,
                    month: isMonthly ? p.month : 'Acumulado',
                    monthKey: p.monthKey || now.slice(0, 7),
                    concepto: recargoConcepto,
                    amount: Math.round(amount * 100) / 100,
                    status: 'Pendiente',
                    paymentDate: null,
                    notes: `Autogenerado por mora de ${surcharge.graceDays} días.`
                  })
                }
              }
            }
          }
        })
      }

      const finalList = newRecargos.length > 0 ? [...updatedPagos, ...newRecargos] : updatedPagos
      
      return {
        ...state,
        pagos: finalList
      }
    }

    // Auto-generate monthly pago + egreso records
    case 'GENERATE_MONTHLY_RECORDS': {
      const mk = action.payload.monthKey
      const [yearStr, monthStr] = mk.split('-')
      const monthLabel = `${MONTH_NAMES_ES[parseInt(monthStr, 10) - 1]} de ${yearStr}`
      const fee = state.buildingConfig.monthlyFee

      // 1. Generate one Mantenimiento pago per resident for this month (if missing)
      //    Skip if monthlyFee is not configured — admin must set it first
      const newPagos: Pago[] = []
      if (fee > 0) state.residents.forEach(res => {
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

    // Full system reset
    case 'RESET': {
      const newState = emptyState()
      if (action.payload?.groupingMode) {
        newState.buildingConfig.groupingMode = action.payload.groupingMode
        newState.buildingConfig.topology.containers = []
      }
      return newState
    }

    // Hydrate from API data
    case 'HYDRATE_FROM_API':
      return { ...action.payload }

    default:
      return state
  }
}
