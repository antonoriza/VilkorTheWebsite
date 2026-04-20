import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../core/store/store'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import { EgresoCategoria } from '../../core/store/seed'

// Sections
import GeneralSettings from './sections/GeneralSettings'
import ArchitectureSettings from './sections/ArchitectureSettings'
import FinanceSettings from './sections/FinanceSettings'
import AmenitySettings from './sections/AmenitySettings'
import ModuleSettings from './sections/ModuleSettings'
import SystemSettings from './sections/SystemSettings'

/** Tracks which confirmation dialog is currently visible */
type ConfirmTarget =
  | { action: 'deleteAmenity'; id: string; name: string }
  | { action: 'deleteTower'; tower: string; residentCount: number }
  | { action: 'reset' }
  | null

export default function AdminConfiguracion() {
  const { state, dispatch } = useStore()
  const bc = state.buildingConfig
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'general'
  const [saved, setSaved] = useState(false)
  
  // Local states for forms
  const [newAmenity, setNewAmenity] = useState('')
  const [newTower, setNewTower] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)
  const [newConcepto, setNewConcepto] = useState('')
  const [expandedConcepto, setExpandedConcepto] = useState<string | null>(null)
  const [newSubConcepto, setNewSubConcepto] = useState('')

  // Recurring egresos form state
  const [reForm, setReForm] = useState({
    concepto: '',
    categoria: 'nomina' as EgresoCategoria,
    amount: '',
    description: ''
  })

  /** Dispatches a partial building config update */
  const update = (key: string, value: string | number) => {
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { [key]: value } })
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return
    dispatch({ type: 'ADD_AMENITY', payload: { id: `amen-${Date.now()}`, name: newAmenity.trim() } })
    setNewAmenity('')
  }

  const handleAddTower = () => {
    if (!newTower.trim()) return
    const t = newTower.trim().toUpperCase()
    if (bc.towers.includes(t)) return
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { towers: [...bc.towers, t] } })
    setNewTower('')
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
      case 'reset':
        dispatch({ type: 'RESET' })
        window.location.reload()
        break
    }
    setConfirmTarget(null)
  }

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all"
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2"

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight capitalize">
            {activeTab === 'general' ? 'Ajustes Generales' : 
             activeTab === 'architecture' ? 'Edificio y Estructura' :
             activeTab === 'finance' ? 'Gestión Financiera' :
             activeTab === 'amenities' ? 'Espacios Comunes' :
             activeTab === 'modules' ? 'Extensiones y Módulos' : 'Sistema y Datos'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Configura los parámetros de {activeTab} para tu comunidad.</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center space-x-2 px-6 py-3 font-bold rounded-xl transition-all shadow-lg text-[11px] tracking-widest uppercase ${
            saved ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{saved ? 'check_circle' : 'save_as'}</span>
          <span>{saved ? 'Guardado' : 'Guardar Todo'}</span>
        </button>
      </div>

      {/* Content Area - Full width now that sidebar is in layout */}
      <div className="pb-20">
        {activeTab === 'general' && (
          <GeneralSettings bc={bc} update={update} labelClass={labelClass} inputClass={inputClass} />
        )}
        {activeTab === 'architecture' && (
          <ArchitectureSettings 
            bc={bc} 
            residents={state.residents} 
            newTower={newTower} 
            setNewTower={setNewTower}
            handleAddTower={handleAddTower}
            handleDeleteTower={(t) => setConfirmTarget({ action: 'deleteTower', tower: t, residentCount: state.residents.filter(r => r.tower === t).length })}
            labelClass={labelClass} 
            inputClass={inputClass} 
          />
        )}
        {activeTab === 'finance' && (
          <FinanceSettings 
            bc={bc}
            dispatch={dispatch}
            newConcepto={newConcepto}
            setNewConcepto={setNewConcepto}
            expandedConcepto={expandedConcepto}
            setExpandedConcepto={setExpandedConcepto}
            newSubConcepto={newSubConcepto}
            setNewSubConcepto={setNewSubConcepto}
            reForm={reForm}
            setReForm={setReForm}
            labelClass={labelClass}
            inputClass={inputClass}
          />
        )}
        {activeTab === 'amenities' && (
          <AmenitySettings 
            amenities={state.amenities}
            newAmenity={newAmenity}
            setNewAmenity={setNewAmenity}
            handleAddAmenity={handleAddAmenity}
            handleDeleteAmenity={(id, name) => setConfirmTarget({ action: 'deleteAmenity', id, name })}
            labelClass={labelClass}
            inputClass={inputClass}
          />
        )}
        {activeTab === 'modules' && (
          <ModuleSettings />
        )}
        {activeTab === 'system' && (
          <SystemSettings handleReset={() => setConfirmTarget({ action: 'reset' })} />
        )}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
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
