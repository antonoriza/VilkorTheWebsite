/**
 * Amenity, reservation, and package types.
 * Consumed by: AmenidadesPage, PaqueteriaPage, store.
 * Does NOT contain: financial records or user profiles.
 */

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
  /** Physical storage location within the building */
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

// ─── Amenity ─────────────────────────────────────────────────────────

/** A bookable shared amenity */
export interface Amenity {
  id: string
  name: string
  /** Material Symbols icon identifier */
  icon: string

  // Scheduling
  /** Opening time in HH:MM format, e.g. "08:00" */
  openTime: string
  /** Closing time in HH:MM format, e.g. "22:00" */
  closeTime: string
  /** Duration of each bookable slot in minutes */
  slotDurationMinutes: number
  /** Cleaning/buffer gap between reservations in minutes */
  cleaningBufferMinutes: number
  /** Max days in advance a resident can book */
  maxAdvanceDays: number

  // Financial
  /** Per-reservation deposit/fee in MXN */
  depositAmount: number

  // Reglamento
  /** Type of attached rules document */
  reglamentoType: 'none' | 'text' | 'pdf'
  /** Markdown/rich text rules content */
  reglamentoText: string
  /** Base64 or URL for a PDF rules document */
  reglamentoPdfUrl: string
}
