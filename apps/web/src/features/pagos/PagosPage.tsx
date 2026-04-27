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
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'


import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import EmptyState from '../../core/components/EmptyState'
import { type Pago, type AdeudoType, type EgresoCategoria } from '../../types'
import { pdf } from '@react-pdf/renderer'
import FinancialReportPDF from './FinancialReportPDF'
import { monthKeyToLabel, generateMonthRange, todayMonthKey, todayIso } from '../../lib/month-utils'
import { useUnifiedPagos, useFilteredPagos, useConceptoOptions, useLedgerEgresos, useAllUnits, type LedgerSortKey, type SortDir } from './hooks/useLedgerData'
import { useGlobalKpis, useContextualKpis, useEgresoKpis } from './hooks/useLedgerKpis'
import { useReportData } from './hooks/useReportData'
import ReportTab from './components/ReportTab'
import RegistrationModal from './components/RegistrationModal'
import IngresoKpiStrip from './components/IngresoKpiStrip'
import EgresoKpiStrip from './components/EgresoKpiStrip'
import { IngresosTable, EgresosTable } from './components/LedgerTables'
import UnitBalancePanel from './components/UnitBalancePanel'
import ResidentPaymentModal from './components/ResidentPaymentModal'
import LedgerToolbar from './components/LedgerToolbar'

const MONTH_RANGE = generateMonthRange()
const TODAY_KEY = todayMonthKey()
const TODAY_ISO = todayIso()


// ── Adeudo type labels ──

const ADEUDO_TYPE_LABELS: Record<AdeudoType, string> = {
  multa: 'Multa', llamado_atencion: 'Llamado de Atención', adeudo: 'Adeudo',
}


// ── Charge type for unified modal ──
type ChargeType = 'ingreso' | 'egreso'
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

  const [searchParams] = useSearchParams()
  const initMonth = searchParams.get('month') || ''
  const initStatus = searchParams.get('status') || ''
  const initConcepto = searchParams.get('concepto') || ''
  const initShowFilters = !!initMonth || !!initStatus || !!initConcepto

  const [lFilterMonth, setLFilterMonth]   = useState(initMonth)
  const [lFilterTower, setLFilterTower]   = useState('')
  const [lFilterUnit, setLFilterUnit]     = useState('')
  const [lFilterStatus, setLFilterStatus] = useState(initStatus)
  const [lFilterConcepto, setLFilterConcepto] = useState(initConcepto)
  const [lSortKey, setLSortKey]           = useState<LedgerSortKey>('apartment')
  const [lSortDir, setLSortDir]           = useState<SortDir>('asc')
  const [ledgerSubTab, setLedgerSubTab]   = useState<'ingresos' | 'egresos'>('ingresos')
  const [unitDetailView, setUnitDetailView] = useState<'pagos' | 'adeudos' | 'balance' | null>(null)
  const [showFilters, setShowFilters]     = useState(initShowFilters)
  const [egresoFilterStatus, setEgresoFilterStatus] = useState('')

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



  const clearAllFilters = useCallback(() => {
    setLFilterMonth('')
    setLFilterTower('')
    setLFilterUnit('')
    setLFilterConcepto('')
    setLFilterStatus('')
    setEgresoFilterStatus('')
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

  // ── Topology & Ledger Data (extracted hooks) ──
  const towers = bc.towers.sort()
  const allUnits = useAllUnits(state.residents, state.pagos, state.adeudos)

  const lFilteredUnits = useMemo(() => {
    if (!lFilterTower) return allUnits
    return allUnits.filter(u => state.residents.some(r => r.apartment === u && r.tower === lFilterTower))
  }, [allUnits, lFilterTower, state.residents])

  const modalUnits = useMemo(() => {
    if (!mTower) return allUnits
    return allUnits.filter(u => state.residents.some(r => r.apartment === u && r.tower === mTower))
  }, [allUnits, mTower, state.residents])

  const unifiedPagos = useUnifiedPagos(state.pagos, state.adeudos, state.residents)
  const filteredPagos = useFilteredPagos(unifiedPagos, state.residents, isAdmin, myApartment, lFilterMonth, lFilterTower, lFilterUnit, lFilterStatus, lFilterConcepto, lSortKey, lSortDir)
  const conceptoOptions = useConceptoOptions(unifiedPagos)
  const ledgerEgresos = useLedgerEgresos(state.egresos, lFilterMonth)

  // ── KPIs (extracted hooks) ──
  const globalKpis = useGlobalKpis(state.pagos, state.adeudos, state.buildingConfig.maturityRules, isAdmin, myApartment, TODAY_ISO)
  const contextualKpis = useContextualKpis(state.pagos, state.adeudos, state.residents, state.buildingConfig.maturityRules, isAdmin, myApartment, TODAY_ISO, lFilterMonth, lFilterTower, lFilterUnit, lFilterConcepto, TODAY_KEY)
  const ledgerKpis = showFilters ? contextualKpis : globalKpis
  const egresoKpis = useEgresoKpis(ledgerEgresos)

  // ═════════════════════════════════════════════════════════════════════
  // EXPEDIENTE tab data
  // ═════════════════════════════════════════════════════════════════════



  // ── Financial Report (extracted hook) ──
  const reportData = useReportData(state.pagos, state.egresos, state.adeudos, bc, reportPeriod, reportMonth)


  // ═════════════════════════════════════════════════════════════════════
  // SORT HELPERS
  // ═════════════════════════════════════════════════════════════════════

  const handleLSort = (key: LedgerSortKey) => {
    if (lSortKey === key) setLSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLSortKey(key); setLSortDir('asc') }
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

          {/* ── Ingreso KPI Strip ── */}
          {isAdmin && ledgerSubTab === 'ingresos' && (
            <IngresoKpiStrip
              kpiItems={[
                { label: 'Recaudación Mantenimiento', value: ledgerKpis.paidMantenimientoCount, amount: ledgerKpis.paidMantenimientoTotal, icon: 'trending_up', color: 'bg-emerald-500', iconColor: 'text-emerald-600', filterKey: 'Pagado', showInGlobal: false },
                { label: 'Deuda Efectiva', value: ledgerKpis.overdueCount, amount: ledgerKpis.overdueTotal, icon: 'gavel', color: 'bg-rose-500', iconColor: 'text-rose-600', filterKey: 'Vencido', showInGlobal: true },
                { label: 'En Revisión', value: ledgerKpis.porValidarCount, amount: ledgerKpis.porValidarTotal, icon: 'hourglass_top', color: 'bg-violet-500', iconColor: 'text-violet-600', filterKey: 'Por validar', showInGlobal: false },
                { label: 'Próximos Cargos', value: ledgerKpis.upcomingCount, amount: ledgerKpis.upcomingTotal, icon: 'schedule', color: 'bg-amber-500', iconColor: 'text-amber-600', filterKey: 'Pendiente', showInGlobal: true },
              ]}
              ledgerKpis={ledgerKpis}
              totalEgresosPaid={egresoKpis.paidTotal}
              lFilterMonth={lFilterMonth}
              lFilterStatus={lFilterStatus}
              showFilters={showFilters}
              todayKey={TODAY_KEY}
              onStatusFilter={(fk) => setLFilterStatus(fk)}
            />
          )}


          {/* ── Egreso KPI Strip ── */}
          {isAdmin && ledgerSubTab === 'egresos' && (
            <EgresoKpiStrip
              egresoKpis={egresoKpis}
              ledgerEgresos={ledgerEgresos}
              lFilterMonth={lFilterMonth}
              lFilterStatus={egresoFilterStatus}
              showFilters={showFilters}
              onStatusFilter={(fk) => setEgresoFilterStatus(fk)}
            />
          )}


          {/* ── Unit balance panel ── */}
          {isAdmin && lFilterUnit && (
            <UnitBalancePanel
              unit={lFilterUnit}
              residents={state.residents}
              pagos={state.pagos}
              adeudos={state.adeudos}
              maturityRules={state.buildingConfig.maturityRules}
              todayIso={TODAY_ISO}
              unitDetailView={unitDetailView}
              onDetailToggle={(view) => setUnitDetailView(prev => prev === view ? null : view)}
              onDetailClose={() => setUnitDetailView(null)}
            />
          )}

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
            <LedgerToolbar
              isAdmin={isAdmin}
              ledgerSubTab={ledgerSubTab}
              ingresoCount={filteredPagos.length}
              egresoCount={ledgerEgresos.length}
              activeFilters={activeFilters}
              showFilters={showFilters}
              lFilterMonth={lFilterMonth}
              lFilterTower={lFilterTower}
              lFilterUnit={lFilterUnit}
              lFilterConcepto={lFilterConcepto}
              lFilterStatus={lFilterStatus}
              towers={towers}
              filteredUnits={lFilteredUnits}
              conceptoOptions={conceptoOptions}
              onSubTabChange={setLedgerSubTab}
              onAddClick={() => {
                setShowModal(true)
                setChargeType(ledgerSubTab === 'ingresos' ? 'ingreso' : 'egreso')
              }}
              onToggleFilters={() => {
                if (showFilters) {
                  clearAllFilters()
                } else {
                  setLFilterMonth(TODAY_KEY)
                }
                setShowFilters(!showFilters)
              }}
              clearAllFilters={clearAllFilters}
              onMonthChange={setLFilterMonth}
              onTowerChange={(v) => { setLFilterTower(v); setLFilterUnit('') }}
              onUnitChange={(v) => { setLFilterUnit(v); setUnitDetailView(null) }}
              onConceptoChange={setLFilterConcepto}
              onStatusChange={setLFilterStatus}
            />

            {/* ── INGRESOS TABLE ── */}
            {(ledgerSubTab === 'ingresos' || !isAdmin) && (
              <IngresosTable
                filteredPagos={filteredPagos}
                isAdmin={isAdmin}
                sortKey={lSortKey}
                sortDir={lSortDir}
                todayIso={TODAY_ISO}
                maturityRules={state.buildingConfig.maturityRules}
                onSort={handleLSort}
                onToggleStatus={handleToggleStatus}
                onRejectPago={handleRejectPago}
                onResidentPay={handleResidentPay}
                onPreview={setPreviewPago}
              />
            )}

            {/* ── EGRESOS TABLE ── */}
            {isAdmin && ledgerSubTab === 'egresos' && (
              <EgresosTable
                ledgerEgresos={egresoFilterStatus ? ledgerEgresos.filter(e => e.status === egresoFilterStatus) : ledgerEgresos}
                onToggleStatus={handleToggleEgresoStatus}
                onPreview={(eg) => setPreviewPago(eg as any)}
                onDelete={(id) => setDeleteEgresoId(id)}
              />
            )}
          </div>
        </>
      )}


      {/* Expediente tab removed — compliance records visible via Concepto filter in Estado de Cuenta */}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: REPORTE FINANCIERO (admin only)                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {isAdmin && activeTab === 'report' && (
        <ReportTab
          reportData={reportData}
          reportPeriod={reportPeriod}
          reportMonth={reportMonth}
          monthRange={MONTH_RANGE}
          pdfLoading={pdfLoading}
          managementCompany={bc.managementCompany}
          onPeriodChange={setReportPeriod}
          onMonthChange={setReportMonth}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* UNIFIED REGISTRATION MODAL                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <RegistrationModal
        open={showModal}
        chargeType={chargeType}
        towers={towers}
        modalUnits={modalUnits}
        mTower={mTower}
        mUnit={mUnit}
        mConcepto={mConcepto}
        mSubConcepto={mSubConcepto}
        mMotivo={mMotivo}
        mMulti={mMulti}
        mMonths={mMonths}
        mSingleMonth={mSingleMonth}
        mAmount={mAmount}
        mReceiptError={mReceiptError}
        mReceiptName={mReceiptName}
        isMantenimientoSelected={isMantenimientoSelected}
        isReasonRequired={isReasonRequired}
        monthRange={MONTH_RANGE}
        conceptosPago={bc.conceptosPago}
        subConceptos={bc.subConceptos}
        formValid={formValid}
        egCategoria={egCategoria}
        egConcepto={egConcepto}
        egAmount={egAmount}
        egDate={egDate}
        egDescription={egDescription}
        onClose={resetAndCloseModal}
        onRegister={handleRegister}
        onTowerChange={setMTower}
        onUnitChange={setMUnit}
        onConceptoChange={v => { setMConcepto(v); setMSubConcepto(''); if (v !== 'Mantenimiento') { setMMulti(false) } }}
        onSubConceptoChange={setMSubConcepto}
        onMotivoChange={setMMotivo}
        onMultiToggle={() => setMMulti(p => !p)}
        onMonthToggle={toggleFormMonth}
        onSingleMonthChange={setMSingleMonth}
        onAmountChange={setMAmount}
        onReceiptUpload={handleReceiptUpload}
        onEgCategoriaChange={setEgCategoria}
        onEgConceptoChange={setEgConcepto}
        onEgAmountChange={setEgAmount}
        onEgDateChange={setEgDate}
        onEgDescriptionChange={setEgDescription}
      />

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
      <ResidentPaymentModal
        pago={residentPayTarget ? state.pagos.find(p => p.id === residentPayTarget) || null : null}
        banking={bc.banking}
        myApartment={myApartment}
        receiptName={mReceiptName}
        receiptData={mReceiptData}
        receiptError={mReceiptError}
        onClose={() => {
          setResidentPayTarget(null)
          setMReceiptData('')
          setMReceiptType(undefined)
          setMReceiptName('')
          setMReceiptError('')
        }}
        onSubmit={handleResidentSubmit}
        onReceiptUpload={handleReceiptUpload}
      />

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
