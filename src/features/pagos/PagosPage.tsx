/**
 * PagosPage — Unified Financial Hub.
 *
 * Two tabs:
 *   1. "Estado de Cuenta" — billing ledger (all Pago records).
 *   2. "Expediente"        — compliance/enforcement (all Adeudo records).
 *
 * Unified registration modal with 5 charge types:
 *   - Mensualidad / Extraordinario → creates Pago only.
 *   - Multa / Adeudo              → creates BOTH Pago + Adeudo (linked) in one click.
 *   - Llamado de Atención         → creates Adeudo only (non-financial).
 *
 * Admin sees both tabs + KPIs + unit balance panel.
 * Resident sees ledger tab only + adeudo summary card.
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import { type Pago, type AdeudoType } from '../../core/store/seed'

// ─── Shared helpers ──────────────────────────────────────────────────

const MONTH_NAMES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]

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

// ── Adeudo type labels & icons ──

const ADEUDO_TYPE_LABELS: Record<AdeudoType, string> = {
  multa: 'Multa', llamado_atencion: 'Llamado de Atención', adeudo: 'Adeudo',
}
const ADEUDO_TYPE_ICONS: Record<AdeudoType, string> = {
  multa: 'gavel', llamado_atencion: 'warning', adeudo: 'account_balance_wallet',
}
const ADEUDO_TYPE_BADGE: Record<AdeudoType, string> = {
  multa: 'bg-rose-50 text-rose-700 border-rose-200',
  llamado_atencion: 'bg-amber-50 text-amber-700 border-amber-200',
  adeudo: 'bg-sky-50 text-sky-700 border-sky-200',
}

function agingLabel(createdAt: string, status: string, amount: number): string | null {
  if (status !== 'Activo' || amount <= 0) return null
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days >= 90) return '90d+'
  if (days >= 60) return '60d'
  if (days >= 30) return '30d'
  return null
}

// ── Charge type for unified modal ──
type ChargeType = 'mensualidad' | 'extraordinario' | 'multa' | 'adeudo' | 'llamado'
const CHARGE_TYPES: { key: ChargeType; label: string; icon: string; desc: string }[] = [
  { key: 'mensualidad',    label: 'Mensualidad',    icon: 'home',                   desc: 'Cuota mensual recurrente' },
  { key: 'extraordinario', label: 'Extraordinario',  icon: 'receipt_long',           desc: 'Cuota especial o proyecto' },
  { key: 'multa',          label: 'Multa',           icon: 'gavel',                  desc: 'Infracción económica → Crea cargo + expediente' },
  { key: 'adeudo',         label: 'Adeudo',          icon: 'account_balance_wallet', desc: 'Deuda histórica → Crea cargo + expediente' },
  { key: 'llamado',        label: 'Llamado',         icon: 'warning',                desc: 'Aviso formal sin cargo económico' },
]

// Sort types
type LedgerSortKey = 'apartment' | 'concepto' | 'month' | 'amount' | 'paymentDate' | 'status'
type ExpSortKey = 'apartment' | 'type' | 'concepto' | 'amount' | 'status' | 'createdAt'
type SortDir = 'asc' | 'desc'
type ActiveTab = 'ledger' | 'expediente'

// ═══════════════════════════════════════════════════════════════════════

export default function PagosPage() {
  const { role, apartment: myApartment } = useAuth()
  const { state, dispatch } = useStore()
  const isAdmin = role === 'admin'
  const bc = state.buildingConfig

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<ActiveTab>('ledger')

  // ── Ledger filters ──
  const [lFilterMonth, setLFilterMonth]   = useState(TODAY_KEY)
  const [lFilterTower, setLFilterTower]   = useState('')
  const [lFilterUnit, setLFilterUnit]     = useState('')
  const [lFilterStatus, setLFilterStatus] = useState('')
  const [lSortKey, setLSortKey]           = useState<LedgerSortKey>('apartment')
  const [lSortDir, setLSortDir]           = useState<SortDir>('asc')

  // ── Expediente filters ──
  const [eFilterTower, setEFilterTower]   = useState('')
  const [eFilterUnit, setEFilterUnit]     = useState('')
  const [eFilterType, setEFilterType]     = useState<AdeudoType | ''>('')
  const [eFilterStatus, setEFilterStatus] = useState('')
  const [eSortKey, setESortKey]           = useState<ExpSortKey>('createdAt')
  const [eSortDir, setESortDir]           = useState<SortDir>('desc')
  const [expandedId, setExpandedId]       = useState<string | null>(null)

  // ── Unified modal ──
  const [showModal, setShowModal]             = useState(false)
  const [chargeType, setChargeType]           = useState<ChargeType>('mensualidad')
  const [mTower, setMTower]                   = useState('')
  const [mUnit, setMUnit]                     = useState('')
  const [mAmount, setMAmount]                 = useState('1700')
  const [mConcepto, setMConcepto]             = useState('')
  const [mDescription, setMDescription]       = useState('')
  const [mStatus, setMStatus]                 = useState<'Pagado' | 'Pendiente'>('Pendiente')
  const [mMulti, setMMulti]                   = useState(false)
  const [mMonths, setMMonths]                 = useState<string[]>([TODAY_KEY])
  const [mSingleMonth, setMSingleMonth]       = useState(TODAY_KEY)
  const [mReceiptData, setMReceiptData]       = useState('')
  const [mReceiptType, setMReceiptType]       = useState<'image' | 'pdf' | undefined>()
  const [mReceiptName, setMReceiptName]       = useState('')
  const [mReceiptError, setMReceiptError]     = useState('')

  // ── Receipt preview ──
  const [previewPago, setPreviewPago] = useState<Pago | null>(null)

  // ── Confirm dialogs ──
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; apartment: string; month: string } | null>(null)
  const [expConfirm, setExpConfirm] = useState<{ id: string; action: 'annul' | 'resolve_llamado' | 'delete'; apartment: string } | null>(null)

  // ── Topology ──
  const towers = bc.towers.sort()
  const allUnits = useMemo(() => {
    const u = new Set<string>()
    state.residents.forEach(r => u.add(r.apartment))
    state.pagos.forEach(p => u.add(p.apartment))
    state.adeudos.forEach(a => u.add(a.apartment))
    return [...u].sort()
  }, [state.residents, state.pagos, state.adeudos])

  const lFilteredUnits = useMemo(() => lFilterTower ? allUnits.filter(u => u.startsWith(lFilterTower)) : allUnits, [allUnits, lFilterTower])
  const eFilteredUnits = useMemo(() => eFilterTower ? allUnits.filter(u => u.startsWith(eFilterTower)) : allUnits, [allUnits, eFilterTower])
  const modalUnits     = useMemo(() => mTower ? allUnits.filter(u => u.startsWith(mTower)) : allUnits, [allUnits, mTower])

  // ═════════════════════════════════════════════════════════════════════
  // LEDGER tab data
  // ═════════════════════════════════════════════════════════════════════

  const filteredPagos = useMemo(() => {
    let data = isAdmin ? state.pagos : state.pagos.filter(p => p.apartment === myApartment)
    if (!isAdmin || lFilterMonth) data = data.filter(p => (p.monthKey || '') === lFilterMonth)
    if (lFilterTower)  data = data.filter(p => p.apartment.startsWith(lFilterTower))
    if (lFilterUnit)   data = data.filter(p => p.apartment === lFilterUnit)
    if (lFilterStatus) data = data.filter(p => p.status === lFilterStatus)
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
  }, [state.pagos, isAdmin, myApartment, lFilterMonth, lFilterTower, lFilterUnit, lFilterStatus, lSortKey, lSortDir])

  const ledgerKpis = useMemo(() => {
    const paid = filteredPagos.filter(p => p.status === 'Pagado')
    const pending = filteredPagos.filter(p => p.status === 'Pendiente')
    return {
      paidTotal: paid.reduce((s, p) => s + p.amount, 0),
      pendingTotal: pending.reduce((s, p) => s + p.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
    }
  }, [filteredPagos])

  // ═════════════════════════════════════════════════════════════════════
  // EXPEDIENTE tab data
  // ═════════════════════════════════════════════════════════════════════

  const filteredAdeudos = useMemo(() => {
    let data = state.adeudos
    if (eFilterTower)  data = data.filter(a => a.apartment.startsWith(eFilterTower))
    if (eFilterUnit)   data = data.filter(a => a.apartment === eFilterUnit)
    if (eFilterType)   data = data.filter(a => a.type === eFilterType)
    if (eFilterStatus) data = data.filter(a => a.status === eFilterStatus)
    return [...data].sort((a, b) => {
      let va: string | number, vb: string | number
      switch (eSortKey) {
        case 'apartment': va = a.apartment; vb = b.apartment; break
        case 'type':      va = a.type;      vb = b.type;      break
        case 'concepto':  va = a.concepto;  vb = b.concepto;  break
        case 'amount':    va = a.amount;    vb = b.amount;    break
        case 'status':    va = a.status;    vb = b.status;    break
        case 'createdAt': va = a.createdAt; vb = b.createdAt; break
        default: return 0
      }
      if (va < vb) return eSortDir === 'asc' ? -1 : 1
      if (va > vb) return eSortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [state.adeudos, eFilterTower, eFilterUnit, eFilterType, eFilterStatus, eSortKey, eSortDir])

  const expKpis = useMemo(() => {
    const active = state.adeudos.filter(a => a.status === 'Activo')
    return {
      warnings: active.filter(a => a.type === 'llamado_atencion').length,
      fines:    active.filter(a => a.type === 'multa').length,
      debts:    active.filter(a => a.type === 'adeudo').length,
      totalAmt: active.reduce((s, a) => s + a.amount, 0),
    }
  }, [state.adeudos])

  // ═════════════════════════════════════════════════════════════════════
  // SORT HELPERS
  // ═════════════════════════════════════════════════════════════════════

  const handleLSort = (key: LedgerSortKey) => {
    if (lSortKey === key) setLSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setLSortKey(key); setLSortDir('asc') }
  }
  const handleESort = (key: ExpSortKey) => {
    if (eSortKey === key) setESortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setESortKey(key); setESortDir('asc') }
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

  // Ledger: toggle pago status
  const handleToggleStatus = (id: string) => {
    const pago = state.pagos.find(p => p.id === id)
    if (!pago) return
    if (pago.status === 'Pagado') {
      setRevokeTarget({ id: pago.id, apartment: pago.apartment, month: pago.month })
      return
    }
    dispatch({ type: 'UPDATE_PAGO', payload: { ...pago, status: 'Pagado', paymentDate: new Date().toISOString().split('T')[0] } })
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

  // Unified register
  const handleRegister = () => {
    if (!mUnit) return
    const resident = state.residents.find(r => r.apartment === mUnit)
    const resName = resident?.name || mUnit
    const isFinancial = chargeType !== 'llamado'
    const isDisciplinary = chargeType === 'multa' || chargeType === 'adeudo'

    if (isFinancial && !isDisciplinary) {
      // ── Mensualidad / Extraordinario → Pago only ──
      const months = mMulti ? mMonths : [mSingleMonth]
      const concepto = chargeType === 'extraordinario' ? 'Extraordinario' : (mConcepto || 'Mensualidad')
      months.forEach(mk => {
        dispatch({
          type: 'ADD_PAGO',
          payload: {
            id: `pg-${Date.now()}-${mk}`,
            apartment: mUnit,
            resident: resName,
            month: monthKeyToLabel(mk),
            monthKey: mk,
            concepto,
            amount: Number(mAmount) || 1700,
            status: mStatus,
            paymentDate: mStatus === 'Pagado' ? new Date().toISOString().split('T')[0] : null,
            receiptData: mReceiptData || undefined,
            receiptType: mReceiptType,
            receiptName: mReceiptName || undefined,
          },
        })
      })
    } else if (isDisciplinary) {
      // ── Multa / Adeudo → creates BOTH Pago + Adeudo ──
      const pagoId = `pg-${Date.now()}`
      const adeudoId = `ad-${Date.now()}`
      const concepto = mConcepto.trim() || (chargeType === 'multa' ? 'Multa' : 'Adeudo')
      // Create pago (Pendiente)
      dispatch({
        type: 'ADD_PAGO',
        payload: {
          id: pagoId,
          apartment: mUnit,
          resident: resName,
          month: monthKeyToLabel(TODAY_KEY),
          monthKey: TODAY_KEY,
          concepto,
          amount: Number(mAmount) || 0,
          status: 'Pendiente',
          paymentDate: null,
          adeudoId,
        },
      })
      // Create adeudo (linked)
      dispatch({
        type: 'ADD_ADEUDO',
        payload: {
          id: adeudoId,
          apartment: mUnit,
          type: chargeType as AdeudoType,
          concepto,
          description: mDescription.trim(),
          amount: Number(mAmount) || 0,
          status: 'Activo',
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
          pagoId,
        },
      })
    } else {
      // ── Llamado de Atención → Adeudo only ──
      dispatch({
        type: 'ADD_ADEUDO',
        payload: {
          id: `ad-${Date.now()}`,
          apartment: mUnit,
          type: 'llamado_atencion',
          concepto: 'Llamado de atención',
          description: mDescription.trim(),
          amount: 0,
          status: 'Activo',
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
          pagoId: undefined,
        },
      })
    }

    // Reset modal
    setMTower(''); setMUnit(''); setMAmount('1700'); setMConcepto(''); setMDescription('')
    setMStatus('Pendiente'); setMMulti(false); setMMonths([TODAY_KEY]); setMSingleMonth(TODAY_KEY)
    setMReceiptData(''); setMReceiptType(undefined); setMReceiptName(''); setMReceiptError('')
    setShowModal(false)
  }

  const toggleFormMonth = (mk: string) => setMMonths(prev => prev.includes(mk) ? prev.filter(m => m !== mk) : [...prev, mk])

  const isPaymentType = chargeType === 'mensualidad' || chargeType === 'extraordinario'
  const isDisciplinaryType = chargeType === 'multa' || chargeType === 'adeudo'
  const isLlamadoType = chargeType === 'llamado'

  const formValid = !!mUnit && (
    isPaymentType ? (mMulti ? mMonths.length > 0 : !!mSingleMonth) && !mReceiptError
    : isDisciplinaryType ? !!mDescription.trim() && Number(mAmount) > 0
    : !!mDescription.trim() // llamado
  )

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">

      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Módulo Financiero</p>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Finanzas
          </h1>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 text-[11px] tracking-widest uppercase shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Cargo
          </button>
        )}
      </div>

      {/* ═══ Tab bar (admin only) ═══ */}
      {isAdmin && (
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
          {([
            { key: 'ledger' as ActiveTab, label: 'Estado de Cuenta', icon: 'receipt_long' },
            { key: 'expediente' as ActiveTab, label: 'Expediente', icon: 'gavel' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ESTADO DE CUENTA (Ledger)                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {(activeTab === 'ledger' || !isAdmin) && (
        <>
          {/* ── Admin filters ── */}
          {isAdmin && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Mes / Año</label>
                <div className="flex items-center gap-2">
                  <input type="month" value={lFilterMonth} min={MONTH_RANGE[0]} max={MONTH_RANGE[MONTH_RANGE.length - 1]}
                    onChange={e => setLFilterMonth(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
                  {lFilterMonth && (
                    <button onClick={() => setLFilterMonth('')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all shrink-0" title="Ver todos">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
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
                <select value={lFilterUnit} onChange={e => setLFilterUnit(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todas</option>
                  {lFilteredUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Estado</label>
                <select value={lFilterStatus} onChange={e => setLFilterStatus(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todos</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Pendiente">Pendiente</option>
                </select>
              </div>
            </div>
          )}

          {/* ── KPI strip (admin) ── */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Pagados', value: ledgerKpis.paidCount, amount: ledgerKpis.paidTotal, icon: 'check_circle', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: 'Pendientes', value: ledgerKpis.pendingCount, amount: ledgerKpis.pendingTotal, icon: 'pending', color: 'text-rose-600 bg-rose-50 border-rose-200' },
              ].map(k => (
                <div key={k.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${k.color}`}>
                  <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-lg">{k.icon}</span>
                  </div>
                  <div>
                    <p className="text-xl font-headline font-black leading-none">{k.value} registros</p>
                    <p className="text-xs font-bold opacity-70 mt-0.5">${k.amount.toLocaleString('es-MX')} MXN · {k.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Unit balance panel ── */}
          {isAdmin && lFilterUnit && (() => {
            const res = state.residents.find(r => r.apartment === lFilterUnit)
            const uPagos   = state.pagos.filter(p => p.apartment === lFilterUnit && p.status === 'Pendiente')
            const uAdeudos = state.adeudos.filter(a => a.apartment === lFilterUnit && a.status === 'Activo' && a.amount > 0)
            const pp = uPagos.reduce((s, p) => s + p.amount, 0)
            const aa = uAdeudos.reduce((s, a) => s + a.amount, 0)
            const total = pp + aa
            return (
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resumen de unidad</p>
                  <p className="text-lg font-headline font-black mt-0.5">{lFilterUnit}{res ? ` — ${res.name}` : ''}</p>
                </div>
                <div className="flex gap-5 flex-wrap">
                  <div className="text-center"><p className="text-xl font-headline font-black tabular-nums">${pp.toLocaleString('es-MX')}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pagos Pend.</p></div>
                  <div className="w-px bg-slate-700" />
                  <div className="text-center"><p className="text-xl font-headline font-black tabular-nums text-amber-400">${aa.toLocaleString('es-MX')}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Adeudos</p></div>
                  <div className="w-px bg-slate-700" />
                  <div className="text-center"><p className={`text-2xl font-headline font-black tabular-nums ${total > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>${total.toLocaleString('es-MX')}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Balance</p></div>
                </div>
                {aa > 0 && (
                  <button onClick={() => { setActiveTab('expediente'); setEFilterUnit(lFilterUnit) }}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-xs tracking-widest uppercase transition-all">
                    <span className="material-symbols-outlined text-[14px]">gavel</span>Ver Expediente
                  </button>
                )}
              </div>
            )
          })()}

          {/* ── Resident balance cards ── */}
          {!isAdmin && (() => {
            const myPagos = state.pagos.filter(p => p.apartment === myApartment)
            const pending = myPagos.filter(p => p.status === 'Pendiente')
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
                  <div className={`border rounded-2xl p-5 flex items-center gap-4 ${pending.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${pending.length > 0 ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                      <span className="material-symbols-outlined text-white text-xl">{pending.length > 0 ? 'warning' : 'verified'}</span>
                    </div>
                    <div>
                      <p className={`text-2xl font-headline font-black ${pending.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {pending.length > 0 ? `$${pending.reduce((s, p) => s + p.amount, 0).toLocaleString('es-MX')}` : 'Al corriente'}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${pending.length > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {pending.length > 0 ? `${pending.length} cargo(s) pendiente(s)` : 'Sin cargos pendientes'}
                      </p>
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

          {/* ── Ledger grid ── */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-headline font-extrabold text-slate-900">
                  {isAdmin ? 'Historial de Cargos' : 'Mis Pagos'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {filteredPagos.length} registro{filteredPagos.length !== 1 ? 's' : ''}
                  {lFilterMonth ? ` · ${monthKeyToLabel(lFilterMonth)}` : ''}
                </p>
              </div>
            </div>
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
                    {isAdmin && <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acción</th>}
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest self-start ${
                            pago.adeudoId ? 'bg-rose-50 text-rose-700'
                            : pago.concepto === 'Extraordinario' ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                            {pago.adeudoId && <span className="material-symbols-outlined text-[11px]">gavel</span>}
                            {pago.concepto || 'Mensualidad'}
                          </span>
                          {pago.adeudoId && isAdmin && (
                            <button onClick={() => { setActiveTab('expediente') }}
                              className="text-[9px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors text-left">
                              Ver expediente →
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700 capitalize">{pago.month}</td>
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
                          <button onClick={() => handleToggleStatus(pago.id)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                              pago.status === 'Pendiente'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                            }`}>
                            {pago.status === 'Pendiente' ? 'Aprobar' : 'Revocar'}
                          </button>
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
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: EXPEDIENTE (Compliance)                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {isAdmin && activeTab === 'expediente' && (
        <>
          {/* ── KPI strip ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { key: 'llamado_atencion' as AdeudoType, label: 'Llamados', value: expKpis.warnings, icon: 'warning', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { key: 'multa'           as AdeudoType, label: 'Multas',    value: expKpis.fines,    icon: 'gavel',   color: 'bg-rose-50 text-rose-700 border-rose-200' },
              { key: 'adeudo'          as AdeudoType, label: 'Adeudos',   value: expKpis.debts,    icon: 'account_balance_wallet', color: 'bg-sky-50 text-sky-700 border-sky-200' },
              { key: null,              label: 'Monto',    value: `$${expKpis.totalAmt.toLocaleString('es-MX')}`, icon: 'trending_up',
                color: expKpis.totalAmt > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ] as { key: AdeudoType | null; label: string; value: string | number; icon: string; color: string }[]).map(k => (
              <button key={k.label}
                onClick={() => k.key && setEFilterType(eFilterType === k.key ? '' : k.key)}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${k.color} ${
                  k.key && eFilterType === k.key ? 'ring-2 ring-offset-1 ring-current scale-[0.98]' : 'hover:scale-[0.98]'
                } ${k.key ? 'cursor-pointer' : 'cursor-default'}`}>
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{k.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-headline font-black leading-none tabular-nums">{k.value}</p>
                  <p className="text-[10px] font-bold opacity-60 mt-0.5 uppercase tracking-widest truncate">{k.label} activos</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Torre</label>
                <select value={eFilterTower} onChange={e => { setEFilterTower(e.target.value); setEFilterUnit('') }}
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todas</option>
                  {towers.map(t => <option key={t} value={t}>Torre {t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Unidad</label>
                <select value={eFilterUnit} onChange={e => setEFilterUnit(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todas</option>
                  {eFilteredUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Estado</label>
                <select value={eFilterStatus} onChange={e => setEFilterStatus(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Pagado">Resuelto</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>
              {(eFilterTower || eFilterUnit || eFilterType || eFilterStatus) && (
                <div className="flex items-end">
                  <button onClick={() => { setEFilterTower(''); setEFilterUnit(''); setEFilterType(''); setEFilterStatus('') }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:border-slate-300 font-bold text-xs transition-all">
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Expediente grid ── */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-headline font-extrabold text-slate-900">Registros</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {filteredAdeudos.length} registro{filteredAdeudos.length !== 1 ? 's' : ''}
                {eFilterType ? ` · ${ADEUDO_TYPE_LABELS[eFilterType]}` : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <SortTh col="apartment" label="Unidad" sortKey={eSortKey} sortDir={eSortDir} onSort={handleESort} />
                    <SortTh col="type" label="Tipo" sortKey={eSortKey} sortDir={eSortDir} onSort={handleESort} />
                    <SortTh col="concepto" label="Concepto" sortKey={eSortKey} sortDir={eSortDir} onSort={handleESort} />
                    <SortTh col="amount" label="Monto" right sortKey={eSortKey} sortDir={eSortDir} onSort={handleESort} />
                    <SortTh col="status" label="Estado" sortKey={eSortKey} sortDir={eSortDir} onSort={handleESort} />
                    <SortTh col="createdAt" label="Fecha" sortKey={eSortKey} sortDir={eSortDir} onSort={handleESort} />
                    <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdeudos.map(ad => {
                    const res = state.residents.find(r => r.apartment === ad.apartment)
                    const aging = agingLabel(ad.createdAt, ad.status, ad.amount)
                    const isExp = expandedId === ad.id
                    const linkedPago = ad.pagoId ? state.pagos.find(p => p.id === ad.pagoId) : undefined
                    return (
                      <tr key={ad.id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-black text-slate-900 leading-none">{ad.apartment}</p>
                          {res && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{res.name}</p>}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${ADEUDO_TYPE_BADGE[ad.type]}`}>
                            <span className="material-symbols-outlined text-[12px]">{ADEUDO_TYPE_ICONS[ad.type]}</span>
                            {ADEUDO_TYPE_LABELS[ad.type]}
                          </span>
                          {aging && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-800">{aging}</span>}
                        </td>
                        <td className="px-5 py-4 align-top max-w-xs">
                          <p className="text-sm font-semibold text-slate-900 leading-none mb-0.5">{ad.concepto}</p>
                          <p className={`text-xs text-slate-500 font-medium leading-snug ${isExp ? '' : 'line-clamp-1'}`}>{ad.description}</p>
                          {ad.description.length > 50 && (
                            <button onClick={() => setExpandedId(isExp ? null : ad.id)}
                              className="text-[9px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest mt-0.5 transition-colors">
                              {isExp ? 'Menos' : 'Más'}
                            </button>
                          )}
                          {linkedPago && (
                            <button onClick={() => setActiveTab('ledger')}
                              className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
                              <span className="material-symbols-outlined text-[11px]">receipt_long</span>
                              Cargo · {linkedPago.status}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-black text-slate-900 text-right tabular-nums align-top whitespace-nowrap">
                          {ad.amount > 0 ? `$${ad.amount.toLocaleString('es-MX')}` : '—'}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                            ad.status === 'Activo' ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : ad.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>{ad.status === 'Pagado' ? 'Resuelto' : ad.status}</span>
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500 tabular-nums whitespace-nowrap align-top">
                          {new Date(ad.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {ad.status === 'Activo' ? (
                            <div className="flex flex-col gap-1.5 items-stretch min-w-[100px]">
                              {ad.type === 'llamado_atencion' ? (
                                <button onClick={() => setExpConfirm({ id: ad.id, action: 'resolve_llamado', apartment: ad.apartment })}
                                  className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 transition-all">
                                  <span className="material-symbols-outlined text-[13px]">check</span>Resolver
                                </button>
                              ) : null}
                              <button onClick={() => setExpConfirm({ id: ad.id, action: 'annul', apartment: ad.apartment })}
                                className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg border bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 transition-all">
                                <span className="material-symbols-outlined text-[13px]">block</span>Anular
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button onClick={() => setExpConfirm({ id: ad.id, action: 'delete', apartment: ad.apartment })}
                                className="text-slate-200 hover:text-rose-500 transition-colors p-1" title="Eliminar">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAdeudos.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-4xl text-slate-200">gavel</span>
                          <p className="text-slate-400 font-medium text-sm">Sin registros para los filtros seleccionados.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* UNIFIED REGISTRATION MODAL                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Cargo">
        <div className="space-y-5">

          {/* ── Step 1: Type selector ── */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de cargo *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CHARGE_TYPES.map(ct => (
                <button key={ct.key} onClick={() => { setChargeType(ct.key); setMAmount(ct.key === 'mensualidad' ? '1700' : '500') }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    chargeType === ct.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}>
                  <span className="material-symbols-outlined text-[20px]">{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium ml-1">
              {CHARGE_TYPES.find(c => c.key === chargeType)?.desc}
            </p>
          </div>

          {/* ── Step 2: Unit ── */}
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

          {/* ── Month (Mensualidad/Extraordinario only) ── */}
          {isPaymentType && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mes(es) *</label>
                <button type="button" onClick={() => setMMulti(p => !p)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">
                  <div className={`relative w-8 h-4 rounded-full transition-colors ${mMulti ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${mMulti ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  Multi-mes
                </button>
              </div>
              {!mMulti ? (
                <input type="month" value={mSingleMonth} min={MONTH_RANGE[0]} max={MONTH_RANGE[MONTH_RANGE.length - 1]}
                  onChange={e => setMSingleMonth(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
              ) : (
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                  {MONTH_RANGE.slice().reverse().map(mk => (
                    <label key={mk} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={mMonths.includes(mk)} onChange={() => toggleFormMonth(mk)} className="w-4 h-4 rounded accent-slate-900" />
                      <span className="text-sm font-medium text-slate-700 capitalize">{monthKeyToLabel(mk)}</span>
                    </label>
                  ))}
                </div>
              )}
              {mMulti && mMonths.length > 0 && <p className="text-[10px] font-bold text-slate-500 ml-1">{mMonths.length} mes(es)</p>}
            </div>
          )}

          {/* ── Concepto ── */}
          {isPaymentType ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto</label>
              <select value={mConcepto || (chargeType === 'extraordinario' ? 'Extraordinario' : 'Mensualidad')}
                onChange={e => setMConcepto(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                {bc.conceptosPago.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : isDisciplinaryType ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto / Motivo corto</label>
              <input type="text" value={mConcepto} onChange={e => setMConcepto(e.target.value)}
                placeholder={chargeType === 'multa' ? 'Ej: Uso indebido de cajón, Ruido nocturno…' : 'Ej: Mensualidades atrasadas Ene–Mar 2025…'}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
            </div>
          ) : null}

          {/* ── Amount (not for llamado) ── */}
          {!isLlamadoType && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto (MXN) {isDisciplinaryType ? '*' : ''}</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input type="number" value={mAmount} onChange={e => setMAmount(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-black text-sm tabular-nums" />
              </div>
            </div>
          )}

          {/* ── Status (Mensualidad/Extraordinario only) ── */}
          {isPaymentType && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado</label>
              <select value={mStatus} onChange={e => setMStatus(e.target.value as 'Pagado' | 'Pendiente')}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          )}

          {/* ── Description (disciplinary / llamado) ── */}
          {(isDisciplinaryType || isLlamadoType) && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {isLlamadoType ? 'Motivo del llamado *' : 'Descripción / Detalle *'}
              </label>
              <textarea value={mDescription} onChange={e => setMDescription(e.target.value)}
                rows={3} maxLength={1000} placeholder="Describe el motivo con detalle…"
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm resize-none" />
              <p className="text-[10px] text-slate-400 font-medium text-right">{mDescription.length}/1000</p>
            </div>
          )}

          {/* ── Receipt (payment types only) ── */}
          {isPaymentType && (
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
          )}

          {/* ── Submit ── */}
          <button onClick={handleRegister} disabled={!formValid}
            className={`w-full py-3 font-bold rounded-2xl transition-all uppercase tracking-widest text-[11px] ${
              !formValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
            }`}>
            {isPaymentType ? (mMulti && mMonths.length > 1 ? `Registrar ${mMonths.length} cargos` : 'Registrar Cargo')
              : isDisciplinaryType ? `Registrar ${chargeType === 'multa' ? 'Multa' : 'Adeudo'} + Cargo`
              : 'Registrar Llamado'}
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

      {/* ═══ Confirm Dialogs ═══ */}
      <ConfirmDialog open={!!revokeTarget} onClose={() => setRevokeTarget(null)} onConfirm={confirmRevoke}
        title="Revocar Pago" confirmLabel="Revocar" variant="danger">
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
    </div>
  )
}
