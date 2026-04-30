import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../core/store/store'
import { useAuth } from '../../core/auth/AuthContext'
import { systemApi } from '../../lib/api'
import { useDemoMode } from '../../core/hooks/useDemoMode'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import DemoResetModal from '../../core/components/DemoResetModal'
import { ComingSoon } from '../../core/components/SettingsShell'

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
  const { logout } = useAuth()
  const navigate = useNavigate()
  const isDemo = useDemoMode()
  const bc = state.buildingConfig
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'perfil'
  const [saved, setSaved] = useState(false)
  const [_isResetting, setIsResetting] = useState(false)
  const [showDemoReset, setShowDemoReset] = useState(false)

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
    dispatch({
      type: 'ADD_AMENITY',
      payload: {
        id: `amen-${Date.now()}`, name: name.trim(), icon,
        openTime: '10:00', closeTime: '22:00',
        slotDurationMinutes: 240, cleaningBufferMinutes: 0,
        maxAdvanceDays: 30, depositAmount: 500,
        reglamentoType: 'none', reglamentoText: '', reglamentoPdfUrl: '',
      }
    })
  }

  const handleUpdateAmenity = (amenity: any) => {
    dispatch({ type: 'UPDATE_AMENITY', payload: amenity })
    setSaved(false)
  }

  const departments = (state.residents || []).map((r: any) => r.apartment).filter(Boolean).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).sort()


  const executeConfirm = async () => {
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
        // In demo mode the DemoResetModal handles the reset — this branch
        // is only reached in production where isDemoMode is false.
        setIsResetting(true)
        try {
          await systemApi.factoryReset()
          await logout()
          navigate('/login', { replace: true })
        } catch (err: any) {
          console.error('[Reset] Factory reset failed:', err)
          setIsResetting(false)
          alert('Error al restablecer el sistema: ' + (err.message || 'Error desconocido'))
        }
        break
    }
    setConfirmTarget(null)
  }

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all shadow-inner"

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header — Enterprise-grade, matching main dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'perfil'      ? 'Perfil del Inmueble' :
             activeTab === 'finanzas'    ? 'Contabilidad y Finanzas' :
             activeTab === 'comunicacion'? 'Avisos/Notificaciones' :
             activeTab === 'servicios'   ? 'Logística e Inventario' :
              activeTab === 'permisos'    ? 'Directorio y Permisos' : 'Opciones Avanzadas'}
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            {activeTab === 'perfil'      ? 'Identidad legal, topología y Digital Twin' :
             activeTab === 'finanzas'    ? 'Catálogo financiero y cuentas bancarias' :
             activeTab === 'comunicacion'? 'Canales, plantillas y automatizaciones' :
             activeTab === 'servicios'   ? 'Paquetería, proveedores e inventario' :
             activeTab === 'permisos'    ? 'Control de acceso y matriz de roles' : 'Backups, logs y resiliencia'}
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {activeTab === 'perfil' && (
          <ArchitectureSettings
            bc={bc}
            amenities={state.amenities}
            departments={departments}
            update={update}
            onRequestGroupingModeChange={(mode) => setConfirmTarget({ action: 'changeGroupingMode', mode })}
            handleAddAmenity={handleAddAmenity}
            handleDeleteAmenity={(id, name) => setConfirmTarget({ action: 'deleteAmenity', id, name })}
            handleUpdateAmenity={handleUpdateAmenity}
            handleSave={handleSave}
            saved={saved}
          />
        )}

        {activeTab === 'finanzas' && (
          <FinanceSettings
            bc={bc}
            dispatch={dispatch}
            handleSave={handleSave}
            saved={saved}
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
          />
        )}

        {activeTab === 'permisos' && (
          <PermisosSettings
            bc={bc}
            residents={state.residents || []}
            staff={state.staff || []}
            inputClass={inputClass}
          />
        )}

        {activeTab === 'resiliencia' && (
          <SystemSettings
            handleReset={() => isDemo ? setShowDemoReset(true) : setConfirmTarget({ action: 'reset' })}
            isDemoMode={isDemo}
          />
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
        open={confirmTarget?.action === 'deleteAmenity' || confirmTarget?.action === 'deleteTower' || (!isDemo && confirmTarget?.action === 'reset')}
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

      {/* Demo-mode context-aware reset modal — shown instead of ConfirmDialog in demo */}
      <DemoResetModal
        open={showDemoReset}
        onClose={() => setShowDemoReset(false)}
        onDemoRestore={async () => {
          try {
            await systemApi.demoRestore()
            await logout()
            navigate('/login', { replace: true })
          } catch (err: any) {
            setShowDemoReset(false)
            alert('Error al restaurar demo: ' + (err.message || 'Error desconocido'))
          }
        }}
        onFactoryReset={async () => {
          try {
            await systemApi.factoryReset()
            await logout()
            navigate('/login', { replace: true })
          } catch (err: any) {
            setShowDemoReset(false)
            alert('Error al restablecer sistema: ' + (err.message || 'Error desconocido'))
          }
        }}
      />
    </div>
  )
}
