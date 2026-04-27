/**
 * Demo Fixture — Tickets
 *
 * 4 sample maintenance/complaint tickets covering different
 * categories, priorities, and statuses.
 *
 * Resident indices reference the array returned by generateResidents().
 * Each ticket includes a daysAgo offset so timestamps form a
 * realistic timeline instead of all sharing the same instant.
 */

export interface DemoTicket {
  subject: string
  description: string
  category: string
  priority: string
  status: string
  /** Index into the residents array for created_by / apartment */
  residentIndex: number
  /** Days ago the ticket was created (older → larger number) */
  daysAgo: number
  /** Days ago the ticket was resolved — only for resolved/closed tickets */
  resolvedDaysAgo?: number
}

export const ticketData: DemoTicket[] = [
  {
    subject: 'Fuga de agua en baño',
    description: 'Se detectó una fuga en el baño principal del departamento',
    category: 'Plomería',
    priority: 'Alta',
    status: 'Nuevo',
    residentIndex: 0,
    daysAgo: 1,
  },
  {
    subject: 'Foco fundido en pasillo piso 3',
    description: 'El foco del pasillo del 3er piso no enciende desde hace una semana',
    category: 'Electricidad',
    priority: 'Baja',
    status: 'Resuelto',
    residentIndex: 1,
    daysAgo: 7,
    resolvedDaysAgo: 3,
  },
  {
    subject: 'Elevador tarda en abrir',
    description: 'El elevador de Torre DANUBIO tarda más de lo normal en abrir las puertas',
    category: 'Áreas Comunes',
    priority: 'Media',
    status: 'En Proceso',
    residentIndex: 5,
    daysAgo: 4,
  },
  {
    subject: 'Ruido excesivo en depto vecino',
    description: 'El departamento contiguo genera ruido excesivo después de las 22:00',
    category: 'Seguridad',
    priority: 'Media',
    status: 'Asignado',
    residentIndex: 10,
    daysAgo: 2,
  },
]
