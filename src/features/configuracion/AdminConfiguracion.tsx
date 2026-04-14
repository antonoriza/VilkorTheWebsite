/**
 * AdminConfiguracion — Admin settings page.
 *
 * Manages building profile, topology (towers vs. houses),
 * amenities CRUD, and system reset.
 *
 * BUG FIX: All 3 window.confirm() calls replaced with ConfirmDialog:
 *   - Delete amenity
 *   - Delete tower
 *   - Reset system
 */
import { useState } from 'react'
import { useStore } from '../../core/store/store'
import ConfirmDialog from '../../core/components/ConfirmDialog'

/** Tracks which confirmation dialog is currently visible */
type ConfirmTarget =
  | { action: 'deleteAmenity'; id: string; name: string }
  | { action: 'deleteTower'; tower: string; residentCount: number }
  | { action: 'reset' }
  | null

export default function AdminConfiguracion() {
  const { state, dispatch } = useStore()
  const bc = state.buildingConfig
  const [saved, setSaved] = useState(false)
  const [newAmenity, setNewAmenity] = useState('')
  const [newTower, setNewTower] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)

  /** Dispatches a partial building config update */
  const update = (key: string, value: string | number) => {
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { [key]: value } })
    setSaved(false)
  }

  /** Triggers the "saved" feedback animation */
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  /** Opens the reset confirmation dialog */
  const handleReset = () => {
    setConfirmTarget({ action: 'reset' })
  }

  /** Adds a new amenity to the store */
  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return
    dispatch({ type: 'ADD_AMENITY', payload: { id: `amen-${Date.now()}`, name: newAmenity.trim() } })
    setNewAmenity('')
  }

  /** Opens the delete-amenity confirmation dialog */
  const handleDeleteAmenity = (id: string, name: string) => {
    setConfirmTarget({ action: 'deleteAmenity', id, name })
  }

  /** Adds a new tower/section */
  const handleAddTower = () => {
    if (!newTower.trim()) return
    const t = newTower.trim().toUpperCase()
    if (bc.towers.includes(t)) return
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { towers: [...bc.towers, t] } })
    setNewTower('')
  }

  /** Opens the delete-tower confirmation dialog */
  const handleDeleteTower = (tower: string) => {
    const residentCount = state.residents.filter(r => r.tower === tower).length
    setConfirmTarget({ action: 'deleteTower', tower, residentCount })
  }

  /** Executes the confirmed action */
  const executeConfirm = () => {
    if (!confirmTarget) return
    switch (confirmTarget.action) {
      case 'deleteAmenity':
        dispatch({ type: 'DELETE_AMENITY', payload: confirmTarget.id })
        break
      case 'deleteTower':
        dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { towers: bc.towers.filter(t => t !== confirmTarget.tower) } })
        break
      case 'reset':
        dispatch({ type: 'RESET' })
        window.location.reload()
        break
    }
  }

  /** Generates confirm dialog title/message based on target */
  const getConfirmProps = () => {
    if (!confirmTarget) return { title: '', children: '' }
    switch (confirmTarget.action) {
      case 'deleteAmenity':
        return {
          title: 'Eliminar Amenidad',
          children: `¿Eliminar la amenidad "${confirmTarget.name}"? Si no quedan amenidades, el módulo se ocultará para todos los usuarios.`,
        }
      case 'deleteTower':
        return {
          title: `Eliminar ${bc.type === 'towers' ? 'Torre' : 'Sección'}`,
          children: confirmTarget.residentCount > 0
            ? `¿Eliminar ${bc.type === 'towers' ? 'torre' : 'sección'} "${confirmTarget.tower}"? Hay ${confirmTarget.residentCount} residente(s) asignados. Deberás reasignarlos manualmente.`
            : `¿Eliminar ${bc.type === 'towers' ? 'torre' : 'sección'} "${confirmTarget.tower}"?`,
        }
      case 'reset':
        return {
          title: 'Restablecer Sistema',
          children: '¿Seguro? Esto eliminará todos los datos y restaurará la aplicación a su estado inicial. Esta acción no se puede deshacer.',
        }
    }
  }

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2"

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">Configuración</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Administra el perfil, datos del edificio, amenidades y preferencias del sistema.
          </p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center space-x-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase ${
            saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{saved ? 'check_circle' : 'save'}</span>
          <span>{saved ? 'Guardado' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Admin Profile */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">person</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Perfil del Administrador</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={bc.adminName} onChange={(e) => update('adminName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" value={bc.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Email</label>
            <input type="email" value={bc.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Building Info */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">apartment</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Información del Edificio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre del Edificio</label>
            <input type="text" value={bc.buildingName} onChange={(e) => update('buildingName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Empresa Administradora</label>
            <input type="text" value={bc.managementCompany} onChange={(e) => update('managementCompany', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input type="text" value={bc.buildingAddress} onChange={(e) => update('buildingAddress', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total de Unidades</label>
            <input type="number" value={bc.totalUnits} onChange={(e) => update('totalUnits', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Building Topology */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">domain</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Topología del Edificio</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de Propiedad</label>
            <div className="flex gap-3">
              <button onClick={() => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { type: 'towers' } })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  bc.type === 'towers' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">apartment</span> Torres
              </button>
              <button onClick={() => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { type: 'houses' } })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  bc.type === 'houses' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">home</span> Casas
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>{bc.type === 'towers' ? 'Torres' : 'Secciones'}</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {bc.towers.map(t => (
                <div key={t} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-bold text-slate-700">{bc.type === 'towers' ? `Torre ${t}` : `Sección ${t}`}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({state.residents.filter(r => r.tower === t).length} res.)</span>
                  <button onClick={() => handleDeleteTower(t)} className="text-slate-400 hover:text-rose-600 transition-colors ml-1">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTower} onChange={(e) => setNewTower(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTower()}
                placeholder={bc.type === 'towers' ? 'Ej: C' : 'Ej: Norte'}
                className={inputClass + ' flex-1'}
              />
              <button onClick={handleAddTower} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold">
                Agregar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">outdoor_grill</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Amenidades</h3>
        </div>
        {state.amenities.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
            <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">warning</span>
            <p className="text-[11px] text-amber-700 font-medium">
              No hay amenidades configuradas. El módulo de amenidades está oculto para todos los usuarios.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {state.amenities.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <span className="text-sm font-bold text-slate-900">{a.name}</span>
              <button onClick={() => handleDeleteAmenity(a.id, a.name)} className="text-slate-400 hover:text-rose-600 transition-colors">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()}
            placeholder="Ej: Asador 4, Salón de Eventos, Alberca..."
            className={inputClass + ' flex-1'}
          />
          <button onClick={handleAddAmenity}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold whitespace-nowrap"
          >
            Agregar
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white border border-rose-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-rose-100 pb-4">
          <span className="material-symbols-outlined text-rose-600 text-xl">warning</span>
          <h3 className="text-[11px] font-bold text-rose-600 uppercase tracking-widest font-headline">Zona de Peligro</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Restablecer Sistema</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Elimina todos los datos de la aplicación y restaura los valores de demostración originales.
            </p>
          </div>
          <button onClick={handleReset}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-[11px] tracking-widest uppercase shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Restablecer</span>
          </button>
        </div>
      </section>

      {/* ── In-App Confirm Dialog (replaces all window.confirm calls) ── */}
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeConfirm}
        title={getConfirmProps().title}
        confirmLabel={confirmTarget?.action === 'reset' ? 'Restablecer' : 'Eliminar'}
        variant="danger"
      >
        {getConfirmProps().children}
      </ConfirmDialog>
    </div>
  )
}
