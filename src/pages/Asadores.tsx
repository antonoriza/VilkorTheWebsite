import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

const TIME_SLOTS = ['10:00 – 14:00', '14:00 – 18:00', '18:00 – 22:00']

export default function Asadores() {
  const { role, apartment, user } = useAuth()
  const { state, dispatch } = useStore()
  const [filterDept, setFilterDept] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formGrill, setFormGrill] = useState('Asador 1')
  const [formTimeSlot, setFormTimeSlot] = useState(TIME_SLOTS[0])
  const [conflictError, setConflictError] = useState('')

  const isAdmin = role === 'admin'

  const filteredReservaciones = useMemo(() => {
    let data = isAdmin ? state.reservaciones : state.reservaciones.filter(r => r.apartment === apartment)
    if (filterDept) data = data.filter(r => r.apartment === filterDept)
    return data
  }, [state.reservaciones, isAdmin, apartment, filterDept])

  const departments = [...new Set(state.reservaciones.map(r => r.apartment))].sort()

  const handleCancel = (id: string) => dispatch({ type: 'DELETE_RESERVACION', payload: id })

  const handleAdd = () => {
    if (!formDate) return

    // Double-booking validation
    const existing = state.reservaciones.find(
      r => r.date === formDate && r.grill === formGrill && r.status !== 'Cancelado'
    )
    if (existing) {
      setConflictError(`${formGrill} ya está reservado el ${formDate} por ${existing.resident} (${existing.apartment}).`)
      return
    }

    dispatch({
      type: 'ADD_RESERVACION',
      payload: {
        id: `res-${Date.now()}`,
        date: formDate,
        grill: `${formGrill} (${formTimeSlot})`,
        resident: user,
        apartment,
        status: 'Reservado',
      },
    })
    
    // Notify admin
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `notif-${Date.now()}`,
        userId: 'admin',
        title: 'Nueva Reservación',
        message: `${user} (${apartment}) reservó ${formGrill} el ${formDate}.`,
        date: new Date().toLocaleDateString(),
        read: false,
        actionLink: '/asadores',
      }
    })

    setFormDate('')
    setFormGrill('Asador 1')
    setFormTimeSlot(TIME_SLOTS[0])
    setConflictError('')
    setShowModal(false)
  }

  const handleUpdateStatus = (id: string) => {
    const res = state.reservaciones.find(r => r.id === id)
    if (!res) return
    const newStatus = res.status === 'Por confirmar' ? 'Reservado' : 'Por confirmar'
    dispatch({ type: 'UPDATE_RESERVACION', payload: { ...res, status: newStatus } })
    
    // Notify resident
    dispatch({
      type: 'ADD_NOTIFICACION',
      payload: {
        id: `notif-${Date.now()}`,
        userId: res.resident,
        title: 'Cambio de Estado',
        message: `Tu reservación de ${res.grill} ha cambiado a: ${newStatus}.`,
        date: new Date().toLocaleDateString(),
        read: false
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
          Reservación de Asadores
        </h1>
        <button
          onClick={() => { setConflictError(''); setShowModal(true) }}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
        >
          <span className="material-symbols-outlined text-lg">outdoor_grill</span>
          <span>Nueva reservación</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-slate-900">
              {isAdmin ? 'Todas las reservaciones' : 'Mis reservaciones'}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin ? 'Listado de todas las reservaciones' : `Departamento ${apartment}`}
            </p>
          </div>
          {isAdmin && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
            >
              <option value="">Filtrar por depto.</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asador</th>
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residente</th>}
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</th>}
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
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
                  <td className="px-8 py-5 flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => handleUpdateStatus(res.id)}
                        className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest transition-colors"
                      >
                        Actualizar
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(res.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReservaciones.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 4} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No hay reservaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Reservación">
        <div className="space-y-5">
          {conflictError && (
            <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
              <span className="material-symbols-outlined text-base mt-0.5">error</span>
              <p className="text-sm font-bold">{conflictError}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => { setFormDate(e.target.value); setConflictError('') }}
              min={new Date().toISOString().split('T')[0]}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asador</label>
            <select
              value={formGrill}
              onChange={(e) => { setFormGrill(e.target.value); setConflictError('') }}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              <option>Asador 1</option>
              <option>Asador 2</option>
              <option>Asador 3</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horario</label>
            <select
              value={formTimeSlot}
              onChange={(e) => setFormTimeSlot(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Reservar
          </button>
        </div>
      </Modal>
    </div>
  )
}
