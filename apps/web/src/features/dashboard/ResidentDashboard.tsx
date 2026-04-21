/**
 * ResidentDashboard — Resident focal point (home page for resident role).
 * 
 * Provides a high-level overview of the resident's estate status:
 * - Building operativity and health.
 * - Active maintenance tickets.
 * - Security staff currently on duty.
 * - Quick links to payments, packages, and amenity reservations.
 * 
 * Highly responsive layout with a persistent sidebar for status summaries
 * and real-time announcements.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import Modal from '../../core/components/Modal'

export default function ResidentDashboard() {
  const { apartment } = useAuth()
  const { state } = useStore()
  const [showStaffModal, setShowStaffModal] = useState(false)

  const bc = state.buildingConfig
  const hasAmenities = state.amenities.length > 0

  /** 
   * Localized counts of pending packages for the resident 
   */
  const pendingPaquetes = useMemo(
    () => state.paquetes.filter(p => p.apartment === apartment && p.status === 'Pendiente').length,
    [state.paquetes, apartment]
  )

  /** 
   * Resident's financial standing logic 
   */
  const myPagos = useMemo(
    () => state.pagos.filter(p => p.apartment === apartment),
    [state.pagos, apartment]
  )
  const hasPendingPayment = myPagos.some(p => p.status === 'Pendiente')
  const paymentStatusLabel = hasPendingPayment ? 'Saldo pendiente' : 'Al Corriente'
  const daysUntilDue = hasPendingPayment ? 'Pago requerido' : 'Próximo vencimiento'

  /** 
   * Earliest upcoming reservation for the resident 
   */
  const nextReservation = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return state.reservaciones
      .filter(r => r.apartment === apartment && r.date >= today && r.status !== 'Cancelado')
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null
  }, [state.reservaciones, apartment])

  const recentAvisos = useMemo(() => state.avisos.slice(0, 3), [state.avisos])

  /**
   * Recent active tickets for the resident
   */
  const activeTickets = useMemo(
    () => state.tickets.filter(t => t.apartment === apartment && t.status !== 'Cerrado' && t.status !== 'Resuelto').slice(0, 2),
    [state.tickets, apartment]
  )
  const totalActiveTicketsCount = state.tickets.filter(t => t.apartment === apartment && t.status !== 'Cerrado' && t.status !== 'Resuelto').length

  /** 
   * Aggregate building collection rate (proxy for building operativity/health) 
   */
  const totalPagos = state.pagos.length
  const paidPagos = state.pagos.filter(p => p.status === 'Pagado').length
  const operativityPct = totalPagos > 0 ? Math.round((paidPagos / totalPagos) * 100) : 100

  /** Filter security staff from general staff list */
  const guards = useMemo(() => state.staff.filter(s => s.role === 'Guardia'), [state.staff])
  const allStaff = state.staff || []

  return (
    <div className="flex flex-col xl:flex-row gap-10 animate-in fade-in duration-700">
      {/* ── Central Activity Feed ── */}
      <div className="flex-1 space-y-10">
        {/* Building Status Display */}
        <section>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-10 hero-pattern relative overflow-hidden flex flex-col md:flex-row items-center justify-between group">
            <div className="relative z-10 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Infraestructura & Operatividad
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-6xl font-headline font-black text-slate-900 tracking-tighter">{operativityPct}%</span>
                <div className={`px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                  operativityPct >= 90 
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                    : 'text-amber-600 bg-amber-50 border-amber-100'
                }`}>
                  {operativityPct >= 90 ? 'Salud Óptima' : 'Requiere Atención'}
                </div>
              </div>
              <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                El ecosistema de {bc.buildingName} se encuentra operando conforme a los estándares de calidad establecidos.
              </p>
            </div>
            
            <div className="relative z-10 mt-8 md:mt-0">
              <Link
                to="/avisos"
                className="px-8 py-4 bg-slate-900 text-white font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-2xl shadow-slate-200 text-[10px]"
              >
                Bitácora de Avisos
                <span className="material-symbols-outlined text-[18px] ml-3 font-bold">trending_flat</span>
              </Link>
            </div>
            
            {/* Visual Icon Decal */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.03] pointer-events-none group-hover:translate-x-1/3 transition-transform duration-1000">
              <span className="material-symbols-outlined text-[20rem]" style={{ fontVariationSettings: '"FILL" 1' }}>apartment</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Active Maintenance Tickets */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Tickets de Servicio</h3>
              <span className="text-[10px] font-bold text-slate-400">Activos: {String(totalActiveTicketsCount).padStart(2, '0')}</span>
            </div>
            
            <div className="space-y-4">
              {activeTickets.length > 0 ? (
                activeTickets.map(ticket => (
                  <Link key={ticket.id} to="/tickets" className="block group p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                       <span className="material-symbols-outlined text-5xl">build</span>
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{ticket.category}</p>
                        <p className="text-[17px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{ticket.subject}</p>
                      </div>
                      <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 font-mono">#{ticket.number}</span>
                    </div>
                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[14px] mr-2 text-slate-300">update</span> {new Date(ticket.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {ticket.status === 'En Proceso' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          ticket.status === 'En Proceso' ? 'text-emerald-600' :
                          ticket.status === 'Asignado' ? 'text-purple-600' :
                          'text-indigo-600'
                        }`}>{ticket.status}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center bg-transparent rounded-3xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay tickets activos</p>
                </div>
              )}
              {totalActiveTicketsCount > 2 && (
                <Link to="/tickets" className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                  Ver {totalActiveTicketsCount - 2} más
                </Link>
              )}
            </div>
          </div>
          
          {/* Security Staff Display */}
          {guards.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Seguridad en Turno</h3>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En Línea</span>
              </div>
              
              <div className="bg-white border border-slate-200 p-2 rounded-3xl shadow-sm space-y-1">
                {guards.map((guard) => (
                  <div key={guard.id} className="flex items-center space-x-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-200 overflow-hidden group-hover:bg-slate-900 group-hover:text-white transition-all">
                        {guard.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-900 truncate tracking-tight">{guard.name}</p>
                      <p className="text-[10px] text-slate-400 truncate font-black uppercase tracking-[0.2em] mt-0.5">
                        Guardia de Acceso • {guard.shiftStart} – {guard.shiftEnd}
                      </p>
                    </div>
                    <button
                      className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 border border-transparent transition-all"
                    >
                      <span className="material-symbols-outlined text-xl">call</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Administration & Staff Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Gestión Administrativa</h3>
          </div>
          
          <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 text-white relative overflow-hidden">
            {/* Visual backdrop */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="flex items-center space-x-6 flex-1 relative z-10">
              <div className="relative">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black text-2xl border border-white/10 ring-8 ring-white/5">
                  {bc.adminName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-2xl font-headline font-extrabold tracking-tight">{bc.adminName}</p>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em]">Administrador General</p>
                <div className="flex items-center mt-3 text-slate-400">
                  <span className="material-symbols-outlined text-sm mr-2">phone</span>
                  <span className="text-xs font-bold tracking-widest text-white/60">
                    {bc.adminPhone}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 relative z-10">
              <button
                onClick={() => setShowStaffModal(true)}
                className="px-8 py-4 text-[10px] font-black text-white bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:text-white transition-all tracking-[0.2em] uppercase"
              >
                Directorio Operativo
              </button>
              <button
                className="w-14 h-14 flex items-center justify-center rounded-2xl bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20"
              >
                <span className="material-symbols-outlined font-bold">mail</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── Side Status Sidebar ── */}
      <aside className="w-full xl:w-80 flex flex-col space-y-10">
        <div className="space-y-6">
          <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Dashboard Rápidp</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-6">
            <Link to="/pagos" className="block bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:border-indigo-200 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${hasPendingPayment ? 'text-amber-700 bg-amber-50 border border-amber-100' : 'text-indigo-700 bg-indigo-50 border border-indigo-100'}`}>
                  {daysUntilDue}
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mi Estado Financiero</p>
              <span className={`font-headline font-extrabold text-2xl tracking-tight ${hasPendingPayment ? 'text-amber-600' : 'text-slate-900'}`}>
                {paymentStatusLabel}
              </span>
            </Link>
            
            <Link to="/paqueteria" className="block bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:border-orange-200 transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Paquetes Pendientes</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-slate-900 font-headline font-black text-4xl tracking-tighter">
                  {String(pendingPaquetes).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Piezas</span>
              </div>
            </Link>
            
            {hasAmenities && (
              <Link to="/amenidades" className="block bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:border-emerald-200 transition-all group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500" />
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <span className="material-symbols-outlined">event_available</span>
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Próxima Reservación</p>
                {nextReservation ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">{nextReservation.grill.split(' (')[0]}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em]">{nextReservation.date} • {nextReservation.grill.split('(')[1]?.replace(')', '')}</p>
                  </div>
                ) : (
                  <p className="text-[15px] font-bold text-slate-400 italic">Sin agenda activa</p>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Vertical Notifications/Notices List */}
        <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Comunicados</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          
          <div className="space-y-8 mt-6">
            {recentAvisos.map((aviso, i) => (
              <Link key={aviso.id} to="/avisos" className={`flex items-start space-x-4 group ${i > 0 ? 'opacity-50 hover:opacity-100 transition-all' : ''}`}>
                <div className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-emerald-500 ring-4 ring-emerald-500/10' : 'bg-slate-300'}`}></div>
                <div className="flex-1">
                  <h5 className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">{aviso.title}</h5>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{aviso.date}</p>
                </div>
              </Link>
            ))}
          </div>
          
          <Link
            to="/avisos"
            className="w-full mt-6 py-4 bg-white border border-slate-200 text-slate-900 text-[10px] font-black rounded-2xl uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all block text-center shadow-sm"
          >
            PANEL DE AVISOS
          </Link>
        </div>
      </aside>

      {/* Staff Directory Modal */}
      <Modal open={showStaffModal} onClose={() => setShowStaffModal(false)} title="Directorio de Servicio">
        <div className="space-y-3">
          {allStaff.length === 0 ? (
            <div className="py-12 text-center space-y-3">
               <span className="material-symbols-outlined text-4xl text-slate-200">person_off</span>
               <p className="text-sm text-slate-400 font-medium">No se ha registrado personal operativo.</p>
            </div>
          ) : (
            allStaff.map((s) => (
              <div key={s.id} className="flex items-center space-x-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-all shadow-sm group">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[1.5rem]">
                    {s.role === 'Guardia' ? 'shield_person' : s.role === 'Jardinero' ? 'yard' : 'mop'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 tracking-tight">{s.name}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] mt-0.5">
                    {s.role} • {s.shiftStart} – {s.shiftEnd}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-400 uppercase group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                  On Duty
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
