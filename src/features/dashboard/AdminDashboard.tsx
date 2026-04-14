/**
 * AdminDashboard — Admin control panel (home page for admin role).
 *
 * Displays KPIs (health gauge, collection rate, occupancy),
 * staff management, approval queue, critical alerts, and
 * quick-access aviso creation via inline modal.
 *
 * BUG FIX: Replaced window.confirm() for staff deletion with
 * an in-app ConfirmDialog component.
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../core/store/store'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import type { StaffRole } from '../../core/store/seed'

/** Static type for approval queue items */
interface ApprovalItem {
  id: string
  type: string
  detail: string
  date: string
  icon: string
}

/** Initial demo approval items */
const initialApprovals: ApprovalItem[] = [
  { id: 'appr-1', type: 'Reserva', detail: 'Salón Eventos — A304', date: '15 Apr', icon: 'event' },
  { id: 'appr-2', type: 'Pago', detail: 'Comprobante — B102', date: '14 Apr', icon: 'receipt_long' },
  { id: 'appr-3', type: 'Acceso', detail: 'Visitante — C201', date: '14 Apr', icon: 'badge' },
]

/** Allowed staff role categories */
const STAFF_ROLES: StaffRole[] = ['Guardia', 'Jardinero', 'Limpieza']

/** Material icon for each staff role */
const ROLE_ICONS: Record<StaffRole, string> = {
  Guardia: 'shield_person',
  Jardinero: 'yard',
  Limpieza: 'mop',
}

export default function AdminDashboard() {
  const { state, dispatch } = useStore()
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initialApprovals)
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'approve' | 'reject' }[]>([])

  // Staff management modal
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState<StaffRole>('Guardia')
  const [staffShiftStart, setStaffShiftStart] = useState('08:00')
  const [staffShiftEnd, setStaffShiftEnd] = useState('17:00')

  // Inline aviso creation modal
  const [showAvisoModal, setShowAvisoModal] = useState(false)
  const [avisoTitle, setAvisoTitle] = useState('')
  const [avisoDesc, setAvisoDesc] = useState('')

  // In-app confirm dialog state (replaces window.confirm)
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null)

  const bc = state.buildingConfig

  // ── KPI Calculations ──
  const totalPagos = state.pagos.length
  const paidPagos = state.pagos.filter(p => p.status === 'Pagado').length
  const recaudacionPct = totalPagos > 0 ? Math.round((paidPagos / totalPagos) * 100) : 0
  const pendingPaquetes = state.paquetes.filter(p => p.status === 'Pendiente').length
  const totalResidents = state.residents?.length || 12
  const totalUnits = bc.totalUnits || 126
  const occupancyPct = Math.round((totalResidents / totalUnits) * 100)
  // Composite health score: 50% payment, 30% occupancy, 20% package delivery
  const healthPct = Math.round((recaudacionPct * 0.5 + occupancyPct * 0.3 + (pendingPaquetes < 5 ? 100 : 60) * 0.2))

  // Most recent announcements for the sidebar
  const recentNotices = useMemo(() => {
    const icons = ['description', 'park', 'pool', 'campaign', 'notifications']
    return state.avisos.slice(0, 2).map((a, i) => ({
      title: a.title,
      body: a.attachment,
      time: a.date,
      icon: icons[i] || 'description',
    }))
  }, [state.avisos])

  /** Handles approve/reject for approval queue items with toast feedback */
  const handleApproval = (id: string, action: 'approve' | 'reject') => {
    const item = approvals.find(a => a.id === id)
    if (!item) return
    setApprovals(prev => prev.filter(a => a.id !== id))
    const msg = action === 'approve' ? `${item.type} aprobado: ${item.detail}` : `${item.type} rechazado: ${item.detail}`
    const toastId = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id: toastId, message: msg, type: action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000)
  }

  /** Adds a new staff member from the modal form */
  const handleAddStaff = () => {
    if (!staffName.trim()) return
    dispatch({
      type: 'ADD_STAFF',
      payload: {
        id: `staff-${Date.now()}`,
        name: staffName,
        role: staffRole,
        shiftStart: staffShiftStart,
        shiftEnd: staffShiftEnd,
      }
    })
    setStaffName('')
    setStaffRole('Guardia')
    setStaffShiftStart('08:00')
    setStaffShiftEnd('17:00')
  }

  /** Opens the in-app confirm dialog for staff deletion */
  const handleDeleteStaff = (id: string) => {
    setConfirmDeleteStaffId(id)
  }

  /** Executes staff deletion after user confirms */
  const confirmDeleteStaff = () => {
    if (confirmDeleteStaffId) {
      dispatch({ type: 'DELETE_STAFF', payload: confirmDeleteStaffId })
    }
  }

  /** Creates a new aviso from the inline dashboard modal */
  const handleAddAviso = () => {
    if (!avisoTitle.trim()) return
    dispatch({
      type: 'ADD_AVISO',
      payload: {
        id: `av-${Date.now()}`,
        title: avisoTitle,
        description: avisoDesc || undefined,
        attachment: '',
        date: new Date().toISOString().split('T')[0],
      }
    })
    setAvisoTitle('')
    setAvisoDesc('')
    setShowAvisoModal(false)
    const toastId = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id: toastId, message: `Aviso "${avisoTitle}" publicado`, type: 'approve' }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000)
  }

  const staff = state.staff || []

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Toast Notifications ── */}
      <div className="fixed top-24 right-10 z-[200] space-y-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center space-x-3 px-5 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-right-4 duration-300 ${
              t.type === 'approve'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {t.type === 'approve' ? 'check_circle' : 'cancel'}
            </span>
            <span className="text-sm font-bold">{t.message}</span>
          </div>
        ))}
      </div>

      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            The Control Tower
          </span>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            {bc.buildingName}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {bc.buildingAddress} — Gestión Operativa Global
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAvisoModal(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-lg font-bold">add</span>
            <span>Nuevo Aviso</span>
          </button>
        </div>
      </header>

      {/* ── Health Gauge + KPI Cards ── */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Composite health gauge */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-3xl p-8 hero-pattern relative overflow-hidden shadow-sm flex flex-col justify-center items-center text-center">
          <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="10"
                strokeDasharray="314.159"
                strokeDashoffset={314.159 - (314.159 * healthPct / 100)}
                strokeLinecap="round"
                className="text-tertiary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-headline font-black text-slate-900 tracking-tighter">{healthPct}%</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                {healthPct >= 90 ? 'Óptimo' : healthPct >= 70 ? 'Bueno' : 'Atención'}
              </span>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-headline font-extrabold text-slate-900 mb-2">Salud del Edificio</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px]">
              Ecosistema operativo estable. {pendingPaquetes} paquetes pendientes de entrega.
            </p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/pagos" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recaudación</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">{recaudacionPct}%</span>
                <span className="text-xs font-bold text-emerald-600">{paidPagos}/{totalPagos}</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${recaudacionPct}%` }}></div>
            </div>
          </Link>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-amber-200 transition-colors">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tickets Abiertos</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">{approvals.length + 2}</span>
                <span className="text-xs font-bold text-slate-400">Pendientes</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-primary-container transition-colors">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ocupación</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">{occupancyPct}%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{totalResidents} de {totalUnits} residencias</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-Column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left column: Staff + Notices */}
        <div className="space-y-10">
          {/* Staff on duty */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Staff en Turno</h3>
              <button
                onClick={() => setShowStaffModal(true)}
                className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center transition-colors"
              >
                Gestionar <span className="material-symbols-outlined text-[14px] ml-1">trending_flat</span>
              </button>
            </div>
            <div className="grid gap-4">
              {staff.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl">
                  <span className="material-symbols-outlined text-3xl mb-2 block">person_off</span>
                  No hay personal registrado
                </div>
              )}
              {staff.map((person) => (
                <div key={person.id} className="flex items-center space-x-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 group-hover:bg-primary-container group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">{ROLE_ICONS[person.role as StaffRole] || 'person'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{person.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{person.role}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{person.shiftStart} – {person.shiftEnd}</p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />
                </div>
              ))}
            </div>
          </section>

          {/* Centro de Avisos */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Centro de Avisos</h3>
              <Link to="/avisos" className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center transition-colors">
                Ver todos <span className="material-symbols-outlined text-[14px] ml-1">trending_flat</span>
              </Link>
            </div>
            <div className="space-y-4">
              {recentNotices.map((notice) => (
                <div key={notice.title} className="flex items-start space-x-5 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <span className="material-symbols-outlined">{notice.icon}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[15px] font-bold text-slate-900 leading-tight">{notice.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notice.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{notice.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column: Alerts + Approvals + Assembly */}
        <div className="space-y-10">
          {/* Critical alerts */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[18px]">warning</span>
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Alertas Críticas</h3>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Falla en Bomba Principal', body: 'Presión baja detectada en Torre A y B.', severity: 'critical', icon: 'water_damage' },
                { title: 'Cámara 04 Desconectada', body: 'Acceso perimetral norte sin monitoreo.', severity: 'warning', icon: 'videocam_off' },
              ].map((alert) => (
                <div key={alert.title} className={`p-6 border rounded-3xl shadow-sm flex items-center space-x-5 group transition-all ${
                  alert.severity === 'critical' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <span className="material-symbols-outlined">{alert.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-900">{alert.title}</h4>
                    <p className="text-sm text-slate-600 font-medium mt-1">{alert.body}</p>
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined">trending_flat</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Approval queue */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Cola de Aprobaciones</h3>
              <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded-lg">{approvals.length}</span>
            </div>
            <div className="space-y-4">
              {approvals.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl">
                  <span className="material-symbols-outlined text-3xl mb-2 block">check_circle</span>
                  No hay aprobaciones pendientes
                </div>
              )}
              {approvals.map((item) => (
                <div key={item.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center space-x-5 hover:border-slate-300 transition-all">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary border border-slate-100">
                    <span className="material-symbols-outlined text-lg font-bold">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">{item.type}</span>
                    <h4 className="text-[14px] font-bold text-slate-900">{item.detail}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleApproval(item.id, 'approve')} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center" title="Aprobar">
                      <span className="material-symbols-outlined font-bold">check</span>
                    </button>
                    <button onClick={() => handleApproval(item.id, 'reject')} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center" title="Rechazar">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Assembly card */}
          <section className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-200 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[8rem]">event</span>
            </div>
            <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] block mb-2 font-label">Próxima Asamblea</span>
                <h3 className="text-2xl font-headline font-black tracking-tight">Asamblea Ordinaria</h3>
                <p className="text-white/70 font-medium mt-1 italic">15 de Julio, 2025 • 19:00 hrs</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                  <span>Quórum Confirmado</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-fixed rounded-full shadow-[0_0_12px_rgba(216,227,251,0.5)]" style={{ width: '45%' }}></div>
                </div>
              </div>
              <Link to="/votaciones" className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg block text-center">
                Gestionar Asamblea
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* ── Staff Management Modal ── */}
      <Modal open={showStaffModal} onClose={() => setShowStaffModal(false)} title="Gestión de Personal">
        <div className="space-y-6">
          {/* Add staff form */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agregar Personal</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Categoría</label>
                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                >
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entrada</label>
                <input type="time" value={staffShiftStart} onChange={(e) => setStaffShiftStart(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salida</label>
                <input type="time" value={staffShiftEnd} onChange={(e) => setStaffShiftEnd(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
              </div>
            </div>
            <button onClick={handleAddStaff}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
            >
              Agregar al Staff
            </button>
          </div>

          {/* Current staff list */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Activo ({staff.length})</p>
            {staff.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No hay personal registrado</p>
            )}
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
                    <span className="material-symbols-outlined text-lg">{ROLE_ICONS[s.role as StaffRole] || 'person'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                      {s.role} • {s.shiftStart}–{s.shiftEnd}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDeleteStaff(s.id)}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Inline Aviso Creation Modal ── */}
      <Modal open={showAvisoModal} onClose={() => setShowAvisoModal(false)} title="Publicar Nuevo Aviso">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título *</label>
            <input type="text" value={avisoTitle} onChange={(e) => setAvisoTitle(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              placeholder="Ej: Mantenimiento de elevadores"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
            <textarea value={avisoDesc} onChange={(e) => setAvisoDesc(e.target.value)} rows={3}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm resize-none"
              placeholder="Descripción opcional del aviso..."
            />
          </div>
          <button onClick={handleAddAviso}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Publicar Aviso
          </button>
        </div>
      </Modal>

      {/* ── In-App Confirm Dialog for Staff Deletion ── */}
      <ConfirmDialog
        open={!!confirmDeleteStaffId}
        onClose={() => setConfirmDeleteStaffId(null)}
        onConfirm={confirmDeleteStaff}
        title="Eliminar Miembro del Staff"
        confirmLabel="Eliminar"
        variant="danger"
      >
        ¿Seguro que desea eliminar a este miembro del staff? Esta acción no se puede deshacer.
      </ConfirmDialog>
    </div>
  )
}
