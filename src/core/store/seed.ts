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
  status: 'Pagado' | 'Pendiente' | 'Por validar'
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

/** A recurring monthly expense configured by the admin */
export interface RecurringEgreso {
  id: string
  concepto: string
  categoria: EgresoCategoria
  amount: number
  description?: string
}

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
  /** Default monthly maintenance fee in MXN */
  monthlyFee: number
  /** Recurring monthly expenses auto-generated each month */
  recurringEgresos: RecurringEgreso[]
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
  /** Payment status — Pendiente until admin confirms disbursement */
  status: 'Pendiente' | 'Pagado'
}

// ═══════════════════════════════════════════════════════════════════════
// SEED DATA — Initial state for a fresh installation
// ═══════════════════════════════════════════════════════════════════════

export const seedBuildingConfig: BuildingConfig = {
  type: 'towers',
  towers: ['RIN', 'DANUBIO'],
  buildingName: 'Lote Alemania',
  buildingAddress: 'Cosmopol HU Lifestyle, CDMX',
  managementCompany: 'Canton Alfa Inc.',
  totalUnits: 116,
  adminName: 'Administrador General',
  adminEmail: 'admin@property.com',
  adminPhone: '+52 55 1234 5678',
  conceptosPago: ['Mensualidad', 'Extraordinario', 'Multa', 'Adeudo', 'Reserva Amenidad'],
  subConceptos: {
    'Extraordinario': ['Cuota pintura fachada', 'Reparación elevador', 'Impermeabilización'],
    'Multa': ['Ruido excesivo', 'Uso indebido de cajón', 'Mascota sin registro', 'Basura fuera de horario'],
  },
  categoriasEgreso: ['nomina', 'mantenimiento', 'servicios', 'equipo', 'seguros', 'administracion', 'otros'],
  monthlyFee: 1800,
  recurringEgresos: [
    { id: 're-1', concepto: 'Nomina — Ricardo Hernandez',  categoria: 'nomina',         amount: 13000,  description: 'Pago mensual guardia de seguridad.' },
    { id: 're-2', concepto: 'Nomina — Enrique Martinez',   categoria: 'nomina',         amount: 11000,  description: 'Pago mensual jardinero.' },
    { id: 're-3', concepto: 'Nomina — Valentina Sanchez',  categoria: 'nomina',         amount: 10000,  description: 'Pago mensual personal de limpieza.' },
    { id: 're-4', concepto: 'Recibo de Agua',                    categoria: 'servicios',      amount: 3200,  description: 'Servicio de agua potable.' },
    { id: 're-5', concepto: 'Recibo de Luz',                     categoria: 'servicios',      amount: 5800,  description: 'Servicio de energía eléctrica áreas comunes.' },
    { id: 're-6', concepto: 'Honorarios Administración',         categoria: 'administracion', amount: 15000, description: 'Cuota mensual de la empresa administradora.' },
  ],
}

export const seedAmenities: Amenity[] = [
  { id: 'amen-1', name: 'Asador 1' },
  { id: 'amen-2', name: 'Asador 2' },
  { id: 'amen-3', name: 'Asador 3' },
]

export const seedResidents: Resident[] = [
  {
    "id": "res-B0101",
    "name": "Zsolt Miller",
    "apartment": "B0101",
    "tower": "DANUBIO",
    "email": "B0101@gmail.com"
  },
  {
    "id": "res-B0102",
    "name": "Zyanya Rodriguez",
    "apartment": "B0102",
    "tower": "DANUBIO",
    "email": "B0102@gmail.com"
  },
  {
    "id": "res-B0103",
    "name": "Maria Thompson",
    "apartment": "B0103",
    "tower": "DANUBIO",
    "email": "B0103@gmail.com"
  },
  {
    "id": "res-B0104",
    "name": "Elizabeth Garcia",
    "apartment": "A0201",
    "tower": "RIN",
    "email": "A0201.2@gmail.com"
  },
  {
    "id": "res-B0201",
    "name": "Manuel Smith",
    "apartment": "B0201",
    "tower": "DANUBIO",
    "email": "B0201@gmail.com"
  },
  {
    "id": "res-B0202",
    "name": "Mario Jones",
    "apartment": "B0202",
    "tower": "DANUBIO",
    "email": "B0202@gmail.com"
  },
  {
    "id": "res-B0203",
    "name": "Karen Morales",
    "apartment": "B0203",
    "tower": "DANUBIO",
    "email": "B0203@gmail.com"
  },
  {
    "id": "res-B0204",
    "name": "Marco Williams",
    "apartment": "B0204",
    "tower": "DANUBIO",
    "email": "B0204@gmail.com"
  },
  {
    "id": "res-B0301",
    "name": "Samantha Herrera",
    "apartment": "B0301",
    "tower": "DANUBIO",
    "email": "B0301@gmail.com"
  },
  {
    "id": "res-B0302",
    "name": "Julio Anderson",
    "apartment": "B0302",
    "tower": "DANUBIO",
    "email": "B0302@gmail.com"
  },
  {
    "id": "res-B0303",
    "name": "Dorothy Lopez",
    "apartment": "B0303",
    "tower": "DANUBIO",
    "email": "B0303@gmail.com"
  },
  {
    "id": "res-B0304",
    "name": "Antonio Taylor",
    "apartment": "B0304",
    "tower": "DANUBIO",
    "email": "B0304@gmail.com"
  },
  {
    "id": "res-B0401",
    "name": "Florian Martinez",
    "apartment": "B0401",
    "tower": "DANUBIO",
    "email": "B0401@gmail.com"
  },
  {
    "id": "res-B0402",
    "name": "Efraín Brown",
    "apartment": "B0402",
    "tower": "DANUBIO",
    "email": "B0402@gmail.com"
  },
  {
    "id": "res-B0403",
    "name": "Santiago Wilson",
    "apartment": "B0403",
    "tower": "DANUBIO",
    "email": "B0403@gmail.com"
  },
  {
    "id": "res-B0404",
    "name": "Bertha Sanchez",
    "apartment": "B0404",
    "tower": "DANUBIO",
    "email": "B0404@gmail.com"
  },
  {
    "id": "res-B0501",
    "name": "Michal Davies",
    "apartment": "B0501",
    "tower": "DANUBIO",
    "email": "B0501@gmail.com"
  },
  {
    "id": "res-B0502",
    "name": "Jorge Evans",
    "apartment": "B0502",
    "tower": "DANUBIO",
    "email": "B0502@gmail.com"
  },
  {
    "id": "res-B0503",
    "name": "Fernanda Clark",
    "apartment": "B0503",
    "tower": "DANUBIO",
    "email": "B0503@gmail.com"
  },
  {
    "id": "res-B0504",
    "name": "Alejandro Ramirez",
    "apartment": "B0504",
    "tower": "DANUBIO",
    "email": "B0504@gmail.com"
  },
  {
    "id": "res-B0601",
    "name": "Carmen White",
    "apartment": "B0601",
    "tower": "DANUBIO",
    "email": "B0601@gmail.com"
  },
  {
    "id": "res-B0602",
    "name": "Martha Roberts",
    "apartment": "B0602",
    "tower": "DANUBIO",
    "email": "B0602@gmail.com"
  },
  {
    "id": "res-B0603",
    "name": "Juan Campbell",
    "apartment": "B0603",
    "tower": "DANUBIO",
    "email": "B0603@gmail.com"
  },
  {
    "id": "res-B0604",
    "name": "Zsolt Hernandez",
    "apartment": "B0604",
    "tower": "DANUBIO",
    "email": "B0604@gmail.com"
  },
  {
    "id": "res-B0701",
    "name": "Zyanya Wright",
    "apartment": "B0701",
    "tower": "DANUBIO",
    "email": "B0701@gmail.com"
  },
  {
    "id": "res-B0702",
    "name": "Elizabeth Mitchell",
    "apartment": "B0702",
    "tower": "DANUBIO",
    "email": "B0702@gmail.com"
  },
  {
    "id": "res-B0703",
    "name": "Maria Flores",
    "apartment": "B0703",
    "tower": "DANUBIO",
    "email": "B0703@gmail.com"
  },
  {
    "id": "res-B0704",
    "name": "Samantha Young",
    "apartment": "B0704",
    "tower": "DANUBIO",
    "email": "B0704@gmail.com"
  },
  {
    "id": "res-B0801",
    "name": "Manuel Ortiz",
    "apartment": "B0801",
    "tower": "DANUBIO",
    "email": "B0801@gmail.com"
  },
  {
    "id": "res-B0802",
    "name": "Mario Collins",
    "apartment": "B0802",
    "tower": "DANUBIO",
    "email": "B0802@gmail.com"
  },
  {
    "id": "res-B0803",
    "name": "Karen King",
    "apartment": "B0803",
    "tower": "DANUBIO",
    "email": "B0803@gmail.com"
  },
  {
    "id": "res-B0804",
    "name": "Marco Ruiz",
    "apartment": "B0804",
    "tower": "DANUBIO",
    "email": "B0804@gmail.com"
  },
  {
    "id": "res-B0901",
    "name": "Julio Harrison",
    "apartment": "B0901",
    "tower": "DANUBIO",
    "email": "B0901@gmail.com"
  },
  {
    "id": "res-B0902",
    "name": "Dorothy Morgan",
    "apartment": "B0902",
    "tower": "DANUBIO",
    "email": "B0902@gmail.com"
  },
  {
    "id": "res-B0903",
    "name": "Antonio Castro",
    "apartment": "B0903",
    "tower": "DANUBIO",
    "email": "B0903@gmail.com"
  },
  {
    "id": "res-B0904",
    "name": "Florian Lee",
    "apartment": "B0904",
    "tower": "DANUBIO",
    "email": "B0904@gmail.com"
  },
  {
    "id": "res-B1001",
    "name": "Efraín Walker",
    "apartment": "B1001",
    "tower": "DANUBIO",
    "email": "B1001@gmail.com"
  },
  {
    "id": "res-B1002",
    "name": "Santiago Mendez",
    "apartment": "B1002",
    "tower": "DANUBIO",
    "email": "B1002@gmail.com"
  },
  {
    "id": "res-B1003",
    "name": "Bertha Scott",
    "apartment": "B1003",
    "tower": "DANUBIO",
    "email": "B1003@gmail.com"
  },
  {
    "id": "res-B1004",
    "name": "Michal Green",
    "apartment": "B1004",
    "tower": "DANUBIO",
    "email": "B1004@gmail.com"
  },
  {
    "id": "res-B1101",
    "name": "Jorge Hill",
    "apartment": "B1101",
    "tower": "DANUBIO",
    "email": "B1101@gmail.com"
  },
  {
    "id": "res-B1102",
    "name": "Fernanda Baker",
    "apartment": "B1102",
    "tower": "DANUBIO",
    "email": "B1102@gmail.com"
  },
  {
    "id": "res-B1103",
    "name": "Alejandro Adams",
    "apartment": "B1103",
    "tower": "DANUBIO",
    "email": "B1103@gmail.com"
  },
  {
    "id": "res-B1104",
    "name": "Carmen Nelson",
    "apartment": "B1104",
    "tower": "DANUBIO",
    "email": "B1104@gmail.com"
  },
  {
    "id": "res-B1201",
    "name": "Martha Gonzalez",
    "apartment": "B1201",
    "tower": "DANUBIO",
    "email": "B1201@gmail.com"
  },
  {
    "id": "res-B1202",
    "name": "Juan Carter",
    "apartment": "B1202",
    "tower": "DANUBIO",
    "email": "B1202@gmail.com"
  },
  {
    "id": "res-B1203",
    "name": "Zsolt Mitchell",
    "apartment": "B1203",
    "tower": "DANUBIO",
    "email": "B1203@gmail.com"
  },
  {
    "id": "res-B1204",
    "name": "Zyanya Perez",
    "apartment": "B1204",
    "tower": "DANUBIO",
    "email": "B1204@gmail.com"
  },
  {
    "id": "res-B1301",
    "name": "Elizabeth Parker",
    "apartment": "B1301",
    "tower": "DANUBIO",
    "email": "B1301@gmail.com"
  },
  {
    "id": "res-B1302",
    "name": "Maria Edwards",
    "apartment": "B1302",
    "tower": "DANUBIO",
    "email": "B1302@gmail.com"
  },
  {
    "id": "res-B1303",
    "name": "Samantha Collins",
    "apartment": "B1303",
    "tower": "DANUBIO",
    "email": "B1303@gmail.com"
  },
  {
    "id": "res-B1304",
    "name": "Manuel Stewart",
    "apartment": "B1304",
    "tower": "DANUBIO",
    "email": "B1304@gmail.com"
  },
  {
    "id": "res-B1401",
    "name": "Mario Morris",
    "apartment": "B1401",
    "tower": "DANUBIO",
    "email": "B1401@gmail.com"
  },
  {
    "id": "res-B1402",
    "name": "Karen Murphy",
    "apartment": "B1402",
    "tower": "DANUBIO",
    "email": "B1402@gmail.com"
  },
  {
    "id": "res-B1403",
    "name": "Marco Rivera",
    "apartment": "B1403",
    "tower": "DANUBIO",
    "email": "B1403@gmail.com"
  },
  {
    "id": "res-B1404",
    "name": "Julio Cook",
    "apartment": "B1404",
    "tower": "DANUBIO",
    "email": "B1404@gmail.com"
  },
  {
    "id": "res-B1501",
    "name": "Dorothy Bell",
    "apartment": "B1501",
    "tower": "DANUBIO",
    "email": "B1501@gmail.com"
  },
  {
    "id": "res-B1502",
    "name": "Antonio Ward",
    "apartment": "B1502",
    "tower": "DANUBIO",
    "email": "B1502@gmail.com"
  },
  {
    "id": "res-A0101",
    "name": "Florian Richardson",
    "apartment": "A0101",
    "tower": "RIN",
    "email": "A0101@gmail.com"
  },
  {
    "id": "res-A0102",
    "name": "Efraín Watson",
    "apartment": "A0102",
    "tower": "RIN",
    "email": "A0102@gmail.com"
  },
  {
    "id": "res-A0103",
    "name": "Santiago Brooks",
    "apartment": "A0103",
    "tower": "RIN",
    "email": "A0103@gmail.com"
  },
  {
    "id": "res-A0104",
    "name": "Bertha Wood",
    "apartment": "A0104",
    "tower": "RIN",
    "email": "A0104@gmail.com"
  },
  {
    "id": "res-A0201",
    "name": "Michal Kelly",
    "apartment": "A0201",
    "tower": "RIN",
    "email": "A0201.1@gmail.com"
  },
  {
    "id": "res-A0202",
    "name": "Jorge Sanders",
    "apartment": "A0202",
    "tower": "RIN",
    "email": "A0202@gmail.com"
  },
  {
    "id": "res-A0203",
    "name": "Fernanda Bennett",
    "apartment": "A0203",
    "tower": "RIN",
    "email": "A0203@gmail.com"
  },
  {
    "id": "res-A0204",
    "name": "Alejandro Ross",
    "apartment": "A0204",
    "tower": "RIN",
    "email": "A0204@gmail.com"
  },
  {
    "id": "res-A0301",
    "name": "Carmen Jenkins",
    "apartment": "A0301",
    "tower": "RIN",
    "email": "A0301@gmail.com"
  },
  {
    "id": "res-A0302",
    "name": "Martha Perry",
    "apartment": "A0302",
    "tower": "RIN",
    "email": "A0302@gmail.com"
  },
  {
    "id": "res-A0303",
    "name": "Juan Powell",
    "apartment": "A0303",
    "tower": "RIN",
    "email": "A0303@gmail.com"
  },
  {
    "id": "res-A0304",
    "name": "Zsolt Sullivan",
    "apartment": "A0304",
    "tower": "RIN",
    "email": "A0304@gmail.com"
  },
  {
    "id": "res-A0401",
    "name": "Zyanya Russell",
    "apartment": "A0401",
    "tower": "RIN",
    "email": "A0401@gmail.com"
  },
  {
    "id": "res-A0402",
    "name": "Elizabeth Foster",
    "apartment": "A0402",
    "tower": "RIN",
    "email": "A0402@gmail.com"
  },
  {
    "id": "res-A0403",
    "name": "Maria Butler",
    "apartment": "A0403",
    "tower": "RIN",
    "email": "A0403@gmail.com"
  },
  {
    "id": "res-A0404",
    "name": "Samantha Simmons",
    "apartment": "A0404",
    "tower": "RIN",
    "email": "A0404@gmail.com"
  },
  {
    "id": "res-A0501",
    "name": "Manuel Bryant",
    "apartment": "A0501",
    "tower": "RIN",
    "email": "A0501@gmail.com"
  },
  {
    "id": "res-A0502",
    "name": "Mario Alexander",
    "apartment": "A0502",
    "tower": "RIN",
    "email": "A0502@gmail.com"
  },
  {
    "id": "res-A0503",
    "name": "Karen Griffin",
    "apartment": "A0503",
    "tower": "RIN",
    "email": "A0503@gmail.com"
  },
  {
    "id": "res-A0504",
    "name": "Marco Diaz",
    "apartment": "A0504",
    "tower": "RIN",
    "email": "A0504@gmail.com"
  },
  {
    "id": "res-A0601",
    "name": "Julio Hayes",
    "apartment": "A0601",
    "tower": "RIN",
    "email": "A0601@gmail.com"
  },
  {
    "id": "res-A0602",
    "name": "Dorothy Myers",
    "apartment": "A0602",
    "tower": "RIN",
    "email": "A0602@gmail.com"
  },
  {
    "id": "res-A0603",
    "name": "Antonio Ford",
    "apartment": "A0603",
    "tower": "RIN",
    "email": "A0603@gmail.com"
  },
  {
    "id": "res-A0604",
    "name": "Florian Hamilton",
    "apartment": "A0604",
    "tower": "RIN",
    "email": "A0604@gmail.com"
  },
  {
    "id": "res-A0701",
    "name": "Efraín Graham",
    "apartment": "A0701",
    "tower": "RIN",
    "email": "A0701@gmail.com"
  },
  {
    "id": "res-A0702",
    "name": "Santiago Fisher",
    "apartment": "A0702",
    "tower": "RIN",
    "email": "A0702@gmail.com"
  },
  {
    "id": "res-A0703",
    "name": "Bertha Wallace",
    "apartment": "A0703",
    "tower": "RIN",
    "email": "A0703@gmail.com"
  },
  {
    "id": "res-A0704",
    "name": "Michal West",
    "apartment": "A0704",
    "tower": "RIN",
    "email": "A0704@gmail.com"
  },
  {
    "id": "res-A0801",
    "name": "Jorge Jordan",
    "apartment": "A0801",
    "tower": "RIN",
    "email": "A0801@gmail.com"
  },
  {
    "id": "res-A0802",
    "name": "Fernanda Owens",
    "apartment": "A0802",
    "tower": "RIN",
    "email": "A0802@gmail.com"
  },
  {
    "id": "res-A0803",
    "name": "Alejandro Reynolds",
    "apartment": "A0803",
    "tower": "RIN",
    "email": "A0803@gmail.com"
  },
  {
    "id": "res-A0804",
    "name": "Carmen Vargas",
    "apartment": "A0804",
    "tower": "RIN",
    "email": "A0804@gmail.com"
  },
  {
    "id": "res-A0901",
    "name": "Martha Ellis",
    "apartment": "A0901",
    "tower": "RIN",
    "email": "A0901@gmail.com"
  },
  {
    "id": "res-A0902",
    "name": "Juan Romero",
    "apartment": "A0902",
    "tower": "RIN",
    "email": "A0902@gmail.com"
  },
  {
    "id": "res-A0903",
    "name": "Zsolt Stephens",
    "apartment": "A0903",
    "tower": "RIN",
    "email": "A0903@gmail.com"
  },
  {
    "id": "res-A0904",
    "name": "Zyanya Porter",
    "apartment": "A0904",
    "tower": "RIN",
    "email": "A0904@gmail.com"
  },
  {
    "id": "res-A1001",
    "name": "Elizabeth Hunter",
    "apartment": "A1001",
    "tower": "RIN",
    "email": "A1001@gmail.com"
  },
  {
    "id": "res-A1002",
    "name": "Maria Robertson",
    "apartment": "A1002",
    "tower": "RIN",
    "email": "A1002@gmail.com"
  },
  {
    "id": "res-A1003",
    "name": "Samantha Shaw",
    "apartment": "A1003",
    "tower": "RIN",
    "email": "A1003@gmail.com"
  },
  {
    "id": "res-A1004",
    "name": "Manuel Hunt",
    "apartment": "A1004",
    "tower": "RIN",
    "email": "A1004@gmail.com"
  },
  {
    "id": "res-A1101",
    "name": "Mario Black",
    "apartment": "A1101",
    "tower": "RIN",
    "email": "A1101@gmail.com"
  },
  {
    "id": "res-A1102",
    "name": "Karen Holmes",
    "apartment": "A1102",
    "tower": "RIN",
    "email": "A1102@gmail.com"
  },
  {
    "id": "res-A1103",
    "name": "Marco Palmer",
    "apartment": "A1103",
    "tower": "RIN",
    "email": "A1103@gmail.com"
  },
  {
    "id": "res-A1104",
    "name": "Julio Wagner",
    "apartment": "A1104",
    "tower": "RIN",
    "email": "A1104@gmail.com"
  },
  {
    "id": "res-A1201",
    "name": "Dorothy Mendoza",
    "apartment": "A1201",
    "tower": "RIN",
    "email": "A1201@gmail.com"
  },
  {
    "id": "res-A1202",
    "name": "Antonio Patterson",
    "apartment": "A1202",
    "tower": "RIN",
    "email": "A1202@gmail.com"
  },
  {
    "id": "res-A1203",
    "name": "Florian Jacobs",
    "apartment": "A1203",
    "tower": "RIN",
    "email": "A1203@gmail.com"
  },
  {
    "id": "res-A1204",
    "name": "Efraín James",
    "apartment": "A1204",
    "tower": "RIN",
    "email": "A1204@gmail.com"
  },
  {
    "id": "res-A1301",
    "name": "Santiago Cruz",
    "apartment": "A1301",
    "tower": "RIN",
    "email": "A1301@gmail.com"
  },
  {
    "id": "res-A1302",
    "name": "Bertha Gordon",
    "apartment": "A1302",
    "tower": "RIN",
    "email": "A1302@gmail.com"
  },
  {
    "id": "res-A1303",
    "name": "Michal Harrison",
    "apartment": "A1303",
    "tower": "RIN",
    "email": "A1303@gmail.com"
  },
  {
    "id": "res-A1304",
    "name": "Jorge Reyes",
    "apartment": "A1304",
    "tower": "RIN",
    "email": "A1304@gmail.com"
  },
  {
    "id": "res-A1401",
    "name": "Fernanda Hughes",
    "apartment": "A1401",
    "tower": "RIN",
    "email": "A1401@gmail.com"
  },
  {
    "id": "res-A1402",
    "name": "Alejandro Price",
    "apartment": "A1402",
    "tower": "RIN",
    "email": "A1402@gmail.com"
  },
  {
    "id": "res-A1403",
    "name": "Carmen Myers",
    "apartment": "A1403",
    "tower": "RIN",
    "email": "A1403@gmail.com"
  },
  {
    "id": "res-A1404",
    "name": "Martha Long",
    "apartment": "A1404",
    "tower": "RIN",
    "email": "A1404@gmail.com"
  },
  {
    "id": "res-A1501",
    "name": "Juan Jimenez",
    "apartment": "A1501",
    "tower": "RIN",
    "email": "A1501@gmail.com"
  },
  {
    "id": "res-A1502",
    "name": "Zsolt Foster",
    "apartment": "A1502",
    "tower": "RIN",
    "email": "A1502@gmail.com"
  },
  {
    "id": "res-A0201-3",
    "name": "Rose Howard",
    "apartment": "A0201",
    "tower": "RIN",
    "email": "A0201.3@gmail.com"
  },
  {
    "id": "res-B0104-New",
    "name": "James Wilson",
    "apartment": "B0104",
    "tower": "DANUBIO",
    "email": "B0104@gmail.com"
  }
]

export const seedStaff: StaffMember[] = [
  { id: 'staff-1', name: 'Samantha Guzman', role: 'Administradora General', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L', 'M', 'Mi', 'J', 'V', 'S'], photo: '' },
  { id: 'staff-2', name: 'Ricardo Hernandez', role: 'Guardia', shiftStart: '08:00', shiftEnd: '08:00', workDays: ['L', 'Mi', 'V', 'D'], photo: '' },
  { id: 'staff-3', name: 'Angel García', role: 'Guardia', shiftStart: '08:00', shiftEnd: '08:00', workDays: ['M', 'J', 'S'], photo: '' },
  { id: 'staff-4', name: 'Enrique Martinez', role: 'Jardinero', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L', 'M', 'Mi', 'J', 'V'], photo: '' },
  { id: 'staff-5', name: 'Valentina Sanchez', role: 'Limpieza', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L', 'M', 'Mi', 'J', 'V'], photo: '' },
  { id: 'staff-6', name: 'Carla Lopez', role: 'Limpieza', shiftStart: '08:00', shiftEnd: '17:00', workDays: ['L', 'M', 'Mi', 'J', 'V'], photo: '' },
]

export const seedAvisos: Aviso[] = [
  {
    "id": "av-1",
    "category": "general",
    "title": "Mantenimiento de elevadores",
    "attachment": "mantenimiento.pdf",
    "date": "2026-04-15"
  },
  {
    "id": "av-2",
    "category": "general",
    "title": "Fiesta de Fin de Año",
    "description": "Agradecemos a todos por participar en nuestra gran Fiesta de Fin de Año. Fue un evento inolvidable lleno de música, comida y gran convivencia vecinal.",
    "attachment": "Memoria_Evento_2025.pdf",
    "attachmentType": "pdf",
    "date": "2025-12-15",
    "startDate": "2025-12-15",
    "endDate": "2026-01-05"
  },
  {
    "id": "av-3",
    "category": "asamblea",
    "pinned": true,
    "title": "Asamblea Ordinaria General",
    "description": "Convocatoria formal para la próxima Asamblea Ordinaria donde se discutirán presupuestos, estado de áreas comunes y elección de comité de vigilancia. **Es vital su participación** para alcanzar el quórum reglamentario.",
    "attachment": "Convocatoria_Asamblea_2026.pdf",
    "attachmentType": "pdf",
    "date": "2026-04-12",
    "startDate": "2026-04-20",
    "endDate": "2027-12-31",
    "startTime": "18:00",
    "endTime": "20:00",
    "tracking": [
      {
        "type": "view",
        "apartment": "B0101",
        "resident": "Zsolt Miller",
        "timestamp": "2026-04-17T10:00:00Z"
      },
      {
        "type": "view",
        "apartment": "B0102",
        "resident": "Zyanya Rodriguez",
        "timestamp": "2026-04-17T10:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0102",
        "resident": "Zyanya Rodriguez",
        "timestamp": "2026-04-17T10:20:00Z"
      },
      {
        "type": "view",
        "apartment": "B0103",
        "resident": "Maria Thompson",
        "timestamp": "2026-04-17T10:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0103",
        "resident": "Maria Thompson",
        "timestamp": "2026-04-17T10:35:00Z"
      },
      {
        "type": "view",
        "apartment": "A0201",
        "resident": "Elizabeth Garcia",
        "timestamp": "2026-04-17T10:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0201",
        "resident": "Elizabeth Garcia",
        "timestamp": "2026-04-17T10:50:00Z"
      },
      {
        "type": "view",
        "apartment": "B0201",
        "resident": "Manuel Smith",
        "timestamp": "2026-04-17T11:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0201",
        "resident": "Manuel Smith",
        "timestamp": "2026-04-17T11:05:00Z"
      },
      {
        "type": "view",
        "apartment": "B0202",
        "resident": "Mario Jones",
        "timestamp": "2026-04-17T11:15:00Z"
      },
      {
        "type": "view",
        "apartment": "B0203",
        "resident": "Karen Morales",
        "timestamp": "2026-04-17T11:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0203",
        "resident": "Karen Morales",
        "timestamp": "2026-04-17T11:35:00Z"
      },
      {
        "type": "view",
        "apartment": "B0204",
        "resident": "Marco Williams",
        "timestamp": "2026-04-17T11:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0204",
        "resident": "Marco Williams",
        "timestamp": "2026-04-17T11:50:00Z"
      },
      {
        "type": "view",
        "apartment": "B0301",
        "resident": "Samantha Herrera",
        "timestamp": "2026-04-17T12:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0301",
        "resident": "Samantha Herrera",
        "timestamp": "2026-04-17T12:05:00Z"
      },
      {
        "type": "view",
        "apartment": "B0302",
        "resident": "Julio Anderson",
        "timestamp": "2026-04-17T12:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0302",
        "resident": "Julio Anderson",
        "timestamp": "2026-04-17T12:20:00Z"
      },
      {
        "type": "view",
        "apartment": "B0303",
        "resident": "Dorothy Lopez",
        "timestamp": "2026-04-17T12:30:00Z"
      },
      {
        "type": "view",
        "apartment": "B0304",
        "resident": "Antonio Taylor",
        "timestamp": "2026-04-17T12:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0304",
        "resident": "Antonio Taylor",
        "timestamp": "2026-04-17T12:50:00Z"
      },
      {
        "type": "view",
        "apartment": "B0401",
        "resident": "Florian Martinez",
        "timestamp": "2026-04-17T13:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0401",
        "resident": "Florian Martinez",
        "timestamp": "2026-04-17T13:05:00Z"
      },
      {
        "type": "view",
        "apartment": "B0402",
        "resident": "Efraín Brown",
        "timestamp": "2026-04-17T13:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0402",
        "resident": "Efraín Brown",
        "timestamp": "2026-04-17T13:20:00Z"
      },
      {
        "type": "view",
        "apartment": "B0403",
        "resident": "Santiago Wilson",
        "timestamp": "2026-04-17T13:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0403",
        "resident": "Santiago Wilson",
        "timestamp": "2026-04-17T13:35:00Z"
      },
      {
        "type": "view",
        "apartment": "B0404",
        "resident": "Bertha Sanchez",
        "timestamp": "2026-04-17T13:45:00Z"
      },
      {
        "type": "view",
        "apartment": "B0501",
        "resident": "Michal Davies",
        "timestamp": "2026-04-17T14:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0501",
        "resident": "Michal Davies",
        "timestamp": "2026-04-17T14:05:00Z"
      },
      {
        "type": "view",
        "apartment": "B0502",
        "resident": "Jorge Evans",
        "timestamp": "2026-04-17T14:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0502",
        "resident": "Jorge Evans",
        "timestamp": "2026-04-17T14:20:00Z"
      },
      {
        "type": "view",
        "apartment": "B0503",
        "resident": "Fernanda Clark",
        "timestamp": "2026-04-17T14:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0503",
        "resident": "Fernanda Clark",
        "timestamp": "2026-04-17T14:35:00Z"
      },
      {
        "type": "view",
        "apartment": "B0504",
        "resident": "Alejandro Ramirez",
        "timestamp": "2026-04-17T14:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0504",
        "resident": "Alejandro Ramirez",
        "timestamp": "2026-04-17T14:50:00Z"
      },
      {
        "type": "view",
        "apartment": "B0601",
        "resident": "Carmen White",
        "timestamp": "2026-04-17T15:00:00Z"
      },
      {
        "type": "view",
        "apartment": "B0602",
        "resident": "Martha Roberts",
        "timestamp": "2026-04-17T15:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0602",
        "resident": "Martha Roberts",
        "timestamp": "2026-04-17T15:20:00Z"
      },
      {
        "type": "view",
        "apartment": "B0603",
        "resident": "Juan Campbell",
        "timestamp": "2026-04-17T15:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0603",
        "resident": "Juan Campbell",
        "timestamp": "2026-04-17T15:35:00Z"
      },
      {
        "type": "view",
        "apartment": "B0604",
        "resident": "Zsolt Hernandez",
        "timestamp": "2026-04-17T15:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0604",
        "resident": "Zsolt Hernandez",
        "timestamp": "2026-04-17T15:50:00Z"
      },
      {
        "type": "view",
        "apartment": "B0701",
        "resident": "Zyanya Wright",
        "timestamp": "2026-04-17T16:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0701",
        "resident": "Zyanya Wright",
        "timestamp": "2026-04-17T16:05:00Z"
      },
      {
        "type": "view",
        "apartment": "B0702",
        "resident": "Elizabeth Mitchell",
        "timestamp": "2026-04-17T16:15:00Z"
      },
      {
        "type": "view",
        "apartment": "B0703",
        "resident": "Maria Hernandez",
        "timestamp": "2026-04-17T16:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0703",
        "resident": "Maria Hernandez",
        "timestamp": "2026-04-17T16:35:00Z"
      },
      {
        "type": "view",
        "apartment": "B0704",
        "resident": "Karen Lopez",
        "timestamp": "2026-04-17T16:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "B0704",
        "resident": "Karen Lopez",
        "timestamp": "2026-04-17T16:50:00Z"
      },
      {
        "type": "view",
        "apartment": "A0101",
        "resident": "George Smith",
        "timestamp": "2026-04-17T17:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0101",
        "resident": "George Smith",
        "timestamp": "2026-04-17T17:05:00Z"
      },
      {
        "type": "view",
        "apartment": "A0102",
        "resident": "Alice Johnson",
        "timestamp": "2026-04-17T17:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0102",
        "resident": "Alice Johnson",
        "timestamp": "2026-04-17T17:20:00Z"
      },
      {
        "type": "view",
        "apartment": "A0103",
        "resident": "Bob Brown",
        "timestamp": "2026-04-17T17:30:00Z"
      },
      {
        "type": "view",
        "apartment": "A0104",
        "resident": "Charlie Davis",
        "timestamp": "2026-04-17T17:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0104",
        "resident": "Charlie Davis",
        "timestamp": "2026-04-17T17:50:00Z"
      },
      {
        "type": "view",
        "apartment": "A0202",
        "resident": "Eve Miller",
        "timestamp": "2026-04-17T18:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0202",
        "resident": "Eve Miller",
        "timestamp": "2026-04-17T18:05:00Z"
      },
      {
        "type": "view",
        "apartment": "A0203",
        "resident": "Frank Wilson",
        "timestamp": "2026-04-17T18:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0203",
        "resident": "Frank Wilson",
        "timestamp": "2026-04-17T18:20:00Z"
      },
      {
        "type": "view",
        "apartment": "A0204",
        "resident": "Grace Moore",
        "timestamp": "2026-04-17T18:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0204",
        "resident": "Grace Moore",
        "timestamp": "2026-04-17T18:35:00Z"
      },
      {
        "type": "view",
        "apartment": "A0301",
        "resident": "Henry Taylor",
        "timestamp": "2026-04-17T18:45:00Z"
      },
      {
        "type": "view",
        "apartment": "A0302",
        "resident": "Ivy Anderson",
        "timestamp": "2026-04-17T19:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0302",
        "resident": "Ivy Anderson",
        "timestamp": "2026-04-17T19:05:00Z"
      },
      {
        "type": "view",
        "apartment": "A0303",
        "resident": "Jack Thomas",
        "timestamp": "2026-04-17T19:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0303",
        "resident": "Jack Thomas",
        "timestamp": "2026-04-17T19:20:00Z"
      },
      {
        "type": "view",
        "apartment": "A0304",
        "resident": "Kelly Jackson",
        "timestamp": "2026-04-17T19:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0304",
        "resident": "Kelly Jackson",
        "timestamp": "2026-04-17T19:35:00Z"
      },
      {
        "type": "view",
        "apartment": "A0401",
        "resident": "Leo White",
        "timestamp": "2026-04-17T19:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0401",
        "resident": "Leo White",
        "timestamp": "2026-04-17T19:50:00Z"
      },
      {
        "type": "view",
        "apartment": "A0402",
        "resident": "Mia Harris",
        "timestamp": "2026-04-17T20:00:00Z"
      },
      {
        "type": "view",
        "apartment": "A0501",
        "resident": "Noah Martin",
        "timestamp": "2026-04-17T20:15:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0501",
        "resident": "Noah Martin",
        "timestamp": "2026-04-17T20:20:00Z"
      },
      {
        "type": "view",
        "apartment": "A0502",
        "resident": "Olivia Garcia",
        "timestamp": "2026-04-17T20:30:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0502",
        "resident": "Olivia Garcia",
        "timestamp": "2026-04-17T20:35:00Z"
      },
      {
        "type": "view",
        "apartment": "A0601",
        "resident": "Paul Martinez",
        "timestamp": "2026-04-17T20:45:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0601",
        "resident": "Paul Martinez",
        "timestamp": "2026-04-17T20:50:00Z"
      },
      {
        "type": "view",
        "apartment": "A0602",
        "resident": "Quinn Robinson",
        "timestamp": "2026-04-17T21:00:00Z"
      },
      {
        "type": "confirm",
        "apartment": "A0602",
        "resident": "Quinn Robinson",
        "timestamp": "2026-04-17T21:05:00Z"
      }
    ]
  },
  {
    "id": "av-4",
    "category": "general",
    "title": "Fumigación de Áreas Comunes",
    "description": "Se llevará a cabo la fumigación bimestral preventiva en jardines, pasillos y estacionamiento. Se recomienda mantener ventanas cerradas durante el proceso.",
    "attachment": "Cronograma_Fumigacion.pdf",
    "attachmentType": "pdf",
    "date": "2026-04-18",
    "startDate": "2026-05-10",
    "endDate": "2026-05-15"
  },
  {
    "id": "av-5",
    "category": "general",
    "title": "Reglamento de Estacionamiento",
    "description": "Recordamos a todos los residentes el uso correcto de los cajones asignados y la prohibición de estacionarse en áreas de maniobra o visitas sin registro previo.",
    "attachment": "Mapa_Estacionamiento.png",
    "attachmentType": "image",
    "attachmentData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "date": "2026-04-19"
  }
]

export const seedPagos: Pago[] = [
  {
    "id": "pg-B0101-2026-01",
    "apartment": "B0101",
    "resident": "Zsolt Miller",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0101-2026-02",
    "apartment": "B0101",
    "resident": "Zsolt Miller",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0101-2026-03",
    "apartment": "B0101",
    "resident": "Zsolt Miller",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0101-2026-04",
    "apartment": "B0101",
    "resident": "Zsolt Miller",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0102-2026-01",
    "apartment": "B0102",
    "resident": "Zyanya Rodriguez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0102-2026-02",
    "apartment": "B0102",
    "resident": "Zyanya Rodriguez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0102-2026-03",
    "apartment": "B0102",
    "resident": "Zyanya Rodriguez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0102-2026-04",
    "apartment": "B0102",
    "resident": "Zyanya Rodriguez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0103-2026-01",
    "apartment": "B0103",
    "resident": "Maria Thompson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0103-2026-02",
    "apartment": "B0103",
    "resident": "Maria Thompson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0103-2026-03",
    "apartment": "B0103",
    "resident": "Maria Thompson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0103-2026-04",
    "apartment": "B0103",
    "resident": "Maria Thompson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0104-2026-01",
    "apartment": "A0201", "resident": "Elizabeth Garcia",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0104-2026-02",
    "apartment": "A0201", "resident": "Elizabeth Garcia",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0104-2026-03",
    "apartment": "A0201", "resident": "Elizabeth Garcia",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0104-2026-04",
    "apartment": "A0201", "resident": "Elizabeth Garcia",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0201-2026-01",
    "apartment": "B0201",
    "resident": "Manuel Smith",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0201-2026-02",
    "apartment": "B0201",
    "resident": "Manuel Smith",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0201-2026-03",
    "apartment": "B0201",
    "resident": "Manuel Smith",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0201-2026-04",
    "apartment": "B0201",
    "resident": "Manuel Smith",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0202-2026-01",
    "apartment": "B0202",
    "resident": "Mario Jones",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0202-2026-02",
    "apartment": "B0202",
    "resident": "Mario Jones",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0202-2026-03",
    "apartment": "B0202",
    "resident": "Mario Jones",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0202-2026-04",
    "apartment": "B0202",
    "resident": "Mario Jones",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0203-2026-01",
    "apartment": "B0203",
    "resident": "Karen Morales",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0203-2026-02",
    "apartment": "B0203",
    "resident": "Karen Morales",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0203-2026-03",
    "apartment": "B0203",
    "resident": "Karen Morales",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0203-2026-04",
    "apartment": "B0203",
    "resident": "Karen Morales",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0204-2026-01",
    "apartment": "B0204",
    "resident": "Marco Williams",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0204-2026-02",
    "apartment": "B0204",
    "resident": "Marco Williams",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0204-2026-03",
    "apartment": "B0204",
    "resident": "Marco Williams",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0204-2026-04",
    "apartment": "B0204",
    "resident": "Marco Williams",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0301-2026-01",
    "apartment": "B0301",
    "resident": "Samantha Herrera",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0301-2026-02",
    "apartment": "B0301",
    "resident": "Samantha Herrera",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0301-2026-03",
    "apartment": "B0301",
    "resident": "Samantha Herrera",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0301-2026-04",
    "apartment": "B0301",
    "resident": "Samantha Herrera",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0302-2026-01",
    "apartment": "B0302",
    "resident": "Julio Anderson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0302-2026-02",
    "apartment": "B0302",
    "resident": "Julio Anderson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0302-2026-03",
    "apartment": "B0302",
    "resident": "Julio Anderson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0302-2026-04",
    "apartment": "B0302",
    "resident": "Julio Anderson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0303-2026-01",
    "apartment": "B0303",
    "resident": "Dorothy Lopez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0303-2026-02",
    "apartment": "B0303",
    "resident": "Dorothy Lopez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0303-2026-03",
    "apartment": "B0303",
    "resident": "Dorothy Lopez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0303-2026-04",
    "apartment": "B0303",
    "resident": "Dorothy Lopez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0304-2026-01",
    "apartment": "B0304",
    "resident": "Antonio Taylor",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0304-2026-02",
    "apartment": "B0304",
    "resident": "Antonio Taylor",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0304-2026-03",
    "apartment": "B0304",
    "resident": "Antonio Taylor",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0304-2026-04",
    "apartment": "B0304",
    "resident": "Antonio Taylor",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0401-2026-01",
    "apartment": "B0401",
    "resident": "Florian Martinez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0401-2026-02",
    "apartment": "B0401",
    "resident": "Florian Martinez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0401-2026-03",
    "apartment": "B0401",
    "resident": "Florian Martinez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0401-2026-04",
    "apartment": "B0401",
    "resident": "Florian Martinez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0402-2026-01",
    "apartment": "B0402",
    "resident": "Efra\u00edn Brown",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0402-2026-02",
    "apartment": "B0402",
    "resident": "Efra\u00edn Brown",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0402-2026-03",
    "apartment": "B0402",
    "resident": "Efra\u00edn Brown",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0402-2026-04",
    "apartment": "B0402",
    "resident": "Efra\u00edn Brown",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0403-2026-01",
    "apartment": "B0403",
    "resident": "Santiago Wilson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0403-2026-02",
    "apartment": "B0403",
    "resident": "Santiago Wilson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0403-2026-03",
    "apartment": "B0403",
    "resident": "Santiago Wilson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0403-2026-04",
    "apartment": "B0403",
    "resident": "Santiago Wilson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0404-2026-01",
    "apartment": "B0404",
    "resident": "Bertha Sanchez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0404-2026-02",
    "apartment": "B0404",
    "resident": "Bertha Sanchez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0404-2026-03",
    "apartment": "B0404",
    "resident": "Bertha Sanchez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0404-2026-04",
    "apartment": "B0404",
    "resident": "Bertha Sanchez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0501-2026-01",
    "apartment": "B0501",
    "resident": "Michal Davies",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0501-2026-02",
    "apartment": "B0501",
    "resident": "Michal Davies",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0501-2026-03",
    "apartment": "B0501",
    "resident": "Michal Davies",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0501-2026-04",
    "apartment": "B0501",
    "resident": "Michal Davies",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0502-2026-01",
    "apartment": "B0502",
    "resident": "Jorge Evans",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0502-2026-02",
    "apartment": "B0502",
    "resident": "Jorge Evans",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0502-2026-03",
    "apartment": "B0502",
    "resident": "Jorge Evans",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0502-2026-04",
    "apartment": "B0502",
    "resident": "Jorge Evans",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0503-2026-01",
    "apartment": "B0503",
    "resident": "Fernanda Clark",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0503-2026-02",
    "apartment": "B0503",
    "resident": "Fernanda Clark",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0503-2026-03",
    "apartment": "B0503",
    "resident": "Fernanda Clark",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0503-2026-04",
    "apartment": "B0503",
    "resident": "Fernanda Clark",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0504-2026-01",
    "apartment": "B0504",
    "resident": "Alejandro Ramirez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0504-2026-02",
    "apartment": "B0504",
    "resident": "Alejandro Ramirez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0504-2026-03",
    "apartment": "B0504",
    "resident": "Alejandro Ramirez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0504-2026-04",
    "apartment": "B0504",
    "resident": "Alejandro Ramirez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0601-2026-01",
    "apartment": "B0601",
    "resident": "Carmen White",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0601-2026-02",
    "apartment": "B0601",
    "resident": "Carmen White",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0601-2026-03",
    "apartment": "B0601",
    "resident": "Carmen White",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0601-2026-04",
    "apartment": "B0601",
    "resident": "Carmen White",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0602-2026-01",
    "apartment": "B0602",
    "resident": "Martha Roberts",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0602-2026-02",
    "apartment": "B0602",
    "resident": "Martha Roberts",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0602-2026-03",
    "apartment": "B0602",
    "resident": "Martha Roberts",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0602-2026-04",
    "apartment": "B0602",
    "resident": "Martha Roberts",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0603-2026-01",
    "apartment": "B0603",
    "resident": "Juan Campbell",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0603-2026-02",
    "apartment": "B0603",
    "resident": "Juan Campbell",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0603-2026-03",
    "apartment": "B0603",
    "resident": "Juan Campbell",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0603-2026-04",
    "apartment": "B0603",
    "resident": "Juan Campbell",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0604-2026-01",
    "apartment": "B0604",
    "resident": "Zsolt Hernandez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0604-2026-02",
    "apartment": "B0604",
    "resident": "Zsolt Hernandez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0604-2026-03",
    "apartment": "B0604",
    "resident": "Zsolt Hernandez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0604-2026-04",
    "apartment": "B0604",
    "resident": "Zsolt Hernandez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0701-2026-01",
    "apartment": "B0701",
    "resident": "Zyanya Wright",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0701-2026-02",
    "apartment": "B0701",
    "resident": "Zyanya Wright",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0701-2026-03",
    "apartment": "B0701",
    "resident": "Zyanya Wright",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0701-2026-04",
    "apartment": "B0701",
    "resident": "Zyanya Wright",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0702-2026-01",
    "apartment": "B0702",
    "resident": "Elizabeth Mitchell",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0702-2026-02",
    "apartment": "B0702",
    "resident": "Elizabeth Mitchell",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0702-2026-03",
    "apartment": "B0702",
    "resident": "Elizabeth Mitchell",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0702-2026-04",
    "apartment": "B0702",
    "resident": "Elizabeth Mitchell",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0703-2026-01",
    "apartment": "B0703",
    "resident": "Maria Flores",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0703-2026-02",
    "apartment": "B0703",
    "resident": "Maria Flores",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0703-2026-03",
    "apartment": "B0703",
    "resident": "Maria Flores",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0703-2026-04",
    "apartment": "B0703",
    "resident": "Maria Flores",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0704-2026-01",
    "apartment": "B0704",
    "resident": "Samantha Young",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0704-2026-02",
    "apartment": "B0704",
    "resident": "Samantha Young",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0704-2026-03",
    "apartment": "B0704",
    "resident": "Samantha Young",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0704-2026-04",
    "apartment": "B0704",
    "resident": "Samantha Young",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0801-2026-01",
    "apartment": "B0801",
    "resident": "Manuel Ortiz",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0801-2026-02",
    "apartment": "B0801",
    "resident": "Manuel Ortiz",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0801-2026-03",
    "apartment": "B0801",
    "resident": "Manuel Ortiz",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0801-2026-04",
    "apartment": "B0801",
    "resident": "Manuel Ortiz",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0802-2026-01",
    "apartment": "B0802",
    "resident": "Mario Collins",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0802-2026-02",
    "apartment": "B0802",
    "resident": "Mario Collins",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0802-2026-03",
    "apartment": "B0802",
    "resident": "Mario Collins",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0802-2026-04",
    "apartment": "B0802",
    "resident": "Mario Collins",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0803-2026-01",
    "apartment": "B0803",
    "resident": "Karen King",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0803-2026-02",
    "apartment": "B0803",
    "resident": "Karen King",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0803-2026-03",
    "apartment": "B0803",
    "resident": "Karen King",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0803-2026-04",
    "apartment": "B0803",
    "resident": "Karen King",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0804-2026-01",
    "apartment": "B0804",
    "resident": "Marco Ruiz",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0804-2026-02",
    "apartment": "B0804",
    "resident": "Marco Ruiz",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0804-2026-03",
    "apartment": "B0804",
    "resident": "Marco Ruiz",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0804-2026-04",
    "apartment": "B0804",
    "resident": "Marco Ruiz",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0901-2026-01",
    "apartment": "B0901",
    "resident": "Julio Harrison",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0901-2026-02",
    "apartment": "B0901",
    "resident": "Julio Harrison",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0901-2026-03",
    "apartment": "B0901",
    "resident": "Julio Harrison",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0901-2026-04",
    "apartment": "B0901",
    "resident": "Julio Harrison",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0902-2026-01",
    "apartment": "B0902",
    "resident": "Dorothy Morgan",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0902-2026-02",
    "apartment": "B0902",
    "resident": "Dorothy Morgan",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0902-2026-03",
    "apartment": "B0902",
    "resident": "Dorothy Morgan",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0902-2026-04",
    "apartment": "B0902",
    "resident": "Dorothy Morgan",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0903-2026-01",
    "apartment": "B0903",
    "resident": "Antonio Castro",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0903-2026-02",
    "apartment": "B0903",
    "resident": "Antonio Castro",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0903-2026-03",
    "apartment": "B0903",
    "resident": "Antonio Castro",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0903-2026-04",
    "apartment": "B0903",
    "resident": "Antonio Castro",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0904-2026-01",
    "apartment": "B0904",
    "resident": "Florian Lee",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B0904-2026-02",
    "apartment": "B0904",
    "resident": "Florian Lee",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B0904-2026-03",
    "apartment": "B0904",
    "resident": "Florian Lee",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B0904-2026-04",
    "apartment": "B0904",
    "resident": "Florian Lee",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1001-2026-01",
    "apartment": "B1001",
    "resident": "Efra\u00edn Walker",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1001-2026-02",
    "apartment": "B1001",
    "resident": "Efra\u00edn Walker",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1001-2026-03",
    "apartment": "B1001",
    "resident": "Efra\u00edn Walker",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1001-2026-04",
    "apartment": "B1001",
    "resident": "Efra\u00edn Walker",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1002-2026-01",
    "apartment": "B1002",
    "resident": "Santiago Mendez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1002-2026-02",
    "apartment": "B1002",
    "resident": "Santiago Mendez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1002-2026-03",
    "apartment": "B1002",
    "resident": "Santiago Mendez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1002-2026-04",
    "apartment": "B1002",
    "resident": "Santiago Mendez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1003-2026-01",
    "apartment": "B1003",
    "resident": "Bertha Scott",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1003-2026-02",
    "apartment": "B1003",
    "resident": "Bertha Scott",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1003-2026-03",
    "apartment": "B1003",
    "resident": "Bertha Scott",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1003-2026-04",
    "apartment": "B1003",
    "resident": "Bertha Scott",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1004-2026-01",
    "apartment": "B1004",
    "resident": "Michal Green",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1004-2026-02",
    "apartment": "B1004",
    "resident": "Michal Green",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1004-2026-03",
    "apartment": "B1004",
    "resident": "Michal Green",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1004-2026-04",
    "apartment": "B1004",
    "resident": "Michal Green",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1101-2026-01",
    "apartment": "B1101",
    "resident": "Jorge Hill",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1101-2026-02",
    "apartment": "B1101",
    "resident": "Jorge Hill",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1101-2026-03",
    "apartment": "B1101",
    "resident": "Jorge Hill",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1101-2026-04",
    "apartment": "B1101",
    "resident": "Jorge Hill",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1102-2026-01",
    "apartment": "B1102",
    "resident": "Fernanda Baker",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1102-2026-02",
    "apartment": "B1102",
    "resident": "Fernanda Baker",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1102-2026-03",
    "apartment": "B1102",
    "resident": "Fernanda Baker",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1102-2026-04",
    "apartment": "B1102",
    "resident": "Fernanda Baker",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1103-2026-01",
    "apartment": "B1103",
    "resident": "Alejandro Adams",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1103-2026-02",
    "apartment": "B1103",
    "resident": "Alejandro Adams",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1103-2026-03",
    "apartment": "B1103",
    "resident": "Alejandro Adams",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1103-2026-04",
    "apartment": "B1103",
    "resident": "Alejandro Adams",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1104-2026-01",
    "apartment": "B1104",
    "resident": "Carmen Nelson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1104-2026-02",
    "apartment": "B1104",
    "resident": "Carmen Nelson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1104-2026-03",
    "apartment": "B1104",
    "resident": "Carmen Nelson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1104-2026-04",
    "apartment": "B1104",
    "resident": "Carmen Nelson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1201-2026-01",
    "apartment": "B1201",
    "resident": "Martha Gonzalez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1201-2026-02",
    "apartment": "B1201",
    "resident": "Martha Gonzalez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1201-2026-03",
    "apartment": "B1201",
    "resident": "Martha Gonzalez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1201-2026-04",
    "apartment": "B1201",
    "resident": "Martha Gonzalez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1202-2026-01",
    "apartment": "B1202",
    "resident": "Juan Carter",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1202-2026-02",
    "apartment": "B1202",
    "resident": "Juan Carter",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1202-2026-03",
    "apartment": "B1202",
    "resident": "Juan Carter",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1202-2026-04",
    "apartment": "B1202",
    "resident": "Juan Carter",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1203-2026-01",
    "apartment": "B1203",
    "resident": "Zsolt Mitchell",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1203-2026-02",
    "apartment": "B1203",
    "resident": "Zsolt Mitchell",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1203-2026-03",
    "apartment": "B1203",
    "resident": "Zsolt Mitchell",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1203-2026-04",
    "apartment": "B1203",
    "resident": "Zsolt Mitchell",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1204-2026-01",
    "apartment": "B1204",
    "resident": "Zyanya Perez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1204-2026-02",
    "apartment": "B1204",
    "resident": "Zyanya Perez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1204-2026-03",
    "apartment": "B1204",
    "resident": "Zyanya Perez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1204-2026-04",
    "apartment": "B1204",
    "resident": "Zyanya Perez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1301-2026-01",
    "apartment": "B1301",
    "resident": "Elizabeth Parker",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1301-2026-02",
    "apartment": "B1301",
    "resident": "Elizabeth Parker",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1301-2026-03",
    "apartment": "B1301",
    "resident": "Elizabeth Parker",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1301-2026-04",
    "apartment": "B1301",
    "resident": "Elizabeth Parker",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1302-2026-01",
    "apartment": "B1302",
    "resident": "Maria Edwards",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1302-2026-02",
    "apartment": "B1302",
    "resident": "Maria Edwards",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1302-2026-03",
    "apartment": "B1302",
    "resident": "Maria Edwards",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1302-2026-04",
    "apartment": "B1302",
    "resident": "Maria Edwards",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1303-2026-01",
    "apartment": "B1303",
    "resident": "Samantha Collins",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1303-2026-02",
    "apartment": "B1303",
    "resident": "Samantha Collins",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1303-2026-03",
    "apartment": "B1303",
    "resident": "Samantha Collins",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1303-2026-04",
    "apartment": "B1303",
    "resident": "Samantha Collins",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1304-2026-01",
    "apartment": "B1304",
    "resident": "Manuel Stewart",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1304-2026-02",
    "apartment": "B1304",
    "resident": "Manuel Stewart",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1304-2026-03",
    "apartment": "B1304",
    "resident": "Manuel Stewart",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1304-2026-04",
    "apartment": "B1304",
    "resident": "Manuel Stewart",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1401-2026-01",
    "apartment": "B1401",
    "resident": "Mario Morris",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1401-2026-02",
    "apartment": "B1401",
    "resident": "Mario Morris",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1401-2026-03",
    "apartment": "B1401",
    "resident": "Mario Morris",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1401-2026-04",
    "apartment": "B1401",
    "resident": "Mario Morris",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1402-2026-01",
    "apartment": "B1402",
    "resident": "Karen Murphy",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1402-2026-02",
    "apartment": "B1402",
    "resident": "Karen Murphy",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1402-2026-03",
    "apartment": "B1402",
    "resident": "Karen Murphy",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1402-2026-04",
    "apartment": "B1402",
    "resident": "Karen Murphy",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1403-2026-01",
    "apartment": "B1403",
    "resident": "Marco Rivera",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1403-2026-02",
    "apartment": "B1403",
    "resident": "Marco Rivera",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1403-2026-03",
    "apartment": "B1403",
    "resident": "Marco Rivera",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1403-2026-04",
    "apartment": "B1403",
    "resident": "Marco Rivera",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1404-2026-01",
    "apartment": "B1404",
    "resident": "Julio Cook",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1404-2026-02",
    "apartment": "B1404",
    "resident": "Julio Cook",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1404-2026-03",
    "apartment": "B1404",
    "resident": "Julio Cook",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1404-2026-04",
    "apartment": "B1404",
    "resident": "Julio Cook",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1501-2026-01",
    "apartment": "B1501",
    "resident": "Dorothy Bell",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1501-2026-02",
    "apartment": "B1501",
    "resident": "Dorothy Bell",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1501-2026-03",
    "apartment": "B1501",
    "resident": "Dorothy Bell",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1501-2026-04",
    "apartment": "B1501",
    "resident": "Dorothy Bell",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B1502-2026-01",
    "apartment": "B1502",
    "resident": "Antonio Ward",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-B1502-2026-02",
    "apartment": "B1502",
    "resident": "Antonio Ward",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-B1502-2026-03",
    "apartment": "B1502",
    "resident": "Antonio Ward",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-B1502-2026-04",
    "apartment": "B1502",
    "resident": "Antonio Ward",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0101-2026-01",
    "apartment": "A0101",
    "resident": "Florian Richardson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0101-2026-02",
    "apartment": "A0101",
    "resident": "Florian Richardson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pendiente",
    "paymentDate": null
  },
  {
    "id": "pg-A0101-2026-03",
    "apartment": "A0101",
    "resident": "Florian Richardson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pendiente",
    "paymentDate": null
  },
  {
    "id": "pg-A0101-2026-04",
    "apartment": "A0101",
    "resident": "Florian Richardson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pendiente",
    "paymentDate": null
  },
  {
    "id": "pg-A0102-2026-01",
    "apartment": "A0102",
    "resident": "Efra\u00edn Watson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0102-2026-02",
    "apartment": "A0102",
    "resident": "Efra\u00edn Watson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0102-2026-03",
    "apartment": "A0102",
    "resident": "Efra\u00edn Watson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0102-2026-04",
    "apartment": "A0102",
    "resident": "Efra\u00edn Watson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0103-2026-01",
    "apartment": "A0103",
    "resident": "Santiago Brooks",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0103-2026-02",
    "apartment": "A0103",
    "resident": "Santiago Brooks",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0103-2026-03",
    "apartment": "A0103",
    "resident": "Santiago Brooks",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0103-2026-04",
    "apartment": "A0103",
    "resident": "Santiago Brooks",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0104-2026-01",
    "apartment": "A0104",
    "resident": "Bertha Wood",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0104-2026-02",
    "apartment": "A0104",
    "resident": "Bertha Wood",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0104-2026-03",
    "apartment": "A0104",
    "resident": "Bertha Wood",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0104-2026-04",
    "apartment": "A0104",
    "resident": "Bertha Wood",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0201-2026-01",
    "apartment": "A0201",
    "resident": "Michal Kelly",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0201-2026-02",
    "apartment": "A0201",
    "resident": "Michal Kelly",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0201-2026-03",
    "apartment": "A0201",
    "resident": "Michal Kelly",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0201-2026-04",
    "apartment": "A0201",
    "resident": "Michal Kelly",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0202-2026-01",
    "apartment": "A0202",
    "resident": "Jorge Sanders",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0202-2026-02",
    "apartment": "A0202",
    "resident": "Jorge Sanders",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0202-2026-03",
    "apartment": "A0202",
    "resident": "Jorge Sanders",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0202-2026-04",
    "apartment": "A0202",
    "resident": "Jorge Sanders",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0203-2026-01",
    "apartment": "A0203",
    "resident": "Fernanda Bennett",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0203-2026-02",
    "apartment": "A0203",
    "resident": "Fernanda Bennett",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0203-2026-03",
    "apartment": "A0203",
    "resident": "Fernanda Bennett",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0203-2026-04",
    "apartment": "A0203",
    "resident": "Fernanda Bennett",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0204-2026-01",
    "apartment": "A0204",
    "resident": "Alejandro Ross",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0204-2026-02",
    "apartment": "A0204",
    "resident": "Alejandro Ross",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0204-2026-03",
    "apartment": "A0204",
    "resident": "Alejandro Ross",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0204-2026-04",
    "apartment": "A0204",
    "resident": "Alejandro Ross",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0301-2026-01",
    "apartment": "A0301",
    "resident": "Carmen Jenkins",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0301-2026-02",
    "apartment": "A0301",
    "resident": "Carmen Jenkins",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0301-2026-03",
    "apartment": "A0301",
    "resident": "Carmen Jenkins",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0301-2026-04",
    "apartment": "A0301",
    "resident": "Carmen Jenkins",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0302-2026-01",
    "apartment": "A0302",
    "resident": "Martha Perry",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0302-2026-02",
    "apartment": "A0302",
    "resident": "Martha Perry",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0302-2026-03",
    "apartment": "A0302",
    "resident": "Martha Perry",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0302-2026-04",
    "apartment": "A0302",
    "resident": "Martha Perry",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0303-2026-01",
    "apartment": "A0303",
    "resident": "Juan Powell",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0303-2026-02",
    "apartment": "A0303",
    "resident": "Juan Powell",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0303-2026-03",
    "apartment": "A0303",
    "resident": "Juan Powell",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0303-2026-04",
    "apartment": "A0303",
    "resident": "Juan Powell",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0304-2026-01",
    "apartment": "A0304",
    "resident": "Zsolt Sullivan",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0304-2026-02",
    "apartment": "A0304",
    "resident": "Zsolt Sullivan",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0304-2026-03",
    "apartment": "A0304",
    "resident": "Zsolt Sullivan",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0304-2026-04",
    "apartment": "A0304",
    "resident": "Zsolt Sullivan",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0401-2026-01",
    "apartment": "A0401",
    "resident": "Zyanya Russell",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0401-2026-02",
    "apartment": "A0401",
    "resident": "Zyanya Russell",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0401-2026-03",
    "apartment": "A0401",
    "resident": "Zyanya Russell",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0401-2026-04",
    "apartment": "A0401",
    "resident": "Zyanya Russell",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0402-2026-01",
    "apartment": "A0402",
    "resident": "Elizabeth Foster",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0402-2026-02",
    "apartment": "A0402",
    "resident": "Elizabeth Foster",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0402-2026-03",
    "apartment": "A0402",
    "resident": "Elizabeth Foster",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0402-2026-04",
    "apartment": "A0402",
    "resident": "Elizabeth Foster",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0403-2026-01",
    "apartment": "A0403",
    "resident": "Maria Butler",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0403-2026-02",
    "apartment": "A0403",
    "resident": "Maria Butler",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0403-2026-03",
    "apartment": "A0403",
    "resident": "Maria Butler",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0403-2026-04",
    "apartment": "A0403",
    "resident": "Maria Butler",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0404-2026-01",
    "apartment": "A0404",
    "resident": "Samantha Simmons",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0404-2026-02",
    "apartment": "A0404",
    "resident": "Samantha Simmons",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0404-2026-03",
    "apartment": "A0404",
    "resident": "Samantha Simmons",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0404-2026-04",
    "apartment": "A0404",
    "resident": "Samantha Simmons",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0501-2026-01",
    "apartment": "A0501",
    "resident": "Manuel Bryant",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0501-2026-02",
    "apartment": "A0501",
    "resident": "Manuel Bryant",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0501-2026-03",
    "apartment": "A0501",
    "resident": "Manuel Bryant",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0501-2026-04",
    "apartment": "A0501",
    "resident": "Manuel Bryant",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0502-2026-01",
    "apartment": "A0502",
    "resident": "Mario Alexander",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0502-2026-02",
    "apartment": "A0502",
    "resident": "Mario Alexander",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0502-2026-03",
    "apartment": "A0502",
    "resident": "Mario Alexander",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0502-2026-04",
    "apartment": "A0502",
    "resident": "Mario Alexander",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0503-2026-01",
    "apartment": "A0503",
    "resident": "Karen Griffin",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0503-2026-02",
    "apartment": "A0503",
    "resident": "Karen Griffin",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0503-2026-03",
    "apartment": "A0503",
    "resident": "Karen Griffin",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0503-2026-04",
    "apartment": "A0503",
    "resident": "Karen Griffin",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0504-2026-01",
    "apartment": "A0504",
    "resident": "Marco Diaz",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0504-2026-02",
    "apartment": "A0504",
    "resident": "Marco Diaz",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0504-2026-03",
    "apartment": "A0504",
    "resident": "Marco Diaz",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0504-2026-04",
    "apartment": "A0504",
    "resident": "Marco Diaz",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0601-2026-01",
    "apartment": "A0601",
    "resident": "Julio Hayes",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0601-2026-02",
    "apartment": "A0601",
    "resident": "Julio Hayes",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0601-2026-03",
    "apartment": "A0601",
    "resident": "Julio Hayes",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0601-2026-04",
    "apartment": "A0601",
    "resident": "Julio Hayes",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0602-2026-01",
    "apartment": "A0602",
    "resident": "Dorothy Myers",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0602-2026-02",
    "apartment": "A0602",
    "resident": "Dorothy Myers",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0602-2026-03",
    "apartment": "A0602",
    "resident": "Dorothy Myers",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0602-2026-04",
    "apartment": "A0602",
    "resident": "Dorothy Myers",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0603-2026-01",
    "apartment": "A0603",
    "resident": "Antonio Ford",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0603-2026-02",
    "apartment": "A0603",
    "resident": "Antonio Ford",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0603-2026-03",
    "apartment": "A0603",
    "resident": "Antonio Ford",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0603-2026-04",
    "apartment": "A0603",
    "resident": "Antonio Ford",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0604-2026-01",
    "apartment": "A0604",
    "resident": "Florian Hamilton",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0604-2026-02",
    "apartment": "A0604",
    "resident": "Florian Hamilton",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0604-2026-03",
    "apartment": "A0604",
    "resident": "Florian Hamilton",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0604-2026-04",
    "apartment": "A0604",
    "resident": "Florian Hamilton",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0701-2026-01",
    "apartment": "A0701",
    "resident": "Efra\u00edn Graham",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0701-2026-02",
    "apartment": "A0701",
    "resident": "Efra\u00edn Graham",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0701-2026-03",
    "apartment": "A0701",
    "resident": "Efra\u00edn Graham",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0701-2026-04",
    "apartment": "A0701",
    "resident": "Efra\u00edn Graham",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0702-2026-01",
    "apartment": "A0702",
    "resident": "Santiago Fisher",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0702-2026-02",
    "apartment": "A0702",
    "resident": "Santiago Fisher",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0702-2026-03",
    "apartment": "A0702",
    "resident": "Santiago Fisher",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0702-2026-04",
    "apartment": "A0702",
    "resident": "Santiago Fisher",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0703-2026-01",
    "apartment": "A0703",
    "resident": "Bertha Wallace",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0703-2026-02",
    "apartment": "A0703",
    "resident": "Bertha Wallace",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0703-2026-03",
    "apartment": "A0703",
    "resident": "Bertha Wallace",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0703-2026-04",
    "apartment": "A0703",
    "resident": "Bertha Wallace",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0704-2026-01",
    "apartment": "A0704",
    "resident": "Michal West",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0704-2026-02",
    "apartment": "A0704",
    "resident": "Michal West",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0704-2026-03",
    "apartment": "A0704",
    "resident": "Michal West",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0704-2026-04",
    "apartment": "A0704",
    "resident": "Michal West",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0801-2026-01",
    "apartment": "A0801",
    "resident": "Jorge Jordan",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0801-2026-02",
    "apartment": "A0801",
    "resident": "Jorge Jordan",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0801-2026-03",
    "apartment": "A0801",
    "resident": "Jorge Jordan",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0801-2026-04",
    "apartment": "A0801",
    "resident": "Jorge Jordan",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0802-2026-01",
    "apartment": "A0802",
    "resident": "Fernanda Owens",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0802-2026-02",
    "apartment": "A0802",
    "resident": "Fernanda Owens",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0802-2026-03",
    "apartment": "A0802",
    "resident": "Fernanda Owens",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0802-2026-04",
    "apartment": "A0802",
    "resident": "Fernanda Owens",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0803-2026-01",
    "apartment": "A0803",
    "resident": "Alejandro Reynolds",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0803-2026-02",
    "apartment": "A0803",
    "resident": "Alejandro Reynolds",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0803-2026-03",
    "apartment": "A0803",
    "resident": "Alejandro Reynolds",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0803-2026-04",
    "apartment": "A0803",
    "resident": "Alejandro Reynolds",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0804-2026-01",
    "apartment": "A0804",
    "resident": "Carmen Vargas",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0804-2026-02",
    "apartment": "A0804",
    "resident": "Carmen Vargas",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0804-2026-03",
    "apartment": "A0804",
    "resident": "Carmen Vargas",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0804-2026-04",
    "apartment": "A0804",
    "resident": "Carmen Vargas",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0901-2026-01",
    "apartment": "A0901",
    "resident": "Martha Ellis",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0901-2026-02",
    "apartment": "A0901",
    "resident": "Martha Ellis",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0901-2026-03",
    "apartment": "A0901",
    "resident": "Martha Ellis",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0901-2026-04",
    "apartment": "A0901",
    "resident": "Martha Ellis",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0902-2026-01",
    "apartment": "A0902",
    "resident": "Juan Romero",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0902-2026-02",
    "apartment": "A0902",
    "resident": "Juan Romero",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0902-2026-03",
    "apartment": "A0902",
    "resident": "Juan Romero",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0902-2026-04",
    "apartment": "A0902",
    "resident": "Juan Romero",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0903-2026-01",
    "apartment": "A0903",
    "resident": "Zsolt Stephens",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0903-2026-02",
    "apartment": "A0903",
    "resident": "Zsolt Stephens",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0903-2026-03",
    "apartment": "A0903",
    "resident": "Zsolt Stephens",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0903-2026-04",
    "apartment": "A0903",
    "resident": "Zsolt Stephens",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A0904-2026-01",
    "apartment": "A0904",
    "resident": "Zyanya Porter",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A0904-2026-02",
    "apartment": "A0904",
    "resident": "Zyanya Porter",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A0904-2026-03",
    "apartment": "A0904",
    "resident": "Zyanya Porter",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A0904-2026-04",
    "apartment": "A0904",
    "resident": "Zyanya Porter",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1001-2026-01",
    "apartment": "A1001",
    "resident": "Elizabeth Hunter",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1001-2026-02",
    "apartment": "A1001",
    "resident": "Elizabeth Hunter",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1001-2026-03",
    "apartment": "A1001",
    "resident": "Elizabeth Hunter",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1001-2026-04",
    "apartment": "A1001",
    "resident": "Elizabeth Hunter",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1002-2026-01",
    "apartment": "A1002",
    "resident": "Maria Robertson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1002-2026-02",
    "apartment": "A1002",
    "resident": "Maria Robertson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1002-2026-03",
    "apartment": "A1002",
    "resident": "Maria Robertson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1002-2026-04",
    "apartment": "A1002",
    "resident": "Maria Robertson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1003-2026-01",
    "apartment": "A1003",
    "resident": "Samantha Shaw",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1003-2026-02",
    "apartment": "A1003",
    "resident": "Samantha Shaw",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1003-2026-03",
    "apartment": "A1003",
    "resident": "Samantha Shaw",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1003-2026-04",
    "apartment": "A1003",
    "resident": "Samantha Shaw",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1004-2026-01",
    "apartment": "A1004",
    "resident": "Manuel Hunt",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1004-2026-02",
    "apartment": "A1004",
    "resident": "Manuel Hunt",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1004-2026-03",
    "apartment": "A1004",
    "resident": "Manuel Hunt",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1004-2026-04",
    "apartment": "A1004",
    "resident": "Manuel Hunt",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1101-2026-01",
    "apartment": "A1101",
    "resident": "Mario Black",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1101-2026-02",
    "apartment": "A1101",
    "resident": "Mario Black",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1101-2026-03",
    "apartment": "A1101",
    "resident": "Mario Black",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1101-2026-04",
    "apartment": "A1101",
    "resident": "Mario Black",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1102-2026-01",
    "apartment": "A1102",
    "resident": "Karen Holmes",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1102-2026-02",
    "apartment": "A1102",
    "resident": "Karen Holmes",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1102-2026-03",
    "apartment": "A1102",
    "resident": "Karen Holmes",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1102-2026-04",
    "apartment": "A1102",
    "resident": "Karen Holmes",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1103-2026-01",
    "apartment": "A1103",
    "resident": "Marco Palmer",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1103-2026-02",
    "apartment": "A1103",
    "resident": "Marco Palmer",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1103-2026-03",
    "apartment": "A1103",
    "resident": "Marco Palmer",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1103-2026-04",
    "apartment": "A1103",
    "resident": "Marco Palmer",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1104-2026-01",
    "apartment": "A1104",
    "resident": "Julio Wagner",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1104-2026-02",
    "apartment": "A1104",
    "resident": "Julio Wagner",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1104-2026-03",
    "apartment": "A1104",
    "resident": "Julio Wagner",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1104-2026-04",
    "apartment": "A1104",
    "resident": "Julio Wagner",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1201-2026-01",
    "apartment": "A1201",
    "resident": "Dorothy Mendoza",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1201-2026-02",
    "apartment": "A1201",
    "resident": "Dorothy Mendoza",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1201-2026-03",
    "apartment": "A1201",
    "resident": "Dorothy Mendoza",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1201-2026-04",
    "apartment": "A1201",
    "resident": "Dorothy Mendoza",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1202-2026-01",
    "apartment": "A1202",
    "resident": "Antonio Patterson",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1202-2026-02",
    "apartment": "A1202",
    "resident": "Antonio Patterson",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1202-2026-03",
    "apartment": "A1202",
    "resident": "Antonio Patterson",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1202-2026-04",
    "apartment": "A1202",
    "resident": "Antonio Patterson",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1203-2026-01",
    "apartment": "A1203",
    "resident": "Florian Jacobs",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1203-2026-02",
    "apartment": "A1203",
    "resident": "Florian Jacobs",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1203-2026-03",
    "apartment": "A1203",
    "resident": "Florian Jacobs",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1203-2026-04",
    "apartment": "A1203",
    "resident": "Florian Jacobs",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1204-2026-01",
    "apartment": "A1204",
    "resident": "Efra\u00edn James",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1204-2026-02",
    "apartment": "A1204",
    "resident": "Efra\u00edn James",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1204-2026-03",
    "apartment": "A1204",
    "resident": "Efra\u00edn James",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1204-2026-04",
    "apartment": "A1204",
    "resident": "Efra\u00edn James",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1301-2026-01",
    "apartment": "A1301",
    "resident": "Santiago Cruz",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1301-2026-02",
    "apartment": "A1301",
    "resident": "Santiago Cruz",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1301-2026-03",
    "apartment": "A1301",
    "resident": "Santiago Cruz",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1301-2026-04",
    "apartment": "A1301",
    "resident": "Santiago Cruz",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1302-2026-01",
    "apartment": "A1302",
    "resident": "Bertha Gordon",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1302-2026-02",
    "apartment": "A1302",
    "resident": "Bertha Gordon",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1302-2026-03",
    "apartment": "A1302",
    "resident": "Bertha Gordon",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1302-2026-04",
    "apartment": "A1302",
    "resident": "Bertha Gordon",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1303-2026-01",
    "apartment": "A1303",
    "resident": "Michal Harrison",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1303-2026-02",
    "apartment": "A1303",
    "resident": "Michal Harrison",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1303-2026-03",
    "apartment": "A1303",
    "resident": "Michal Harrison",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1303-2026-04",
    "apartment": "A1303",
    "resident": "Michal Harrison",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1304-2026-01",
    "apartment": "A1304",
    "resident": "Jorge Reyes",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1304-2026-02",
    "apartment": "A1304",
    "resident": "Jorge Reyes",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1304-2026-03",
    "apartment": "A1304",
    "resident": "Jorge Reyes",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1304-2026-04",
    "apartment": "A1304",
    "resident": "Jorge Reyes",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1401-2026-01",
    "apartment": "A1401",
    "resident": "Fernanda Hughes",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1401-2026-02",
    "apartment": "A1401",
    "resident": "Fernanda Hughes",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1401-2026-03",
    "apartment": "A1401",
    "resident": "Fernanda Hughes",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1401-2026-04",
    "apartment": "A1401",
    "resident": "Fernanda Hughes",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1402-2026-01",
    "apartment": "A1402",
    "resident": "Alejandro Price",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1402-2026-02",
    "apartment": "A1402",
    "resident": "Alejandro Price",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1402-2026-03",
    "apartment": "A1402",
    "resident": "Alejandro Price",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1402-2026-04",
    "apartment": "A1402",
    "resident": "Alejandro Price",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1403-2026-01",
    "apartment": "A1403",
    "resident": "Carmen Myers",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1403-2026-02",
    "apartment": "A1403",
    "resident": "Carmen Myers",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1403-2026-03",
    "apartment": "A1403",
    "resident": "Carmen Myers",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1403-2026-04",
    "apartment": "A1403",
    "resident": "Carmen Myers",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1404-2026-01",
    "apartment": "A1404",
    "resident": "Martha Long",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1404-2026-02",
    "apartment": "A1404",
    "resident": "Martha Long",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1404-2026-03",
    "apartment": "A1404",
    "resident": "Martha Long",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1404-2026-04",
    "apartment": "A1404",
    "resident": "Martha Long",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1501-2026-01",
    "apartment": "A1501",
    "resident": "Juan Jimenez",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1501-2026-02",
    "apartment": "A1501",
    "resident": "Juan Jimenez",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1501-2026-03",
    "apartment": "A1501",
    "resident": "Juan Jimenez",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1501-2026-04",
    "apartment": "A1501",
    "resident": "Juan Jimenez",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-A1502-2026-01",
    "apartment": "A1502",
    "resident": "Zsolt Foster",
    "month": "enero de 2026",
    "monthKey": "2026-01",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-01-05"
  },
  {
    "id": "pg-A1502-2026-02",
    "apartment": "A1502",
    "resident": "Zsolt Foster",
    "month": "febrero de 2026",
    "monthKey": "2026-02",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-02-05"
  },
  {
    "id": "pg-A1502-2026-03",
    "apartment": "A1502",
    "resident": "Zsolt Foster",
    "month": "marzo de 2026",
    "monthKey": "2026-03",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-03-05"
  },
  {
    "id": "pg-A1502-2026-04",
    "apartment": "A1502",
    "resident": "Zsolt Foster",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Mensualidad",
    "amount": 1800,
    "status": "Pagado",
    "paymentDate": "2026-04-05"
  },
  {
    "id": "pg-B0101-rsv",
    "apartment": "B0101",
    "resident": "Zsolt Miller",
    "month": "abril de 2026",
    "monthKey": "2026-04",
    "concepto": "Reserva Amenidad",
    "amount": 250,
    "status": "Pendiente",
    "paymentDate": null
  }
]


export const seedPaquetes: Paquete[] = []

export const seedReservaciones: Reservacion[] = [
  { id: 'rsv-b0101', date: '2026-04-25', grill: 'Asador 1', resident: 'Zsolt Miller', apartment: 'B0101', status: 'Reservado' },
]

export const seedVotaciones: Votacion[] = []

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
export const seedTickets: Ticket[] = []

export const seedNotificaciones: Notificacion[] = []

export const seedAdeudos: Adeudo[] = [
  {
    id: 'ad-b0101-1',
    apartment: 'B0101',
    type: 'multa',
    concepto: 'Multa',
    description: 'Uso indebido de cajón de estacionamiento.',
    amount: 500,
    status: 'Activo',
    createdAt: '2026-04-10T10:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    pagoId: undefined,
  },
  {
    id: 'ad-b0101-2',
    apartment: 'B0101',
    type: 'llamado_atencion',
    concepto: 'Llamado de atención',
    description: 'Ruido excesivo reportado por vecinos.',
    amount: 0,
    status: 'Activo',
    createdAt: '2026-04-08T09:30:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    pagoId: undefined,
  },
  {
    id: 'ad-b0101-3',
    apartment: 'B0101',
    type: 'multa',
    description: 'Exceso de mascotas en lugares no permitidos.',
    concepto: 'Mascota sin registro',
    amount: 300,
    status: 'Activo',
    createdAt: '2026-04-15T11:00:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
    pagoId: undefined,
  },
]

export const seedEgresos: Egreso[] = [
  { id: 'eg-2026-01-staff-1', categoria: 'administracion', concepto: 'Honorarios — Samantha Guzman', description: 'Honorarios Administradora General correspondientes a enero.', amount: 19500, monthKey: '2026-01', date: '2026-01-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-staff-2', categoria: 'nomina', concepto: 'Nomina — Ricardo Hernandez', description: 'Sueldo Guardia correspondiente a enero.', amount: 13000, monthKey: '2026-01', date: '2026-01-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-staff-3', categoria: 'nomina', concepto: 'Nomina — Angel García', description: 'Sueldo Guardia correspondiente a enero.', amount: 13000, monthKey: '2026-01', date: '2026-01-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-staff-4', categoria: 'nomina', concepto: 'Nomina — Enrique Martinez', description: 'Sueldo Jardinero correspondiente a enero.', amount: 11000, monthKey: '2026-01', date: '2026-01-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-staff-5', categoria: 'nomina', concepto: 'Nomina — Valentina Sanchez', description: 'Sueldo Limpieza correspondiente a enero.', amount: 10000, monthKey: '2026-01', date: '2026-01-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-staff-6', categoria: 'nomina', concepto: 'Nomina — Carla Lopez', description: 'Sueldo Limpieza correspondiente a enero.', amount: 10000, monthKey: '2026-01', date: '2026-01-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-recibo-de-agua', categoria: 'servicios', concepto: 'Recibo de Agua', description: 'Servicio de agua potable.', amount: 3200, monthKey: '2026-01', date: '2026-01-20', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-recibo-de-luz', categoria: 'servicios', concepto: 'Recibo de Luz', description: 'Servicio de energía eléctrica áreas comunes.', amount: 5800, monthKey: '2026-01', date: '2026-01-22', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-01-mantenimiento-elevadores', categoria: 'mantenimiento', concepto: 'Mantenimiento Elevadores', description: 'Póliza mensual mantenimiento preventivo.', amount: 4500, monthKey: '2026-01', date: '2026-01-5', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-staff-1', categoria: 'administracion', concepto: 'Honorarios — Samantha Guzman', description: 'Honorarios Administradora General correspondientes a febrero.', amount: 19500, monthKey: '2026-02', date: '2026-02-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-staff-2', categoria: 'nomina', concepto: 'Nomina — Ricardo Hernandez', description: 'Sueldo Guardia correspondiente a febrero.', amount: 13000, monthKey: '2026-02', date: '2026-02-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-staff-3', categoria: 'nomina', concepto: 'Nomina — Angel García', description: 'Sueldo Guardia correspondiente a febrero.', amount: 13000, monthKey: '2026-02', date: '2026-02-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-staff-4', categoria: 'nomina', concepto: 'Nomina — Enrique Martinez', description: 'Sueldo Jardinero correspondiente a febrero.', amount: 11000, monthKey: '2026-02', date: '2026-02-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-staff-5', categoria: 'nomina', concepto: 'Nomina — Valentina Sanchez', description: 'Sueldo Limpieza correspondiente a febrero.', amount: 10000, monthKey: '2026-02', date: '2026-02-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-staff-6', categoria: 'nomina', concepto: 'Nomina — Carla Lopez', description: 'Sueldo Limpieza correspondiente a febrero.', amount: 10000, monthKey: '2026-02', date: '2026-02-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-recibo-de-agua', categoria: 'servicios', concepto: 'Recibo de Agua', description: 'Servicio de agua potable.', amount: 3200, monthKey: '2026-02', date: '2026-02-20', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-recibo-de-luz', categoria: 'servicios', concepto: 'Recibo de Luz', description: 'Servicio de energía eléctrica áreas comunes.', amount: 5800, monthKey: '2026-02', date: '2026-02-22', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-02-mantenimiento-elevadores', categoria: 'mantenimiento', concepto: 'Mantenimiento Elevadores', description: 'Póliza mensual mantenimiento preventivo.', amount: 4500, monthKey: '2026-02', date: '2026-02-5', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-staff-1', categoria: 'administracion', concepto: 'Honorarios — Samantha Guzman', description: 'Honorarios Administradora General correspondientes a marzo.', amount: 19500, monthKey: '2026-03', date: '2026-03-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-staff-2', categoria: 'nomina', concepto: 'Nomina — Ricardo Hernandez', description: 'Sueldo Guardia correspondiente a marzo.', amount: 13000, monthKey: '2026-03', date: '2026-03-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-staff-3', categoria: 'nomina', concepto: 'Nomina — Angel García', description: 'Sueldo Guardia correspondiente a marzo.', amount: 13000, monthKey: '2026-03', date: '2026-03-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-staff-4', categoria: 'nomina', concepto: 'Nomina — Enrique Martinez', description: 'Sueldo Jardinero correspondiente a marzo.', amount: 11000, monthKey: '2026-03', date: '2026-03-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-staff-5', categoria: 'nomina', concepto: 'Nomina — Valentina Sanchez', description: 'Sueldo Limpieza correspondiente a marzo.', amount: 10000, monthKey: '2026-03', date: '2026-03-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-staff-6', categoria: 'nomina', concepto: 'Nomina — Carla Lopez', description: 'Sueldo Limpieza correspondiente a marzo.', amount: 10000, monthKey: '2026-03', date: '2026-03-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-recibo-de-agua', categoria: 'servicios', concepto: 'Recibo de Agua', description: 'Servicio de agua potable.', amount: 3200, monthKey: '2026-03', date: '2026-03-20', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-recibo-de-luz', categoria: 'servicios', concepto: 'Recibo de Luz', description: 'Servicio de energía eléctrica áreas comunes.', amount: 5800, monthKey: '2026-03', date: '2026-03-22', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-03-mantenimiento-elevadores', categoria: 'mantenimiento', concepto: 'Mantenimiento Elevadores', description: 'Póliza mensual mantenimiento preventivo.', amount: 4500, monthKey: '2026-03', date: '2026-03-5', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-04-staff-1', categoria: 'administracion', concepto: 'Honorarios — Samantha Guzman', description: 'Honorarios Administradora General correspondientes a abril.', amount: 19500, monthKey: '2026-04', date: '2026-04-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-04-staff-2', categoria: 'nomina', concepto: 'Nomina — Ricardo Hernandez', description: 'Sueldo Guardia correspondiente a abril.', amount: 13000, monthKey: '2026-04', date: '2026-04-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-04-staff-3', categoria: 'nomina', concepto: 'Nomina — Angel García', description: 'Sueldo Guardia correspondiente a abril.', amount: 13000, monthKey: '2026-04', date: '2026-04-01', registeredBy: 'Samantha Guzman', status: 'Pagado' },
  { id: 'eg-2026-04-staff-4', categoria: 'nomina', concepto: 'Nomina — Enrique Martinez', description: 'Sueldo Jardinero correspondiente a abril.', amount: 11000, monthKey: '2026-04', date: '2026-04-01', registeredBy: 'Samantha Guzman', status: 'Pendiente' },
  { id: 'eg-2026-04-staff-5', categoria: 'nomina', concepto: 'Nomina — Valentina Sanchez', description: 'Sueldo Limpieza correspondiente a abril.', amount: 10000, monthKey: '2026-04', date: '2026-04-01', registeredBy: 'Samantha Guzman', status: 'Pendiente' },
  { id: 'eg-2026-04-staff-6', categoria: 'nomina', concepto: 'Nomina — Carla Lopez', description: 'Sueldo Limpieza correspondiente a abril.', amount: 10000, monthKey: '2026-04', date: '2026-04-01', registeredBy: 'Samantha Guzman', status: 'Pendiente' },
  { id: 'eg-2026-04-recibo-de-agua', categoria: 'servicios', concepto: 'Recibo de Agua', description: 'Servicio de agua potable.', amount: 3200, monthKey: '2026-04', date: '2026-04-20', registeredBy: 'Samantha Guzman', status: 'Pendiente' },
  { id: 'eg-2026-04-recibo-de-luz', categoria: 'servicios', concepto: 'Recibo de Luz', description: 'Servicio de energía eléctrica áreas comunes.', amount: 5800, monthKey: '2026-04', date: '2026-04-22', registeredBy: 'Samantha Guzman', status: 'Pendiente' },
  { id: 'eg-2026-04-mantenimiento-elevadores', categoria: 'mantenimiento', concepto: 'Mantenimiento Elevadores', description: 'Póliza mensual mantenimiento preventivo.', amount: 4500, monthKey: '2026-04', date: '2026-04-5', registeredBy: 'Samantha Guzman', status: 'Pendiente' },
]
