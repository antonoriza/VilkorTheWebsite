/**
 * Communication types — notifications and announcements.
 * Consumed by: AvisosPage, DashboardLayout, store.
 * Does NOT contain: financial records, tickets, or voting.
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
  /** Publication status: 'published' (default) or 'draft' */
  status?: 'published' | 'draft'
}
