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
import AvisoFormModal from '../../core/components/AvisoFormModal'
import type { Aviso, StaffRole } from '../../types'

const DAYS_OF_WEEK = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D']

/** Allowed staff role categories */
const STAFF_ROLES: StaffRole[] = ['Guardia', 'Jardinero', 'Limpieza', 'Administradora General']

/** Material icon for each staff role */
const ROLE_ICONS: Record<StaffRole, string> = {
  Guardia: 'shield_person',
  Jardinero: 'yard',
  Limpieza: 'mop',
  'Administradora General': 'manage_accounts',
}

export default function AdminDashboard() {
  const { state, dispatch } = useStore()
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'approve' | 'reject' }[]>([])

  // Derived approvals from reservations
  const approvals = useMemo(() => {
    return state.reservaciones
      .filter(r => r.status === 'Por confirmar')
      .map(r => ({
        id: r.id,
        type: 'Reserva',
        detail: `${r.grill.split(' (')[0]} — ${r.apartment}`,
        date: r.date,
        icon: 'event',
        original: r
      }))
  }, [state.reservaciones])

  // Staff management modal
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState<StaffRole>('Guardia')
  const [staffShiftStart, setStaffShiftStart] = useState('08:00')
  const [staffShiftEnd, setStaffShiftEnd] = useState('17:00')
  const [staffPhoto, setStaffPhoto] = useState('')
  const [staffWorkDays, setStaffWorkDays] = useState<string[]>(['L', 'M', 'Mi', 'J', 'V'])

  // Inline aviso creation via unified component
  const [showAvisoModal, setShowAvisoModal] = useState(false)

  // In-app confirm dialog state (replaces window.confirm)
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null)

  const bc = state.buildingConfig
  const todayISO = new Date().toISOString().split('T')[0]

  /** Check if there is already an active assembly */
  const hasActiveAsamblea = useMemo(() => {
    return state.avisos.some(a =>
      a.category === 'asamblea' && (!a.endDate || a.endDate >= todayISO)
    )
  }, [state.avisos, todayISO])

  // ── KPI Calculations ──
  const totalPagos = state.pagos.length
  const paidPagos = state.pagos.filter(p => p.status === 'Pagado').length
  const recaudacionPct = totalPagos > 0 ? Math.round((paidPagos / totalPagos) * 100) : 0
  const pendingPaquetes = state.paquetes.filter(p => p.status === 'Pendiente').length
  const totalUnits = bc.totalUnits
  const occupiedUnits = new Set(state.residents.map(r => r.apartment)).size
  const occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0
  // Composite health score: 50% payment, 30% occupancy, 20% package delivery
  const healthPct = Math.round((recaudacionPct * 0.5 + occupancyPct * 0.3 + (pendingPaquetes < 5 ? 100 : 60) * 0.2))

  // Open ticket count — derived from real ticket state
  const openTicketsCount = state.tickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Resuelto').length
  const totalTickets = state.tickets.length
  const ticketResolutionPct = totalTickets > 0
    ? Math.round(state.tickets.filter(t => t.status === 'Cerrado' || t.status === 'Resuelto').length / totalTickets * 100)
    : 0

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
    
    dispatch({
      type: 'UPDATE_RESERVACION',
      payload: { ...item.original, status: action === 'approve' ? 'Reservado' : 'Cancelado' }
    })
    
    const msg = action === 'approve' ? `${item.type} aprobado: ${item.detail}` : `${item.type} rechazado: ${item.detail}`
    const toastId = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id: toastId, message: msg, type: action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000)
  }

  const resetStaffForm = () => {
    setEditingStaffId(null)
    setStaffName('')
    setStaffRole('Guardia')
    setStaffShiftStart('08:00')
    setStaffShiftEnd('17:00')
    setStaffPhoto('')
    setStaffWorkDays(['L', 'M', 'Mi', 'J', 'V'])
    setShowStaffModal(false)
  }

  const openEditStaff = (staff: any) => {
    setEditingStaffId(staff.id)
    setStaffName(staff.name)
    setStaffRole(staff.role as StaffRole)
    setStaffShiftStart(staff.shiftStart)
    setStaffShiftEnd(staff.shiftEnd)
    setStaffPhoto(staff.photo || '')
    setStaffWorkDays(staff.workDays || ['L', 'M', 'Mi', 'J', 'V'])
    setShowStaffModal(true)
  }

  const handleSaveStaff = () => {
    if (!staffName.trim()) return
    const payload = {
      id: editingStaffId || `staff-${Date.now()}`,
      name: staffName,
      role: staffRole,
      shiftStart: staffShiftStart,
      shiftEnd: staffShiftEnd,
      photo: staffPhoto,
      workDays: staffWorkDays,
    }

    if (editingStaffId) {
      dispatch({ type: 'UPDATE_STAFF', payload })
    } else {
      dispatch({ type: 'ADD_STAFF', payload })
    }
    resetStaffForm()
  }

  const handleStaffPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setStaffPhoto(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  const toggleWorkDay = (day: string) => {
    setStaffWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
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
    setConfirmDeleteStaffId(null)
  }

  /** Creates a new aviso from the unified modal */
  const handleSaveAviso = (data: Omit<Aviso, 'id'> & { id?: string }) => {
    if (data.id) {
      const existing = state.avisos.find(a => a.id === data.id)
      if (existing) {
        dispatch({ type: 'UPDATE_AVISO', payload: { ...existing, ...data } as Aviso })
      }
    } else {
      dispatch({
        type: 'ADD_AVISO',
        payload: { id: `av-${Date.now()}`, ...data } as Aviso,
      })
    }
    setShowAvisoModal(false)
    const toastId = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id: toastId, message: `Aviso "${data.title}" publicado`, type: 'approve' }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 3000)
  }

  const staff = state.staff || []
  
  const upcomingAsamblea = useMemo(() => state.avisos.find(a => a.category === 'asamblea'), [state.avisos])
  const asambleaStats = useMemo(() => {
    if (!upcomingAsamblea) return { confirmedApartments: 0, trackingByApartment: {} }
    const tracking = upcomingAsamblea.tracking || []
    
    // Group by apartment
    const byApartment: Record<string, typeof tracking> = {}
    tracking.forEach(t => {
      if (!byApartment[t.apartment]) byApartment[t.apartment] = []
      byApartment[t.apartment].push(t)
    })

    let confirmedApartments = 0
    Object.values(byApartment).forEach(list => {
      if (list.some(t => t.type === 'confirm')) confirmedApartments++
    })

    return { confirmedApartments, trackingByApartment: byApartment }
  }, [upcomingAsamblea])

  const [viewAsambleaModal, setViewAsambleaModal] = useState(false)

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

          <Link to="/tickets" className="block bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-amber-200 transition-colors">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tickets Abiertos</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">{openTicketsCount}</span>
                <span className="text-xs font-bold text-slate-400">Pendientes</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${ticketResolutionPct}%` }}></div>
            </div>
          </Link>

          <Link to="/usuarios" className="block bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-primary-container transition-colors">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ocupación</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">{occupancyPct}%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{occupiedUnits} de {totalUnits} unidades ocupadas</p>
            </div>
          </Link>
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
                <div key={person.id} className="flex items-center space-x-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all group cursor-pointer" onClick={() => openEditStaff(person)}>
                  {person.photo ? (
                    <img src={person.photo} alt={person.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 group-hover:bg-primary-container group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">{ROLE_ICONS[person.role as StaffRole] || 'person'}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{person.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{person.role}</p>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                      {person.shiftStart} – {person.shiftEnd} • {(person.workDays || ['L','M','Mi','J','V']).join(' ')}
                    </p>
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
              {recentNotices.length === 0 ? (
                <div className="p-8 text-center text-emerald-600 font-medium bg-emerald-50/50 border border-emerald-100/50 rounded-2xl animate-in fade-in">
                  <span className="material-symbols-outlined text-2xl mb-1 block">check_circle</span>
                  <span className="text-[11px] uppercase tracking-widest font-black">Todo en orden</span>
                </div>
              ) : (
                recentNotices.map((notice) => (
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
                ))
              )}
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
              {(() => {
                // Derive alerts from real system state
                const currentAlerts: { title: string; body: string; icon: string; severity: 'critical' | 'warning'; link: string }[] = []

                // Overdue payments
                const overdueCount = state.pagos.filter(p => p.status === 'Vencido').length
                if (overdueCount > 0) {
                  currentAlerts.push({
                    title: `${overdueCount} pago${overdueCount > 1 ? 's' : ''} vencido${overdueCount > 1 ? 's' : ''}`,
                    body: 'Existen cargos vencidos pendientes de gestión.',
                    icon: 'payments', severity: overdueCount > 5 ? 'critical' : 'warning', link: '/pagos',
                  })
                }

                // Pending approval payments
                const porValidarCount = state.pagos.filter(p => p.status === 'Por validar').length
                if (porValidarCount > 0) {
                  currentAlerts.push({
                    title: `${porValidarCount} comprobante${porValidarCount > 1 ? 's' : ''} por validar`,
                    body: 'Residentes han subido comprobantes esperando revisión.',
                    icon: 'fact_check', severity: 'warning', link: '/pagos',
                  })
                }

                // Stale open tickets (open > 72h)
                const staleThreshold = Date.now() - 72 * 60 * 60 * 1000
                const staleTickets = state.tickets.filter(t =>
                  t.status !== 'Cerrado' && t.status !== 'Resuelto' && new Date(t.createdAt).getTime() < staleThreshold
                ).length
                if (staleTickets > 0) {
                  currentAlerts.push({
                    title: `${staleTickets} ticket${staleTickets > 1 ? 's' : ''} sin resolver (+72h)`,
                    body: 'Tickets de servicio abiertos requieren atención.',
                    icon: 'schedule', severity: staleTickets > 3 ? 'critical' : 'warning', link: '/tickets',
                  })
                }

                // Undelivered packages > 3 days
                const pkgThreshold = Date.now() - 3 * 24 * 60 * 60 * 1000
                const stalePkgs = state.paquetes.filter(p =>
                  p.status === 'Pendiente' && new Date(p.receivedDate).getTime() < pkgThreshold
                ).length
                if (stalePkgs > 0) {
                  currentAlerts.push({
                    title: `${stalePkgs} paquete${stalePkgs > 1 ? 's' : ''} sin entregar (+3 días)`,
                    body: 'Paquetes en espera requieren notificación a residentes.',
                    icon: 'package_2', severity: 'warning', link: '/paqueteria',
                  })
                }

                // Building not configured
                if (!bc.buildingName || bc.totalUnits === 0) {
                  currentAlerts.push({
                    title: 'Configuración pendiente',
                    body: 'Configura nombre, torres y unidades del edificio para habilitar todas las funciones.',
                    icon: 'settings', severity: 'warning', link: '/configuracion',
                  })
                }

                if (currentAlerts.length === 0) {
                  return (
                    <div className="p-8 text-center text-emerald-600 font-medium bg-emerald-50/50 border border-emerald-100/50 rounded-2xl animate-in fade-in">
                      <span className="material-symbols-outlined text-2xl mb-1 block">check_circle</span>
                      <span className="text-[11px] uppercase tracking-widest font-black">Todo en orden</span>
                    </div>
                  )
                }

                return currentAlerts.map((alert) => (
                  <Link to={alert.link} key={alert.title} className={`p-6 border rounded-3xl shadow-sm flex items-center space-x-5 group transition-all ${
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
                    <span className="material-symbols-outlined w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                      trending_flat
                    </span>
                  </Link>
                ))
              })()}
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
                <div className="p-8 text-center text-emerald-600 font-medium bg-emerald-50/50 border border-emerald-100/50 rounded-2xl animate-in fade-in">
                  <span className="material-symbols-outlined text-2xl mb-1 block">check_circle</span>
                  <span className="text-[11px] uppercase tracking-widest font-black">Todo en orden</span>
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
          {upcomingAsamblea && (
            <section className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-200 text-white">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="material-symbols-outlined text-[8rem]">event</span>
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] block mb-2 font-label">Próxima Asamblea</span>
                  <h3 className="text-2xl font-headline font-black tracking-tight">{upcomingAsamblea.title}</h3>
                  <p className="text-white/70 font-medium mt-1 italic">
                    {upcomingAsamblea.startDate || upcomingAsamblea.date}
                    {upcomingAsamblea.startTime && ` • ${upcomingAsamblea.startTime} – ${upcomingAsamblea.endTime}`}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                    <span>Quórum Confirmado</span>
                    <span className="text-white">
                      {Math.round((asambleaStats.confirmedApartments / bc.totalUnits) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-fixed rounded-full shadow-[0_0_12px_rgba(216,227,251,0.5)] transition-all duration-1000 delay-500" 
                      style={{ width: `${Math.round((asambleaStats.confirmedApartments / bc.totalUnits) * 100)}%` }}
                    />
                  </div>
                </div>
                <button onClick={() => setViewAsambleaModal(true)} className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg block text-center">
                  Auditoría de Asistencia
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Staff Management Modal ── */}
      <Modal open={showStaffModal} onClose={resetStaffForm} title={editingStaffId ? 'Editar Personal' : 'Agregar Personal'}>
        <div className="space-y-6">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingStaffId ? 'Datos del empleado' : 'Nuevo Empleado'}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input
                  type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Categoría</label>
                <select value={staffRole} onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                >
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Fotografía (Sugerido 200x200 1:1)</label>
                <input type="file" accept="image/jpeg, image/png" onChange={handleStaffPhotoUpload}
                  className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Días Laborales</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleWorkDay(day)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs border transition-all ${
                        staffWorkDays.includes(day)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entrada</label>
                <input type="time" value={staffShiftStart} onChange={(e) => setStaffShiftStart(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salida</label>
                <input type="time" value={staffShiftEnd} onChange={(e) => setStaffShiftEnd(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
              </div>
            </div>
            <button onClick={handleSaveStaff}
              className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
            >
              {editingStaffId ? 'Guardar Cambios' : 'Agregar al Staff'}
            </button>
          </div>

          {!editingStaffId && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Activo ({staff.length})</p>
              {staff.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No hay personal registrado</p>
              )}
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                  <div className="flex items-center space-x-3">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
                        <span className="material-symbols-outlined text-lg">{ROLE_ICONS[s.role as StaffRole] || 'person'}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                        {s.role} • {s.shiftStart}–{s.shiftEnd} • {(s.workDays || []).join(' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditStaff(s)}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-container/30 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleDeleteStaff(s.id)}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Inline Aviso Creation Modal ── */}
      {/* ── Unified Aviso Form Modal ── */}
      <AvisoFormModal
        open={showAvisoModal}
        onClose={() => setShowAvisoModal(false)}
        onSave={handleSaveAviso}
        hasActiveAsamblea={hasActiveAsamblea}
      />

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

      {/* ── Auditoria Asamblea Modal ── */}
      <Modal open={viewAsambleaModal} onClose={() => setViewAsambleaModal(false)} title="Auditoría de Asistencia">
        {upcomingAsamblea && (
          <div className="space-y-4">
             <p className="text-sm font-medium text-slate-600 mb-4">
               Lista de residentes que han confirmado su asistencia / acuse de recibo para: <strong className="text-slate-900">{upcomingAsamblea.title}</strong>
             </p>
             <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actividad de Residentes</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estatus Depto</th>
                     </tr>
                  </thead>
                  <tbody>
                     {Object.entries(asambleaStats.trackingByApartment).map(([apartment, events]) => {
                       const isConfirmed = events.some(e => e.type === 'confirm')
                       return (
                         <tr key={apartment} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-sm font-bold text-slate-900">{apartment}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                               <div className="space-y-1">
                                 {events.map((e, i) => (
                                   <div key={i} className="flex items-center space-x-2">
                                     {e.type === 'confirm' ? (
                                        <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                     ) : (
                                        <span className="material-symbols-outlined text-[14px] text-slate-300">visibility</span>
                                     )}
                                     <span className={e.type === 'confirm' ? 'font-bold text-slate-900' : 'text-slate-500'}>
                                        {e.resident} <span className="opacity-50 text-[10px]">({new Date(e.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })})</span>
                                     </span>
                                   </div>
                                 ))}
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               {isConfirmed ? (
                                 <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100">
                                   Confirmado
                                 </span>
                               ) : (
                                 <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200">
                                   Solo Visto
                                 </span>
                               )}
                            </td>
                         </tr>
                       )
                     })}
                     {Object.keys(asambleaStats.trackingByApartment).length === 0 && (
                       <tr>
                         <td colSpan={3} className="px-4 py-6 text-center text-slate-400 font-medium text-sm">Nadie ha interactuado aún</td>
                       </tr>
                     )}
                  </tbody>
                </table>
             </div>
             <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Departamentos Confirmados</p>
                   <p className="text-lg font-black text-slate-900">{asambleaStats.confirmedApartments} Unidades</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Quórum Pendiente</p>
                   <p className="text-lg font-black text-slate-900">{bc.totalUnits - asambleaStats.confirmedApartments} Unidades</p>
                </div>
             </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
