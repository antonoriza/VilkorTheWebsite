interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

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
