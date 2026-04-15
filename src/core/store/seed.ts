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

/** Event tracking for communications (Universal Data Models - Event-Party linkage) */
export interface AvisoTrackingEvent {
  /** Nature of the tracking: passive view or intentional confirm */
  type: 'view' | 'confirm'
  /** Identifier of the interacting party (e.g. "A101") */
  apartment: string
  /** Human reference to the resident name */
  resident: string
  /** ISO Date of the tracking */
  timestamp: string
}

/** A community announcement or communication event posted by the admin */
export interface Aviso {
  id: string
  title: string
  /** Event Category classification */
  category: 'general' | 'asamblea'
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
  /** Event start time (HH:mm) — required for asamblea */
  startTime?: string
  /** Event end time (HH:mm) — required for asamblea */
  endTime?: string
  /** Base64 string of the uploaded file */
  attachmentData?: string
  /** Type of attachment to help rendering */
  attachmentType?: 'image' | 'pdf'
  /** Whether this announcement is pinned to the top of the list */
  pinned?: boolean
  /** Audit log of recipients who have formally interacted with this communication event */
  tracking?: AvisoTrackingEvent[]
}

// ─── Payment ─────────────────────────────────────────────────────────

/** A charge/payment record in the billing ledger for a residential unit */
export interface Pago {
  id: string
  /** Apartment identifier (e.g. "A101") */
  apartment: string
  /** Name of the responsible resident */
  resident: string
  /** Human-readable month (e.g. "abril de 2026") */
  month: string
  /** ISO YYYY-MM used for reliable ordering and filtering */
  monthKey: string
  /** Billing concept — admin-defined, non-disciplinary (e.g. "Mensualidad", "Extraordinario") */
  concepto: string
  /** Amount in MXN */
  amount: number
  status: 'Pagado' | 'Pendiente'
  /** ISO date of payment, null if unpaid */
  paymentDate: string | null
  /** If this pago was auto-generated from an Adeudo, stores the source adeudo id */
  adeudoId?: string
  /** Base64 data URL of the uploaded receipt (image or PDF) */
  receiptData?: string
  /** MIME category for rendering the receipt */
  receiptType?: 'image' | 'pdf'
  /** Original filename of the receipt */
  receiptName?: string
  /** Admin/system notes (e.g. advance payment annotations) */
  notes?: string
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
  /** Base64 image data URL */
  photo?: string
  /** Active working days, e.g., ['L', 'M', 'Mi', 'J', 'V'] */
  workDays?: string[]
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
  /** Admin-managed list of payment concepts (e.g. Mensualidad, Extraordinario) */
  conceptosPago: string[]
  /** Admin-managed sub-items per concept (e.g. Extraordinario → ['Cuota pintura', 'Reparación elevador']) */
  subConceptos?: Record<string, string[]>
  /** Admin-managed list of expense categories */
  categoriasEgreso?: EgresoCategoria[]
}

// ─── Ticket ──────────────────────────────────────────────────────────

/** Allowed service categories for tickets */
export type TicketCategory = 'Plomería' | 'Electricidad' | 'Áreas Comunes' | 'Seguridad' | 'Limpieza' | 'Otro'

/** Priority levels affecting visual urgency indicators */
export type TicketPriority = 'Alta' | 'Media' | 'Baja'

/**
 * Lifecycle states — ordered progression.
 * Valid transitions:
 *   Nuevo → Asignado → En Proceso → Resuelto → Cerrado
 *   Any state → Cerrado (admin can close at any time)
 */
export type TicketStatus = 'Nuevo' | 'Asignado' | 'En Proceso' | 'Resuelto' | 'Cerrado'

/** A single timestamped entry in the ticket's activity log */
export interface TicketActivity {
  id: string
  /** Who posted this note — "Sistema", admin name, or resident name */
  author: string
  /**
   * Visibility scope:
   *   - "internal" — admin-only work notes (not visible to residents)
   *   - "public"   — visible to both admin and resident
   */
  visibility: 'internal' | 'public'
  message: string
  /** ISO timestamp when this entry was created */
  createdAt: string
}

/** A service request / incident ticket submitted by a resident */
export interface Ticket {
  id: string
  /** Auto-incrementing display number for human reference (e.g. "#2941") */
  number: number
  subject: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  /** Name of the resident who created the ticket */
  createdBy: string
  /** Apartment of the creator (e.g. "A101") */
  apartment: string
  /** Optional location within the building (e.g. "Lobby", "Estacionamiento P2") */
  location?: string
  /** ISO timestamp when ticket was created */
  createdAt: string
  /** ISO timestamp of last status change or activity */
  updatedAt: string
  /** ISO timestamp when ticket was resolved (null if still open) */
  resolvedAt: string | null
  /** Chronological activity log — work notes and public responses */
  activities: TicketActivity[]
}

// ─── Adeudo (Debt / Fine / Warning) ──────────────────────────────────

/** Type of administrative record against a unit */
export type AdeudoType = 'multa' | 'llamado_atencion' | 'adeudo'

/** An administrative record: fine, formal warning, or collected overdue debt */
export interface Adeudo {
  id: string
  /** Target unit/apartment (e.g. "A101") */
  apartment: string
  /** Classification */
  type: AdeudoType
  /** Free-text description of the reason (e.g. "Mensualidad atrasada Mar-2025", "Daños en elevador") */
  concepto: string
  /** Admin notes / detailed reason for this record */
  description: string
  /** Amount in MXN (0 for llamado_atencion) */
  amount: number
  status: 'Activo' | 'Pagado' | 'Anulado'
  /** ISO timestamp when this record was created */
  createdAt: string
  /** ISO timestamp when resolved, null if still active */
  resolvedAt: string | null
  /** Name of the admin who resolved it */
  resolvedBy: string | null
  /** If a billing charge was generated from this adeudo, stores the linked Pago id */
  pagoId?: string
}

// ─── Egreso (Operational Expense) ────────────────────────────────────

/** Category of operational expense */
export type EgresoCategoria =
  | 'nomina'
  | 'mantenimiento'
  | 'servicios'
  | 'equipo'
  | 'seguros'
  | 'administracion'
  | 'otros'

export const EGRESO_CATEGORIA_LABELS: Record<EgresoCategoria, string> = {
  nomina: 'Nómina / Personal',
  mantenimiento: 'Mantenimiento',
  servicios: 'Servicios (Agua, Luz, Gas)',
  equipo: 'Equipo y Suministros',
  seguros: 'Seguros',
  administracion: 'Administración',
  otros: 'Otros Egresos',
}

/** An operational expense record for the building */
export interface Egreso {
  id: string
  /** Expense category */
  categoria: EgresoCategoria
  /** Short description (e.g. "Pago mensual jardinero") */
  concepto: string
  /** Detailed notes */
  description?: string
  /** Amount in MXN */
  amount: number
  /** ISO YYYY-MM period this expense belongs to */
  monthKey: string
  /** ISO date of the expense */
  date: string
  /** Admin who recorded this expense */
  registeredBy: string
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
  conceptosPago: ['Mensualidad', 'Extraordinario', 'Multa', 'Adeudo', 'Reserva Amenidad'],
  subConceptos: {
    'Extraordinario': ['Cuota pintura fachada', 'Reparación elevador', 'Impermeabilización'],
    'Multa': ['Ruido excesivo', 'Uso indebido de cajón', 'Mascota sin registro', 'Basura fuera de horario'],
  },
  categoriasEgreso: ['nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros'],
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
  { id: 'staff-1', name: 'Carlos Mendoza', role: 'Guardia', shiftStart: '07:00', shiftEnd: '19:00', workDays: ['L', 'M', 'Mi', 'J', 'V', 'S'], photo: '' },
  { id: 'staff-2', name: 'Juan Pérez', role: 'Jardinero', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L', 'Mi', 'V'], photo: '' },
  { id: 'staff-3', name: 'María López', role: 'Limpieza', shiftStart: '06:00', shiftEnd: '14:00', workDays: ['L', 'M', 'Mi', 'J', 'V'], photo: '' },
]

export const seedAvisos: Aviso[] = [
  { id: 'av-1', category: 'general', title: 'Mantenimiento de elevadores', attachment: 'mantenimiento.pdf', date: '2025-04-15' },
  { id: 'av-2', category: 'general', title: 'Cambio de administración', attachment: 'cambio-admin.pdf', date: '2025-04-10' },
  { 
    id: 'av-3', 
    category: 'asamblea', 
    pinned: true,
    title: 'Asamblea Ordinaria General', 
    description: 'Convocatoria formal para la próxima Asamblea Ordinaria donde se discutirán presupuestos, estado de áreas comunes y elección de comité de vigilancia. Favor de confirmar su asistencia para contemplar el quórum reglamentario.', 
    attachment: 'Convocatoria_Asamblea_2025.pdf', 
    date: '2025-04-12',
    startDate: '2025-04-20',
    endDate: '2027-12-31',
    startTime: '18:00',
    endTime: '20:00',
    tracking: [
      { type: 'view', apartment: 'A101', resident: 'Sofía Torres', timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
      { type: 'confirm', apartment: 'A101', resident: 'Sofía Torres', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
      { type: 'view', apartment: 'A101', resident: 'Carlos Torres', timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() },
      { type: 'view', apartment: 'B102', resident: 'Roberto Mendez', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { type: 'confirm', apartment: 'B102', resident: 'Roberto Mendez', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
    ]
  },
  { id: 'av-4', category: 'general', title: 'Corte de Agua - Torre B', attachment: 'corte-agua.pdf', date: '2025-04-01' },
  { id: 'av-5', category: 'general', title: 'Nueva Normativa Basura', attachment: 'normativa-basura.pdf', date: '2025-03-28' },
]

export const seedPagos: Pago[] = [
  { id: 'pg-1',  apartment: 'A101', resident: 'Sofía Torres',     month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-13' },
  { id: 'pg-2',  apartment: 'A102', resident: 'Luis Díaz',        month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-20' },
  { id: 'pg-3',  apartment: 'A103', resident: 'Luis Martínez',    month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-11' },
  { id: 'pg-4',  apartment: 'A104', resident: 'Pedro Sánchez',    month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-02' },
  { id: 'pg-5',  apartment: 'A201', resident: 'Ana López',        month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-6',  apartment: 'A202', resident: 'María Ramírez',    month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-12' },
  { id: 'pg-7',  apartment: 'A203', resident: 'Carlos Gómez',     month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-8',  apartment: 'A204', resident: 'Juan Pérez',       month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-08' },
  { id: 'pg-9',  apartment: 'B101', resident: 'Laura Ramírez',    month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-10', apartment: 'B102', resident: 'Roberto Mendez',   month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-15' },
  { id: 'pg-11', apartment: 'B203', resident: 'María López',      month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-12', apartment: 'B204', resident: 'Gabriela Sánchez', month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-04-09' },
  { id: 'pg-13', apartment: 'A101', resident: 'Sofía Torres',     month: 'marzo de 2026',  monthKey: '2026-03', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-03-10' },
  { id: 'pg-14', apartment: 'A201', resident: 'Ana López',        month: 'marzo de 2026',  monthKey: '2026-03', concepto: 'Mensualidad', amount: 1700, status: 'Pendiente', paymentDate: null },
  { id: 'pg-15', apartment: 'B101', resident: 'Laura Ramírez',    month: 'marzo de 2026',  monthKey: '2026-03', concepto: 'Mensualidad', amount: 1700, status: 'Pagado',   paymentDate: '2026-03-15' },
  { id: 'pg-16', apartment: 'A203', resident: 'Carlos Gómez',     month: 'abril de 2026',  monthKey: '2026-04', concepto: 'Multa',        amount: 500,  status: 'Pendiente', paymentDate: null },
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

/**
 * Initial ticket counter — new tickets will start from this number + 1.
 * Set to 2940 so the first three seeds are 2941, 2942, 2943.
 */
export const seedTicketCounter = 2943

/**
 * Demo tickets showcasing different lifecycle stages:
 *   - #2941: En Proceso with activity history
 *   - #2942: Nuevo (freshly submitted)
 *   - #2943: Resuelto (completed with resolution note)
 */
export const seedTickets: Ticket[] = [
  {
    id: 'tkt-1',
    number: 2941,
    subject: 'Reparación de Bomba de Agua',
    description: 'La bomba de agua del edificio presenta ruidos anormales y baja presión en los pisos superiores de la Torre A. Se requiere inspección y posible reemplazo de componentes.',
    category: 'Plomería',
    priority: 'Alta',
    status: 'En Proceso',
    createdBy: 'Sofía Torres',
    apartment: 'A101',
    location: 'Cuarto de Máquinas',
    createdAt: '2026-04-12T09:30:00.000Z',
    updatedAt: '2026-04-13T14:00:00.000Z',
    resolvedAt: null,
    activities: [
      {
        id: 'act-1',
        author: 'Sistema',
        visibility: 'public',
        message: 'Ticket creado por Sofía Torres.',
        createdAt: '2026-04-12T09:30:00.000Z',
      },
      {
        id: 'act-2',
        author: 'Administrador General',
        visibility: 'internal',
        message: 'Se contactó al proveedor de mantenimiento hidráulico. Visita programada para mañana.',
        createdAt: '2026-04-12T11:15:00.000Z',
      },
      {
        id: 'act-3',
        author: 'Administrador General',
        visibility: 'public',
        message: 'Hemos asignado un técnico especializado. La reparación está programada para el día de mañana entre 9:00 y 12:00 hrs.',
        createdAt: '2026-04-12T11:20:00.000Z',
      },
      {
        id: 'act-4',
        author: 'Administrador General',
        visibility: 'internal',
        message: 'Técnico en sitio. Diagnóstico: impeller desgastado, se requiere reemplazo. Pieza en camino.',
        createdAt: '2026-04-13T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'tkt-2',
    number: 2942,
    subject: 'Luminaria fundida en estacionamiento',
    description: 'La luminaria del nivel P1 del estacionamiento, zona cercana al elevador, se encuentra fundida. El área queda completamente oscura por las noches.',
    category: 'Electricidad',
    priority: 'Media',
    status: 'Nuevo',
    createdBy: 'Carlos Gómez',
    apartment: 'A203',
    location: 'Estacionamiento P1',
    createdAt: '2026-04-14T08:45:00.000Z',
    updatedAt: '2026-04-14T08:45:00.000Z',
    resolvedAt: null,
    activities: [
      {
        id: 'act-5',
        author: 'Sistema',
        visibility: 'public',
        message: 'Ticket creado por Carlos Gómez.',
        createdAt: '2026-04-14T08:45:00.000Z',
      },
    ],
  },
  {
    id: 'tkt-3',
    number: 2943,
    subject: 'Limpieza profunda lobby Torre B',
    description: 'Se solicita limpieza profunda del lobby de Torre B. Hay manchas en el piso de mármol y los vidrios de la entrada necesitan atención.',
    category: 'Limpieza',
    priority: 'Baja',
    status: 'Resuelto',
    createdBy: 'Laura Ramírez',
    apartment: 'B101',
    location: 'Lobby Torre B',
    createdAt: '2026-04-10T16:00:00.000Z',
    updatedAt: '2026-04-12T09:00:00.000Z',
    resolvedAt: '2026-04-12T09:00:00.000Z',
    activities: [
      {
        id: 'act-6',
        author: 'Sistema',
        visibility: 'public',
        message: 'Ticket creado por Laura Ramírez.',
        createdAt: '2026-04-10T16:00:00.000Z',
      },
      {
        id: 'act-7',
        author: 'Administrador General',
        visibility: 'public',
        message: 'Se programó limpieza profunda para el viernes 12 de abril en horario de 7:00 a 9:00 hrs.',
        createdAt: '2026-04-11T10:30:00.000Z',
      },
      {
        id: 'act-8',
        author: 'Administrador General',
        visibility: 'public',
        message: 'Limpieza completada satisfactoriamente. Se aplicó tratamiento especial al mármol.',
        createdAt: '2026-04-12T09:00:00.000Z',
      },
    ],
  },
]

export const seedAdeudos: Adeudo[] = [
  {
    id: 'ad-1',
    apartment: 'A203',
    type: 'multa',
    concepto: 'Multa',
    description: 'Uso indebido de cajón de estacionamiento ajeno. Se le ha notificado previamente.',
    amount: 500,
    status: 'Activo',
    createdAt: '2026-04-10T10:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    pagoId: undefined,
  },
  {
    id: 'ad-2',
    apartment: 'B203',
    type: 'llamado_atencion',
    concepto: 'Llamado de atención',
    description: 'Ruido excesivo después de las 22:00 hrs. reportado por vecinos del piso 2.',
    amount: 0,
    status: 'Activo',
    createdAt: '2026-04-08T09:30:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    pagoId: undefined,
  },
  {
    id: 'ad-3',
    apartment: 'A201',
    type: 'adeudo',
    concepto: 'Mensualidades atrasadas Mar-Abr 2026',
    description: 'Adeudo acumulado de 2 meses de mantenimiento (marzo y abril 2026).',
    amount: 3400,
    status: 'Activo',
    createdAt: '2026-04-01T08:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    pagoId: undefined,
  },
]

export const seedEgresos: Egreso[] = [
  {
    id: 'eg-1',
    categoria: 'nomina',
    concepto: 'Nómina jardinero — abril 2026',
    description: 'Pago quincenal (1ra quincena) al jardinero contratado.',
    amount: 4500,
    monthKey: '2026-04',
    date: '2026-04-15',
    registeredBy: 'Administrador General',
  },
  {
    id: 'eg-2',
    categoria: 'nomina',
    concepto: 'Nómina guardia — abril 2026',
    description: 'Pago mensual al guardia de seguridad nocturno.',
    amount: 8000,
    monthKey: '2026-04',
    date: '2026-04-01',
    registeredBy: 'Administrador General',
  },
  {
    id: 'eg-3',
    categoria: 'servicios',
    concepto: 'Recibo de agua — marzo 2026',
    amount: 3200,
    monthKey: '2026-03',
    date: '2026-03-20',
    registeredBy: 'Administrador General',
  },
  {
    id: 'eg-4',
    categoria: 'servicios',
    concepto: 'Recibo de luz — marzo 2026',
    amount: 5800,
    monthKey: '2026-03',
    date: '2026-03-22',
    registeredBy: 'Administrador General',
  },
  {
    id: 'eg-5',
    categoria: 'mantenimiento',
    concepto: 'Reparación elevador Torre A',
    description: 'Servicio correctivo por fallo en sensor de piso 3.',
    amount: 12000,
    monthKey: '2026-03',
    date: '2026-03-10',
    registeredBy: 'Administrador General',
  },
  {
    id: 'eg-6',
    categoria: 'administracion',
    concepto: 'Honorarios administración — abril 2026',
    description: 'Cuota mensual de la empresa administradora.',
    amount: 15000,
    monthKey: '2026-04',
    date: '2026-04-01',
    registeredBy: 'Administrador General',
  },
]
