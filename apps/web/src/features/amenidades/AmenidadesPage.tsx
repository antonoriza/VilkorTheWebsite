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
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import EmptyState from '../../core/components/EmptyState'

/** Pre-defined time slots for reservations */
const TIME_SLOTS = ['10:00 – 14:00', '14:00 – 18:00', '18:00 – 22:00']

import { dateToMonthLabel } from '../../lib/month-utils'


export default function AmenidadesPage() {
  const { role, apartment, user } = useAuth()
  const { state, dispatch } = useStore()
  
  // Local state for filtering and modals
  const [filterDept, setFilterDept] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formGrill, setFormGrill] = useState('')
  const [formTimeSlot, setFormTimeSlot] = useState(TIME_SLOTS[0])
  const [conflictError, setConflictError] = useState('')
  
  // Confirm dialog for cancellation
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'
  const amenities = state.amenities || []

  /** Default selection for the first available amenity */
  const selectedGrill = formGrill || (amenities.length > 0 ? amenities[0].name : '')

  /**
   * Memoized list of reservations based on role and filters
   */
  const filteredReservaciones = useMemo(() => {
    let data = isAdmin ? state.reservaciones : state.reservaciones.filter(r => r.apartment === apartment)
    if (filterDept) data = data.filter(r => r.apartment === filterDept)
    return data
  }, [state.reservaciones, isAdmin, apartment, filterDept])

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
   * Handles new reservation creation with collision detection
   */
  const handleAdd = () => {
    if (!formDate || !selectedGrill) return

    // Prevent double booking for the same amenity on the same date
    const existing = state.reservaciones.find(
      r => r.date === formDate && r.grill.startsWith(selectedGrill) && r.status !== 'Cancelado'
    )
    if (existing) {
      setConflictError(`${selectedGrill} ya está reservado el ${formDate} por ${existing.resident} (${existing.apartment}).`)
      return
    }

    const resId = `res-${Date.now()}`
    dispatch({
      type: 'ADD_RESERVACION',
      payload: {
        id: resId,
        date: formDate,
        grill: `${selectedGrill} (${formTimeSlot})`,
        resident: user,
        apartment,
        status: 'Reservado',
      },
    })
    
    // 3. Create linked financial charge (Pago)
    dispatch({
      type: 'ADD_PAGO',
      payload: {
        id: `pg-res-${resId}`,
        apartment,
        resident: user,
        month: dateToMonthLabel(formDate),
        monthKey: formDate, // Use YYYY-MM-DD for high-resolution maturity check
        concepto: `Reserva Amenidad: ${selectedGrill} (${formTimeSlot})`,
        amount: 500, // Standard fee for amenities
        status: 'Pendiente',
        paymentDate: null,
      }
    })

    // Reset form
    setFormDate('')
    setFormGrill('')
    setFormTimeSlot(TIME_SLOTS[0])
    setConflictError('')
    setShowModal(false)
  }

  /**
   * Admin-only: Toggles reservation status and notifies the resident
   */
  const handleUpdateStatus = (id: string) => {
    const res = state.reservaciones.find(r => r.id === id)
    if (!res) return
    const newStatus = res.status === 'Por confirmar' ? 'Reservado' : 'Por confirmar'
    dispatch({ type: 'UPDATE_RESERVACION', payload: { ...res, status: newStatus } })
    
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `notif-${Date.now()}`,
        userId: res.resident,
        title: 'Estado de Reservación Actualizado',
        message: `Tu reservación de ${res.grill} para el ${res.date} ha cambiado a: ${newStatus}.`,
        date: new Date().toLocaleDateString(),
        read: false
      }
    })
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
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-slate-900">
              {isAdmin ? 'Calendario General' : 'Mis Reservaciones'}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin ? 'Resumen de todas las solicitudes activas' : `Registros del Depto. ${apartment}`}
            </p>
          </div>
          {isAdmin && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            >
              <option value="">Todos los Deptos.</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100 bg-slate-50/30">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amenidad / Horario</th>
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residente</th>}
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depto.</th>}
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservaciones.map((res) => (
                <tr key={res.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-900">{res.date}</td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-700">{res.grill}</td>
                  {isAdmin && <td className="px-8 py-5 text-sm font-medium text-slate-700">{res.resident}</td>}
                  {isAdmin && <td className="px-8 py-5 text-sm font-bold text-slate-900">{res.apartment}</td>}
                  <td className="px-8 py-5"><StatusBadge status={res.status} /></td>
                  <td className="px-8 py-5 text-right space-x-2">
                    {isAdmin && (
                      <button
                        onClick={() => handleUpdateStatus(res.id)}
                        className="text-[10px] font-bold text-primary hover:text-white hover:bg-primary px-3 py-1.5 rounded-lg border border-primary-dim uppercase tracking-widest transition-all"
                      >
                        Validar
                      </button>
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
              ))}
              {filteredReservaciones.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 4} className="px-8 py-10">
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Uso</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => { setFormDate(e.target.value); setConflictError('') }}
              min={new Date().toISOString().split('T')[0]}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amenidad</label>
              <select
                value={selectedGrill}
                onChange={(e) => { setFormGrill(e.target.value); setConflictError('') }}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              >
                {amenities.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bloque Horario</label>
              <select
                value={formTimeSlot}
                onChange={(e) => setFormTimeSlot(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              >
                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200"
          >
            Confirmar Solicitud
          </button>
        </div>
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
    </div>
  )
}
