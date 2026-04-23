/**
 * EgresoKpiStrip — Status metrics + category breakdown for the egresos sub-tab.
 * Displays: Egresos Pagados, Facturas Pendientes, Flujo Total with category bars.
 */
import { type EgresoCategoria, EGRESO_CATEGORIA_LABELS } from '../../../types/financial'
import { monthKeyToLabel } from '../../../lib/month-utils'
import type { Egreso } from '../../../types/financial'

// ── Category color map (shared constant) ──
const CATEGORY_COLORS: Record<EgresoCategoria, string> = {
  nomina: 'bg-sky-500',
  mantenimiento: 'bg-emerald-500',
  servicios: 'bg-amber-500',
  equipo: 'bg-purple-500',
  seguros: 'bg-indigo-500',
  administracion: 'bg-slate-500',
  otros: 'bg-rose-500',
}

export interface EgresoKpiStripProps {
  egresoKpis: {
    paidCount: number
    paidTotal: number
    pendingCount: number
    pendingTotal: number
    total: number
  }
  ledgerEgresos: Egreso[]
  lFilterMonth: string
  lFilterStatus: string
  showFilters: boolean
  ledgerSubTab: string
  onStatusFilter: (filterKey: string) => void
}

export default function EgresoKpiStrip({
  egresoKpis, ledgerEgresos,
  lFilterMonth, lFilterStatus, showFilters, ledgerSubTab,
  onStatusFilter,
}: EgresoKpiStripProps) {
  // Build totals per category once
  const categoryTotals: Record<string, number> = {}
  ledgerEgresos.forEach(e => {
    categoryTotals[e.categoria] = (categoryTotals[e.categoria] || 0) + e.amount
  })
  const total = egresoKpis.total || 1
  const progress = egresoKpis.total > 0 ? (egresoKpis.paidTotal / egresoKpis.total) * 100 : 0

  const kpis = [
    { label: 'Egresos Pagados', value: egresoKpis.paidCount, amount: egresoKpis.paidTotal, icon: 'check_circle', iconColor: 'text-emerald-600', filterKey: 'Pagado' },
    { label: 'Facturas Pendientes', value: egresoKpis.pendingCount, amount: egresoKpis.pendingTotal, icon: 'schedule', iconColor: 'text-amber-600', filterKey: 'Pendiente' },
    { label: 'Flujo Total', value: ledgerEgresos.length, amount: egresoKpis.total, icon: 'trending_down', iconColor: 'text-rose-600', filterKey: '' },
  ]

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
        {kpis.map(k => {
          const isClickable = !!k.filterKey
          const isActive = isClickable && lFilterStatus === k.filterKey

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
                  {k.label}
                </span>
                {isActive ? (
                  <span className="material-symbols-outlined text-[12px] text-slate-400">filter_alt</span>
                ) : (
                  <span className={`material-symbols-outlined text-[14px] ${k.iconColor} opacity-50 group-hover:opacity-100 transition-opacity`}>{k.icon}</span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-headline font-black tracking-tight tabular-nums transition-colors ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                  ${k.amount.toLocaleString('es-MX')}
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest tabular-nums font-sans">
                  {k.value} regs.
                </span>
              </div>

              {/* Progress Lines */}
              {k.label === 'Egresos Pagados' && (
                <>
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000 ease-out bg-emerald-500 rounded-full"
                      style={{ width: `${Math.max(progress, 1)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-black mt-1 tabular-nums text-slate-400">
                    {progress.toFixed(1)}% liquidado
                  </span>
                </>
              )}

              {k.label === 'Flujo Total' && (
                <>
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 flex overflow-hidden">
                    {(Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => {
                      const pct = ((categoryTotals[cat] || 0) / total) * 100
                      if (pct === 0) return null
                      return <div key={cat} className={`h-full ${CATEGORY_COLORS[cat]}`} style={{ width: `${pct}%` }} title={`${EGRESO_CATEGORIA_LABELS[cat]}: ${pct.toFixed(1)}%`} />
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                    {(Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => {
                      const pct = ((categoryTotals[cat] || 0) / total) * 100
                      if (pct < 5) return null
                      return (
                        <span key={cat} className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-slate-400">
                          <div className={`w-1 h-1 rounded-full ${CATEGORY_COLORS[cat]}`} />
                          {EGRESO_CATEGORIA_LABELS[cat].split(' ')[0]}
                        </span>
                      )
                    })}
                  </div>
                </>
              )}

              {k.label === 'Facturas Pendientes' && (
                <span className="text-[9px] font-black mt-1 tabular-nums text-slate-300 uppercase tracking-widest">
                  {ledgerSubTab}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
