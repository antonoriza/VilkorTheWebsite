/**
 * AmenidadesPage — Amenity reservation and management.
 * 
 * Allows residents to reserve common areas (grills, event rooms, etc.)
 * based on availability and pre-defined time slots.
 * Admins can manage all reservations, update their status, and monitor facility usage.
 *
 * Integrated with the notification system to alert admins of new bookings
 * and residents of status changes.
 */
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import EmptyState from '../../core/components/EmptyState'
import { generateSlots, getMaxDate, withDefaults } from './slotUtils'
import { dateToMonthLabel } from '../../lib/month-utils'


export default function AmenidadesPage() {
  const { role, apartment, user } = useAuth()
  const { state, dispatch } = useStore()
  
  const [searchParams] = useSearchParams()

  const [filterDept, setFilterDept] = useState('')
  const [filterAmenity, setFilterAmenity] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(
    () => searchParams.get('status') || ''
  )

  useEffect(() => {
    setFilterStatus(searchParams.get('status') || '')
  }, [searchParams])

  const [showModal, setShowModal] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formGrill, setFormGrill] = useState('')
  const [formTimeSlot, setFormTimeSlot] = useState('')
  const [conflictError, setConflictError] = useState('')
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  // Reglamento
  const [showReglamento, setShowReglamento] = useState(false)
  const [reglamentoAccepted, setReglamentoAccepted] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Multa modal
  const [multaResId, setMultaResId] = useState<string | null>(null)
  const [multaAmount, setMultaAmount] = useState(500)
  const [multaReason, setMultaReason] = useState('Daño a las instalaciones')
  const [multaCustomReason, setMultaCustomReason] = useState('')
  const [multaNotes, setMultaNotes] = useState('')

  // Toast
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'ok' | 'warn' }[]>([])
  const addToast = (msg: string, type: 'ok' | 'warn' = 'ok') => {
    const id = `t-${Date.now()}`
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }

  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'
  const amenities = (state.amenities || []).map(withDefaults)
  const bc = state.buildingConfig
  const approvalMode = bc.reservationApprovalMode || 'auto_approve'
  const exceptionApts = bc.reservationExceptionApartments || []

  const selectedAmenity = amenities.find(a => a.name === (formGrill || amenities[0]?.name))
  const selectedGrill = formGrill || (amenities.length > 0 ? amenities[0].name : '')

  /**
   * Memoized list of reservations based on role and filters
   */
  // Parse grill field "AmenityName (HH:MM – HH:MM)" into parts
  const parseGrill = (grill: string) => {
    const match = grill.match(/^(.+?)\s*\(([^)]+)\)$/)
    return match ? { amenity: match[1].trim(), time: match[2].trim() } : { amenity: grill, time: '' }
  }

  // Parse "HH:MM" string to minutes for range comparison
  const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0) }

  // Parse slot "HH:MM – HH:MM" into [startMins, endMins]
  const slotRange = (time: string): [number, number] | null => {
    const parts = time.split(/\s*[–-]\s*/)
    if (parts.length !== 2) return null
    return [toMins(parts[0].trim()), toMins(parts[1].trim())]
  }

  const filteredReservaciones = useMemo(() => {
    let data = isAdmin ? state.reservaciones : state.reservaciones.filter(r => r.apartment === apartment)
    if (filterDept) data = data.filter(r => r.apartment === filterDept)
    if (filterStatus) data = data.filter(r => r.status === filterStatus)
    if (filterAmenity) data = data.filter(r => parseGrill(r.grill).amenity === filterAmenity)
    if (filterDay) data = data.filter(r => r.date === filterDay)
    if (filterFrom || filterTo) {
      data = data.filter(r => {
        const range = slotRange(parseGrill(r.grill).time)
        if (!range) return true
        const [sStart, sEnd] = range
        const from = filterFrom ? toMins(filterFrom) : 0
        const to = filterTo ? toMins(filterTo) : 24 * 60
        // Overlap: slot starts before filter ends AND slot ends after filter starts
        return sStart < to && sEnd > from
      })
    }
    return [...data].sort((a, b) => a.date.localeCompare(b.date))
  }, [state.reservaciones, isAdmin, apartment, filterDept, filterStatus, filterAmenity, filterDay, filterFrom, filterTo])

  // Unique amenity names from all reservations for the filter dropdown
  const amenityNames = [...new Set(state.reservaciones.map(r => parseGrill(r.grill).amenity))].sort()

  // All unique hour values appearing in any slot boundary (for from/to selects)
  const hourOptions = [...new Set(state.reservaciones.flatMap(r => {
    const t = parseGrill(r.grill).time
    if (!t) return []
    return t.split(/\s*[–-]\s*/).map(s => s.trim()).filter(Boolean)
  }))].sort()

  // Color palette for amenity pills
  const amenityColor = (name: string): string => {
    const palette: Record<string, string> = {
      'Asador':          'bg-orange-100 text-orange-700',
      'Alberca':         'bg-blue-100 text-blue-700',
      'Cancha de Tenis': 'bg-lime-100 text-lime-700',
      'Cancha de Fútbol':'bg-green-100 text-green-700',
      'Gimnasio':        'bg-violet-100 text-violet-700',
      'Ludoteca':        'bg-pink-100 text-pink-700',
      'Salón de Eventos':'bg-amber-100 text-amber-700',
    }
    return palette[name] ?? 'bg-slate-100 text-slate-700'
  }

  const departments = [...new Set(state.reservaciones.map(r => r.apartment))].sort()

  /**
   * Opens confirmation dialog for cancellation
   */
  const handleRequestCancel = (id: string) => setConfirmCancelId(id)

  /**
   * Executes the deletion of a reservation
   */
  const executeCancel = () => {
    if (confirmCancelId) {
      dispatch({ type: 'DELETE_RESERVACION', payload: confirmCancelId })
      setConfirmCancelId(null)
    }
  }

  /**
   * Handles new reservation creation with collision detection + approval mode
   */
  const handleAdd = () => {
    if (!formDate || !selectedGrill || !formTimeSlot) return

    // Reglamento check — if amenity has one and user hasn't accepted yet
    if (selectedAmenity && selectedAmenity.reglamentoType !== 'none') {
      const key = `pp_reglamento_accepted_${selectedAmenity.id}`
      if (localStorage.getItem(key) !== 'true' && !reglamentoAccepted) {
        setShowReglamento(true)
        return
      }
    }

    // Prevent double booking for the same amenity + date + slot
    const existing = state.reservaciones.find(
      r => r.date === formDate && r.grill === `${selectedGrill} (${formTimeSlot})` && r.status !== 'Cancelado'
    )
    if (existing) {
      setConflictError(`${selectedGrill} ya está reservado el ${formDate} (${formTimeSlot}) por ${existing.resident} (${existing.apartment}).`)
      return
    }

    // Determine status based on approval mode
    let status: 'Reservado' | 'Por confirmar' = 'Reservado'
    if (approvalMode === 'manual_approval') {
      status = 'Por confirmar'
    } else if (approvalMode === 'auto_with_exceptions' && exceptionApts.includes(apartment)) {
      status = 'Por confirmar'
    }

    const resId = `res-${Date.now()}`
    dispatch({
      type: 'ADD_RESERVACION',
      payload: { id: resId, date: formDate, grill: `${selectedGrill} (${formTimeSlot})`, resident: user, apartment, status },
    })
    
    // Financial charge using per-amenity deposit
    const deposit = selectedAmenity?.depositAmount ?? 500
    if (deposit > 0) {
      dispatch({
        type: 'ADD_PAGO',
        payload: {
          id: `pg-res-${resId}`, apartment, resident: user,
          month: dateToMonthLabel(formDate), monthKey: formDate,
          concepto: `Reserva Amenidad: ${selectedGrill} (${formTimeSlot})`,
          amount: deposit, status: 'Pendiente', paymentDate: null,
        }
      })
    }

    // Save "don't show again" if checked
    if (dontShowAgain && selectedAmenity) {
      localStorage.setItem(`pp_reglamento_accepted_${selectedAmenity.id}`, 'true')
    }

    // Toast feedback
    addToast(
      status === 'Reservado'
        ? 'Reservación confirmada ✓'
        : 'Solicitud enviada — pendiente de aprobación',
      status === 'Reservado' ? 'ok' : 'warn'
    )

    // Reset
    setFormDate(''); setFormGrill(''); setFormTimeSlot('')
    setConflictError(''); setShowModal(false)
    setReglamentoAccepted(false); setDontShowAgain(false); setShowReglamento(false)
  }

  /** Admin: Approve a pending reservation */
  const handleApprove = (id: string) => {
    const res = state.reservaciones.find(r => r.id === id)
    if (!res) return
    dispatch({ type: 'UPDATE_RESERVACION', payload: { ...res, status: 'Reservado' } })
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `notif-${Date.now()}`, userId: res.resident,
        title: 'Reservación Aprobada',
        message: `Tu reservación de ${res.grill} para el ${res.date} ha sido aprobada.`,
        date: new Date().toLocaleDateString(), read: false
      }
    })
    addToast(`Reservación aprobada: ${res.grill}`)
  }

  /** Admin: Reject a pending reservation */
  const handleReject = (id: string) => {
    const res = state.reservaciones.find(r => r.id === id)
    if (!res) return
    dispatch({ type: 'UPDATE_RESERVACION', payload: { ...res, status: 'Cancelado' } })
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `notif-${Date.now()}`, userId: res.resident,
        title: 'Reservación Rechazada',
        message: `Tu reservación de ${res.grill} para el ${res.date} ha sido rechazada por la administración.`,
        date: new Date().toLocaleDateString(), read: false
      }
    })
    addToast(`Reservación rechazada`, 'warn')
  }

  /** Admin: Apply a fine (multa) to a reservation */
  const handleMultaSubmit = () => {
    if (!multaResId) return
    const res = state.reservaciones.find(r => r.id === multaResId)
    if (!res) return
    const reason = multaReason === 'Otro' ? multaCustomReason : multaReason
    dispatch({
      type: 'ADD_PAGO',
      payload: {
        id: `pg-multa-${Date.now()}`, apartment: res.apartment, resident: res.resident,
        month: dateToMonthLabel(new Date().toISOString().split('T')[0]),
        monthKey: new Date().toISOString().slice(0, 7),
        concepto: `Multa: ${reason} — ${res.grill.split(' (')[0]}`,
        amount: multaAmount, status: 'Pendiente', paymentDate: null,
        notes: multaNotes || undefined,
      }
    })
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `notif-multa-${Date.now()}`, userId: res.resident,
        title: 'Multa Aplicada',
        message: `Se ha aplicado una multa de $${multaAmount} por: ${reason} (${res.grill}).`,
        date: new Date().toLocaleDateString(), read: false
      }
    })
    addToast(`Multa de $${multaAmount} aplicada a ${res.apartment}`, 'warn')
    setMultaResId(null); setMultaAmount(500); setMultaReason('Daño a las instalaciones')
    setMultaCustomReason(''); setMultaNotes('')
  }

  // Early return if no amenities are defined (module hidden logic)
  if (amenities.length === 0) {
    return (
      <EmptyState
        variant="page"
        icon="outdoor_grill"
        title="Sin amenidades configuradas"
        subtitle={isAdmin
          ? 'Agrega amenidades desde Configuración para que los residentes puedan hacer reservaciones.'
          : 'El edificio no cuenta con amenidades disponibles para reservación en este momento.'}
        action={isAdmin ? { label: 'Ir a Configuración', href: '/admin/configuracion?tab=perfil' } : undefined}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Amenidades
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Reserva y gestiona el uso de áreas comunes.
          </p>
        </div>
        <button
          onClick={() => { setConflictError(''); setShowModal(true) }}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Nueva reservación</span>
        </button>
      </div>

      {/* Reservations Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-headline font-extrabold text-slate-900">
                {isAdmin ? 'Calendario General' : 'Mis Reservaciones'}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-slate-500 font-medium">
                  {isAdmin ? 'Resumen de todas las solicitudes activas' : `Registros del Depto. ${apartment}`}
                </p>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {filteredReservaciones.length} de {(isAdmin ? state.reservaciones : state.reservaciones.filter(r => r.apartment === apartment)).length}
                </span>
              </div>
            </div>
            {(filterAmenity || filterDay || filterFrom || filterTo || filterDept || filterStatus) && (
              <button
                onClick={() => { setFilterAmenity(''); setFilterDay(''); setFilterFrom(''); setFilterTo(''); setFilterDept(''); setFilterStatus('') }}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amenidad</label>
              <select
                value={filterAmenity}
                onChange={e => setFilterAmenity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              >
                <option value="">Todas</option>
                {amenityNames.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Día</label>
              <input
                type="date"
                value={filterDay}
                onChange={e => setFilterDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Desde hora</label>
              <select
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              >
                <option value="">Cualquiera</option>
                {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hasta hora</label>
              <select
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              >
                <option value="">Cualquiera</option>
                {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              >
                <option value="">Todos</option>
                <option value="Reservado">Reservado</option>
                <option value="Por confirmar">Por confirmar</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            {isAdmin && (
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apartamento</label>
                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                >
                  <option value="">Todos</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amenidad</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</th>
                {isAdmin && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residente</th>}
                {isAdmin && <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depto.</th>}
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservaciones.map((res) => {
                const { amenity: resAmenity, time: resTime } = parseGrill(res.grill)
                return (
                <tr key={res.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">{res.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg ${amenityColor(resAmenity)}`}>
                      <span className="material-symbols-outlined text-sm">outdoor_grill</span>
                      {resAmenity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 whitespace-nowrap">
                      <span className="material-symbols-outlined text-base text-slate-300">schedule</span>
                      {resTime || '—'}
                    </span>
                  </td>
                  {isAdmin && <td className="px-6 py-4 text-sm font-medium text-slate-700">{res.resident}</td>}
                  {isAdmin && <td className="px-6 py-4"><span className="text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded-md">{res.apartment}</span></td>}
                  <td className="px-6 py-4"><StatusBadge status={res.status} /></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {isAdmin && res.status === 'Por confirmar' && (
                      <>
                        <button onClick={() => handleApprove(res.id)}
                          className="text-[10px] font-bold text-emerald-600 hover:text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200 uppercase tracking-widest transition-all"
                        >Aprobar</button>
                        <button onClick={() => handleReject(res.id)}
                          className="text-[10px] font-bold text-rose-500 hover:text-white hover:bg-rose-500 px-3 py-1.5 rounded-lg border border-rose-200 uppercase tracking-widest transition-all"
                        >Rechazar</button>
                      </>
                    )}
                    {isAdmin && res.status === 'Reservado' && (
                      <button onClick={() => setMultaResId(res.id)}
                        className="text-[10px] font-bold text-amber-600 hover:text-white hover:bg-amber-600 px-3 py-1.5 rounded-lg border border-amber-200 uppercase tracking-widest transition-all"
                        title="Aplicar multa"
                      >⚠ Multa</button>
                    )}
                    <button
                      onClick={() => handleRequestCancel(res.id)}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                      title="Cancelar Reservación"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </td>
                </tr>
                )
              })}
              {filteredReservaciones.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-8 py-10">
                    <EmptyState
                      icon="event_busy"
                      title="Sin reservaciones activas"
                      subtitle={isAdmin ? 'Los residentes aún no han realizado reservaciones.' : 'No tienes reservaciones activas. Haz clic en “Nueva reservación” para comenzar.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reservation Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Reservación">
        <div className="space-y-6">
          {conflictError && (
            <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 animate-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-lg mt-0.5">error_outline</span>
              <p className="text-xs font-bold leading-relaxed">{conflictError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amenidad</label>
            <select
              value={selectedGrill}
              onChange={(e) => { setFormGrill(e.target.value); setFormTimeSlot(''); setConflictError('') }}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              {amenities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Uso</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => { setFormDate(e.target.value); setFormTimeSlot(''); setConflictError('') }}
              min={new Date().toISOString().split('T')[0]}
              max={selectedAmenity ? getMaxDate(selectedAmenity) : undefined}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
          </div>

          {/* Dynamic time slots */}
          {selectedAmenity && formDate && (() => {
            const slots = generateSlots(selectedAmenity, formDate, state.reservaciones)
            return (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Bloque Horario <span className="text-slate-300">({slots.filter(s => s.available).length} disponibles)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.label}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setFormTimeSlot(slot.label)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                        formTimeSlot === slot.label
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                          : slot.available
                            ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
                {slots.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No hay horarios configurados para esta amenidad.</p>
                )}
              </div>
            )
          })()}

          {/* Reglamento link */}
          {selectedAmenity && selectedAmenity.reglamentoType !== 'none' && (
            <button
              type="button"
              onClick={() => setShowReglamento(true)}
              className="flex items-center gap-2 text-[11px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
            >
              <span className="material-symbols-outlined text-base">description</span>
              Ver Reglamento de {selectedAmenity.name}
            </button>
          )}

          {/* Deposit info */}
          {selectedAmenity && (selectedAmenity.depositAmount ?? 0) > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="material-symbols-outlined text-blue-500 text-base">info</span>
              <span className="text-xs font-bold text-blue-700">Depósito: ${selectedAmenity.depositAmount?.toLocaleString()} MXN</span>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={!formDate || !formTimeSlot}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar Solicitud
          </button>
        </div>
      </Modal>

      {/* Reglamento Modal */}
      <Modal open={showReglamento} onClose={() => setShowReglamento(false)} title={`Reglamento — ${selectedAmenity?.name || ''}`}>
        <div className="space-y-5">
          {selectedAmenity?.reglamentoType === 'text' && (
            <div className="prose prose-sm max-w-none max-h-64 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedAmenity.reglamentoText || 'Sin reglamento configurado.'}
            </div>
          )}
          {selectedAmenity?.reglamentoType === 'pdf' && selectedAmenity.reglamentoPdfUrl && (
            <iframe src={selectedAmenity.reglamentoPdfUrl} className="w-full h-80 rounded-2xl border border-slate-200" title="Reglamento PDF" />
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={reglamentoAccepted} onChange={e => setReglamentoAccepted(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <span className="text-xs font-bold text-slate-700">He leído y acepto el reglamento</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-400 focus:ring-slate-300" />
            <span className="text-xs font-medium text-slate-400">No mostrar de nuevo para esta amenidad</span>
          </label>
          <button
            disabled={!reglamentoAccepted}
            onClick={() => { setShowReglamento(false); handleAdd() }}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aceptar y Continuar
          </button>
        </div>
      </Modal>

      {/* Multa Modal */}
      <Modal open={!!multaResId} onClose={() => setMultaResId(null)} title="Aplicar Multa">
        {(() => {
          const res = state.reservaciones.find(r => r.id === multaResId)
          if (!res) return null
          return (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reservación</p>
                <p className="text-sm font-bold text-slate-900">{res.grill} — {res.date}</p>
                <p className="text-xs text-slate-500">{res.resident} ({res.apartment})</p>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                <select value={multaReason} onChange={e => setMultaReason(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-primary/5">
                  <option>Daño a las instalaciones</option>
                  <option>Limpieza no realizada</option>
                  <option>Exceso de ruido / horario</option>
                  <option>Capacidad excedida</option>
                  <option>Otro</option>
                </select>
                {multaReason === 'Otro' && (
                  <input value={multaCustomReason} onChange={e => setMultaCustomReason(e.target.value)}
                    placeholder="Describir motivo..." className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-primary/5 mt-2" />
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto (MXN)</label>
                <input type="number" value={multaAmount} onChange={e => setMultaAmount(Number(e.target.value))} min={0}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-4 focus:ring-primary/5" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notas (opcional)</label>
                <textarea value={multaNotes} onChange={e => setMultaNotes(e.target.value)} rows={2}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium outline-none focus:ring-4 focus:ring-primary/5 resize-none" />
              </div>
              <button onClick={handleMultaSubmit}
                className="w-full py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-amber-100">
                Aplicar Multa — ${multaAmount.toLocaleString()} MXN
              </button>
            </div>
          )
        })()}
      </Modal>

      {/* Cancellation Confirmation */}
      <ConfirmDialog
        open={!!confirmCancelId}
        onClose={() => setConfirmCancelId(null)}
        onConfirm={executeCancel}
        title="Cancelar Reservación"
        confirmLabel="Confirmar Cancelación"
        variant="danger"
      >
        ¿Estás seguro de que deseas cancelar esta reservación? Esta acción liberará el espacio para otros residentes.
      </ConfirmDialog>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in slide-in-from-bottom-3 ${
            t.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
          }`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
