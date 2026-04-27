/**
 * IngresoKpiStrip — Status metrics for the ingresos sub-tab.
 * Displays: Recaudación Mantenimiento, Deuda Efectiva, Próximos Cargos.
 */
import { monthKeyToLabel } from '../../../lib/month-utils'

export interface KpiItem {
  label: string
  value: number
  amount: number
  icon: string
  color: string
  iconColor: string
  filterKey: string
  showInGlobal: boolean
}

export interface IngresoKpiStripProps {
  kpiItems: KpiItem[]
  ledgerKpis: {
    expectedMantenimientoTotal: number
    paidMantenimientoTotal: number
    paidTotal: number
  }
  totalEgresosPaid: number
  lFilterMonth: string
  lFilterStatus: string
  showFilters: boolean
  todayKey: string
  onStatusFilter: (filterKey: string) => void
}

export default function IngresoKpiStrip({
  kpiItems, ledgerKpis, totalEgresosPaid,
  lFilterMonth, lFilterStatus, showFilters, todayKey,
  onStatusFilter,
}: IngresoKpiStripProps) {
  const surplus = ledgerKpis.paidTotal - totalEgresosPaid
  const isPositive = surplus >= 0
  const visibleKpis = kpiItems.filter(k => {
    if (k.label === 'Próximos Cargos') {
      return !lFilterMonth || lFilterMonth >= todayKey
    }
    return !!lFilterMonth || k.showInGlobal
  })

  return (
    <div className="mt-2 mb-6 border border-slate-100 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* ── Contextual Eyebrow ── */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px] opacity-100 text-slate-400">calendar_today</span>
          {lFilterMonth ? monthKeyToLabel(lFilterMonth) : 'Acumulado Histórico'}
        </span>
        {showFilters && (
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
            Vista Filtrada
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        {/* ── Superávit Operativo (always first) ── */}
        <div className="relative flex-1 flex flex-col justify-center p-4 cursor-default">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              Superávit Operativo
            </span>
            <span className={`material-symbols-outlined text-[14px] ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-headline font-black tracking-tight tabular-nums ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isPositive ? '' : '−'}${Math.abs(surplus).toLocaleString('es-MX')}
            </span>
          </div>
          <span className="text-[9px] font-bold mt-1 text-slate-400">
            {lFilterMonth ? 'Cobrado − Gastado este mes' : 'Ingresos cobrados − Egresos pagados'}
          </span>
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] overflow-hidden">
            <div className={`h-full w-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ opacity: 0.3 }} />
          </div>
        </div>
        {visibleKpis.map(k => {
          const isClickable = !!k.filterKey
          const isActive = isClickable && lFilterStatus === k.filterKey

          // Progress bar percentage — only used for Recaudación Mantenimiento
          const progress = k.label === 'Recaudación Mantenimiento' && ledgerKpis.expectedMantenimientoTotal > 0
            ? (ledgerKpis.paidMantenimientoTotal / ledgerKpis.expectedMantenimientoTotal) * 100
            : 0

          const isZeroDebt = k.filterKey === 'Vencido' && k.amount === 0

          return (
            <button
              key={k.label}
              type="button"
              onClick={() => {
                if (!isClickable) return
                onStatusFilter(lFilterStatus === k.filterKey ? '' : k.filterKey)
              }}
              className={`relative flex-1 flex flex-col justify-center p-4 transition-all duration-300 group outline-none ${
                isClickable ? 'cursor-pointer hover:bg-slate-50/80' : 'cursor-default'
              } ${isActive ? 'bg-slate-50/50 pt-3.5' : ''}`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-900 animate-in slide-in-from-top-full duration-300" />
              )}

              <div className="flex items-baseline justify-between mb-1.5">
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'}`}>
                  {isZeroDebt ? 'Historial Limpio' : k.label}
                </span>
                {isActive && (
                  <span className="material-symbols-outlined text-[12px] text-slate-400">filter_alt</span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-headline font-black tracking-tight tabular-nums transition-colors ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                  {isZeroDebt ? 'Sin Deuda' : `$${k.amount.toLocaleString('es-MX')}`}
                </span>
                {!isZeroDebt && (
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest tabular-nums">
                    {k.value} regs.
                  </span>
                )}
              </div>

              {/* Progress Line (Mantenimiento only) */}
              {k.label === 'Recaudación Mantenimiento' && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${k.color} rounded-full`}
                    style={{ width: `${Math.max(progress, 1)}%` }}
                  />
                </div>
              )}

              {/* Secondary info — contextual per card */}
              {k.label === 'Recaudación Mantenimiento' && (
                <span className={`text-[9px] font-black mt-1 tabular-nums ${progress >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {progress.toFixed(1)}% recolectado
                </span>
              )}
              {!isZeroDebt && k.label === 'Deuda Efectiva' && (
                <span className={`text-[9px] font-black mt-1 tabular-nums ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                  {k.value} {k.value === 1 ? 'unidad' : 'unidades'} con adeudo
                </span>
              )}
              {k.label === 'En Revisión' && (
                <span className={`text-[9px] font-black mt-1 tabular-nums ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                  {k.value} {k.value === 1 ? 'comprobante' : 'comprobantes'} por aprobar
                </span>
              )}
              {k.label === 'Próximos Cargos' && (
                <span className={`text-[9px] font-black mt-1 tabular-nums ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                  {k.value} {k.value === 1 ? 'cobro' : 'cobros'} por vencer
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
