/**
 * EmptyState — Shared contextual empty state component.
 *
 * Usage:
 *   <EmptyState
 *     icon="receipt_long"
 *     title="Sin pagos registrados"
 *     subtitle="Agrega residentes primero para comenzar a generar cobros de mantenimiento."
 *     action={{ label: 'Ir a Usuarios', href: '/admin/usuarios' }}
 *   />
 *
 * Variants:
 *   - default: centered card with dashed border (for list areas)
 *   - page: full page centered (for when entire page is empty, e.g. Amenidades)
 */
import { Link } from 'react-router-dom'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface Props {
  icon: string
  title: string
  subtitle?: string
  action?: EmptyStateAction
  variant?: 'default' | 'page'
  className?: string
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
  variant = 'default',
  className = '',
}: Props) {
  if (variant === 'page') {
    return (
      <div className={`flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-700 ${className}`}>
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
          <span className="material-symbols-outlined text-5xl text-slate-300">{icon}</span>
        </div>
        <h3 className="text-xl font-headline font-black text-slate-900 uppercase tracking-widest mb-2">{title}</h3>
        {subtitle && (
          <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed mb-6">{subtitle}</p>
        )}
        {action && <EmptyStateAction action={action} />}
      </div>
    )
  }

  return (
    <div className={`p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in duration-500 ${className}`}>
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
        <span className="material-symbols-outlined text-3xl text-slate-300">{icon}</span>
      </div>
      <p className="text-sm font-black text-slate-700 mb-1">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed mt-1 mb-4">{subtitle}</p>
      )}
      {action && <EmptyStateAction action={action} />}
    </div>
  )
}

function EmptyStateAction({ action }: { action: EmptyStateAction }) {
  const cls = 'inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-[11px] uppercase tracking-widest shadow-sm'

  if (action.href) {
    return (
      <Link to={action.href} className={cls}>
        <span className="material-symbols-outlined text-base">arrow_forward</span>
        {action.label}
      </Link>
    )
  }
  return (
    <button onClick={action.onClick} className={cls}>
      <span className="material-symbols-outlined text-base">add</span>
      {action.label}
    </button>
  )
}
