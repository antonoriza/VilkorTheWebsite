/**
 * PagosPage — Unified Financial Hub.
 *
 * Two tabs:
 *   1. "Estado de Cuenta" — billing ledger (all Pago records).
 *   2. "Expediente"        — compliance/enforcement (all Adeudo records).
 *
 * Unified registration modal with 5 charge types:
 *   - Mantenimiento / Rentas      → creates Pago only.
 *   - Multa / Otros              → creates BOTH Pago + Adeudo (linked) in one click.
 *   - Llamado de Atención         → creates Adeudo only (non-financial).
 *
 * Admin sees both tabs + KPIs + unit balance panel.
 * Resident sees ledger tab only + adeudo summary card.
 */
import { useState, useMemo, useCallback, useEffect, Fragment } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore, isEffectiveDebt } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import EmptyState from '../../core/components/EmptyState'
import { type Pago, type AdeudoType, type EgresoCategoria, EGRESO_CATEGORIA_LABELS } from '../../types'
import { pdf } from '@react-pdf/renderer'
import FinancialReportPDF, { type ReportData, type IncomeRow, type ExpenseRow } from './FinancialReportPDF'

// ─── Shared helpers ──────────────────────────────────────────────────

const MONTH_NAMES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]
const MONTH_ABBR_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function monthKeyToLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_NAMES_ES[parseInt(month, 10) - 1] || ''} de ${year}`
}

function generateMonthRange(): string[] {
  const keys: string[] = []
  const now = new Date()
  const start = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const end = new Date(now.getFullYear() + 1, now.getMonth(), 1)
  const cur = new Date(start)
  while (cur <= end) {
    keys.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return keys
}

const MONTH_RANGE = generateMonthRange()
const TODAY_KEY = (() => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
})()
const TODAY_ISO = new Date().toISOString().split('T')[0]

// ── Adeudo type labels ──

const ADEUDO_TYPE_LABELS: Record<AdeudoType, string> = {
  multa: 'Multa', llamado_atencion: 'Llamado de Atención', adeudo: 'Adeudo',
}


// ── Charge type for unified modal ──
type ChargeType = 'ingreso' | 'egreso'

// Sort types
type LedgerSortKey = 'apartment' | 'concepto' | 'month' | 'amount' | 'paymentDate' | 'status'
type SortDir = 'asc' | 'desc'
type ActiveTab = 'ledger' | 'report'

// ═══════════════════════════════════════════════════════════════════════

export default function PagosPage() {
  const { role, apartment: myApartment } = useAuth()
  const { state, dispatch } = useStore()
  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'
  const bc = state.buildingConfig

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('ledger')

  // ── State Sanitizer: Purge redundant auto-summary records on mount ──
  useEffect(() => {
    if (!isAdmin) return
    const autoAdeudos = state.adeudos.filter(a => a.id.startsWith('ad-auto-'))
    autoAdeudos.forEach(a => dispatch({ type: 'DELETE_ADEUDO', payload: a.id }))
  }, [isAdmin, state.adeudos.length, dispatch]) // Runs if length changes, ensuring all are purged

  const [lFilterMonth, setLFilterMonth]   = useState('') // Default to Historic (All months)
  const [lFilterTower, setLFilterTower]   = useState('')
  const [lFilterUnit, setLFilterUnit]     = useState('')
  const [lFilterStatus, setLFilterStatus] = useState('')
  const [lFilterConcepto, setLFilterConcepto] = useState('')
  const [lSortKey, setLSortKey]           = useState<LedgerSortKey>('apartment')
  const [lSortDir, setLSortDir]           = useState<SortDir>('asc')
  const [ledgerSubTab, setLedgerSubTab]   = useState<'ingresos' | 'egresos'>('ingresos')
  const [unitDetailView, setUnitDetailView] = useState<'pagos' | 'adeudos' | 'balance' | null>(null)
  const [showFilters, setShowFilters]     = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())

  // ── Auto-process maturity on mount ──
  useEffect(() => {
    dispatch({ type: 'PROCESS_MATURITY', payload: { nowIso: TODAY_ISO } })
  }, [dispatch])

  // ── Derived filter logic ──
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onClear: () => void }[] = []
    if (lFilterMonth) filters.push({ key: 'month', label: `Mes: ${monthKeyToLabel(lFilterMonth)}`, onClear: () => setLFilterMonth('') })
    if (lFilterTower) filters.push({ key: 'tower', label: `Torre: ${lFilterTower}`, onClear: () => { setLFilterTower(''); setLFilterUnit('') } })
    if (lFilterUnit) filters.push({ key: 'unit', label: `Unidad: ${lFilterUnit}`, onClear: () => { setLFilterUnit(''); setUnitDetailView(null) } })
    if (lFilterConcepto) filters.push({ key: 'concepto', label: `Concepto: ${lFilterConcepto}`, onClear: () => setLFilterConcepto('') })
    if (lFilterStatus) {
      const statusLabel = lFilterStatus === 'Pendiente' ? 'Adeudos' : lFilterStatus === 'Por validar' ? 'En Revisión' : lFilterStatus
      filters.push({ key: 'status', label: `Estado: ${statusLabel}`, onClear: () => { setLFilterStatus(''); setLFilterMonth('') } })
    }
    return filters
  }, [lFilterMonth, lFilterTower, lFilterUnit, lFilterConcepto, lFilterStatus])

  // ── Month Picker Groups ──
  const monthsByYear = useMemo(() => {
    const map: Record<number, string[]> = {}
    MONTH_RANGE.forEach(m => {
      const y = parseInt(m.split('-')[0], 10)
      if (!map[y]) map[y] = []
      map[y].push(m)
    })
    return map
  }, [])
  const pickerYears = useMemo(() => Object.keys(monthsByYear).map(Number).sort((a,b) => b-a), [monthsByYear])

  const clearAllFilters = useCallback(() => {
    setLFilterMonth('')
    setLFilterTower('')
    setLFilterUnit('')
    setLFilterConcepto('')
    setLFilterStatus('')
    setUnitDetailView(null)
  }, [])

  // ── Unified modal ──
  const [showModal, setShowModal]             = useState(false)
  const [chargeType, setChargeType]           = useState<ChargeType>('ingreso')
  const [mTower, setMTower]                   = useState('')
  const [mUnit, setMUnit]                     = useState('')
  const [mAmount, setMAmount]                 = useState('')
  const [mConcepto, setMConcepto]             = useState('')
  const [mSubConcepto, setMSubConcepto]       = useState('')
  const [mMotivo, setMMotivo]                 = useState('')
  const [mMulti, setMMulti]                   = useState(false)
  const [mMonths, setMMonths]                 = useState<string[]>([TODAY_KEY])
  const [mSingleMonth, setMSingleMonth]       = useState(TODAY_KEY)
  const [mReceiptData, setMReceiptData]       = useState('')
  const [mReceiptType, setMReceiptType]       = useState<'image' | 'pdf' | undefined>()
  const [mReceiptName, setMReceiptName]       = useState('')
  const [mReceiptError, setMReceiptError]     = useState('')

  // ── Receipt preview ──
  const [previewPago, setPreviewPago] = useState<Pago | null>(null)

  // ── Resident Payment Modal ──
  const [residentPayTarget, setResidentPayTarget] = useState<string | null>(null)

  // ── Confirm dialogs ──
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; apartment: string; month: string } | null>(null)
  const [expConfirm, setExpConfirm] = useState<{ id: string; action: 'annul' | 'resolve_llamado' | 'delete'; apartment: string } | null>(null)

  // ── Financial report tab ──
  const [reportPeriod, setReportPeriod] = useState<'month' | 'ytd'>('month')
  const [reportMonth, setReportMonth] = useState(TODAY_KEY)
  const [pdfLoading, setPdfLoading] = useState(false)

  // ── Egreso fields (inside unified modal) ──
  const [egCategoria, setEgCategoria] = useState<EgresoCategoria>('mantenimiento')
  const [egDate, setEgDate] = useState(TODAY_ISO.split('T')[0])
  const [egDescription, setEgDescription] = useState('')
  const [egConcepto, setEgConcepto] = useState('')
  const [egAmount, setEgAmount] = useState('')

  // ── Egreso delete confirm ──
  const [deleteEgresoId, setDeleteEgresoId] = useState<string | null>(null)

  // ── Topology ──
  const towers = bc.towers.sort()
  const allUnits = useMemo(() => {
    const u = new Set<string>()
    state.residents.forEach(r => u.add(r.apartment))
    state.pagos.forEach(p => u.add(p.apartment))
    state.adeudos.forEach(a => u.add(a.apartment))
    return [...u].sort()
  }, [state.residents, state.pagos, state.adeudos])

  const lFilteredUnits = useMemo(() => {
    if (!lFilterTower) return allUnits
    return allUnits.filter(u => state.residents.some(r => r.apartment === u && r.tower === lFilterTower))
  }, [allUnits, lFilterTower, state.residents])

  const modalUnits = useMemo(() => {
    if (!mTower) return allUnits
    return allUnits.filter(u => state.residents.some(r => r.apartment === u && r.tower === mTower))
  }, [allUnits, mTower, state.residents])

  const unifiedPagos = useMemo(() => {
    const basePagos = state.pagos.map(p => ({ ...p, _isAdeudo: false }))
    // Map only manual/actual Adeudos (Multas, etc.) to the ledger.
    // Exclude any ad-auto- that might survive the sanitizer for 1 render.
    const activeAdeudos = state.adeudos
      .filter(a => a.status === 'Activo' && a.amount > 0 && !a.id.startsWith('ad-auto-'))
      .map(a => ({
        id: a.id,
        apartment: a.apartment,
        resident: state.residents.find(r => r.apartment === a.apartment)?.name || a.apartment,
        month: monthKeyToLabel(a.createdAt.slice(0, 7)),
        monthKey: a.createdAt.slice(0, 7),
        concepto: a.concepto,
        amount: a.amount,
        status: 'Pendiente' as const,
        paymentDate: null,
        _isAdeudo: true
      })) as (Pago & { _isAdeudo: boolean })[]
    return [...basePagos, ...activeAdeudos]
  }, [state.pagos, state.adeudos, state.residents])

  // ═════════════════════════════════════════════════════════════════════
  // LEDGER tab data
  // ═════════════════════════════════════════════════════════════════════

  const filteredPagos = useMemo(() => {
    let data = isAdmin ? unifiedPagos : unifiedPagos.filter(p => p.apartment === myApartment)
    if (isAdmin && lFilterMonth) data = data.filter(p => (p.monthKey || '') === lFilterMonth)
    if (isAdmin && lFilterTower) {
      data = data.filter(p => {
        const res = state.residents.find(r => r.apartment === p.apartment)
        return res?.tower === lFilterTower
      })
    }
    if (isAdmin && lFilterUnit)     data = data.filter(p => p.apartment === lFilterUnit)
    if (isAdmin && lFilterStatus)   data = data.filter(p => p.status === lFilterStatus)
    if (isAdmin && lFilterConcepto) data = data.filter(p => (p.concepto || 'Mantenimiento') === lFilterConcepto)
    return [...data].sort((a, b) => {
      let va: string | number, vb: string | number
      switch (lSortKey) {
        case 'apartment':   va = a.apartment;         vb = b.apartment;         break
        case 'concepto':    va = a.concepto || '';     vb = b.concepto || '';    break
        case 'month':       va = a.monthKey || a.month;vb = b.monthKey || b.month;break
        case 'amount':      va = a.amount;             vb = b.amount;            break
        case 'paymentDate': va = a.paymentDate || '';  vb = b.paymentDate || ''; break
        case 'status':      va = a.status;             vb = b.status;            break
        default: return 0
      }
      if (va < vb) return lSortDir === 'asc' ? -1 : 1
      if (va > vb) return lSortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [unifiedPagos, isAdmin, myApartment, lFilterMonth, lFilterTower, lFilterUnit, lFilterStatus, lFilterConcepto, lSortKey, lSortDir, state.residents])

  // Unique concepto values for filter dropdown
  const conceptoOptions = useMemo(() => {
    const set = new Set<string>()
    unifiedPagos.forEach(p => set.add(p.concepto || 'Mantenimiento'))
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [unifiedPagos])

  // Egresos filtered by the same month as the ledger (for KPI card + egresos grid)
  const ledgerEgresos = useMemo(() => {
    const data = lFilterMonth
      ? state.egresos.filter(e => e.monthKey === lFilterMonth)
      : state.egresos
    return [...data].sort((a, b) => b.date.localeCompare(a.date))
  }, [state.egresos, lFilterMonth])

  /** Global KPIs — computed from ALL pagos, independent of dropdown filters */
  const globalKpis = useMemo(() => {
    const allPagos = isAdmin ? state.pagos : state.pagos.filter(p => p.apartment === myApartment)
    const paid = allPagos.filter(p => p.status === 'Pagado')
    const overdue = allPagos.filter(p => p.status === 'Vencido' || isEffectiveDebt(p, TODAY_ISO, state.buildingConfig.maturityRules))
    const upcoming = allPagos.filter(p => p.status === 'Pendiente' && !isEffectiveDebt(p, TODAY_ISO, state.buildingConfig.maturityRules))
    const porValidar = allPagos.filter(p => p.status === 'Por validar')
    
    const myAdeudos = state.adeudos.filter(a => a.status === 'Activo' && (isAdmin || a.apartment === myApartment))
    const adeudosTotal = myAdeudos.reduce((s, a) => s + a.amount, 0)

    // Base collection metrics for progress bar
    const isMaintenance = (p: Pago) => (p.concepto || '').split(/[:—]/)[0].trim() === 'Mantenimiento'
    const maintenancePagos = allPagos.filter(isMaintenance)
    const expectedMantenimientoTotal = maintenancePagos.reduce((s, p) => s + p.amount, 0)
    const paidMantenimientoTotal = maintenancePagos.filter(p => p.status === 'Pagado').reduce((s, p) => s + p.amount, 0)

    return {
      paidTotal: paid.reduce((s, p) => s + p.amount, 0),
      overdueTotal: overdue.reduce((s, p) => s + p.amount, 0) + adeudosTotal,
      upcomingTotal: upcoming.reduce((s, p) => s + p.amount, 0),
      porValidarTotal: porValidar.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      overdueCount: overdue.length + myAdeudos.length,
      upcomingCount: upcoming.length,
      porValidarCount: porValidar.length,
      totalPortfolioAmount: paid.reduce((s, p) => s + p.amount, 0) + overdue.reduce((s, p) => s + p.amount, 0) + adeudosTotal + upcoming.reduce((s, p) => s + p.amount, 0) + porValidar.reduce((s, p) => s + p.amount, 0),
      expectedMantenimientoTotal,
      paidMantenimientoTotal
    }
  }, [state.pagos, state.adeudos, isAdmin, myApartment, state.buildingConfig.maturityRules])

  /** Contextual KPIs — filtered by dropdowns (month/tower/unit/concepto), NOT by status */
  const contextualKpis = useMemo(() => {
    let data = isAdmin ? state.pagos : state.pagos.filter(p => p.apartment === myApartment)
    if (lFilterMonth) data = data.filter(p => (p.monthKey || '') === lFilterMonth)
    if (lFilterTower) {
      data = data.filter(p => {
        const res = state.residents.find(r => r.apartment === p.apartment)
        return res?.tower === lFilterTower
      })
    }
    if (lFilterUnit) data = data.filter(p => p.apartment === lFilterUnit)
    if (lFilterConcepto) data = data.filter(p => (p.concepto || 'Mantenimiento') === lFilterConcepto)

    const paid = data.filter(p => p.status === 'Pagado')
    const overdue = data.filter(p => p.status === 'Vencido' || isEffectiveDebt(p, TODAY_ISO, state.buildingConfig.maturityRules))
    const upcoming = data.filter(p => p.status === 'Pendiente' && !isEffectiveDebt(p, TODAY_ISO, state.buildingConfig.maturityRules))
    const porValidar = data.filter(p => p.status === 'Por validar')

    // Contextual adeudos are tricky (linked by property logic, not monthKey)
    // We only show them if no month filter is active or if week/day logic matches
    const showAdeudos = !lFilterMonth || lFilterMonth === TODAY_KEY
    const myAdeudos = showAdeudos 
      ? state.adeudos.filter(a => a.status === 'Activo' && (isAdmin || a.apartment === myApartment))
      : []
    const adeudosTotal = myAdeudos.reduce((s, a) => s + a.amount, 0)

    // Base collection metrics for progress bar
    const isMaintenance = (p: Pago) => (p.concepto || '').split(/[:—]/)[0].trim() === 'Mantenimiento'
    const maintenancePagos = data.filter(isMaintenance)
    const expectedMantenimientoTotal = maintenancePagos.reduce((s, p) => s + p.amount, 0)
    const paidMantenimientoTotal = maintenancePagos.filter(p => p.status === 'Pagado').reduce((s, p) => s + p.amount, 0)

    return {
      paidTotal: paid.reduce((s, p) => s + p.amount, 0),
      overdueTotal: overdue.reduce((s, p) => s + p.amount, 0) + adeudosTotal,
      upcomingTotal: upcoming.reduce((s, p) => s + p.amount, 0),
      porValidarTotal: porValidar.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      overdueCount: overdue.length + myAdeudos.length,
      upcomingCount: upcoming.length,
      porValidarCount: porValidar.length,
      totalPortfolioAmount: paid.reduce((s, p) => s + p.amount, 0) + overdue.reduce((s, p) => s + p.amount, 0) + adeudosTotal + upcoming.reduce((s, p) => s + p.amount, 0) + porValidar.reduce((s, p) => s + p.amount, 0),
      expectedMantenimientoTotal,
      paidMantenimientoTotal
    }
  }, [state.pagos, state.adeudos, state.residents, isAdmin, myApartment, lFilterMonth, lFilterTower, lFilterUnit, lFilterConcepto, state.buildingConfig.maturityRules])

  /** Active KPIs — contextual when filters panel is open, global otherwise */
  const ledgerKpis = showFilters ? contextualKpis : globalKpis

  const egresoKpis = useMemo(() => {
    const paid = ledgerEgresos.filter(e => e.status === 'Pagado')
    const pending = ledgerEgresos.filter(e => e.status === 'Pendiente')
    return {
      paidTotal: paid.reduce((s, e) => s + e.amount, 0),
      pendingTotal: pending.reduce((s, e) => s + e.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      total: ledgerEgresos.reduce((s, e) => s + e.amount, 0),
    }
  }, [ledgerEgresos])

  // ═════════════════════════════════════════════════════════════════════
  // EXPEDIENTE tab data
  // ═════════════════════════════════════════════════════════════════════



  // ═════════════════════════════════════════════════════════════════════
  // FINANCIAL REPORT tab data
  // ═════════════════════════════════════════════════════════════════════

  const reportMonthKeys = useMemo(() => {
    if (reportPeriod === 'month') return [reportMonth]
    // YTD: January of current year through current month
    const year = new Date().getFullYear()
    const curMonth = new Date().getMonth() + 1
    const keys: string[] = []
    for (let m = 1; m <= curMonth; m++) keys.push(`${year}-${String(m).padStart(2, '0')}`)
    return keys
  }, [reportPeriod, reportMonth])

  const reportData = useMemo((): ReportData => {
    const monthSet = new Set(reportMonthKeys)

    // INGRESOS: paid pagos in period, grouped by concepto
    const paidPagos = state.pagos.filter(p => p.status === 'Pagado' && monthSet.has(p.monthKey || ''))
    const incomeMap = new Map<string, number>()
    paidPagos.forEach(p => {
      const key = p.concepto || 'Mantenimiento'
      incomeMap.set(key, (incomeMap.get(key) || 0) + p.amount)
    })
    const ingresos: IncomeRow[] = [...incomeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([concepto, amount]) => ({ concepto, amount }))
    const totalIngresos = ingresos.reduce((s, r) => s + r.amount, 0)

    // EGRESOS: expenses in period, grouped by categoria
    const periodEgresos = state.egresos.filter(e => monthSet.has(e.monthKey))
    const expenseMap = new Map<EgresoCategoria, { amount: number; items: { concepto: string; amount: number }[] }>()
    periodEgresos.forEach(e => {
      const entry = expenseMap.get(e.categoria) || { amount: 0, items: [] }
      entry.amount += e.amount
      entry.items.push({ concepto: e.concepto, amount: e.amount })
      expenseMap.set(e.categoria, entry)
    })
    const egresos: ExpenseRow[] = [...expenseMap.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([cat, data]) => ({ categoria: cat, label: EGRESO_CATEGORIA_LABELS[cat], amount: data.amount, items: data.items }))
    const totalEgresos = egresos.reduce((s, r) => s + r.amount, 0)

    // Pending + Adeudos
    const pendingCharges = state.pagos.filter(p => p.status === 'Pendiente' && monthSet.has(p.monthKey || '')).reduce((s, p) => s + p.amount, 0)
    const activeAdeudosList = state.adeudos.filter(a => a.status === 'Activo' && a.amount > 0)

    const periodLabel = reportPeriod === 'month'
      ? monthKeyToLabel(reportMonth)
      : `Enero – ${monthKeyToLabel(TODAY_KEY)} ${new Date().getFullYear()} (acumulado)`

    return {
      buildingName: bc.buildingName,
      buildingAddress: bc.buildingAddress,
      managementCompany: bc.managementCompany,
      periodLabel,
      generatedAt: new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
      ingresos,
      totalIngresos,
      egresos,
      totalEgresos,
      netResult: totalIngresos - totalEgresos,
      pendingCharges,
      activeAdeudos: activeAdeudosList.length,
      activeAdeudosAmount: activeAdeudosList.reduce((s, a) => s + a.amount, 0),
    }
  }, [state.pagos, state.egresos, state.adeudos, reportMonthKeys, reportPeriod, reportMonth, bc])


  // ═════════════════════════════════════════════════════════════════════
  // SORT HELPERS
  // ═════════════════════════════════════════════════════════════════════

  const handleLSort = (key: LedgerSortKey) => {
    if (lSortKey === key) setLSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLSortKey(key); setLSortDir('asc') }
  }

  // Reusable sort header
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

  // ═════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═════════════════════════════════════════════════════════════════════

  // Ledger: admin action on pago status
  const handleToggleStatus = (id: string) => {
    const pago = state.pagos.find(p => p.id === id)
    if (!pago) return
    if (pago.status === 'Pagado') {
      // Pagado → confirm revoke → Pendiente
      setRevokeTarget({ id: pago.id, apartment: pago.apartment, month: pago.month })
      return
    }
    if (pago.status === 'Por validar') {
      // Admin approves: Por validar → Pagado
      dispatch({ type: 'UPDATE_PAGO', payload: { ...pago, status: 'Pagado' } })
      return
    }
    // Pendiente → Pagado (admin direct approval)
    dispatch({ type: 'UPDATE_PAGO', payload: { ...pago, status: 'Pagado', paymentDate: new Date().toISOString().split('T')[0] } })
  }

  // Admin rejects: Por validar → Pendiente (clears payment data)
  const handleRejectPago = (id: string) => {
    const pago = state.pagos.find(p => p.id === id)
    if (!pago) return
    dispatch({ type: 'UPDATE_PAGO', payload: { ...pago, status: 'Pendiente', paymentDate: null, receiptData: undefined, receiptType: undefined, receiptName: undefined } })
  }

  // Resident clicks pay: opens modal
  const handleResidentPay = (id: string) => {
    setResidentPayTarget(id)
  }

  // Resident submits receipt from modal
  const handleResidentSubmit = () => {
    if (!residentPayTarget) return
    const pago = state.pagos.find(p => p.id === residentPayTarget)
    if (!pago) return
    if (!mReceiptData) {
      setMReceiptError('Debes adjuntar un comprobante.')
      return
    }
    dispatch({ 
      type: 'UPDATE_PAGO', 
      payload: { 
        ...pago, 
        status: 'Por validar', 
        paymentDate: new Date().toISOString().split('T')[0],
        receiptData: mReceiptData,
        receiptType: mReceiptType,
        receiptName: mReceiptName || undefined
      } 
    })
    setResidentPayTarget(null)
    setMReceiptData('')
    setMReceiptType(undefined)
    setMReceiptName('')
    setMReceiptError('')
  }

  // Egreso: toggle status between Pendiente and Pagado
  const handleToggleEgresoStatus = (id: string) => {
    const egreso = state.egresos.find(e => e.id === id)
    if (!egreso) return
    const newStatus = egreso.status === 'Pendiente' ? 'Pagado' : 'Pendiente'
    dispatch({ type: 'UPDATE_EGRESO', payload: { ...egreso, status: newStatus } })
  }

  const confirmRevoke = () => {
    if (!revokeTarget) return
    const pago = state.pagos.find(p => p.id === revokeTarget.id)
    if (pago) dispatch({ type: 'UPDATE_PAGO', payload: { ...pago, status: 'Pendiente', paymentDate: null } })
  }

  // Expediente: annul / resolve / delete
  const executeExpConfirm = () => {
    if (!expConfirm) return
    const ad = state.adeudos.find(a => a.id === expConfirm.id)
    if (!ad) return
    switch (expConfirm.action) {
      case 'annul':
        dispatch({ type: 'UPDATE_ADEUDO', payload: { ...ad, status: 'Anulado', resolvedAt: new Date().toISOString(), resolvedBy: 'Administrador' } })
        break
      case 'resolve_llamado':
        dispatch({ type: 'UPDATE_ADEUDO', payload: { ...ad, status: 'Pagado', resolvedAt: new Date().toISOString(), resolvedBy: 'Administrador' } })
        break
      case 'delete':
        dispatch({ type: 'DELETE_ADEUDO', payload: ad.id })
        break
    }
  }

  // Egreso registration
  const handleRegisterEgreso = () => {
    if (!egConcepto.trim() || !egAmount || Number(egAmount) <= 0) return
    const monthKey = egDate.slice(0, 7) // YYYY-MM from date
    dispatch({
      type: 'ADD_EGRESO',
      payload: {
        id: `eg-${Date.now()}`,
        categoria: egCategoria,
        concepto: egConcepto.trim(),
        description: egDescription.trim() || undefined,
        amount: Number(egAmount),
        monthKey,
        date: egDate,
        registeredBy: bc.adminName,
        status: 'Pagado',
        receiptData: mReceiptData || undefined,
        receiptType: mReceiptType || undefined,
        receiptName: mReceiptName || undefined
      },
    })
    resetAndCloseModal()
  }

  // PDF download
  const handleDownloadPDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      const blob = await pdf(<FinancialReportPDF data={reportData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Estado_Resultados_${reportData.periodLabel.replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation error:', err)
    } finally {
      setPdfLoading(false)
    }
  }, [reportData])

  // Receipt upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMReceiptError('')
    const file = e.target.files?.[0]
    if (!file) return
    const isPdf = file.type === 'application/pdf'
    const isImg = file.type.startsWith('image/')
    if (!isPdf && !isImg) { setMReceiptError('Solo PDF o imagen (JPG/PNG).'); return }
    if (isPdf && file.size > 5 * 1024 * 1024) { setMReceiptError('PDF excede 5 MB.'); return }
    if (isImg && file.size > 2 * 1024 * 1024) { setMReceiptError('Imagen excede 2 MB.'); return }
    setMReceiptName(file.name)
    setMReceiptType(isPdf ? 'pdf' : 'image')
    const reader = new FileReader()
    reader.onload = ev => setMReceiptData(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Reset & close helper
  const resetAndCloseModal = () => {
    setMTower(''); setMUnit(''); setMAmount(String(bc.monthlyFee || '')); setMConcepto(''); setMSubConcepto(''); setMMotivo('')
    setMMulti(false); setMMonths([TODAY_KEY]); setMSingleMonth(TODAY_KEY)
    setMReceiptData(''); setMReceiptType(undefined); setMReceiptName(''); setMReceiptError('')
    setEgCategoria('mantenimiento'); setEgConcepto(''); setEgDescription(''); setEgAmount(''); setEgDate(new Date().toISOString().split('T')[0])
    setShowModal(false)
  }

  // Unified register
  const handleRegister = () => {
    if (chargeType === 'egreso') {
      handleRegisterEgreso()
      return
    }
    if (!mUnit) return
    const resident = state.residents.find(r => r.apartment === mUnit)
    const resName = resident?.name || mUnit
    const baseConcepto = mConcepto || 'Mantenimiento'
    let concepto = mSubConcepto ? `${baseConcepto} — ${mSubConcepto}` : baseConcepto
    
    // Option A: Concepto: Motivo
    if ((baseConcepto === 'Multa' || baseConcepto === 'Otros') && mMotivo.trim()) {
      concepto = `${baseConcepto}: ${mMotivo.trim()}`
    }

    const isMantenimiento = baseConcepto === 'Mantenimiento'
    const todayIso = new Date().toISOString().split('T')[0]
    const todayMk = todayIso.slice(0, 7)

    if (isMantenimiento && mMulti && mMonths.length > 0) {
      // ── Multi-month Mantenimiento (advance payments) ──
      // Sort months chronologically
      const sorted = [...mMonths].sort()
      const firstMonth = sorted[0] // the "actual" payment month
      sorted.forEach((mk, idx) => {
        const isAdvance = idx > 0 // months after the first are advance payments
        dispatch({
          type: 'ADD_PAGO',
          payload: {
            id: `pg-${Date.now()}-${mk}-${idx}`,
            apartment: mUnit,
            resident: resName,
            month: monthKeyToLabel(mk),
            monthKey: mk,
            concepto,
            amount: Number(mAmount) || bc.monthlyFee,
            status: 'Pagado',
            paymentDate: todayIso,
            receiptData: mReceiptData || undefined,
            receiptType: mReceiptType,
            receiptName: mReceiptName || undefined,
            notes: isAdvance ? `Pagado por adelanto en ${monthKeyToLabel(firstMonth)} (${todayMk})` : undefined,
          },
        })
      })
    } else {
      // ── Single month (any concepto) ──
      dispatch({
        type: 'ADD_PAGO',
        payload: {
          id: `pg-${Date.now()}-${mSingleMonth}`,
          apartment: mUnit,
          resident: resName,
          month: monthKeyToLabel(mSingleMonth),
          monthKey: mSingleMonth,
          concepto,
          amount: Number(mAmount) || bc.monthlyFee,
          status: 'Pagado',
          paymentDate: todayIso,
          receiptData: mReceiptData || undefined,
          receiptType: mReceiptType,
          receiptName: mReceiptName || undefined,
        },
      })
    }

    resetAndCloseModal()
  }

  const toggleFormMonth = (mk: string) => setMMonths(prev => prev.includes(mk) ? prev.filter(m => m !== mk) : [...prev, mk])

  const isMantenimientoSelected = (mConcepto || 'Mantenimiento') === 'Mantenimiento'
  const isReasonRequired = (mConcepto === 'Multa' || mConcepto === 'Otros')

  const formValid = (() => {
    if (chargeType === 'ingreso') {
      if (!mUnit || Number(mAmount) <= 0 || mReceiptError) return false
      if (isReasonRequired && !mMotivo.trim()) return false
      if (isMantenimientoSelected && mMulti) return mMonths.length > 0
      return !!mSingleMonth
    }
    if (chargeType === 'egreso') return !!egConcepto.trim() && Number(egAmount) > 0
    return false
  })()

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">

      {/* ── Dependency guard: admin with no residents — module is empty by design —— */}
      {isAdmin && state.residents.length === 0 && state.pagos.length === 0 && (
        <EmptyState
          variant="page"
          icon="receipt_long"
          title="Sin datos financieros"
          subtitle="Agrega residentes y configura las cuotas de mantenimiento para comenzar a gestionar cobros y pagos."
          action={{ label: 'Ir a Usuarios', href: '/admin/usuarios' }}
        />
      )}

      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Finanzas
          </h1>
        </div>

        {/* Tab bar (admin only) integrated in header */}
        {isAdmin && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
            {([
              { key: 'ledger' as ActiveTab, label: 'Estado de Cuenta', icon: 'receipt_long' },
              { key: 'report' as ActiveTab, label: 'Reporte', icon: 'analytics' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ESTADO DE CUENTA (Ledger)                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {(activeTab === 'ledger' || !isAdmin) && (
        <>

          {/* ── Status Strip (Architectural Minimalist) — Integrated metrics ── */}
          {isAdmin && ledgerSubTab === 'ingresos' && (
            <div className={`mt-2 mb-6 border border-slate-100 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden`}>
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
                {[
                  { label: 'Recaudación Mantenimiento', value: ledgerKpis.paidCount, amount: ledgerKpis.paidTotal, icon: 'trending_up', color: 'bg-emerald-500', iconColor: 'text-emerald-600', filterKey: '' as string, showInGlobal: false },
                  { label: 'Deuda Efectiva', value: ledgerKpis.overdueCount, amount: ledgerKpis.overdueTotal, icon: 'gavel', color: 'bg-rose-500', iconColor: 'text-rose-600', filterKey: 'Vencido', showInGlobal: true },
                  { label: 'Próximos Cargos', value: ledgerKpis.upcomingCount, amount: ledgerKpis.upcomingTotal, icon: 'schedule', color: 'bg-amber-500', iconColor: 'text-amber-600', filterKey: 'Pendiente', showInGlobal: true },
                ].filter(k => {
                  if (k.label === 'Próximos Cargos') {
                    // Solo mostramos próximamente en la vista global o si el mes es actual/futuro
                    return !lFilterMonth || lFilterMonth >= TODAY_KEY;
                  }
                  return !!lFilterMonth || k.showInGlobal;
                }).map(k => {
                  const isClickable = !!k.filterKey && !showFilters
                  const isActive = isClickable && lFilterStatus === k.filterKey
                  
                  let progress = 0
                  if (k.label === 'Recaudación Mantenimiento') {
                    progress = ledgerKpis.expectedMantenimientoTotal > 0 
                      ? (ledgerKpis.paidMantenimientoTotal / ledgerKpis.expectedMantenimientoTotal) * 100 
                      : 0
                  } else {
                    progress = ledgerKpis.totalPortfolioAmount > 0 
                      ? (k.amount / ledgerKpis.totalPortfolioAmount) * 100 
                      : 0
                  }

                  const isZeroDebt = k.filterKey === 'Vencido' && k.amount === 0

                  return (
                    <button
                      key={k.label}
                      type="button"
                      onClick={() => {
                        if (!isClickable) return
                        if (lFilterStatus === k.filterKey) {
                          setLFilterStatus('')
                          setLFilterMonth('')
                        } else {
                          setLFilterStatus(k.filterKey)
                          setLFilterMonth('')
                        }
                      }}
                      className={`relative flex-1 flex flex-col justify-center p-4 transition-all duration-300 group outline-none ${
                        isClickable ? 'cursor-pointer hover:bg-slate-50/80' : 'cursor-default'
                      } ${isActive ? 'bg-slate-50/50 pt-3.5' : ''}`}
                    >
                      {/* Active indicator line */}
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

                      {/* Integrated Progress Line (Mantenimiento only) */}
                      {k.label === 'Recaudación Mantenimiento' && (
                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out ${k.color} rounded-full`}
                            style={{ width: `${Math.max(progress, 1)}%` }}
                          />
                        </div>
                      )}
                      
                      {/* Secondary status info (percentage) */}
                      {!isZeroDebt && k.label !== 'Recaudación Mantenimiento' && (
                         <span className={`text-[9px] font-black mt-1 tabular-nums ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                           {progress.toFixed(1)}% del total
                         </span>
                      )}
                      {k.label === 'Recaudación Mantenimiento' && (
                         <span className={`text-[9px] font-black mt-1 tabular-nums ${progress >= 100 ? 'text-emerald-600' : 'text-slate-400'}`}>
                           {progress.toFixed(1)}% recolectado
                         </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}


          {/* ── Spend Mix Data ── */}
          {isAdmin && ledgerSubTab === 'egresos' && (() => {
            const totals: Record<string, number> = {}
            ledgerEgresos.forEach(e => {
              totals[e.categoria] = (totals[e.categoria] || 0) + e.amount
            })
            const total = egresoKpis.total || 1
            const segments = (Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => ({
              cat,
              label: EGRESO_CATEGORIA_LABELS[cat],
              amount: totals[cat] || 0,
              pct: ((totals[cat] || 0) / total) * 100,
              color: {
                nomina: 'bg-sky-500',
                mantenimiento: 'bg-emerald-500',
                servicios: 'bg-amber-500',
                equipo: 'bg-purple-500',
                seguros: 'bg-indigo-500',
                administracion: 'bg-slate-500',
                otros: 'bg-rose-500'
              }[cat]
            })).filter(s => s.amount > 0).sort((a,b) => b.amount - a.amount)
            
            return (
              <div key="spend-mix" className="hidden" id="spend-mix-data" data-segments={JSON.stringify(segments)} />
            )
          })()}

          {/* ── Status Strip (Egresos) — Integrated metrics ── */}
          {isAdmin && ledgerSubTab === 'egresos' && (
            <div className={`mt-2 mb-6 border border-slate-100 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden`}>
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
                {[
                  { label: 'Egresos Pagados', value: egresoKpis.paidCount, amount: egresoKpis.paidTotal, icon: 'check_circle', color: 'bg-emerald-500', iconColor: 'text-emerald-600', filterKey: 'Pagado' },
                  { label: 'Facturas Pendientes', value: egresoKpis.pendingCount, amount: egresoKpis.pendingTotal, icon: 'schedule', color: 'bg-amber-500', iconColor: 'text-amber-600', filterKey: 'Pendiente' },
                  { label: 'Flujo Total', value: ledgerEgresos.length, amount: egresoKpis.total, icon: 'trending_down', color: 'bg-rose-500', iconColor: 'text-rose-600', filterKey: '' },
                ].map(k => {
                  const progress = egresoKpis.total > 0 ? (egresoKpis.paidTotal / egresoKpis.total) * 100 : 0

                  return (
                    <div
                      key={k.label}
                      className="relative flex-1 flex flex-col justify-center p-4 transition-all duration-300 group outline-none"
                    >
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] group-hover:text-slate-500 transition-colors">
                          {k.label}
                        </span>
                        <span className={`material-symbols-outlined text-[14px] ${k.iconColor} opacity-50 group-hover:opacity-100 transition-opacity`}>{k.icon}</span>
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-headline font-black tracking-tight tabular-nums text-slate-800">
                          ${k.amount.toLocaleString('es-MX')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest tabular-nums font-sans">
                          {k.value} regs.
                        </span>
                      </div>

                      {/* Integrated Progress Line (Shared across the strip) */}
                      {k.label === 'Egresos Pagados' && (
                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out bg-emerald-500 rounded-full`}
                            style={{ width: `${Math.max(progress, 1)}%` }}
                          />
                        </div>
                      )}

                      {k.label === 'Flujo Total' && (
                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100 flex overflow-hidden">
                          {(() => {
                            const totals: Record<string, number> = {}
                            ledgerEgresos.forEach(e => { totals[e.categoria] = (totals[e.categoria] || 0) + e.amount })
                            const total = egresoKpis.total || 1
                            return (Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => {
                              const pct = ((totals[cat] || 0) / total) * 100
                              if (pct === 0) return null
                              const color = {
                                nomina: 'bg-sky-500', mantenimiento: 'bg-emerald-500', servicios: 'bg-amber-500',
                                equipo: 'bg-purple-500', seguros: 'bg-indigo-500', administracion: 'bg-slate-500', otros: 'bg-rose-500'
                              }[cat]
                              return <div key={cat} className={`h-full ${color}`} style={{ width: `${pct}%` }} title={`${EGRESO_CATEGORIA_LABELS[cat]}: ${pct.toFixed(1)}%`} />
                            })
                          })()}
                        </div>
                      )}

                      {k.label === 'Egresos Pagados' && (
                         <span className={`text-[9px] font-black mt-1 tabular-nums text-slate-400`}>
                           {progress.toFixed(1)}% liquidado
                         </span>
                      )}
                      
                      {k.label === 'Flujo Total' && (
                         <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                           {(() => {
                             const totals: Record<string, number> = {}
                             ledgerEgresos.forEach(e => { totals[e.categoria] = (totals[e.categoria] || 0) + e.amount })
                             const total = egresoKpis.total || 1
                             return (Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => {
                               const pct = ((totals[cat] || 0) / total) * 100
                               if (pct < 5) return null // Hide tiny ones in the legend to keep it clean
                               return (
                                 <span key={cat} className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-slate-400">
                                   <div className={`w-1 h-1 rounded-full ${{
                                     nomina: 'bg-sky-500', mantenimiento: 'bg-emerald-500', servicios: 'bg-amber-500',
                                     equipo: 'bg-purple-500', seguros: 'bg-indigo-500', administracion: 'bg-slate-500', otros: 'bg-rose-500'
                                   }[cat]}`} />
                                   {EGRESO_CATEGORIA_LABELS[cat].split(' ')[0]}
                                 </span>
                               )
                             })
                           })()}
                         </div>
                      )}

                      {k.label === 'Facturas Pendientes' && (
                         <span className={`text-[9px] font-black mt-1 tabular-nums text-slate-300 uppercase tracking-widest`}>
                           {ledgerSubTab}
                         </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}


          {/* ── Unit balance panel ── */}
          {isAdmin && lFilterUnit && (() => {
            const res = state.residents.find(r => r.apartment === lFilterUnit)
            const uUpcoming = state.pagos.filter(p => p.apartment === lFilterUnit && p.status === 'Pendiente' && !isEffectiveDebt(p, TODAY_ISO, state.buildingConfig.maturityRules))
            const uOverdue  = state.pagos.filter(p => p.apartment === lFilterUnit && (p.status === 'Vencido' || isEffectiveDebt(p, TODAY_ISO, state.buildingConfig.maturityRules)))
            const uPagos = [...uUpcoming, ...uOverdue]
            const uAdeudos  = state.adeudos.filter(a => a.apartment === lFilterUnit && a.status === 'Activo' && a.amount > 0 && !a.id.startsWith('ad-auto-'))
            
            const pp = uUpcoming.reduce((s, p) => s + p.amount, 0)
            const aa = uOverdue.reduce((s, p) => s + p.amount, 0) + uAdeudos.reduce((s, a) => s + a.amount, 0)
            const total = aa // In this view, "Total Balance" usually means total debt
            const toggleDetail = (view: 'pagos' | 'adeudos' | 'balance') => setUnitDetailView(prev => prev === view ? null : view)
            return (
              <div className="space-y-0">
                <div className="bg-slate-900 text-white rounded-t-2xl p-5 flex flex-col md:flex-row md:items-center gap-4" style={unitDetailView ? {} : { borderRadius: '1rem' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resumen Histórico de Unidad</p>
                    <p className="text-lg font-headline font-black mt-0.5">{lFilterUnit}{res ? ` — ${res.name}` : ''}</p>
                  </div>
                  <div className="flex gap-5 flex-wrap">
                    <button onClick={() => toggleDetail('pagos')} className={`text-center outline-none ring-0 transition-all cursor-pointer px-3 py-1.5 rounded-xl ${unitDetailView === 'pagos' ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
                      <p className="text-xl font-headline font-black tabular-nums">${pp.toLocaleString('es-MX')}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Próximos</p>
                    </button>
                    <div className="w-px bg-slate-700" />
                    <button onClick={() => toggleDetail('adeudos')} className={`text-center outline-none ring-0 transition-all cursor-pointer px-3 py-1.5 rounded-xl ${unitDetailView === 'adeudos' ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
                      <p className="text-xl font-headline font-black tabular-nums text-amber-400">${aa.toLocaleString('es-MX')}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Deuda Efectiva</p>
                    </button>
                    <div className="w-px bg-slate-700" />
                    <button onClick={() => toggleDetail('balance')} className={`text-center outline-none ring-0 transition-all cursor-pointer px-3 py-1.5 rounded-xl ${unitDetailView === 'balance' ? 'bg-white/10 scale-105' : 'hover:bg-white/5'}`}>
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
                        {unitDetailView === 'pagos' && `Pagos pendientes — ${lFilterUnit}`}
                        {unitDetailView === 'adeudos' && `Adeudos activos — ${lFilterUnit}`}
                        {unitDetailView === 'balance' && `Desglose completo — ${lFilterUnit}`}
                      </p>
                      <button onClick={() => setUnitDetailView(null)} className="text-slate-500 hover:text-white transition-colors">
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
          })()}

          {/* ── Resident balance cards ── */}
          {!isAdmin && (() => {
            const myPagos = state.pagos.filter(p => p.apartment === myApartment)
              const myAdeudos = state.adeudos.filter(a => a.apartment === myApartment && a.status === 'Activo')
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center"><span className="material-symbols-outlined text-white text-xl">receipt_long</span></div>
                    <div>
                      <p className="text-2xl font-headline font-black text-slate-900">${myPagos.filter(p => p.status === 'Pagado').reduce((s, p) => s + p.amount, 0).toLocaleString('es-MX')}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total pagado</p>
                    </div>
                  </div>
                  <div className={`border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 ${ledgerKpis.overdueTotal > 0 ? 'bg-rose-50 border-rose-200' : ledgerKpis.upcomingTotal > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className="flex items-center gap-6 w-full">
                      <div className="flex-1 text-center">
                        <p className={`text-2xl font-headline font-black ${ledgerKpis.overdueTotal > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                          ${ledgerKpis.overdueTotal.toLocaleString('es-MX')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Deuda Efectiva</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div className="flex-1 text-center">
                        <p className="text-2xl font-headline font-black text-slate-900">
                          ${ledgerKpis.upcomingTotal.toLocaleString('es-MX')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Próximos Cargos</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Resident adeudo warning */}
                {myAdeudos.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">gavel</span>
                    <div>
                      <p className="text-sm font-bold text-amber-800">Tienes {myAdeudos.length} registro(s) activo(s) en tu expediente</p>
                      <div className="mt-2 space-y-1">
                        {myAdeudos.map(a => (
                          <p key={a.id} className="text-xs text-amber-700 font-medium">
                            <span className="font-bold uppercase">{ADEUDO_TYPE_LABELS[a.type]}</span> · {a.concepto}
                            {a.amount > 0 && ` · $${a.amount.toLocaleString('es-MX')}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  {isAdmin ? (
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      {([
                        { key: 'ingresos' as const, label: 'Ingresos', icon: 'trending_up', count: filteredPagos.length },
                        { key: 'egresos' as const, label: 'Egresos', icon: 'trending_down', count: ledgerEgresos.length },
                      ]).map(t => (
                        <button key={t.key} onClick={() => setLedgerSubTab(t.key)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all ${
                            ledgerSubTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                          }`}>
                          <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
                          {t.label}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] tabular-nums ${
                            ledgerSubTab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>{t.count}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <h2 className="text-base font-headline font-extrabold text-slate-900">Mis Pagos</h2>
                  )}
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {ledgerSubTab === 'ingresos' ? `${filteredPagos.length} registro${filteredPagos.length !== 1 ? 's' : ''}` : `${ledgerEgresos.length} registro${ledgerEgresos.length !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowModal(true)
                        setChargeType(ledgerSubTab === 'ingresos' ? 'ingreso' : 'egreso')
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 text-[10px] tracking-widest uppercase"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span className="hidden sm:inline">
                        {ledgerSubTab === 'ingresos' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (showFilters) {
                          clearAllFilters()
                        } else {
                          // Al activar filtros, por defecto mostramos el mes actual
                          setLFilterMonth(TODAY_KEY)
                        }
                        setShowFilters(!showFilters)
                      }}
                      className={[
                        'flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all',
                        showFilters
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                          : activeFilters.length > 0
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 shadow-sm',
                      ].join(' ')}
                    >
                      <span className="material-symbols-outlined text-[16px]">tune</span>
                        Filtros
                      {activeFilters.length > 0 && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          showFilters ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                        }`}>{activeFilters.length}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Active Filter Chips Tray */}
              {isAdmin && activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-slate-50">
                  {activeFilters.map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={f.onClear}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group"
                      title={`Quitar filtro: ${f.label}`}
                    >
                      <span>{f.label}</span>
                      <span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100 transition-opacity">close</span>
                    </button>
                  ))}
                  {activeFilters.length > 1 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-[10px] font-bold text-slate-400 hover:text-rose-500 underline underline-offset-2 transition-colors uppercase tracking-widest ml-1"
                    >Limpiar todo</button>
                  )}
                </div>
              )}

              {/* Collapsible Dropdown Grid */}
              {isAdmin && showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-[fadeIn_0.15s_ease-out]">
                  <div className="relative">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Mes / Año</label>
                    <button
                      type="button"
                      onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm text-left flex items-center justify-between group hover:border-slate-300 transition-all"
                    >
                      <span>{lFilterMonth ? monthKeyToLabel(lFilterMonth) : 'Histórico (Todos)'}</span>
                      <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isMonthPickerOpen && (
                      <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsMonthPickerOpen(false)} />
                        
                        {/* Popover */}
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl z-50 p-4 animate-[fadeIn_0.1s_ease-out] origin-top-left">
                          {/* Year Switcher */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                            <p className="text-sm font-black text-slate-900 tracking-tight">{pickerYear}</p>
                            <div className="flex items-center gap-1">
                              {pickerYears.map(y => (
                                <button
                                  key={y}
                                  onClick={() => setPickerYear(y)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    pickerYear === y ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >{y}</button>
                              ))}
                            </div>
                          </div>

                          {/* Month Grid */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {Array.from({ length: 12 }).map((_, i) => {
                              const monthNum = i + 1
                              const monthKey = `${pickerYear}-${String(monthNum).padStart(2, '0')}`
                              const exists = MONTH_RANGE.includes(monthKey)
                              const isActive = lFilterMonth === monthKey
                              
                              return (
                                <button
                                  key={i}
                                  disabled={!exists}
                                  onClick={() => {
                                    setLFilterMonth(monthKey)
                                    setIsMonthPickerOpen(false)
                                  }}
                                  className={`
                                    py-2.5 rounded-xl text-[11px] font-bold transition-all
                                    ${isActive 
                                      ? 'bg-slate-900 text-white shadow-lg' 
                                      : exists 
                                        ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                                        : 'text-slate-200 cursor-not-allowed'}
                                  `}
                                >
                                  {MONTH_ABBR_ES[i]}
                                </button>
                              )
                            })}
                          </div>

                          {/* Quick Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-50">
                            <button
                              onClick={() => {
                                setLFilterMonth('')
                                setIsMonthPickerOpen(false)
                              }}
                              className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                !lFilterMonth ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              Acumulado Histórico
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Torre</label>
                    <select value={lFilterTower} onChange={e => { setLFilterTower(e.target.value); setLFilterUnit('') }}
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                      <option value="">Todas</option>
                      {towers.map(t => <option key={t} value={t}>Torre {t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Unidad</label>
                    <select value={lFilterUnit} onChange={e => { setLFilterUnit(e.target.value); setUnitDetailView(null); }}
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                      <option value="">Todas</option>
                      {lFilteredUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Concepto</label>
                    <select value={lFilterConcepto} onChange={e => setLFilterConcepto(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                      <option value="">Todos</option>
                      {conceptoOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Estado</label>
                    <select value={lFilterStatus} onChange={e => setLFilterStatus(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                      <option value="">Todos</option>
                      <option value="Pendiente">Adeudos</option>
                      <option value="Por validar">En Revisión</option>
                      <option value="Pagado">Pagados</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ── INGRESOS TABLE ── */}
            {(ledgerSubTab === 'ingresos' || !isAdmin) && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {isAdmin && <SortTh col="apartment" label="Unidad" sortKey={lSortKey} sortDir={lSortDir} onSort={handleLSort} />}
                    <SortTh col="concepto" label="Concepto" sortKey={lSortKey} sortDir={lSortDir} onSort={handleLSort} />
                    <SortTh col="month" label="Mes" sortKey={lSortKey} sortDir={lSortDir} onSort={handleLSort} />
                    <SortTh col="amount" label="Monto" right sortKey={lSortKey} sortDir={lSortDir} onSort={handleLSort} />
                    <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprobante</th>
                    <SortTh col="status" label="Estado" sortKey={lSortKey} sortDir={lSortDir} onSort={handleLSort} />
                    <SortTh col="paymentDate" label="Fecha" sortKey={lSortKey} sortDir={lSortDir} onSort={handleLSort} />
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
                        {pago.status === 'Pendiente' && !isEffectiveDebt(pago, TODAY_ISO, state.buildingConfig.maturityRules) && (() => {
                          const base = (pago.concepto || '').split(/[:—]/)[0].trim()
                          const rules = state.buildingConfig.maturityRules
                          
                          let venceDate: Date | null = null

                          if (base === 'Mantenimiento' && pago.monthKey) {
                            const [y, m] = pago.monthKey.split('-').map(Number)
                            const day = (rules.mantenimiento === 'next_month_10') ? 10 : 1
                            venceDate = new Date(y, m, day)
                          }
                          
                          if (base === 'Reserva Amenidad' && pago.monthKey) {
                            const parts = pago.monthKey.split('-').map(Number)
                            if (parts.length === 3) {
                              venceDate = new Date(parts[0], parts[1] - 1, parts[2])
                            } else if (parts.length === 2) {
                              venceDate = new Date(parts[0], parts[1], 0)
                            }
                            if (venceDate && rules.amenidad === '1_day_before') {
                              venceDate.setDate(venceDate.getDate() - 1)
                            }
                          }
                          
                          if ((base === 'Multa' || base === 'Otros') && rules.multaOtros === '7_days_grace') {
                            const [y, m] = (pago.monthKey || TODAY_ISO.slice(0, 7)).split('-').map(Number)
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
                          <button onClick={() => setPreviewPago(pago)}
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
                              <button onClick={() => handleToggleStatus(pago.id)}
                                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                Aprobar
                              </button>
                            )}
                            {pago.status === 'Por validar' && (
                              <>
                                <button onClick={() => handleToggleStatus(pago.id)}
                                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                  Aprobar
                                </button>
                                <button onClick={() => handleRejectPago(pago.id)}
                                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100">
                                  Rechazar
                                </button>
                              </>
                            )}
                            {pago.status === 'Pagado' && (
                              <button onClick={() => handleToggleStatus(pago.id)}
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
                            <button onClick={() => handleResidentPay(pago.id)}
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
            )}

            {/* ── EGRESOS TABLE ── */}
            {isAdmin && ledgerSubTab === 'egresos' && (
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
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500`}>
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
                                <button onClick={() => handleToggleEgresoStatus(eg.id)}
                                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 transition-all ${
                                    eg.status === 'Pendiente'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                      : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                                  }`}>
                                  {eg.status === 'Pendiente' ? 'Pagar' : 'Revertir'}
                                </button>
                                {eg.receiptData && (
                                  <button onClick={() => setPreviewPago(eg as any)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" title="Ver Comprobante">
                                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                  </button>
                                )}
                                <button onClick={() => setDeleteEgresoId(eg.id)}
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
            )}
          </div>
        </>
      )}


      {/* Expediente tab removed — compliance records visible via Concepto filter in Estado de Cuenta */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: REPORTE FINANCIERO (admin only)                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {isAdmin && activeTab === 'report' && (
        <>
          {/* ── Period selector + actions ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                <button onClick={() => setReportPeriod('month')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                    reportPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  }`}>Mensual</button>
                <button onClick={() => setReportPeriod('ytd')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                    reportPeriod === 'ytd' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  }`}>Acumulado Anual</button>
              </div>
              {reportPeriod === 'month' && (
                <input type="month" value={reportMonth} min={MONTH_RANGE[0]} max={MONTH_RANGE[MONTH_RANGE.length - 1]}
                  onChange={e => setReportMonth(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadPDF} disabled={pdfLoading}
                className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-[11px] tracking-widest uppercase transition-all ${
                  pdfLoading ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-900/10'
                }`}>
                <span className="material-symbols-outlined text-[16px]">{pdfLoading ? 'hourglass_empty' : 'picture_as_pdf'}</span>
                {pdfLoading ? 'Generando…' : 'Descargar PDF'}
              </button>
            </div>
          </div>

          {/* ── Income Statement Card ── */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{bc.managementCompany}</p>
              <h2 className="text-xl font-headline font-extrabold text-slate-900 mt-1">Estado de Resultados</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {reportPeriod === 'month' ? `Período: ${monthKeyToLabel(reportMonth)}` : `Acumulado Enero — ${monthKeyToLabel(TODAY_KEY)} ${new Date().getFullYear()}`}
              </p>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* ── INGRESOS ── */}
              <div>
                <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  Ingresos
                </h3>
                <div className="space-y-0.5">
                  {reportData.ingresos.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium py-2">Sin ingresos cobrados en este período.</p>
                  ) : reportData.ingresos.map((row, i) => (
                    <div key={row.concepto} className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${i % 2 === 0 ? '' : 'bg-slate-50/70'}`}>
                      <span className="text-sm font-medium text-slate-700">{row.concepto}</span>
                      <span className="text-sm font-black text-slate-900 tabular-nums">${row.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-3 mt-1 border-t-2 border-emerald-200 bg-emerald-50/50 rounded-lg">
                  <span className="text-sm font-bold text-emerald-800">Total Ingresos</span>
                  <span className="text-lg font-headline font-black text-emerald-700 tabular-nums">${reportData.totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* ── EGRESOS ── */}
              <div>
                <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">trending_down</span>
                  Egresos
                </h3>
                <div className="space-y-0.5">
                  {reportData.egresos.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium py-2">Sin egresos registrados en este período.</p>
                  ) : reportData.egresos.map((cat, i) => (
                    <div key={cat.categoria}>
                      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${i % 2 === 0 ? '' : 'bg-slate-50/70'}`}>
                        <span className="text-sm font-semibold text-slate-700">{EGRESO_CATEGORIA_LABELS[cat.categoria]}</span>
                        <span className="text-sm font-black text-slate-900 tabular-nums">${cat.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {cat.items.map(item => (
                        <div key={item.concepto} className="flex items-center justify-between px-8 py-1.5">
                          <span className="text-xs text-slate-400 font-medium">• {item.concepto}</span>
                          <span className="text-xs text-slate-500 tabular-nums">${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-3 mt-1 border-t-2 border-rose-200 bg-rose-50/50 rounded-lg">
                  <span className="text-sm font-bold text-rose-800">Total Egresos</span>
                  <span className="text-lg font-headline font-black text-rose-700 tabular-nums">${reportData.totalEgresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* ── NET RESULT ── */}
              <div className={`flex items-center justify-between px-6 py-5 rounded-2xl border-2 ${
                reportData.netResult >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
              }`}>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Resultado del Período</p>
                  <p className="text-sm font-bold text-slate-600 mt-0.5">Ingresos − Egresos</p>
                </div>
                <p className={`text-3xl font-headline font-black tabular-nums ${reportData.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ${reportData.netResult.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* ── DELINQUENCY ── */}
              {(reportData.pendingCharges > 0 || reportData.activeAdeudos > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Cartera Pendiente
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xl font-headline font-black text-amber-800 tabular-nums">${reportData.pendingCharges.toLocaleString('es-MX')}</p>
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Cargos sin cobrar</p>
                    </div>
                    <div>
                      <p className="text-xl font-headline font-black text-amber-800 tabular-nums">${reportData.activeAdeudosAmount.toLocaleString('es-MX')}</p>
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">{reportData.activeAdeudos} adeudo(s) activo(s)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Egresos grid moved to Estado de Cuenta */}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* UNIFIED REGISTRATION MODAL                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <Modal open={showModal} onClose={resetAndCloseModal} title={chargeType === 'ingreso' ? 'Nuevo Cargo' : 'Nuevo Gasto'}>
        <div className="space-y-5">

          {/* Tab selector removed - now contextual to the active dashboard tab */}

          {/* ═══ INGRESO FORM ═══ */}
          {chargeType === 'ingreso' && (
            <>
              {/* Unit */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unidad *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={mTower} onChange={e => { setMTower(e.target.value); setMUnit('') }}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                    <option value="">Todas las torres</option>
                    {towers.map(t => <option key={t} value={t}>Torre {t}</option>)}
                  </select>
                  <select value={mUnit} onChange={e => setMUnit(e.target.value)}
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                    <option value="">Seleccionar…</option>
                    {modalUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {/* Concepto */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto *</label>
                <select value={mConcepto || 'Mantenimiento'}
                  onChange={e => { setMConcepto(e.target.value); setMSubConcepto(''); if (e.target.value !== 'Mantenimiento') { setMMulti(false) } }}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  {[...bc.conceptosPago].sort().map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Custom Reason field for Multa/Otros */}
              {isReasonRequired && (
                <div className="space-y-2 animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo / Descripción *</label>
                  <textarea value={mMotivo} onChange={e => setMMotivo(e.target.value)}
                    rows={2} maxLength={100} placeholder="Ej: Ruido excesivo, Arreglo de pintura…"
                    className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm resize-none" />
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-bold ${mMotivo.length >= 90 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {mMotivo.length} / 100
                    </span>
                  </div>
                </div>
              )}
              {/* Sub-Concepto (shown when concept has sub-items) */}
              {(() => {
                const subs = bc.subConceptos?.[(mConcepto || 'Mantenimiento')]
                if (!subs || subs.length === 0) return null
                return (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Detalle</label>
                    <div className="space-y-1.5">
                      {[...subs].sort().map(sub => (
                        <label key={sub} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          mSubConcepto === sub ? 'border-slate-900 bg-slate-900/5' : 'border-slate-100 hover:border-slate-200'
                        }`}>
                          <input type="radio" name="subConcepto" checked={mSubConcepto === sub} onChange={() => setMSubConcepto(sub)}
                            className="w-4 h-4 accent-slate-900" />
                          <span className={`text-sm font-medium ${mSubConcepto === sub ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{sub}</span>
                        </label>
                      ))}
                    </div>
                    {mSubConcepto && (
                      <button type="button" onClick={() => setMSubConcepto('')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest ml-1">
                        Limpiar selección
                      </button>
                    )}
                  </div>
                )
              })()}
              {/* Month — with multi-month toggle ONLY for Mantenimiento */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {isMantenimientoSelected && mMulti ? 'Mes(es) *' : 'Mes *'}
                  </label>
                  {isMantenimientoSelected && (
                    <button type="button" onClick={() => setMMulti(p => !p)}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">
                      <div className={`relative w-8 h-4 rounded-full transition-colors ${mMulti ? 'bg-slate-900' : 'bg-slate-200'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${mMulti ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      Multi-mes
                    </button>
                  )}
                </div>
                {isMantenimientoSelected && mMulti ? (
                  <>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                      {MONTH_RANGE.slice().reverse().map(mk => (
                        <label key={mk} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" checked={mMonths.includes(mk)} onChange={() => toggleFormMonth(mk)} className="w-4 h-4 rounded accent-slate-900" />
                          <span className="text-sm font-medium text-slate-700 capitalize">{monthKeyToLabel(mk)}</span>
                        </label>
                      ))}
                    </div>
                    {mMonths.length > 1 && (
                      <p className="text-[10px] font-bold text-amber-600 ml-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">info</span>
                        {mMonths.length} meses · los meses adelantados se anotan como "pago anticipado"
                      </p>
                    )}
                    {mMonths.length > 0 && mMonths.length <= 1 && <p className="text-[10px] font-bold text-slate-500 ml-1">{mMonths.length} mes seleccionado</p>}
                  </>
                ) : (
                  <input type="month" value={mSingleMonth} min={MONTH_RANGE[0]} max={MONTH_RANGE[MONTH_RANGE.length - 1]}
                    onChange={e => setMSingleMonth(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
                )}
              </div>
              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto (MXN) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input type="number" value={mAmount} onChange={e => setMAmount(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-black text-sm tabular-nums" />
                </div>
                {isMantenimientoSelected && mMulti && mMonths.length > 1 && (
                  <p className="text-[10px] text-slate-400 font-medium ml-1">
                    Total: <span className="font-black text-slate-900">${((Number(mAmount) || 0) * mMonths.length).toLocaleString('es-MX')} MXN</span> ({mMonths.length} × ${(Number(mAmount) || 0).toLocaleString('es-MX')})
                  </p>
                )}
              </div>
              {/* Receipt */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Comprobante <span className="text-slate-300">(PDF ≤5MB · IMG ≤2MB)</span>
                </label>
                <input type="file" accept=".pdf, image/jpeg, image/png" onChange={handleReceiptUpload}
                  className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800" />
                {mReceiptError && <p className="text-xs text-rose-600 font-bold ml-1">{mReceiptError}</p>}
                {mReceiptName && !mReceiptError && (
                  <div className="flex items-center gap-2 ml-1">
                    <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                    <span className="text-xs text-emerald-600 font-bold">{mReceiptName}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══ EGRESO FORM ═══ */}
          {chargeType === 'egreso' && (
            <>
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => (
                    <button key={cat} onClick={() => setEgCategoria(cat)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all text-left ${
                        egCategoria === cat ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {EGRESO_CATEGORIA_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Concepto */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto *</label>
                <input type="text" value={egConcepto} onChange={e => setEgConcepto(e.target.value)}
                  placeholder="Ej: Pago mensual jardinero, Recibo de luz…"
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
              </div>
              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto (MXN) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input type="number" value={egAmount} onChange={e => setEgAmount(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-black text-sm tabular-nums" />
                </div>
              </div>
              {/* Date */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha *</label>
                <input type="date" value={egDate} onChange={e => setEgDate(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
              </div>
              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notas <span className="text-slate-300">(opcional)</span></label>
                <textarea value={egDescription} onChange={e => setEgDescription(e.target.value)}
                  rows={2} maxLength={500} placeholder="Detalle adicional…"
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm resize-none" />
              </div>

              {/* Receipt for Egreso */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Comprobante / Factura <span className="text-slate-300">(PDF/JPG/PNG)</span>
                </label>
                <input type="file" accept=".pdf, image/jpeg, image/png" onChange={handleReceiptUpload}
                  className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800" />
                {mReceiptError && <p className="text-xs text-rose-600 font-bold ml-1">{mReceiptError}</p>}
                {mReceiptName && !mReceiptError && (
                  <div className="flex items-center gap-2 ml-1">
                    <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                    <span className="text-xs text-emerald-600 font-bold">{mReceiptName}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Submit ── */}
          <button onClick={handleRegister} disabled={!formValid}
            className={`w-full py-3 font-bold rounded-2xl transition-all uppercase tracking-widest text-[11px] ${
              !formValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
            }`}>
            {chargeType === 'ingreso'
              ? (isMantenimientoSelected && mMulti && mMonths.length > 1 ? `Registrar ${mMonths.length} pagos` : 'Registrar Ingreso')
              : 'Registrar Egreso'}
          </button>
        </div>
      </Modal>

      {/* ═══ Receipt Preview ═══ */}
      <Modal open={!!previewPago} onClose={() => setPreviewPago(null)} title="Comprobante de Pago">
        {previewPago && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 space-y-1">
              <p><span className="font-black text-slate-900">Unidad:</span> {previewPago.apartment}</p>
              <p><span className="font-black text-slate-900">Mes:</span> {previewPago.month}</p>
              <p><span className="font-black text-slate-900">Monto:</span> ${previewPago.amount.toLocaleString('es-MX')} MXN</p>
              {previewPago.paymentDate && <p><span className="font-black text-slate-900">Fecha:</span> {previewPago.paymentDate}</p>}
            </div>
            {previewPago.receiptType === 'image' && (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={previewPago.receiptData} alt="Comprobante" className="max-w-full max-h-[50vh] object-contain mx-auto" />
              </div>
            )}
            {previewPago.receiptType === 'pdf' && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-rose-500">picture_as_pdf</span>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{previewPago.receiptName}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Documento PDF</p>
                  </div>
                </div>
                <a href={previewPago.receiptData} download={previewPago.receiptName}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">download</span>Descargar
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══ Resident Payment Modal ═══ */}
      <Modal open={!!residentPayTarget} onClose={() => {
        setResidentPayTarget(null)
        setMReceiptData('')
        setMReceiptType(undefined)
        setMReceiptName('')
        setMReceiptError('')
      }} title="Instrucciones de Pago">
        {(() => {
          const pago = state.pagos.find(p => p.id === residentPayTarget)
          if (!pago) return null
          
          const b = bc.banking || { acceptsTransfer: false, acceptsCash: false, acceptsOxxo: false }
          
          return (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                <p className="text-3xl font-headline font-black text-slate-900">${pago.amount.toLocaleString('es-MX')} MXN</p>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{pago.concepto}</p>
                <p className="text-xs text-slate-400 mt-1">Status: <span className="font-bold">{pago.status}</span></p>
              </div>

              {/* Banking Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900">1. Realiza tu pago</h3>
                
                {b.acceptsTransfer ? (
                  <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.02] transform rotate-45 translate-x-10 -translate-y-10" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-[0.02] rounded-full transform -translate-x-8 translate-y-8" />
                    
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Banco</p>
                        <p className="text-sm font-semibold">{b.bankName || 'Por definir'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Titular</p>
                        <p className="text-sm font-semibold truncate" title={b.accountHolder}>{b.accountHolder || 'Por definir'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">CLABE Interbancaria</p>
                        <p className="text-xl font-bold tracking-widest font-mono text-emerald-400">{b.clabe || '000 0000 0000 0000 00'}</p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-800">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Referencia</p>
                        <p className="text-sm font-semibold">
                          {b.referenceFormat === 'apartment' ? `Depto ${myApartment}` : b.customReferenceNote || `Depto ${myApartment}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-center text-rose-600 text-sm font-bold">
                    No hay cuenta bancaria configurada. Contacta a administración.
                  </div>
                )}
                
                {/* Method Pills */}
                <div className="flex gap-2 justify-center">
                  {b.acceptsTransfer && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">SPEI</span>}
                  {b.acceptsCash && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Efectivo</span>}
                  {b.acceptsOxxo && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">OXXO Pay</span>}
                </div>

                {b.notes && (
                  <p className="text-xs text-slate-500 italic text-center px-4">{b.notes}</p>
                )}
              </div>

              {/* Receipt Upload */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900">2. Adjunta Comprobante</h3>
                <div className="space-y-2">
                  <input type="file" accept=".pdf, image/jpeg, image/png" onChange={handleReceiptUpload}
                    className="block w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-slate-900 file:text-white" />
                  {mReceiptError && <p className="text-xs text-rose-600 font-bold ml-1">{mReceiptError}</p>}
                  {mReceiptName && !mReceiptError && (
                    <div className="flex items-center gap-2 ml-1">
                      <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                      <span className="text-xs text-emerald-600 font-bold max-w-[250px] truncate">{mReceiptName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button onClick={handleResidentSubmit} disabled={!mReceiptData && b.acceptsTransfer}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex justify-center items-center gap-2 ${
                    !mReceiptData && b.acceptsTransfer ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] hover:shadow-lg'
                  }`}>
                  <span className="material-symbols-outlined text-[16px]">send</span> Enviar Comprobante
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ═══ Confirm Dialogs ═══ */}
      <ConfirmDialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)} onConfirm={confirmRevoke}
        title="Cancelar Pago" confirmLabel="Cancelar" variant="danger">
        {revokeTarget ? `Estás a punto de marcar el pago del depto. ${revokeTarget.apartment} (${revokeTarget.month}) como PENDIENTE. ¿Confirmar?` : ''}
      </ConfirmDialog>

      <ConfirmDialog open={!!expConfirm} onClose={() => setExpConfirm(null)} onConfirm={executeExpConfirm}
        title={expConfirm?.action === 'annul' ? 'Anular Registro' : expConfirm?.action === 'delete' ? 'Eliminar Registro' : 'Resolver Llamado'}
        confirmLabel={expConfirm?.action === 'annul' ? 'Anular' : expConfirm?.action === 'delete' ? 'Eliminar' : 'Resolver'}
        variant={expConfirm?.action === 'resolve_llamado' ? 'neutral' : 'danger'}>
        {expConfirm?.action === 'annul' ? `¿Anular este registro del depto. ${expConfirm.apartment}? Equivale a una exención.`
          : expConfirm?.action === 'delete' ? `¿Eliminar permanentemente este registro del depto. ${expConfirm?.apartment}?`
          : `¿Confirmar que el llamado del depto. ${expConfirm?.apartment} fue atendido?`}
      </ConfirmDialog>

      {/* ═══ Egreso delete confirm ═══ */}
      <ConfirmDialog open={!!deleteEgresoId} onClose={() => setDeleteEgresoId(null)}
        onConfirm={() => { if (deleteEgresoId) dispatch({ type: 'DELETE_EGRESO', payload: deleteEgresoId }) }}
        title="Eliminar Egreso" confirmLabel="Eliminar" variant="danger">
        ¿Eliminar permanentemente este registro de egreso?
      </ConfirmDialog>

    </div>
  )
}
