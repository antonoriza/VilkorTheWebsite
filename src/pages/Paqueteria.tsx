import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { seedResidents } from '../data/seed'

export default function Paqueteria() {
  const { role, apartment } = useAuth()
  const { state, dispatch } = useStore()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formRecipient, setFormRecipient] = useState('')
  const [formApartment, setFormApartment] = useState('')
  const [formLocation, setFormLocation] = useState('Caseta')

  const isAdmin = role === 'admin'

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

  const handleDeliver = (id: string) => {
    const pkg = state.paquetes.find(p => p.id === id)
    if (!pkg) return
    dispatch({ type: 'UPDATE_PAQUETE', payload: { ...pkg, status: 'Entregado', location: 'N/A' } })
  }

  const handleCleanDelivered = () => dispatch({ type: 'DELETE_PAQUETES_DELIVERED' })

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
    setFormLocation('Caseta')
    setShowModal(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
          Control de Paquetería
        </h1>
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

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <span className="material-symbols-outlined text-xl">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paquete..."
            className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-8 pb-4">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-slate-900">Paquetería</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin ? 'Todos los paquetes recibidos' : `Paquetes para ${apartment}`}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <span className="material-symbols-outlined text-base">package_2</span>
            <span>{filteredPaquetes.length} paquetes</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100">
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destinatario</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de recepción</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaquetes.map((pkg) => (
                <tr key={pkg.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-medium text-slate-700">{pkg.recipient}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900">{pkg.apartment}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pkg.receivedDate}</td>
                  <td className="px-8 py-5"><StatusBadge status={pkg.status} /></td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pkg.location}</td>
                  <td className="px-8 py-5">
                    {pkg.status === 'Pendiente' && isAdmin && (
                      <button
                        onClick={() => handleDeliver(pkg.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                        title="Marcar como entregado"
                      >
                        <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
                      </button>
                    )}
                    {pkg.status === 'Pendiente' && !isAdmin && (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        En espera
                      </span>
                    )}
                    {pkg.status === 'Entregado' && (
                      <span className="material-symbols-outlined text-lg text-slate-300">task_alt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Paquete">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destinatario</label>
            <select
              value={formRecipient}
              onChange={(e) => {
                setFormRecipient(e.target.value)
                const r = seedResidents.find(r => r.name === e.target.value)
                if (r) setFormApartment(r.apartment)
              }}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              <option value="">Seleccionar residente...</option>
              {seedResidents.map(r => <option key={r.name} value={r.name}>{r.name} — {r.apartment}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
            <input
              type="text"
              value={formApartment}
              onChange={(e) => setFormApartment(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              placeholder="A101"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
            <select
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              <option value="Caseta">Caseta</option>
              <option value="Lobby">Lobby</option>
              <option value="Administración">Administración</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Registrar Paquete
          </button>
        </div>
      </Modal>
    </div>
  )
}
