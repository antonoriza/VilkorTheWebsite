/**
 * PagosPage — Payment management page.
 *
 * Admin view: Full payment ledger with filtering by month, tower,
 * apartment, and status. Payment reversal requires confirmation.
 * Resident view: Personal payment history with balance summary.
 *
 * BUG FIX: Replaced window.confirm() for payment revocation
 * (Pagado → Pendiente) with an in-app ConfirmDialog component.
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import { seedResidents } from '../../core/store/seed'

export default function PagosPage() {
  const { role, apartment } = useAuth()
  const { state, dispatch } = useStore()
  
  // Filter state
  const [filterMonth, setFilterMonth] = useState('')
  const [filterTower, setFilterTower] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Add-payment modal state
  const [showModal, setShowModal] = useState(false)
  const [formResident, setFormResident] = useState('')
  const [formMonth, setFormMonth] = useState('')
  const [formAmount, setFormAmount] = useState('1700')
  const [formStatus, setFormStatus] = useState<'Pagado' | 'Pendiente'>('Pendiente')

  // Confirm dialog state for payment revocation
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; resident: string; month: string } | null>(null)

  const isAdmin = role === 'admin'

  // Extract unique filter options from existing data
  const availableMonths = [...new Set(state.pagos.map(p => p.month))]
  const availableDepts = [...new Set(state.pagos.map(p => p.apartment))].sort()
  const availableTowers = [...new Set(availableDepts.map(d => d[0]))].sort()

  // Apply all active filters to the payment list
  const filteredPagos = useMemo(() => {
    let data = isAdmin ? state.pagos : state.pagos.filter(p => p.apartment === apartment)
    if (filterMonth) data = data.filter(p => p.month.toLowerCase().includes(filterMonth.toLowerCase()))
    if (filterTower) data = data.filter(p => p.apartment.startsWith(filterTower.toUpperCase()))
    if (filterDept) data = data.filter(p => p.apartment.toLowerCase().includes(filterDept.toLowerCase()))
    if (filterStatus) data = data.filter(p => p.status === filterStatus)
    return data
  }, [state.pagos, isAdmin, apartment, filterMonth, filterTower, filterDept, filterStatus])

  // Calculate pending balance for the current filter
  const pendingTotal = useMemo(
    () => filteredPagos.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + p.amount, 0),
    [filteredPagos]
  )

  /**
   * Handles payment status toggle.
   * Pendiente → Pagado: immediate toggle.
   * Pagado → Pendiente: opens confirm dialog first (prevents accidental revocation).
   */
  const handleToggleStatus = (id: string) => {
    const pago = state.pagos.find(p => p.id === id)
    if (!pago) return

    if (pago.status === 'Pagado') {
      // Open confirm dialog for revocation
      setRevokeTarget({ id: pago.id, resident: pago.resident, month: pago.month })
      return
    }

    // Direct approval for Pendiente → Pagado
    dispatch({
      type: 'UPDATE_PAGO',
      payload: {
        ...pago,
        status: 'Pagado',
        paymentDate: new Date().toISOString().split('T')[0],
      },
    })
  }

  /** Executes the payment revocation after user confirms */
  const confirmRevoke = () => {
    if (!revokeTarget) return
    const pago = state.pagos.find(p => p.id === revokeTarget.id)
    if (!pago) return
    dispatch({
      type: 'UPDATE_PAGO',
      payload: { ...pago, status: 'Pendiente', paymentDate: null },
    })
  }

  /** Adds a new payment record from the modal form */
  const handleAddPago = () => {
    if (!formResident || !formMonth.trim()) return
    const resident = seedResidents.find(r => r.name === formResident)
    dispatch({
      type: 'ADD_PAGO',
      payload: {
        id: `pg-${Date.now()}`,
        apartment: resident?.apartment || 'A101',
        resident: formResident,
        month: formMonth,
        amount: Number(formAmount) || 1700,
        status: formStatus,
        paymentDate: formStatus === 'Pagado' ? new Date().toISOString().split('T')[0] : null,
      },
    })
    setFormResident('')
    setFormMonth('')
    setFormAmount('1700')
    setFormStatus('Pendiente')
    setShowModal(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
          Estado de Cuenta y Pagos
        </h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-lg">upload</span>
            <span>Subir estado de cuenta</span>
          </button>
        )}
      </div>

      {/* Filters (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input type="text" list="month-options" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              placeholder="Mes (ej. abril de 2026)"
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
            />
            <datalist id="month-options">
              {availableMonths.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="relative">
            <input type="text" list="tower-options" value={filterTower} onChange={(e) => setFilterTower(e.target.value)}
              placeholder="Torre (ej. A)"
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
            />
            <datalist id="tower-options">
              {availableTowers.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="relative">
            <input type="text" list="dept-options" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
              placeholder="Departamento (ej. A101)"
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
            />
            <datalist id="dept-options">
              {availableDepts.map(d => <option key={d} value={d} />)}
            </datalist>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="Pagado">Pagado</option>
            <option value="Pendiente">Pendiente</option>
          </select>
        </div>
      )}

      {/* Payment table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-8 pb-4">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-slate-900">Historial de pagos</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isAdmin && !filterTower && !filterDept ? 'Todos los deptos.' : 
               isAdmin ? `Filtro Activo` : `Departamento ${apartment}`}
            </p>
          </div>
          {pendingTotal > 0 && (
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 mt-4 md:mt-0">
              <span className="material-symbols-outlined text-base text-rose-600">error</span>
              <span>Saldo pendiente: ${pendingTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100">
                {isAdmin && <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depto.</th>}
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mes</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha de pago</th>
                <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredPagos.map((pago) => (
                <tr key={pago.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  {isAdmin && (
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-900">{pago.apartment}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{pago.resident}</p>
                    </td>
                  )}
                  <td className="px-8 py-5 text-sm font-medium text-slate-700 capitalize">{pago.month}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900 border-l border-slate-50">${pago.amount.toLocaleString()}</td>
                  <td className="px-8 py-5"><StatusBadge status={pago.status} /></td>
                  <td className="px-8 py-5 text-xs text-slate-500 font-bold uppercase tracking-widest">{pago.paymentDate || '—'}</td>
                  <td className="px-8 py-5 flex items-center justify-center">
                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleStatus(pago.id)}
                        className={`text-[10px] font-bold uppercase tracking-widest transition-colors px-4 py-2 rounded-lg border ${
                          pago.status === 'Pendiente' ? 'bg-primary-container/20 text-primary border-primary-dim hover:bg-primary-container/50' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                        }`}
                      >
                        {pago.status === 'Pendiente' ? 'Aprobar' : 'Revocar'}
                      </button>
                    ) : (
                      <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">Detalle</button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPagos.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No hay registros de pago que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Pago">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Residente</label>
            <select value={formResident} onChange={(e) => setFormResident(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
            >
              <option value="">Seleccionar residente...</option>
              {seedResidents.map(r => <option key={r.name} value={r.name}>{r.name} — {r.apartment}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mes</label>
            <input type="text" value={formMonth} onChange={(e) => setFormMonth(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
              placeholder="mayo de 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto</label>
              <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as 'Pagado' | 'Pendiente')}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>
          <button onClick={handleAddPago}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Registrar Pago
          </button>
        </div>
      </Modal>

      {/* ── Confirm Dialog for Payment Revocation ── */}
      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={confirmRevoke}
        title="Revocar Pago"
        confirmLabel="Revocar Pago"
        variant="danger"
      >
        {revokeTarget
          ? `Estás a punto de marcar el pago de ${revokeTarget.resident} del mes de ${revokeTarget.month} como PENDIENTE. ¿Estás seguro de revocar este pago?`
          : ''}
      </ConfirmDialog>
    </div>
  )
}
