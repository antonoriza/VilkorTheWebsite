/**
 * Seed Data — Type definitions and initial demo data.
 *
 * This file serves two purposes:
 *   1. Defines all TypeScript interfaces used across the app
 *   2. Provides initial seed data for a fresh application state
 *
 * To reset the app to these values, use the "Restablecer Sistema"
 * button in the admin Configuration page.
 */

// ─── Notification ────────────────────────────────────────────────────

/** A notification sent to a specific user (admin or resident) */
export interface Notificacion {
  id: string
  /** Target user ID — "admin" for admin, or a resident name */
  userId: string
  title: string
  message: string
  /** ISO date string (YYYY-MM-DD) */
  date: string
  read: boolean
  /** Optional deep-link path (e.g. "/amenidades") for click navigation */
  actionLink?: string
}

// ─── Announcement ────────────────────────────────────────────────────

/** A community announcement posted by the admin */
export interface Aviso {
  id: string
  title: string
  /** Optional rich text description */
  description?: string
  /** File name of the attached document */
  attachment: string
  /** Optional: ISO date when the announcement becomes visible */
  startDate?: string
  /** Optional: ISO date when the announcement expires */
  endDate?: string | null
  /** ISO date when the announcement was created */
  date: string
}

// ─── Payment ─────────────────────────────────────────────────────────

/** A monthly condo fee payment record */
export interface Pago {
  id: string
  /** Apartment identifier (e.g. "A101") */
  apartment: string
  /** Name of the responsible resident */
  resident: string
  /** Human-readable month (e.g. "abril de 2026") */
  month: string
  /** Payment amount in MXN */
  amount: number
  status: 'Pagado' | 'Pendiente'
  /** ISO date of payment, null if unpaid */
  paymentDate: string | null
}

// ─── Package ─────────────────────────────────────────────────────────

/** A package received at the building for a resident */
export interface Paquete {
  id: string
  /** Name of the package recipient */
  recipient: string
  apartment: string
  /** ISO date when the package was received */
  receivedDate: string
  /** Optional: auto-expire after N days */
  expirationDays?: number
  /** ISO date when it was handed to the resident */
  deliveredDate?: string | null
  status: 'Entregado' | 'Pendiente'
  /** Physical location (e.g. "Caseta", "Lobby") */
  location: string
}

// ─── Amenity Reservation ─────────────────────────────────────────────

/** A reservation for a shared amenity (grill, pool, etc.) */
export interface Reservacion {
  id: string
  /** ISO date of the reservation */
  date: string
  /** Name of the amenity + time slot */
  grill: string
  resident: string
  apartment: string
  status: 'Reservado' | 'Por confirmar' | 'Cancelado'
}

// ─── Voting ──────────────────────────────────────────────────────────

/** A single option within a community vote */
export interface VoteOption {
  label: string
  votes: number
  color?: string
  emoji?: string
}

/** A record of a resident's vote */
export interface Voter {
  name: string
  apartment: string
  /** Which option they selected */
  optionLabel: string
  /** ISO timestamp of when they voted */
  votedAt: string
}

/** A community governance poll */
export interface Votacion {
  id: string
  title: string
  description: string
  /** ISO date — voting opens */
  periodStart: string
  /** ISO date — voting closes */
  periodEnd: string
  status: 'Activa' | 'Cerrada'
  options: VoteOption[]
  /** Audit trail: who voted and when */
  voters: Voter[]
}

// ─── Resident ────────────────────────────────────────────────────────

/** A registered resident in the building */
export interface Resident {
  id: string
  name: string
  /** Apartment identifier (e.g. "A101") */
  apartment: string
  /** Tower/section identifier (e.g. "A", "B") */
  tower: string
  email: string
}

// ─── Staff ───────────────────────────────────────────────────────────

/** Allowed staff role categories */
export type StaffRole = 'Jardinero' | 'Limpieza' | 'Guardia'

/** A building staff member */
export interface StaffMember {
  id: string
  name: string
  role: StaffRole
  /** Shift start time (HH:mm) */
  shiftStart: string
  /** Shift end time (HH:mm) */
  shiftEnd: string
}

// ─── Amenity ─────────────────────────────────────────────────────────

/** A bookable shared amenity */
export interface Amenity {
  id: string
  name: string
}

// ─── Building Configuration ──────────────────────────────────────────

/** Global building settings managed by the admin */
export interface BuildingConfig {
  /** Property type: "towers" for high-rise, "houses" for low-rise */
  type: 'towers' | 'houses'
  /** List of tower/section identifiers (e.g. ["A", "B"]) */
  towers: string[]
  buildingName: string
  buildingAddress: string
  managementCompany: string
  /** Total number of residential units */
  totalUnits: number
  adminName: string
  adminEmail: string
  adminPhone: string
}

// ═══════════════════════════════════════════════════════════════════════
// SEED DATA — Initial state for a fresh installation
// ═══════════════════════════════════════════════════════════════════════

export const seedBuildingConfig: BuildingConfig = {
  type: 'towers',
  towers: ['A', 'B'],
  buildingName: 'Lote Alemania',
  buildingAddress: 'Cosmopol HU Lifestyle, CDMX',
  managementCompany: 'Canton Alfa Inc.',
  totalUnits: 126,
  adminName: 'Administrador General',
  adminEmail: 'admin@property.com',
  adminPhone: '+52 55 1234 5678',
}

export const seedAmenities: Amenity[] = [
  { id: 'amen-1', name: 'Asador 1' },
  { id: 'amen-2', name: 'Asador 2' },
  { id: 'amen-3', name: 'Asador 3' },
]

export const seedResidents: Resident[] = [
  { id: 'res-1', name: 'Sofía Torres', apartment: 'A101', tower: 'A', email: 'sofia@property.com' },
  { id: 'res-2', name: 'Luis Díaz', apartment: 'A102', tower: 'A', email: 'luis@property.com' },
  { id: 'res-3', name: 'Luis Martínez', apartment: 'A103', tower: 'A', email: 'martinez@property.com' },
  { id: 'res-4', name: 'Pedro Sánchez', apartment: 'A104', tower: 'A', email: 'pedro@property.com' },
  { id: 'res-5', name: 'Ana López', apartment: 'A201', tower: 'A', email: 'ana@property.com' },
  { id: 'res-6', name: 'María Ramírez', apartment: 'A202', tower: 'A', email: 'maria@property.com' },
  { id: 'res-7', name: 'Carlos Gómez', apartment: 'A203', tower: 'A', email: 'carlos@property.com' },
  { id: 'res-8', name: 'Juan Pérez', apartment: 'A204', tower: 'A', email: 'juan@property.com' },
  { id: 'res-9', name: 'Laura Ramírez', apartment: 'B101', tower: 'B', email: 'laura@property.com' },
  { id: 'res-10', name: 'Roberto Mendez', apartment: 'B102', tower: 'B', email: 'roberto@property.com' },
  { id: 'res-11', name: 'María López', apartment: 'B203', tower: 'B', email: 'mlopez@property.com' },
  { id: 'res-12', name: 'Gabriela Sánchez', apartment: 'B204', tower: 'B', email: 'gabriela@property.com' },
]

export const seedNotificaciones: Notificacion[] = []

export const seedStaff: StaffMember[] = [
  { id: 'staff-1', name: 'Carlos Mendoza', role: 'Guardia', shiftStart: '07:00', shiftEnd: '19:00' },
  { id: 'staff-2', name: 'Juan Pérez', role: 'Jardinero', shiftStart: '08:00', shiftEnd: '17:00' },
  { id: 'staff-3', name: 'María López', role: 'Limpieza', shiftStart: '06:00', shiftEnd: '14:00' },
]

export const seedAvisos: Aviso[] = [
  { id: 'av-1', title: 'Mantenimiento de elevadores', attachment: 'mantenimiento.pdf', date: '2025-04-15' },
  { id: 'av-2', title: 'Cambio de administración', attachment: 'cambio-admin.pdf', date: '2025-04-10' },
  { id: 'av-3', title: 'Estado de cuenta mensual - Abril', attachment: 'estado-cuenta-abril.pdf', date: '2025-04-05' },
  { id: 'av-4', title: 'Corte de Agua - Torre B', attachment: 'corte-agua.pdf', date: '2025-04-01' },
  { id: 'av-5', title: 'Nueva Normativa Basura', attachment: 'normativa-basura.pdf', date: '2025-03-28' },
]

export const seedPagos: Pago[] = [
  { id: 'pg-1', apartment: 'A101', resident: 'Sofía Torres', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-13' },
  { id: 'pg-2', apartment: 'A102', resident: 'Luis Díaz', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-20' },
  { id: 'pg-3', apartment: 'A103', resident: 'Luis Martínez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-11' },
  { id: 'pg-4', apartment: 'A104', resident: 'Pedro Sánchez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-02' },
  { id: 'pg-5', apartment: 'A201', resident: 'Ana López', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-6', apartment: 'A202', resident: 'María Ramírez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-12' },
  { id: 'pg-7', apartment: 'A203', resident: 'Carlos Gómez', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-8', apartment: 'A204', resident: 'Juan Pérez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-08' },
  { id: 'pg-9', apartment: 'B101', resident: 'Laura Ramírez', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-10', apartment: 'B102', resident: 'Roberto Mendez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-15' },
  { id: 'pg-11', apartment: 'B203', resident: 'María López', month: 'abril de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-12', apartment: 'B204', resident: 'Gabriela Sánchez', month: 'abril de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-04-09' },
  { id: 'pg-13', apartment: 'A101', resident: 'Sofía Torres', month: 'marzo de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-03-10' },
  { id: 'pg-14', apartment: 'A201', resident: 'Ana López', month: 'marzo de 2026', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-15', apartment: 'B101', resident: 'Laura Ramírez', month: 'marzo de 2026', amount: 1700, status: 'Pagado', paymentDate: '2026-03-15' },
]

export const seedPaquetes: Paquete[] = [
  { id: 'pq-1', recipient: 'Luis Martínez', apartment: 'A101', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-2', recipient: 'Carlos Díaz', apartment: 'A102', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-3', recipient: 'Pedro Pérez', apartment: 'A103', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-4', recipient: 'Gabriela Sánchez', apartment: 'A104', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-5', recipient: 'Laura Ramírez', apartment: 'A201', receivedDate: '2026-04-11', status: 'Entregado', location: 'N/A' },
  { id: 'pq-6', recipient: 'Ana López', apartment: 'A201', receivedDate: '2026-04-12', status: 'Pendiente', location: 'Caseta' },
  { id: 'pq-7', recipient: 'Roberto Mendez', apartment: 'B102', receivedDate: '2026-04-12', status: 'Pendiente', location: 'Caseta' },
  { id: 'pq-8', recipient: 'Juan Antonio', apartment: 'A201', receivedDate: '2026-04-13', status: 'Pendiente', location: 'Lobby' },
]

export const seedReservaciones: Reservacion[] = [
  { id: 'rsv-1', date: '2025-04-20', grill: 'Asador 1', resident: 'Juan Pérez', apartment: 'A101', status: 'Reservado' },
  { id: 'rsv-2', date: '2025-04-21', grill: 'Asador 1', resident: 'María López', apartment: 'B203', status: 'Reservado' },
  { id: 'rsv-3', date: '2025-04-22', grill: 'Asador 1', resident: 'Carlos Gómez', apartment: 'A101', status: 'Por confirmar' },
  { id: 'rsv-4', date: '2025-04-23', grill: 'Asador 2', resident: 'Ana López', apartment: 'A201', status: 'Reservado' },
  { id: 'rsv-5', date: '2025-04-25', grill: 'Asador 3', resident: 'Juan Antonio', apartment: 'A201', status: 'Reservado' },
]

export const seedVotaciones: Votacion[] = [
  {
    id: 'vot-1',
    title: 'Convivio X',
    description: 'Votación para definir la fecha del próximo convivio',
    periodStart: '2025-04-20',
    periodEnd: '2025-05-20',
    status: 'Activa',
    options: [
      { label: 'Sábado 10 de mayo', votes: 18 },
      { label: 'Domingo 11 de mayo', votes: 7 },
      { label: 'Sábado 17 de mayo', votes: 25 },
    ],
    voters: [],
  },
  {
    id: 'vot-2',
    title: 'Pintura de áreas comunes',
    description: 'Selección de color para pintar las áreas comunes del condominio',
    periodStart: '2025-04-15',
    periodEnd: '2025-05-15',
    status: 'Activa',
    options: [
      { label: 'Azul claro', votes: 12 },
      { label: 'Beige', votes: 8 },
      { label: 'Blanco', votes: 15 },
    ],
    voters: [],
  },
]
