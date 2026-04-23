/**
 * Resident and staff types — people management.
 * Consumed by: UsuariosPage, store, dashboard.
 * Does NOT contain: financial records or building configuration.
 */

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
  /** Contact phone number */
  phone?: string
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

/**
 * A planned or reactive deviation from a staff member's regular schedule.
 * - Planned (set from Usuarios/staff profile): type 'vacation' | 'pre_authorized'
 * - Reactive (set from Dashboard, day-of): type 'absence' | 'substitute'
 */
export interface ShiftOverride {
  id: string
  staffId: string
  /** Override category */
  type: 'vacation' | 'pre_authorized' | 'absence' | 'substitute'
  /** Inclusive start date YYYY-MM-DD */
  startDate: string
  /** Inclusive end date YYYY-MM-DD (same as startDate for single-day) */
  endDate: string
  /** ID of another StaffMember covering this period (optional) */
  substituteStaffId?: string
  /** Free-text name if substitute is external (not in staff list) */
  substituteExternal?: string
  /** Optional note for audit trail */
  note?: string
  /** Username / role of the person who created this record */
  reportedBy: string
  /** ISO timestamp of creation */
  reportedAt: string
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
