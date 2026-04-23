/**
 * LedgerTables — Ingresos + Egresos data tables.
 * Consumed by: PagosPage (ledger tab).
 * Does NOT handle: filter logic or table header/filter bar (those remain in PagosPage).
 */
import { Fragment } from 'react'
import StatusBadge from '../../../core/components/StatusBadge'
import { isEffectiveDebt } from '../../../core/store/maturity'
import { EGRESO_CATEGORIA_LABELS } from '../../../types/financial'
import type { FinancialMaturityRules } from '../../../types/financial'
import { MONTH_NAMES_ES, monthKeyToLabel } from '../../../lib/month-utils'
import type { Pago, Egreso } from '../../../types'
import type { LedgerSortKey, SortDir } from '../hooks/useLedgerData'

// ── Reusable sortable th ──
function SortTh<K extends string>({ col, label, right, sortKey: sk, sortDir: sd, onSort }: {
  col: K; label: string; right?: boolean; sortKey: K; sortDir: SortDir; onSort: (k: K) => void
}) {
  const icon = sk !== col
    ? <span className="material-symbols-outlined text-[11px] text-slate-300 ml-0.5">unfold_more</span>
    : <span className="material-symbols-outlined text-[11px] text-slate-600 ml-0.5">{sd === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  return (
    <th onClick={() => onSort(col)}
      className={`px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-700 select-none whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      <span className="inline-flex items-center">{label}{icon}</span>
    </th>
  )
}

// ═══════════════════════════════════════════════════════════════════
// INGRESOS TABLE
// ═══════════════════════════════════════════════════════════════════

interface IngresosTableProps {
  filteredPagos: Pago[]
  isAdmin: boolean
  sortKey: LedgerSortKey
  sortDir: SortDir
  todayIso: string
  maturityRules: FinancialMaturityRules
  onSort: (k: LedgerSortKey) => void
  onToggleStatus: (id: string) => void
  onRejectPago: (id: string) => void
  onResidentPay: (id: string) => void
  onPreview: (pago: Pago) => void
}

export function IngresosTable({
  filteredPagos, isAdmin, sortKey, sortDir, todayIso, maturityRules,
  onSort, onToggleStatus, onRejectPago, onResidentPay, onPreview,
}: IngresosTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {isAdmin && <SortTh col="apartment" label="Unidad" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />}
            <SortTh col="concepto" label="Concepto" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <SortTh col="month" label="Mes" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <SortTh col="amount" label="Monto" right sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprobante</th>
            <SortTh col="status" label="Estado" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <SortTh col="paymentDate" label="Fecha" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredPagos.map(pago => (
            <tr key={pago.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
              {isAdmin && (
                <td className="px-5 py-4">
                  <p className="text-sm font-black text-slate-900">{pago.apartment}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{pago.resident}</p>
                </td>
              )}
              <td className="px-5 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest self-start ${(() => {
                    const base = (pago.concepto || '').split(/[:—]/)[0].trim()
                    if (pago.adeudoId || base === 'Multa' || base === 'Otros') return 'bg-rose-50 text-rose-700'
                    if (base === 'Reserva Amenidad') return 'bg-indigo-50 text-indigo-700'
                    return 'bg-slate-100 text-slate-600'
                  })()}`}>
                    {pago.adeudoId && <span className="material-symbols-outlined text-[11px]">gavel</span>}
                    {pago.concepto || 'Mantenimiento'}
                  </span>
                  {pago.notes && (
                    <span className="text-[9px] text-amber-600 font-semibold ml-0.5 italic">{pago.notes}</span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-slate-700 capitalize">{pago.month}</p>
                {pago.status === 'Pendiente' && !isEffectiveDebt(pago, todayIso, maturityRules) && (() => {
                  const base = (pago.concepto || '').split(/[:—]/)[0].trim()
                  let venceDate: Date | null = null

                  if (base === 'Mantenimiento' && pago.monthKey) {
                    const [y, m] = pago.monthKey.split('-').map(Number)
                    const day = (maturityRules.mantenimiento === 'next_month_10') ? 10 : 1
                    venceDate = new Date(y, m, day)
                  }
                  if (base === 'Reserva Amenidad' && pago.monthKey) {
                    const parts = pago.monthKey.split('-').map(Number)
                    if (parts.length === 3) venceDate = new Date(parts[0], parts[1] - 1, parts[2])
                    else if (parts.length === 2) venceDate = new Date(parts[0], parts[1], 0)
                    if (venceDate && maturityRules.amenidad === '1_day_before') venceDate.setDate(venceDate.getDate() - 1)
                  }
                  if ((base === 'Multa' || base === 'Otros') && maturityRules.multaOtros === '7_days_grace') {
                    const [y, m] = (pago.monthKey || todayIso.slice(0, 7)).split('-').map(Number)
                    venceDate = new Date(y, m - 1, 7)
                  }

                  if (venceDate) {
                    return (
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter mt-1">
                        Vence el {venceDate.getDate().toString().padStart(2, '0')} de {MONTH_NAMES_ES[venceDate.getMonth()]}
                      </p>
                    )
                  }
                  return null
                })()}
              </td>
              <td className="px-5 py-4 text-sm font-black text-slate-900 text-right tabular-nums">${pago.amount.toLocaleString('es-MX')}</td>
              <td className="px-5 py-4">
                {pago.receiptData ? (
                  <button onClick={() => onPreview(pago)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[14px]">{pago.receiptType === 'pdf' ? 'picture_as_pdf' : 'image'}</span>Ver
                  </button>
                ) : (
                  <span className="text-slate-200 text-[10px] font-bold uppercase tracking-widest">—</span>
                )}
              </td>
              <td className="px-5 py-4"><StatusBadge status={pago.status} /></td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-500 tabular-nums">{pago.paymentDate || '—'}</td>
              {isAdmin && (
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {pago.status === 'Pendiente' && (
                      <button onClick={() => onToggleStatus(pago.id)}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                        Aprobar
                      </button>
                    )}
                    {pago.status === 'Por validar' && (
                      <>
                        <button onClick={() => onToggleStatus(pago.id)}
                          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                          Aprobar
                        </button>
                        <button onClick={() => onRejectPago(pago.id)}
                          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100">
                          Rechazar
                        </button>
                      </>
                    )}
                    {pago.status === 'Pagado' && (
                      <button onClick={() => onToggleStatus(pago.id)}
                        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-slate-50 text-slate-500 border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200">
                        Revocar
                      </button>
                    )}
                  </div>
                </td>
              )}
              {!isAdmin && (
                <td className="px-5 py-4 text-center">
                  {(pago.status === 'Pendiente' || pago.status === 'Vencido') && (
                    <button onClick={() => onResidentPay(pago.id)}
                      className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all bg-slate-900 text-white border-slate-900 hover:bg-slate-800">
                      Pagar
                    </button>
                  )}
                  {pago.status === 'Por validar' && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">En revisión</span>
                  )}
                  {pago.status === 'Pagado' && (
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">✓</span>
                  )}
                </td>
              )}
            </tr>
          ))}
          {filteredPagos.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 8 : 6} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-slate-200">receipt_long</span>
                  <p className="text-slate-400 font-medium text-sm">Sin registros para los filtros seleccionados.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EGRESOS TABLE
// ═══════════════════════════════════════════════════════════════════

interface EgresosTableProps {
  ledgerEgresos: Egreso[]
  onToggleStatus: (id: string) => void
  onPreview: (eg: Egreso) => void
  onDelete: (id: string) => void
}

export function EgresosTable({ ledgerEgresos, onToggleStatus, onPreview, onDelete }: EgresosTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Concepto</th>
            <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto</th>
            <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
            <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acción</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let lastMonth = ''
            return ledgerEgresos.map(eg => {
              const currentMonth = eg.monthKey
              const isNewMonth = currentMonth !== lastMonth
              lastMonth = currentMonth

              return (
                <Fragment key={eg.id}>
                  {isNewMonth && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="px-5 py-2.5 border-y border-slate-100/50">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {monthKeyToLabel(currentMonth)}
                          </span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-50 hover:bg-slate-50/80 transition-all group">
                    <td className="px-5 py-4 text-xs font-semibold text-slate-500 tabular-nums whitespace-nowrap">{eg.date}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">
                        {EGRESO_CATEGORIA_LABELS[eg.categoria].split(' ')[0]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-black transition-colors">{eg.concepto}</span>
                        {eg.description && <span className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">{eg.description}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-rose-600 text-right tabular-nums">-${eg.amount.toLocaleString('es-MX')}</td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <StatusBadge status={eg.status} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={() => onToggleStatus(eg.id)}
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 transition-all ${
                            eg.status === 'Pendiente'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                          }`}>
                          {eg.status === 'Pendiente' ? 'Pagar' : 'Revertir'}
                        </button>
                        {eg.receiptData && (
                          <button onClick={() => onPreview(eg)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" title="Ver Comprobante">
                            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                          </button>
                        )}
                        <button onClick={() => onDelete(eg.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all" title="Eliminar">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              )
            })
          })()}
          {ledgerEgresos.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-slate-200">account_balance</span>
                  <p className="text-slate-400 font-medium text-sm">Sin egresos registrados en este período.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
