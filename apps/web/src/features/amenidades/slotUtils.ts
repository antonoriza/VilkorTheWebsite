/**
 * Amenity slot generation utilities.
 * Generates bookable time slots based on per-amenity config.
 */
import type { Amenity, Reservacion } from '../../types'

/** Parse "HH:MM" into total minutes */
function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Format total minutes back to "HH:MM" */
function formatTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export interface TimeSlot {
  label: string      // "10:00 – 14:00"
  available: boolean  // false if already booked
}

/**
 * Generate bookable time slots for an amenity on a specific date.
 * Accounts for slot duration, cleaning buffer, and existing reservations.
 */
export function generateSlots(
  amenity: Amenity,
  date: string,
  reservations: Reservacion[],
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const open = parseMinutes(amenity.openTime || '10:00')
  const close = parseMinutes(amenity.closeTime || '22:00')
  const duration = amenity.slotDurationMinutes || 240
  const buffer = amenity.cleaningBufferMinutes || 0

  let cursor = open
  while (cursor + duration <= close) {
    const start = formatTime(cursor)
    const end = formatTime(cursor + duration)
    const label = `${start} – ${end}`

    // Check if this slot is already booked on the given date
    const isBooked = reservations.some(r =>
      r.date === date &&
      r.grill.startsWith(amenity.name) &&
      r.grill.includes(label) &&
      r.status !== 'Cancelado'
    )

    slots.push({ label, available: !isBooked })
    cursor += duration + buffer
  }

  return slots
}

/** Get max advance date based on amenity config */
export function getMaxDate(amenity: Amenity): string {
  const d = new Date()
  d.setDate(d.getDate() + (amenity.maxAdvanceDays || 30))
  return d.toISOString().split('T')[0]
}

/** Amenity defaults for backward compat with legacy amenities missing new fields */
export function withDefaults(amenity: Amenity): Amenity {
  const defaults = {
    openTime: '10:00',
    closeTime: '22:00',
    slotDurationMinutes: 240,
    cleaningBufferMinutes: 0,
    maxAdvanceDays: 30,
    depositAmount: 500,
    reglamentoType: 'none' as const,
    reglamentoText: '',
    reglamentoPdfUrl: '',
  }
  return { ...defaults, ...amenity }
}
