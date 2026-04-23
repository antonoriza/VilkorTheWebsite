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
