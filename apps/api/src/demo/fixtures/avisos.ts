/**
 * Demo Fixture — Avisos
 *
 * 2 sample announcements: one pinned general notice,
 * one assembly notification.
 *
 * Dates are derived dynamically so they always appear recent
 * regardless of when the demo is seeded.
 */

export interface DemoAviso {
  title: string
  category: string
  description: string
  date: string
  pinned: number
}

/** ISO date string for N days ago */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Current month name in Spanish, e.g. "Abril 2026" */
const currentMonthLabel = (() => {
  const now = new Date()
  const month = now.toLocaleDateString('es-MX', { month: 'long' })
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${now.getFullYear()}`
})()

export const avisoData: DemoAviso[] = [
  {
    title: 'Mantenimiento de elevadores',
    category: 'general',
    description:
      `Se realizará mantenimiento preventivo a los elevadores los próximos dos días hábiles. Se solicita usar escaleras durante el horario de 9:00 a 14:00.`,
    date: daysAgo(5),
    pinned: 1,
  },
  {
    title: `Asamblea Ordinaria ${currentMonthLabel}`,
    category: 'asamblea',
    description:
      'Se convoca a todos los condóminos a la asamblea ordinaria del mes. Orden del día: revisión financiera, mantenimiento preventivo y asuntos generales.',
    date: daysAgo(12),
    pinned: 0,
  },
]
