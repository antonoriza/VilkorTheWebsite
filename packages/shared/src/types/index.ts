/**
 * Vilkor — Canonical Type Definitions
 *
 * All TypeScript interfaces used across the app. These types are the
 * single source of truth for data shapes — referenced by both the
 * database layer (sql.js) and UI components.
 *
 * Extracted from the original seed.ts to decouple types from data.
 */

// ─── Notification ────────────────────────────────────────────────────

/** A notification sent to a specific user (admin or resident) */
export interface Notificacion {
  id: string
  /** Target user ID — "admin" for admin, or a resident name */
  userId: string
  title: string
  message: string
  read: boolean
  /** Optional deep-link path (e.g. "/amenidades") for click navigation */
  actionLink?: string
  /** ISO timestamp */
  createdAt: string
  updatedAt: string
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
  /** FK to residents table (nullable for backward compat) */
  residentId?: string
  /** Apartment identifier (e.g. "A101") */
  apartment: string
  /** Name of the responsible resident (display snapshot) */
  resident: string
  /** Human-readable month (e.g. "abril de 2026") */
  month: string
  /** ISO YYYY-MM used for reliable ordering and filtering */
  monthKey: string
  /** Billing concept — admin-defined, non-disciplinary (e.g. "Mantenimiento", "Otros") */
  concepto: string
  /** Amount in MXN */
  amount: number
  status: 'Pagado' | 'Pendiente' | 'Por validar' | 'Vencido'
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
  /** ISO timestamps */
  createdAt: string
  updatedAt: string
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
  phone?: string
  /** ISO timestamps */
  createdAt: string
  updatedAt: string
}

// ─── Staff ───────────────────────────────────────────────────────────

/** Allowed staff role categories */
export type StaffRole = 'Jardinero' | 'Limpieza' | 'Guardia' | 'Administradora General'

/** Allowed inventory classification categories */
export type InventoryCategory = StaffRole | 'Propiedad'

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

/** An item in the building's inventory */
export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  /** ID of the owner (resident id or "building") */
  ownerId: string
  /** Human-readable owner name */
  owner: string
  /** ID of the person using it (staff id) */
  currentUserId: string | null
  /** Human-readable user name */
  currentUser: string
  /** Detailed notes */
  notes?: string
  /** ISO timestamps */
  createdAt: string
  updatedAt: string
}

// ─── Amenity ─────────────────────────────────────────────────────────

/** A bookable shared amenity */
export interface Amenity {
  id: string
  name: string
  /** Material Symbols icon identifier */
  icon: string
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

/** Property classification for future scalability */
export type PropertyCategory = 'residencial' | 'industrial' | 'comercial' | 'hotel'

/** Topographical grouping logic */
export type GroupingMode = 'vertical' | 'horizontal'

/** Spatial zoning points (Digital Twin infrastructure) */
export interface ZoningPoint {
  id: string
  name: string
  type: 'lobby' | 'elevator' | 'gate' | 'other'
  linkedContainer: string
}

/** The "DNA" of a residential unit */
export interface UnitDna {
  privateArea: number
  totalArea: number
  ownershipCoefficient: number
  usageType: 'propietario' | 'renta_largo' | 'renta_corto' | 'desocupado'
}

/** Topology hierarchies (Digital Twin structure generator) */
export interface TopologyContainer {
  id: string
  name: string
  unitsCount: number
  parkingCount: number
  storageCount: number
}

export interface TopologyParams {
  containers: TopologyContainer[]
  unitNomenclature: string
}

/** Objects linked to a primary unit */
export interface LinkedObject {
  id: string
  type: 'estacionamiento' | 'bodega' | 'tag'
  location: string
  hasEVCharger?: boolean
  meta?: string
}

/** Utility points for consumption mapping */
export interface UtilityPoint {
  id: string
  meterId: string
  type: 'agua' | 'gas' | 'electricidad'
  isIndividual: boolean
}

/** Critical infrastructure for preventive maintenance */
export interface CriticalEquipment {
  id: string
  name: string
  type: 'solar' | 'ac' | 'boiler' | 'pump' | 'elevator' | 'cistern' | 'cctv' | 'electric_plant' | 'transformer' | 'hvac' | 'intercom' | 'gate'
  category: 'transporte' | 'hidraulica' | 'energia' | 'seguridad'
  /** Container association: '*' = todas, or a specific container name e.g. 'Torre A' */
  location?: string
  lastMaintenance?: string
  nextMaintenance?: string
}

/** Agentic-first vendor directory — used by resolver to route incidents to the right contact */
export type VendorCategory =
  | 'limpieza'
  | 'plomeria'
  | 'elevadores'
  | 'electricidad'
  | 'seguridad'
  | 'jardineria'
  | 'hvac'
  | 'otro'

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  limpieza:      'Limpieza / Recolección',
  plomeria:      'Plomería',
  elevadores:    'Elevadores',
  electricidad:  'Electricidad',
  seguridad:     'Seguridad',
  jardineria:    'Jardinería',
  hvac:          'HVAC / Climatización',
  otro:          'Otro',
}

export interface Vendor {
  id: string
  /** Human-readable service name (e.g. "Recolección de Basura") */
  service: string
  /** Company or individual name */
  name: string
  category: VendorCategory
  /** Primary contact phone */
  phone: string
  email?: string
  /** When they operate, e.g. "L-V 7:00-15:00" */
  schedule?: string
  /** urgencias = call immediately; mantenimiento = scheduled; recurrente = fixed calendar */
  type: 'urgencias' | 'mantenimiento' | 'recurrente'
  notes?: string
}

// ─── Permissions Matrix (ThingWorx Style) ────────────────────────────

/** Human-readable group identifiers */
export type UserGroup = 'super_admin' | 'administracion' | 'operador' | 'residente'

/** Functional system areas */
export type Resource = 'finanzas' | 'logistica' | 'comunicacion' | 'gobernanza' | 'directorio' | 'configuracion'

/** Specific interaction capability */
export type PermissionAction = 'ver' | 'crear' | 'editar' | 'eliminar' | 'votar'

/** A ThingWorx-style permission record: Map[Resource] -> Map[Action] -> UserGroups[] */
export type PermissionMatrix = Record<string, Record<string, UserGroup[]>>

/** Rule-based maturity settings for financial charges */
export interface FinancialMaturityRules {
  mantenimiento: 'next_month_01' | 'next_month_10' | 'current_month_end'
  amenidad: 'day_of_event' | '1_day_before' | 'immediate'
  multaOtros: 'immediate' | '7_days_grace'
}

/** Moratory surcharge rule applied after grace period on unpaid debts */
export interface SurchargeConfig {
  /** Whether surcharges are active */
  enabled: boolean
  /** percent = % of outstanding balance; fixed = flat MXN amount */
  type: 'percent' | 'fixed'
  /** The rate or amount (e.g. 5 for 5% or 500 for $500 MXN flat) */
  amount: number
  /** Days overdue before the first surcharge is applied */
  graceDays: number
  /** How often the surcharge compounds */
  frequency: 'monthly' | 'one_time'
}

/** Building bank account and payment method configuration */
export interface BankingConfig {
  /** 18-digit CLABE interbancaria */
  clabe: string
  bankName: string
  accountHolder: string
  acceptsTransfer: boolean
  acceptsCash: boolean
  acceptsOxxo: boolean
  /** How resident constructs their payment reference */
  referenceFormat: 'apartment' | 'custom'
  customReferenceNote?: string
  notes?: string
}

export interface CommunicationConfig {
  canales: { push: boolean; email: boolean; sms: boolean; whatsapp: boolean }
  asambleas: {
    quorumRequired: number // Percentage, e.g. 51
    advanceNoticeDays: number
    allowProxies: boolean
    proxyMaxPerResident: number
  }
}

export interface BuildingConfig {
  /** Property classification (Digital Twin category) */
  propertyCategory: PropertyCategory
  /** Property type: "towers" for high-rise, "houses" for low-rise */
  type: 'towers' | 'houses'
  /** Hierarchy logic: Vertical (Torres/Pisos) vs Horizontal (Manzanas/Privadas) */
  groupingMode: GroupingMode
  /** List of tower/section identifiers (e.g. ["A", "B"]) */
  towers: string[]
  buildingName: string
  buildingAddress: string
  zipCode?: string
  city?: string
  state?: string
  country?: string
  managementCompany: string
  /** Total number of residential units */
  totalUnits: number
  adminName: string
  adminEmail: string
  adminPhone: string
  /** Admin-managed list of payment concepts (e.g. Mantenimiento, Otros) */
  conceptosPago: string[]
  /** Admin-managed sub-items per concept (e.g. Otros → ['Cuota pintura', 'Reparación elevador']) */
  subConceptos?: Record<string, string[]>
  /** Admin-managed list of expense categories */
  categoriasEgreso?: EgresoCategoria[]
  /** Default monthly maintenance fee in MXN */
  monthlyFee: number
  /** Recurring monthly expenses auto-generated each month */
  recurringEgresos: RecurringEgreso[]
  /** Rules for debt maturity */
  maturityRules: FinancialMaturityRules
  /** Moratory surcharge rules — applied by the surcharge engine on matured debts */
  surcharge: SurchargeConfig
  /** Payment method configuration — shown to residents in their payment ledger */
  banking: BankingConfig
  /** Communication and notifications settings */
  communication?: CommunicationConfig
  /** Digital Twin: Spatial zoning mapping */
  zoning: ZoningPoint[]
  /** Digital Twin: Topology hierarchies */
  topology: TopologyParams
  /** Digital Twin: Default unit DNA settings */
  defaultUnitDna: UnitDna
  /** Digital Twin: Global equipment inventory */
  equipment: CriticalEquipment[]
  /** Agentic vendor directory — resolver uses this to route incidents */
  vendors: Vendor[]
  /** ThingWorx-style permissions matrix */
  permissionsMatrix: PermissionMatrix
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
  /** Free-text description of the reason (e.g. "Mantenimiento atrasada Mar-2025", "Daños en elevador") */
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
  /** Base64 data URL of the uploaded receipt (image or PDF) */
  receiptData?: string
  /** MIME category for rendering the receipt */
  receiptType?: 'image' | 'pdf'
  /** Original filename of the receipt */
  receiptName?: string
}
