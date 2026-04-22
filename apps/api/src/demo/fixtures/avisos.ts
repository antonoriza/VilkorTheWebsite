/**
 * Demo Fixture — Avisos
 *
 * 2 sample announcements: one pinned general notice,
 * one assembly notification.
 */

export interface DemoAviso {
  title: string
  category: string
  description: string
  date: string
  pinned: number
}

export const avisoData: DemoAviso[] = [
  {
    title: 'Mantenimiento de elevadores',
    category: 'general',
    description:
      'Se realizará mantenimiento preventivo a los elevadores los días 25 y 26 de abril. Se solicita usar escaleras durante el horario de 9:00 a 14:00.',
    date: '2026-04-20',
    pinned: 1,
  },
  {
    title: 'Asamblea Ordinaria Abril 2026',
    category: 'asamblea',
    description:
      'Se convoca a todos los condóminos a la asamblea ordinaria del mes de abril. Orden del día: revisión financiera, mantenimiento preventivo y asuntos generales.',
    date: '2026-04-15',
    pinned: 0,
  },
]
