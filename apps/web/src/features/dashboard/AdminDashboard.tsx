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
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../core/store/store'
import { useAuth } from '../../core/auth/AuthContext'
import Modal from '../../core/components/Modal'
import AvisoFormModal from '../../core/components/AvisoFormModal'
import SetupChecklist from './components/SetupChecklist'
import StaffSection from './components/StaffSection'
import OperationalAlerts from './components/OperationalAlerts'
import type { Aviso } from '../../types'



export default function AdminDashboard() {
  const { state, dispatch } = useStore()
  const { role } = useAuth()
  const isAdmin = role === 'super_admin' || role === 'administracion'
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



  // Inline aviso creation via unified component
  const [showAvisoModal, setShowAvisoModal] = useState(false)

  // ── Optional step: amenities skip/confirm ─────────────────────────────
  const [amenitiesSkipped, setAmenitiesSkipped] = useState<boolean>(
    () => localStorage.getItem('pp_amenities_skipped') === 'true'
  )
  const skipAmenities = () => {
    localStorage.setItem('pp_amenities_skipped', 'true')
    setAmenitiesSkipped(true)
  }



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
  // Guard: if there are no residents and no pagos, the system has no data to measure — return 0
  const hasOperationalData = totalPagos > 0 || occupiedUnits > 0
  const healthPct = !hasOperationalData
    ? 0
    : Math.round((recaudacionPct * 0.5 + occupancyPct * 0.3 + (pendingPaquetes < 5 ? 100 : 60) * 0.2))

  // Open ticket count — derived from real ticket state
  const openTicketsCount = state.tickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Resuelto').length
  const totalTickets = state.tickets.length
  const ticketResolutionPct = totalTickets > 0
    ? Math.round(state.tickets.filter(t => t.status === 'Cerrado' || t.status === 'Resuelto').length / totalTickets * 100)
    : 0

  // Avisos KPI — derived from date ranges and status field
  const avisosKpi = useMemo(() => {
    let activos = 0, programados = 0, borradores = 0
    state.avisos.forEach(a => {
      if (a.status === 'draft') {
        borradores++
      } else if (a.startDate && a.startDate > todayISO) {
        programados++
      } else if (!a.endDate || a.endDate >= todayISO) {
        activos++
      }
    })
    return { activos, programados, borradores, total: state.avisos.length }
  }, [state.avisos, todayISO])

  // ── Setup checklist — visible only when system is unconfigured ─────
  const setupSteps = [
    {
      id: 'profile',
      label: 'Configura el perfil del inmueble',
      description: 'Nombre, dirección y datos generales del edificio',
      icon: 'apartment',
      done: !!bc.buildingName && !!bc.buildingAddress,
      href: '/configuracion?tab=perfil&subtab=identidad',
    },
    {
      id: 'architecture',
      label: 'Define torres y unidades',
      description: 'Estructura del edificio: torres, pisos y departamentos',
      icon: 'domain_add',
      done: bc.totalUnits > 0,
      href: '/configuracion?tab=perfil&subtab=categoria',
    },
    {
      id: 'residents',
      label: 'Agrega residentes',
      description: 'Registro de propietarios e inquilinos por unidad',
      icon: 'group_add',
      done: state.residents.length > 0,
      href: '/usuarios',
    },
    {
      id: 'finances',
      label: 'Configura cuotas de mantenimiento',
      description: 'Monto mensual, día de corte y reglas de vencimiento',
      icon: 'account_balance',
      done: bc.monthlyFee > 0,
      href: '/configuracion?tab=finanzas',
    },
    {
      id: 'amenities',
      label: 'Agrega amenidades',
      description: 'Áreas comunes, asadores, salones — opcional',
      icon: 'outdoor_grill',
      optional: true,
      done: state.amenities.length > 0 || amenitiesSkipped,
      skipped: amenitiesSkipped && state.amenities.length === 0,
      href: '/configuracion?tab=perfil&subtab=amenidades',
    },
  ]
  const completedSteps = setupSteps.filter(s => s.done).length
  const isSetupComplete = completedSteps === setupSteps.length
  const showSetupCard = !isSetupComplete && isAdmin

  /**
   * "Virgin" state: no building name configured AND no residents yet.
   * This is Day 0 — nothing operational to show, focus entirely on setup.
   * Once ANY resident is added OR the building is named, we transition
   * to the normal operational dashboard.
   */
  const isSystemVirgin = !bc.buildingName && state.residents.length === 0

  // Most recent announcements for the sidebar

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

  // ── Avisos KPI carousel ──
  const [avisoSlide, setAvisoSlide] = useState(0)
  const avisoSlides = useMemo(() => [
    { value: avisosKpi.activos, label: 'Activos', color: 'emerald', icon: 'campaign' },
    { value: avisosKpi.programados, label: 'Programados', color: 'blue', icon: 'schedule' },
    { value: avisosKpi.borradores, label: 'Borradores', color: 'slate', icon: 'edit_note' },
  ], [avisosKpi])
  const nextAvisoSlide = useCallback(() => setAvisoSlide(i => (i + 1) % 3), [])
  useEffect(() => {
    const timer = setInterval(nextAvisoSlide, 5000)
    return () => clearInterval(timer)
  }, [nextAvisoSlide])

  return (
    <>
      {/* ── Toast Notifications (fixed, outside layout flow) ── */}
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

      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── Page Header — HIDDEN when system is virgin ── */}
        {!isSystemVirgin && (
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>

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
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* SETUP CHECKLIST — virgin onboarding or compact progress bar   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <SetupChecklist
          steps={setupSteps}
          isSystemVirgin={isSystemVirgin}
          showSetupCard={showSetupCard && !isSystemVirgin}
          onSkipAmenities={skipAmenities}
        />

        {/* ── OPERATIONAL DASHBOARD — hidden while system is virgin ── */}
        {!isSystemVirgin && (<>
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

        {/* KPI cards — 3×2 compact grid */}
        <div className="xl:col-span-8 grid grid-cols-3 grid-rows-2 gap-4">
          {/* ── Row 1 ── */}
          <Link to="/pagos" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:border-emerald-200 transition-colors flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Recaudación mensual</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-headline font-black text-slate-900 tracking-tight">{recaudacionPct}%</span>
              <span className="text-[10px] font-bold text-emerald-600">{paidPagos}/{totalPagos}</span>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${recaudacionPct}%` }}></div>
            </div>
          </Link>

          <Link to="/tickets" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:border-amber-200 transition-colors flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tickets</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-headline font-black text-slate-900 tracking-tight">{openTicketsCount}</span>
              <span className="text-[10px] font-bold text-slate-400">Pendientes</span>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${ticketResolutionPct}%` }}></div>
            </div>
          </Link>

          <Link to="/avisos" className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 hover:border-indigo-200 transition-colors flex flex-col items-center text-center relative overflow-hidden">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${
              avisoSlide === 0 ? 'bg-emerald-50 text-emerald-600' :
              avisoSlide === 1 ? 'bg-blue-50 text-blue-600' :
              'bg-slate-100 text-slate-500'
            }`}>
              <span className="material-symbols-outlined text-xl">{avisoSlides[avisoSlide].icon}</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Avisos</p>
            <div className="flex items-baseline space-x-1.5">
              <span key={avisoSlide} className="text-2xl font-headline font-black text-slate-900 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">
                {avisoSlides[avisoSlide].value}
              </span>
              <span key={`label-${avisoSlide}`} className={`text-[10px] font-bold animate-in fade-in duration-300 ${
                avisoSlide === 0 ? 'text-emerald-600' :
                avisoSlide === 1 ? 'text-blue-500' :
                'text-slate-400'
              }`}>
                {avisoSlides[avisoSlide].label}
              </span>
            </div>
            {/* Hover arrows */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAvisoSlide(i => (i - 1 + 3) % 3) }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">chevron_left</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAvisoSlide(i => (i + 1) % 3) }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-sm text-slate-500">chevron_right</span>
            </button>
            {/* Slide indicator — tiny dots, only visible on hover */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {avisoSlides.map((_, i) => (
                <span key={i} className={`rounded-full transition-all duration-300 ${
                  i === avisoSlide ? 'w-1.5 h-1.5 bg-slate-400' : 'w-1 h-1 bg-slate-200'
                }`} />
              ))}
            </div>
          </Link>

          {/* ── Row 2 — TBD KPIs ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500">
              <span className="material-symbols-outlined text-xl">package_2</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paquetería</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-headline font-black text-slate-900 tracking-tight">{pendingPaquetes}</span>
              <span className="text-[10px] font-bold text-slate-400">Pendientes</span>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-violet-400 rounded-full transition-all duration-700" style={{ width: `${pendingPaquetes > 0 ? 100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col items-center text-center opacity-50">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-xl">how_to_vote</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Votaciones</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-headline font-black text-slate-300 tracking-tight">—</span>
              <span className="text-[10px] font-bold text-slate-300">TBD</span>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden"></div>
          </div>

          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col items-center text-center opacity-50">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-xl">outdoor_grill</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Amenidades</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-headline font-black text-slate-300 tracking-tight">—</span>
              <span className="text-[10px] font-bold text-slate-300">TBD</span>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden"></div>
          </div>
        </div>
      </section>

      {/* ── Two-Column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left column: Staff + Notices */}
        <div className="space-y-10">
          <StaffSection
            staff={staff}
            onAddStaff={(p) => dispatch({ type: 'ADD_STAFF', payload: p })}
            onUpdateStaff={(p) => dispatch({ type: 'UPDATE_STAFF', payload: p })}
            onDeleteStaff={(id) => dispatch({ type: 'DELETE_STAFF', payload: id })}
          />

        </div>

        {/* Right column: Alerts + Approvals + Assembly */}
        <div className="space-y-10">
          <OperationalAlerts
            pagos={state.pagos}
            tickets={state.tickets}
            paquetes={state.paquetes}
            buildingName={bc.buildingName}
            totalUnits={bc.totalUnits}
            approvals={approvals}
            onApproval={handleApproval}
          />

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

      </>) /* end !isSystemVirgin */}


      {/* ── Aviso Form Modal ── */}
      <AvisoFormModal
        open={showAvisoModal}
        onClose={() => setShowAvisoModal(false)}
        onSave={handleSaveAviso}
        hasActiveAsamblea={hasActiveAsamblea}
      />

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
    </>
  )
}
