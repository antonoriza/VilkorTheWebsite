/**
 * LedgerTables — Ingresos + Egresos data tables.
 * Consumed by: PagosPage (ledger tab).
 * Does NOT handle: filter logic or table header/filter bar (those remain in PagosPage).
 */
import { Fragment, useState, useMemo, useRef } from 'react'
import StatusBadge from '../../../core/components/StatusBadge'
import { isEffectiveDebt, getMaturityTargetDate } from '../../../core/store/maturity'
import { EGRESO_CATEGORIA_LABELS } from '../../../types/financial'
import type { FinancialMaturityRules, ConceptoFinanciero } from '../../../types/financial'
import { MONTH_NAMES_ES, monthKeyToLabel } from '../../../lib/month-utils'
import type { Pago, Egreso } from '../../../types'
import type { LedgerSortKey, SortDir } from '../hooks/useLedgerData'

const PAGE_SIZE = 50

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

// ── Pagination Controls ──
function PaginationBar({ page, totalPages, total, onPageChange }: {
  page: number; totalPages: number; total: number; onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const start = page * PAGE_SIZE + 1
  const end = Math.min((page + 1) * PAGE_SIZE, total)
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
      <span className="text-[10px] font-bold text-slate-400 tabular-nums">
        {start}–{end} de {total} registros
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
          let pageNum: number
          if (totalPages <= 7) {
            pageNum = i
          } else if (page < 3) {
            pageNum = i
          } else if (page > totalPages - 4) {
            pageNum = totalPages - 7 + i
          } else {
            pageNum = page - 3 + i
          }
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                page === pageNum
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >{pageNum + 1}</button>
          )
        })}
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

// ── Revocar dropdown ──
function RevokeMenu({ onRevoke }: { onRevoke: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
        title="Más opciones"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => { setOpen(false); onRevoke() }}
              className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[14px]">undo</span>
              Revocar Pago
            </button>
          </div>
        </>
      )}
    </div>
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
  catalog?: ConceptoFinanciero[]
  onSort: (k: LedgerSortKey) => void
  onToggleStatus: (id: string) => void
  onRejectPago: (id: string) => void
  onResidentPay: (id: string) => void
  onPreview: (pago: Pago) => void
}

export function IngresosTable({
  filteredPagos, isAdmin, sortKey, sortDir, todayIso, maturityRules, catalog,
  onSort, onToggleStatus, onRejectPago, onResidentPay, onPreview,
}: IngresosTableProps) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(filteredPagos.length / PAGE_SIZE)
  const paginatedPagos = filteredPagos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when data changes
  useMemo(() => { if (page >= totalPages && totalPages > 0) setPage(totalPages - 1) }, [totalPages])

  return (
    <>
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
            {paginatedPagos.map(pago => (
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
                  {/* Vence date — derived from canonical maturity engine */}
                  {pago.status === 'Pendiente' && !isEffectiveDebt(pago, todayIso, maturityRules, catalog) && (() => {
                    const venceDate = getMaturityTargetDate(pago, maturityRules, todayIso, catalog)
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
                        <RevokeMenu onRevoke={() => onToggleStatus(pago.id)} />
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
      <PaginationBar page={page} totalPages={totalPages} total={filteredPagos.length} onPageChange={setPage} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EGRESOS TABLE
// ═══════════════════════════════════════════════════════════════════

interface ReceiptPreviewable {
  apartment?: string
  month?: string
  amount: number
  paymentDate?: string | null
  receiptData?: string
  receiptType?: 'image' | 'pdf'
  receiptName?: string
}

interface EgresosTableProps {
  ledgerEgresos: Egreso[]
  onToggleStatus: (id: string) => void
  onPreview: (item: ReceiptPreviewable) => void
  onDelete: (id: string) => void
}

export function EgresosTable({ ledgerEgresos, onToggleStatus, onPreview, onDelete }: EgresosTableProps) {
  type ESortKey = 'date' | 'categoria' | 'concepto' | 'amount' | 'status'
  const [sk, setSk] = useState<ESortKey>('date')
  const [sd, setSd] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const handleESort = (col: ESortKey) => {
    if (col === sk) setSd(d => d === 'asc' ? 'desc' : 'asc')
    else { setSk(col); setSd('asc') }
  }

  const sortedEgresos = useMemo(() => {
    return [...ledgerEgresos].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sk === 'date') { av = a.date; bv = b.date }
      else if (sk === 'categoria') { av = a.categoria; bv = b.categoria }
      else if (sk === 'concepto') { av = a.concepto; bv = b.concepto }
      else if (sk === 'amount') { av = a.amount; bv = b.amount }
      else if (sk === 'status') { av = a.status; bv = b.status }
      if (typeof av === 'number' && typeof bv === 'number') {
        return sd === 'asc' ? av - bv : bv - av
      }
      const cmp = String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' })
      return sd === 'asc' ? cmp : -cmp
    })
  }, [ledgerEgresos, sk, sd])

  const totalPages = Math.ceil(sortedEgresos.length / PAGE_SIZE)
  const paginatedEgresos = sortedEgresos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  useMemo(() => { if (page >= totalPages && totalPages > 0) setPage(totalPages - 1) }, [totalPages])

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <SortTh col="date"      label="Fecha"     sortKey={sk} sortDir={sd} onSort={handleESort} />
              <SortTh col="categoria" label="Categoría" sortKey={sk} sortDir={sd} onSort={handleESort} />
              <SortTh col="concepto"  label="Concepto"  sortKey={sk} sortDir={sd} onSort={handleESort} />
              <SortTh col="amount"    label="Monto"     right sortKey={sk} sortDir={sd} onSort={handleESort} />
              <SortTh col="status"    label="Estado"    sortKey={sk} sortDir={sd} onSort={handleESort} />
              <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let lastMonth = ''
              return paginatedEgresos.map(eg => {
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
                            <button onClick={() => onPreview({
                              apartment: eg.concepto,
                              month: monthKeyToLabel(eg.monthKey),
                              amount: eg.amount,
                              paymentDate: eg.date,
                              receiptData: eg.receiptData,
                              receiptType: eg.receiptType,
                              receiptName: eg.receiptName,
                            })}
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
            {sortedEgresos.length === 0 && (
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
      <PaginationBar page={page} totalPages={totalPages} total={sortedEgresos.length} onPageChange={setPage} />
    </>
  )
}
