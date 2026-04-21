import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../core/store/store'
import ConfirmDialog from '../../core/components/ConfirmDialog'

// Sections
import ArchitectureSettings from './sections/ArchitectureSettings'
import FinanceSettings from './sections/FinanceSettings'
import ComunicacionSettings from './sections/ComunicacionSettings'
import LogisticaSettings from './sections/LogisticaSettings'
import PermisosSettings from './sections/PermisosSettings'
import SystemSettings from './sections/SystemSettings'

/** Tracks which confirmation dialog is currently visible */
type ConfirmTarget =
  | { action: 'deleteAmenity'; id: string; name: string }
  | { action: 'deleteTower'; tower: string; residentCount: number }
  | { action: 'changeGroupingMode'; mode: 'vertical' | 'horizontal' }
  | { action: 'reset' }
  | null

export default function AdminConfiguracion() {
  const { state, dispatch } = useStore()
  const bc = state.buildingConfig
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'perfil'
  const [saved, setSaved] = useState(false)

  // Local states for forms
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)

  /** Dispatches a partial building config update */
  const update = (key: string, value: any) => {
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { [key]: value } })
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddAmenity = (name: string, icon: string) => {
    if (!name.trim()) return
    dispatch({ type: 'ADD_AMENITY', payload: { id: `amen-${Date.now()}`, name: name.trim(), icon } })
  }


  const executeConfirm = () => {
    if (!confirmTarget) return
    switch (confirmTarget.action) {
      case 'deleteAmenity':
        dispatch({ type: 'DELETE_AMENITY', payload: confirmTarget.id })
        break
      case 'deleteTower':
        dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { towers: bc.towers.filter(t => t !== confirmTarget.tower) } })
        break
      case 'changeGroupingMode':
        dispatch({ type: 'RESET', payload: { groupingMode: confirmTarget.mode } })
        window.location.reload()
        break
      case 'reset':
        dispatch({ type: 'RESET' })
        window.location.reload()
        break
    }
    setConfirmTarget(null)
  }

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all shadow-inner"
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2"

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight capitalize">
            {activeTab === 'perfil'      ? 'Perfil del Inmueble' :
             activeTab === 'finanzas'    ? 'Contabilidad y Finanzas' :
             activeTab === 'comunicacion'? 'Avisos/Notificaciones' :
             activeTab === 'servicios'   ? 'Logística e Inventario' :
             activeTab === 'permisos'    ? 'Directorio y Permisos' :
             activeTab === 'auditoria'   ? 'Auditoría y Trazabilidad' : 'Resiliencia del Sistema'}
          </h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {activeTab === 'perfil' && (
          <ArchitectureSettings
            bc={bc}
            amenities={state.amenities}
            update={update}
            onRequestGroupingModeChange={(mode) => setConfirmTarget({ action: 'changeGroupingMode', mode })}
            handleAddAmenity={handleAddAmenity}
            handleDeleteAmenity={(id, name) => setConfirmTarget({ action: 'deleteAmenity', id, name })}
            handleSave={handleSave}
            saved={saved}
            labelClass={labelClass}
            inputClass={inputClass}
          />
        )}

        {activeTab === 'finanzas' && (
          <FinanceSettings
            bc={bc}
            dispatch={dispatch}
            handleSave={handleSave}
            saved={saved}
            labelClass={labelClass}
            inputClass={inputClass}
          />
        )}

        {activeTab === 'comunicacion' && (
          <ComunicacionSettings
            handleSave={handleSave}
            saved={saved}
          />
        )}

        {activeTab === 'servicios' && (
          <LogisticaSettings
            bc={bc}
            inventory={state.inventory}
            residents={state.residents}
            staff={state.staff}
            dispatch={dispatch}
            handleSave={handleSave}
            saved={saved}
            labelClass={labelClass}
            inputClass={inputClass}
          />
        )}

        {activeTab === 'permisos' && (
          <PermisosSettings
            bc={bc}
            residents={state.residents || []}
            staff={state.staff || []}
            labelClass={labelClass}
            inputClass={inputClass}
          />
        )}

        {activeTab === 'auditoria' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
               <span className="material-symbols-outlined text-4xl">construction</span>
             </div>
             <h3 className="text-xl font-headline font-black text-slate-900 uppercase tracking-widest">Módulo en Desarrollo</h3>
             <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
               Estamos trabajando en la infraestructura de este componente para el siguiente release de Canton Alfa.
             </p>
          </div>
        )}

        {activeTab === 'resiliencia' && (
          <SystemSettings handleReset={() => setConfirmTarget({ action: 'reset' })} />
        )}
      </div>

      <ConfirmDialog
        open={confirmTarget?.action === 'changeGroupingMode'}
        onConfirm={executeConfirm}
        onClose={() => setConfirmTarget(null)}
        title="Cambio de Arquitectura Base"
        variant="danger"
        confirmLabel="Entiendo, reiniciar sistema"
      >
        <p className="mb-2">¡Atención! Cambiar la estructura de <strong>{bc.groupingMode === 'vertical' ? 'Torres a Casas' : 'Casas a Torres'}</strong> es una acción destructiva.</p>
        <p>Para garantizar la integridad del Gemelo Digital, toda la configuración actual (Amenidades, Finanzas e Identidad) será <strong>eliminada y reiniciada</strong> por completo.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmTarget?.action === 'reset' || confirmTarget?.action === 'deleteAmenity' || confirmTarget?.action === 'deleteTower'}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeConfirm}
        title={
          confirmTarget?.action === 'deleteAmenity' ? 'Eliminar Amenidad' :
          confirmTarget?.action === 'deleteTower' ? 'Eliminar Sección' : 'Restablecer Sistema'
        }
        confirmLabel={confirmTarget?.action === 'reset' ? 'Restablecer' : 'Eliminar'}
        variant="danger"
      >
        {confirmTarget?.action === 'deleteAmenity' && `¿Eliminar la amenidad "${confirmTarget.name}"?`}
        {confirmTarget?.action === 'deleteTower' && `¿Eliminar "${confirmTarget.tower}"? Hay ${confirmTarget.residentCount} residente(s).`}
        {confirmTarget?.action === 'reset' && '¿Seguro? Esto eliminará todos los datos. Esta acción no se puede deshacer.'}
      </ConfirmDialog>
    </div>
  )
}
