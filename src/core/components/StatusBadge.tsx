/**
 * StatusBadge — Visual status indicator pill component.
 *
 * Renders a colored badge for entity statuses across the app.
 * Each status string maps to a specific color scheme (green for positive,
 * amber for pending, rose for negative, slate for neutral).
 *
 * Used in: Pagos, Paquetería, Amenidades, Votaciones tables.
 */

interface StatusBadgeProps {
  /** The status string to display (e.g. "Pagado", "Pendiente", "Cancelado") */
  status: string
  /** Size variant — "sm" for table rows, "md" for card headers */
  size?: 'sm' | 'md'
}

/** Maps status labels to their Tailwind color classes */
const colorMap: Record<string, string> = {
  'Pagado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Pendiente': 'bg-amber-50 text-amber-700 border-amber-100',
  'Entregado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Reservado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Por confirmar': 'bg-amber-50 text-amber-700 border-amber-100',
  'Cancelado': 'bg-rose-50 text-rose-700 border-rose-100',
  'Activa': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Cerrada': 'bg-slate-50 text-slate-500 border-slate-100',
  'EN PROCESO': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'PROGRAMADO': 'bg-slate-50 text-slate-500 border-slate-100',
  // Ticket statuses
  'Nuevo': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Asignado': 'bg-purple-50 text-purple-700 border-purple-100',
  'En Proceso': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Resuelto': 'bg-teal-50 text-teal-700 border-teal-100',
  'Cerrado': 'bg-slate-50 text-slate-500 border-slate-100',
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = colorMap[status] || 'bg-slate-50 text-slate-600 border-slate-100'
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2.5 py-0.5'
    : 'text-xs px-3 py-1'

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-widest rounded-full border ${colors} ${sizeClasses}`}>
      {status}
    </span>
  )
}
