/**
 * Ticket types — service requests and incident management.
 * Consumed by: TicketsPage, store.
 * Does NOT contain: financial records or user profiles.
 */

/** Allowed service categories for tickets */
export type TicketCategory = string

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
  /** Whether this ticket is visible to all residents for transparency */
  isPublic?: boolean
  /** Name of the staff member or admin assigned to this ticket */
  assignedTo?: string
}
