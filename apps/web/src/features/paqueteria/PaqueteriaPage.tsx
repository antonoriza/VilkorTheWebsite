/**
 * PaqueteriaPage — Package receipt and delivery management.
 *
 * Admin view: Full list of received packages with the ability to
 * register new arrivals, filter by recipient/apartment, and
 * marks packages as delivered.
 * Resident view: Personalized list of pending and received packages.
 *
 * This module ensures secure tracking of physical items within
 * the residential complex.
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'


export default function PaqueteriaPage() {
  const { role, apartment } = useAuth()
  const { state, dispatch } = useStore()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formRecipient, setFormRecipient] = useState('')
  const [formApartment, setFormApartment] = useState('')
  const [formLocation, setFormLocation] = useState('')

  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'

  /** 
   * Filtered list of packages based on user role and search query 
   */
  const filteredPaquetes = useMemo(() => {
    let data = isAdmin ? state.paquetes : state.paquetes.filter(p => p.apartment === apartment)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p =>
        p.recipient.toLowerCase().includes(q) ||
        p.apartment.toLowerCase().includes(q)
      )
    }
    return data
  }, [state.paquetes, isAdmin, apartment, search])

  /** Derive unique location options from existing package data */
  const knownLocations = useMemo(() => {
    const locs = new Set<string>()
    state.paquetes.forEach(p => { if (p.location && p.location !== 'N/A') locs.add(p.location) })
    return [...locs].sort()
  }, [state.paquetes])

  /** 
   * Admin-only: Clears all packages marked as 'Entregado' (Delivered) 
   */
  const handleCleanDelivered = () => dispatch({ type: 'DELETE_PAQUETES_DELIVERED' })

  /** 
   * Registers a new package arrival 
   */
  const handleAdd = () => {
    if (!formRecipient.trim() || !formApartment.trim()) return
    dispatch({
      type: 'ADD_PAQUETE',
      payload: {
        id: `pq-${Date.now()}`,
        recipient: formRecipient,
        apartment: formApartment,
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'Pendiente',
        location: formLocation,
      },
    })
    setFormRecipient('')
    setFormApartment('')
    setFormLocation('')
    setShowModal(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Control de Paquetería
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestión y seguimiento de paquetes recibidos en el edificio.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Registrar paquete</span>
            </button>
            <button
              onClick={handleCleanDelivered}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[11px] tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              <span>Limpiar entregados</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <span className="material-symbols-outlined text-xl">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por destinatario o departamento..."
            className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      {/* Packages Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-slate-900">Paquetes</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin ? 'Todos los registros operativos' : `Registros para el Depto. ${apartment}`}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <span className="material-symbols-outlined text-base">package_2</span>
            <span>{filteredPaquetes.length} registros</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destinatario</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recibido</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</th>
                <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaquetes.map((pkg) => (
                <tr key={pkg.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-900">{pkg.recipient}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{pkg.apartment}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pkg.receivedDate}</td>
                  <td className="px-8 py-5"><StatusBadge status={pkg.status} /></td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pkg.location}</td>
                  <td className="px-8 py-5 text-center">
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          const newStatus = pkg.status === 'Pendiente' ? 'Entregado' : 'Pendiente'
                          dispatch({ 
                            type: 'UPDATE_PAQUETE', 
                            payload: { 
                              ...pkg, 
                              status: newStatus, 
                              location: newStatus === 'Entregado' ? 'N/A' : pkg.location 
                            } 
                          })
                        }}
                        className={`w-10 h-10 inline-flex items-center justify-center rounded-xl transition-all shadow-sm ${
                          pkg.status === 'Entregado' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={pkg.status === 'Pendiente' ? 'Confirmar Entrega' : 'Revertir a Pendiente'}
                      >
                        <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
                      </button>
                    ) : (
                      <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${
                        pkg.status === 'Pendiente' 
                          ? 'text-amber-600 bg-amber-50 border-amber-100' 
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}>
                        {pkg.status === 'Pendiente' ? 'En espera' : 'Recibido'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPaquetes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No se encontraron registros de paquetería.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal (Admin Only) */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Paquete">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destinatario</label>
            <select
              value={formRecipient}
              onChange={(e) => {
                setFormRecipient(e.target.value)
                const r = state.residents.find(r => r.name === e.target.value)
                if (r) setFormApartment(r.apartment)
              }}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              <option value="">Seleccionar residente...</option>
              {state.residents.map(r => <option key={r.name} value={r.name}>{r.name} — {r.apartment}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
            <input
              type="text"
              value={formApartment}
              readOnly
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium cursor-not-allowed"
              placeholder="Auto-completado"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación de Almacenamiento</label>
            <input
              type="text"
              list="pkg-location-options"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Ubicación donde se almacena el paquete"
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
            <datalist id="pkg-location-options">
              {knownLocations.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200"
          >
            Registrar Paquete
          </button>
        </div>
      </Modal>
    </div>
  )
}
