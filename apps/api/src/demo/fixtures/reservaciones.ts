/**
 * Demo Fixture — Reservaciones
 *
 * 14 amenity reservations mixing past, current, and upcoming dates
 * across different statuses and amenity types to showcase the full module.
 * Resident indices reference the array returned by generateResidents().
 *
 * Time slots are realistic per amenity:
 *   Asador         → evening use: 14:00–18:00 or 18:00–22:00 (4hr slots)
 *   Alberca        → morning/afternoon: 08:00–12:00 or 12:00–16:00 (4hr slots)
 *   Cancha Tenis   → short morning/evening: 08:00–10:00, 10:00–12:00 (2hr slots)
 *   Cancha Fútbol  → afternoon/evening: 16:00–18:00, 18:00–20:00 (2hr slots)
 *   Gimnasio       → early morning or evening: 06:00–08:00, 18:00–20:00 (2hr slots)
 *   Ludoteca       → daytime kids: 10:00–12:00, 14:00–16:00 (2hr slots)
 *   Salón Eventos  → half-day blocks: 10:00–14:00, 14:00–19:00, 19:00–23:00 (4–5hr)
 */

export interface DemoReservacion {
  residentIndex: number
  amenityName: string
  timeSlot: string
  status: 'Reservado' | 'Por confirmar' | 'Cancelado'
  /** Days from today (negative = past, positive = future) */
  daysFromNow: number
}

export const reservacionData: DemoReservacion[] = [
  // ── Upcoming — confirmed ──────────────────────────────────────────
  { residentIndex: 4,  amenityName: 'Asador',          timeSlot: '18:00 – 22:00', status: 'Reservado',     daysFromNow: 2  },
  { residentIndex: 14, amenityName: 'Cancha de Tenis',  timeSlot: '08:00 – 10:00', status: 'Reservado',     daysFromNow: 3  },
  { residentIndex: 22, amenityName: 'Alberca',          timeSlot: '08:00 – 12:00', status: 'Reservado',     daysFromNow: 3  },
  { residentIndex: 10, amenityName: 'Asador',          timeSlot: '14:00 – 18:00', status: 'Reservado',     daysFromNow: 5  },
  { residentIndex: 44, amenityName: 'Gimnasio',         timeSlot: '06:00 – 08:00', status: 'Reservado',     daysFromNow: 5  },
  { residentIndex: 58, amenityName: 'Alberca',          timeSlot: '12:00 – 16:00', status: 'Reservado',     daysFromNow: 7  },
  { residentIndex: 70, amenityName: 'Cancha de Tenis',  timeSlot: '10:00 – 12:00', status: 'Reservado',     daysFromNow: 7  },
  { residentIndex: 82, amenityName: 'Ludoteca',         timeSlot: '10:00 – 12:00', status: 'Reservado',     daysFromNow: 9  },

  // ── Upcoming — pending admin confirmation ─────────────────────────
  { residentIndex: 30, amenityName: 'Cancha de Fútbol', timeSlot: '16:00 – 18:00', status: 'Por confirmar', daysFromNow: 4  },
  { residentIndex: 38, amenityName: 'Gimnasio',         timeSlot: '18:00 – 20:00', status: 'Por confirmar', daysFromNow: 6  },
  { residentIndex: 50, amenityName: 'Asador',          timeSlot: '18:00 – 22:00', status: 'Por confirmar', daysFromNow: 8  },

  // ── Past — various outcomes ────────────────────────────────────────
  { residentIndex: 6,  amenityName: 'Ludoteca',         timeSlot: '14:00 – 16:00', status: 'Cancelado',     daysFromNow: -5 },
  { residentIndex: 18, amenityName: 'Cancha de Fútbol', timeSlot: '18:00 – 20:00', status: 'Reservado',     daysFromNow: -3 },
  { residentIndex: 26, amenityName: 'Alberca',          timeSlot: '08:00 – 12:00', status: 'Reservado',     daysFromNow: -1 },
]
