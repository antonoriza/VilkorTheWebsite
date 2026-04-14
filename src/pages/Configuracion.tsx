import { useState, useEffect } from 'react'
import { useStore } from '../data/store'

const SETTINGS_KEY = 'cantonalfa_settings'

interface AdminSettings {
  adminName: string
  adminEmail: string
  adminPhone: string
  buildingName: string
  buildingAddress: string
  totalUnits: number
  managementCompany: string
  notifReservations: boolean
  notifPayments: boolean
  notifPackages: boolean
}

const defaultSettings: AdminSettings = {
  adminName: 'Administrador General',
  adminEmail: 'admin@property.com',
  adminPhone: '+52 55 1234 5678',
  buildingName: 'Lote Alemania',
  buildingAddress: 'Cosmopol HU Lifestyle, CDMX',
  totalUnits: 126,
  managementCompany: 'Canton Alfa Inc.',
  notifReservations: true,
  notifPayments: true,
  notifPackages: true,
}

function loadSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* defaults */ }
  return defaultSettings
}

export default function Configuracion() {
  const { dispatch } = useStore()
  const [settings, setSettings] = useState<AdminSettings>(loadSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  const update = (key: keyof AdminSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('¿Seguro? Esto eliminará todos los datos y restaurará la aplicación a su estado inicial. Esta acción no se puede deshacer.')) {
      dispatch({ type: 'RESET' })
      localStorage.removeItem(SETTINGS_KEY)
      setSettings(defaultSettings)
      window.location.reload()
    }
  }

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2"

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Configuración
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Administra el perfil, datos del edificio y preferencias del sistema.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center space-x-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-white hover:bg-slate-800'
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
            <input type="text" value={settings.adminName} onChange={(e) => update('adminName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" value={settings.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Email</label>
            <input type="email" value={settings.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className={inputClass} />
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
            <input type="text" value={settings.buildingName} onChange={(e) => update('buildingName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Empresa Administradora</label>
            <input type="text" value={settings.managementCompany} onChange={(e) => update('managementCompany', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input type="text" value={settings.buildingAddress} onChange={(e) => update('buildingAddress', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total de Unidades</label>
            <input type="number" value={settings.totalUnits} onChange={(e) => update('totalUnits', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">notifications</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Preferencias de Notificaciones</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: 'notifReservations' as const, label: 'Reservaciones de Amenidades', desc: 'Recibir alerta cuando un residente haga una reservación' },
            { key: 'notifPayments' as const, label: 'Pagos y Estados de Cuenta', desc: 'Notificar cambios de estado en pagos' },
            { key: 'notifPackages' as const, label: 'Paquetería', desc: 'Alerta al registrar o entregar un paquete' },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900">{pref.label}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{pref.desc}</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[pref.key]}
                  onChange={(e) => update(pref.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
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
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-[11px] tracking-widest uppercase shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Restablecer</span>
          </button>
        </div>
      </section>
    </div>
  )
}
