import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../../core/store/store'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import { EgresoCategoria } from '../../core/store/seed'

// Sections
import ArchitectureSettings from './sections/ArchitectureSettings'
import FinanceSettings from './sections/FinanceSettings'
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
  const activeTab = searchParams.get('tab') || 'perfil'
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

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all shadow-inner"
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2"

  /** Dynamic Title Helper */
  const getTabBadge = () => {
    if (['perfil', 'inventario'].includes(activeTab)) return 'Entidad e Infraestructura'
    if (['finanzas', 'espacios', 'comunicacion', 'servicios'].includes(activeTab)) return 'Gobernanza Operativa'
    if (['permisos', 'integraciones'].includes(activeTab)) return 'Seguridad y Acceso'
    return 'Gestión de Datos'
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with Pillar Badge */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight capitalize">
            {activeTab === 'perfil' ? 'Perfil del Inmueble' : 
             activeTab === 'finanzas' ? 'Estrategia Financiera' :
             activeTab === 'espacios' ? 'Amenidades' :
             activeTab === 'comunicacion' ? 'Protocolos de Comunicación' : 
             activeTab === 'servicios' ? 'Flujos de Servicio' :
             activeTab === 'permisos' ? 'Directorio y Permisos' :
             activeTab === 'integraciones' ? 'Ecosistema de Integraciones' :
             activeTab === 'auditoria' ? 'Auditoría y Trazabilidad' : 'Resiliencia del Sistema'}
          </h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {activeTab === 'perfil' && (
          <ArchitectureSettings 
            bc={bc} 
            residents={state.residents} 
            amenities={state.amenities}
            newAmenity={newAmenity}
            setNewAmenity={setNewAmenity}
            handleAddAmenity={handleAddAmenity}
            handleDeleteAmenity={(id, name) => setConfirmTarget({ action: 'deleteAmenity', id, name })}
            update={update}
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
        {(activeTab === 'comunicacion' || activeTab === 'servicios') && (
          <ModuleSettings />
        )}
        {(activeTab === 'permisos' || activeTab === 'integraciones' || activeTab === 'auditoria') && (
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
