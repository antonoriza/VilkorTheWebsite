/**
 * UsuariosPage — Admin-only resident management page.
 *
 * Displays a searchable table of all registered residents
 * with the ability to add or remove residents.
 *
 * BUG FIX: Replaced window.confirm() for resident deletion with
 * an in-app ConfirmDialog component.
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'

export default function UsuariosPage() {
  const { role } = useAuth()
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formApartment, setFormApartment] = useState('')
  const [formTower, setFormTower] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [search, setSearch] = useState('')

  // Confirm dialog state — stores the resident ID & name pending deletion
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const bc = state.buildingConfig
  const residents = state.residents || []

  // Full-text search + PRIVACY FILTER
  const filtered = useMemo(() => {
    let list = residents.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.apartment.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.tower?.toLowerCase().includes(search.toLowerCase())
    )

    // Security Filter: Operators cannot see resident list in detail
    if (role === 'operador') return []

    return list
  }, [residents, search, role])

  /** Unique apartment list for the datalist autocomplete */
  const apartments = [...new Set(residents.map(r => r.apartment))].sort()

  /** Adds a new resident from the modal form */
  const handleAdd = () => {
    if (!formName.trim() || !formApartment.trim() || !formEmail.trim()) return
    const tower = formTower || (bc.towers.length > 0 ? bc.towers[0] : 'A')
    dispatch({
      type: 'ADD_RESIDENT',
      payload: {
        id: `res-${Date.now()}`,
        name: formName,
        apartment: formApartment.toUpperCase(),
        tower: tower.toUpperCase(),
        email: formEmail.toLowerCase(),
      }
    })
    setFormName('')
    setFormApartment('')
    setFormTower('')
    setFormEmail('')
    setShowModal(false)
  }

  /** Opens the confirm dialog instead of window.confirm */
  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  /** Executes the deletion after user confirms */
  const confirmDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_RESIDENT', payload: deleteTarget.id })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Gestión de Residentes
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {residents.length} residentes en {apartments.length} departamentos
            {bc.towers.length > 0 && ` — ${bc.towers.length} ${bc.type === 'towers' ? 'torres' : 'secciones'} (${bc.towers.join(', ')})`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Nuevo Residente</span>
        </button>
      </div>

      {/* Info banner — voting rules */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start space-x-3">
        <span className="material-symbols-outlined text-indigo-600 text-lg mt-0.5">info</span>
        <div className="text-[11px] text-indigo-700 font-medium space-y-1">
          <p>Múltiples personas pueden estar asignadas al mismo departamento.</p>
          <p>En votaciones, solo se permite <strong>1 voto por departamento</strong> (no por persona).</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
          <span className="material-symbols-outlined text-xl">search</span>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
          placeholder="Buscar por nombre, departamento, torre o email..."
        />
      </div>

      {/* Residents table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Residente</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {bc.type === 'towers' ? 'Torre' : 'Sección'}
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              // Count co-residents for the shared-apartment badge
              const sameAptCount = residents.filter(res => res.apartment === r.apartment).length
              return (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-bold text-slate-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">
                      {r.tower || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-slate-700">{r.apartment}</span>
                      {sameAptCount > 1 && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                          {sameAptCount} personas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">{r.email}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(r.id, r.name)}
                      className="w-9 h-9 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium text-sm">
                  No se encontraron residentes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Nuevo Residente">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
            <input
              type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              placeholder="Juan Antonio Pérez"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {bc.type === 'towers' ? 'Torre' : 'Sección'} *
              </label>
              <select
                value={formTower} onChange={(e) => setFormTower(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              >
                <option value="">Seleccionar</option>
                {bc.towers.map(t => <option key={t} value={t}>{bc.type === 'towers' ? `Torre ${t}` : `Sección ${t}`}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento *</label>
              <input
                type="text" value={formApartment} onChange={(e) => setFormApartment(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                placeholder="A101" list="apartment-list"
              />
              <datalist id="apartment-list">
                {apartments.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email *</label>
            <input
              type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              placeholder="correo@property.com"
            />
          </div>
          <button onClick={handleAdd}
            className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Registrar Residente
          </button>
        </div>
      </Modal>

      {/* ── In-App Confirm Dialog (replaces window.confirm) ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar Residente"
        confirmLabel="Eliminar"
        variant="danger"
      >
        {deleteTarget
          ? `¿Seguro que desea eliminar a ${deleteTarget.name}? El departamento y registros históricos se conservan.`
          : ''}
      </ConfirmDialog>
    </div>
  )
}
