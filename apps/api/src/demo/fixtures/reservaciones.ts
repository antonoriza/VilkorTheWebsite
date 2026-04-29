/**
 * Demo Fixture — Reservaciones
 *
 * 6 amenity reservations mixing past, current, and upcoming dates
 * across different statuses and amenity types to showcase the full module.
 * Resident indices reference the array returned by generateResidents().
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
  // Upcoming — confirmed
  { residentIndex: 4,  amenityName: 'Asador',           timeSlot: '18:00 – 22:00', status: 'Reservado',     daysFromNow: 3  },
  { residentIndex: 14, amenityName: 'Cancha de Tenis',   timeSlot: '10:00 – 14:00', status: 'Reservado',     daysFromNow: 5  },
  { residentIndex: 22, amenityName: 'Alberca',           timeSlot: '10:00 – 14:00', status: 'Reservado',     daysFromNow: 7  },
  // Upcoming — pending admin confirmation
  { residentIndex: 30, amenityName: 'Cancha de Fútbol',  timeSlot: '14:00 – 18:00', status: 'Por confirmar', daysFromNow: 2  },
  { residentIndex: 38, amenityName: 'Gimnasio',          timeSlot: '18:00 – 22:00', status: 'Por confirmar', daysFromNow: 10 },
  // Past — cancelled (shows lifecycle)
  { residentIndex: 6,  amenityName: 'Ludoteca',          timeSlot: '14:00 – 18:00', status: 'Cancelado',     daysFromNow: -5 },
]
