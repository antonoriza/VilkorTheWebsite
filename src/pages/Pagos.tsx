import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import StatusBadge from '../components/StatusBadge'

export default function Pagos() {
  const { role, apartment } = useAuth()
  const { state, dispatch } = useStore()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const isAdmin = role === 'admin'

  const filteredPagos = useMemo(() => {
    let data = isAdmin ? state.pagos : state.pagos.filter(p => p.apartment === apartment)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p =>
        p.month.toLowerCase().includes(q) ||
        p.resident.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.apartment.toLowerCase().includes(q)
      )
    }
    if (filterDept) data = data.filter(p => p.apartment === filterDept)
    if (filterStatus) data = data.filter(p => p.status === filterStatus)
    return data
  }, [state.pagos, isAdmin, apartment, search, filterDept, filterStatus])

  const pendingTotal = useMemo(
    () => filteredPagos.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + p.amount, 0),
    [filteredPagos]
  )

  const departments = [...new Set(state.pagos.map(p => p.apartment))].sort()

  const handleMarkPaid = (id: string) => {
    const pago = state.pagos.find(p => p.id === id)
    if (!pago) return
    dispatch({
      type: 'UPDATE_PAGO',
      payload: { ...pago, status: 'Pagado', paymentDate: new Date().toISOString().split('T')[0] },
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
          Estado de Cuenta y Pagos
        </h1>
        {isAdmin && (
          <button className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-lg">upload</span>
            <span>Subir estado de cuenta</span>
          </button>
        )}
      </div>

      {/* Search & filters (admin) */}
      {isAdmin && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mes, estado o residente..."
              className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
          >
            <option value="">Todos los deptos.</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-8 pb-4">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-slate-900">Historial de pagos</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin ? 'Todos los deptos.' : `Departamento ${apartment}`}
            </p>
          </div>
          {pendingTotal > 0 && (
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <span className="material-symbols-outlined text-base">attach_money</span>
              <span>Saldo pendiente: ${pendingTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100">
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depto.</th>}
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residente</th>}
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mes</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de pago</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos.map((pago) => (
                <tr key={pago.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  {isAdmin && <td className="px-8 py-5 text-sm font-bold text-slate-900">{pago.apartment}</td>}
                  {isAdmin && <td className="px-8 py-5 text-sm font-medium text-slate-700">{pago.resident}</td>}
                  <td className="px-8 py-5 text-sm font-medium text-slate-700">{pago.month}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900">${pago.amount.toLocaleString()}</td>
                  <td className="px-8 py-5"><StatusBadge status={pago.status} /></td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pago.paymentDate || '–'}</td>
                  <td className="px-8 py-5">
                    {pago.status === 'Pendiente' ? (
                      <button
                        onClick={() => handleMarkPaid(pago.id)}
                        className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest transition-colors"
                      >
                        {isAdmin ? 'Actualizar' : 'Subir comprobante'}
                      </button>
                    ) : isAdmin ? (
                      <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Actualizar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
