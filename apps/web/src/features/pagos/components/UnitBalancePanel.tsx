/**
 * UnitBalancePanel — Admin per-unit financial summary with expandable detail.
 * Shows upcoming payments, effective debt, and total balance.
 * Extracted from PagosPage.
 */
import { isEffectiveDebt } from '../../../core/store/maturity'
import type { Pago, Adeudo, Resident, FinancialMaturityRules, AdeudoType } from '../../../types'

const ADEUDO_TYPE_LABELS: Record<AdeudoType, string> = {
  multa: 'Multa', llamado_atencion: 'Llamado de Atención', adeudo: 'Adeudo',
}

interface UnitBalancePanelProps {
  unit: string
  residents: Resident[]
  pagos: Pago[]
  adeudos: Adeudo[]
  maturityRules: FinancialMaturityRules
  todayIso: string
  unitDetailView: 'pagos' | 'adeudos' | 'balance' | null
  onDetailToggle: (view: 'pagos' | 'adeudos' | 'balance') => void
  onDetailClose: () => void
}

export default function UnitBalancePanel({
  unit, residents, pagos, adeudos, maturityRules, todayIso,
  unitDetailView, onDetailToggle, onDetailClose,
}: UnitBalancePanelProps) {
  const res = residents.find(r => r.apartment === unit)
  const uUpcoming = pagos.filter(p => p.apartment === unit && p.status === 'Pendiente' && !isEffectiveDebt(p, todayIso, maturityRules))
  const uOverdue  = pagos.filter(p => p.apartment === unit && (p.status === 'Vencido' || isEffectiveDebt(p, todayIso, maturityRules)))
  const uPagos = [...uUpcoming, ...uOverdue]
  const uAdeudos  = adeudos.filter(a => a.apartment === unit && a.status === 'Activo' && a.amount > 0 && !a.id.startsWith('ad-auto-'))

  const pp = uUpcoming.reduce((s, p) => s + p.amount, 0)
  const aa = uOverdue.reduce((s, p) => s + p.amount, 0) + uAdeudos.reduce((s, a) => s + a.amount, 0)
  const total = aa

  return (
    <div className="space-y-0">
      <div className="bg-slate-900 text-white rounded-t-2xl p-5 flex flex-col md:flex-row md:items-center gap-4" style={unitDetailView ? {} : { borderRadius: '1rem' }}>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resumen Histórico de Unidad</p>
          <p className="text-lg font-headline font-black mt-0.5">{unit}{res ? ` — ${res.name}` : ''}</p>
        </div>
        <div className="flex gap-5 flex-wrap">
          <button onClick={() => onDetailToggle('pagos')} className={`text-center outline-none ring-0 transition-all cursor-pointer px-3 py-1.5 rounded-xl ${unitDetailView === 'pagos' ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
            <p className="text-xl font-headline font-black tabular-nums">${pp.toLocaleString('es-MX')}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Próximos</p>
          </button>
          <div className="w-px bg-slate-700" />
          <button onClick={() => onDetailToggle('adeudos')} className={`text-center outline-none ring-0 transition-all cursor-pointer px-3 py-1.5 rounded-xl ${unitDetailView === 'adeudos' ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
            <p className="text-xl font-headline font-black tabular-nums text-amber-400">${aa.toLocaleString('es-MX')}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deuda Efectiva</p>
          </button>
          <div className="w-px bg-slate-700" />
          <button onClick={() => onDetailToggle('balance')} className={`text-center outline-none ring-0 transition-all cursor-pointer px-3 py-1.5 rounded-xl ${unitDetailView === 'balance' ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
            <p className={`text-2xl font-headline font-black tabular-nums ${aa > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${aa.toLocaleString('es-MX')}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Vencido</p>
          </button>
        </div>
        {aa > 0 && (
          <span className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 rounded-xl text-rose-200 font-bold text-xs tracking-widest uppercase">
            <span className="material-symbols-outlined text-[14px]">warning</span>{uAdeudos.length} adeudo(s)
          </span>
        )}
      </div>

      {/* ── Expandable detail section ── */}
      {unitDetailView && (
        <div className="bg-slate-800 rounded-b-2xl px-5 py-4 border-t border-slate-700/50 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {unitDetailView === 'pagos' && `Pagos pendientes — ${unit}`}
              {unitDetailView === 'adeudos' && `Adeudos activos — ${unit}`}
              {unitDetailView === 'balance' && `Desglose completo — ${unit}`}
            </p>
            <button onClick={onDetailClose} className="text-slate-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Pending pagos rows */}
          {(unitDetailView === 'pagos' || unitDetailView === 'balance') && uPagos.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {unitDetailView === 'balance' && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cargos pendientes</p>}
              {uPagos.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-700/40 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm text-slate-400">receipt_long</span>
                    <div>
                      <p className="text-sm font-bold text-white">{p.concepto}</p>
                      <p className="text-[10px] text-slate-400">{p.month}</p>
                    </div>
                  </div>
                  <p className="text-sm font-headline font-black text-white tabular-nums">${p.amount.toLocaleString('es-MX')}</p>
                </div>
              ))}
            </div>
          )}
          {unitDetailView === 'pagos' && uPagos.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-3">Sin pagos pendientes</p>
          )}

          {/* Adeudos rows */}
          {(unitDetailView === 'adeudos' || unitDetailView === 'balance') && uAdeudos.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {unitDetailView === 'balance' && <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Adeudos activos</p>}
              {uAdeudos.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm text-amber-400">gavel</span>
                    <div>
                      <p className="text-sm font-bold text-amber-200">{a.concepto}</p>
                      <p className="text-[10px] text-amber-400/70">{ADEUDO_TYPE_LABELS[a.type]}</p>
                    </div>
                  </div>
                  <p className="text-sm font-headline font-black text-amber-300 tabular-nums">${a.amount.toLocaleString('es-MX')}</p>
                </div>
              ))}
            </div>
          )}
          {unitDetailView === 'adeudos' && uAdeudos.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-3">Sin adeudos activos</p>
          )}

          {/* Balance total */}
          {unitDetailView === 'balance' && (
            <div className="flex items-center justify-between border-t border-slate-600/50 pt-3 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total adeudo</p>
              <p className={`text-lg font-headline font-black tabular-nums ${total > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${total.toLocaleString('es-MX')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
