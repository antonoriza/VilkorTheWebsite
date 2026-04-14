/**
 * ResidentConfiguracion — Personal settings for the resident user.
 * 
 * Allows residents to:
 * - Update their profile name and email (synchronized with Store).
 * - View read-only housing details (tower, unit number, building address).
 * 
 * Includes visual feedback for saved states and follows the 
 * "Architectural Minimalist" design system.
 */
import { useState } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'

export default function ResidentConfiguracion() {
  const { user, apartment, email } = useAuth()
  const { state, dispatch } = useStore()
  const [saved, setSaved] = useState(false)

  /** Identify the resident entity in the store to maintain data integrity */
  const resident = state.residents.find(r => r.email === email) || null

  const [formName, setFormName] = useState(resident?.name || user)
  const [formEmail, setFormEmail] = useState(resident?.email || email)

  /** 
   * Updates the resident information in the global store
   */
  const handleSave = () => {
    if (!resident) return
    dispatch({
      type: 'UPDATE_RESIDENT',
      payload: {
        ...resident,
        name: formName,
        email: formEmail,
      }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Consistent typography and spacing tokens
  const inputClass = "block w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-slate-900 transition-all font-semibold text-sm placeholder-slate-300 shadow-sm"
  const disabledInputClass = "block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-bold text-sm cursor-not-allowed opacity-80"
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3"

  return (
    <div className="space-y-10 max-w-3xl animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">
            Perfiles & Preferencias
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestione su identidad digital dentro de {state.buildingConfig.buildingName}.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex items-center space-x-3 px-8 py-4 font-black rounded-2xl transition-all shadow-xl text-[10px] tracking-[0.2em] uppercase ${
            saved 
              ? 'bg-emerald-500 text-white shadow-emerald-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 active:scale-95'
          }`}
        >
          <span className="material-symbols-outlined text-lg font-bold">{saved ? 'check_circle' : 'fingerprint'}</span>
          <span>{saved ? 'Cambios Aplicados' : 'Guardar Perfil'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Profile Management Section */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 border border-slate-100 z-0" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-slate-50 pb-10">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-2xl border-4 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
              {formName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-headline font-black text-slate-900 tracking-tighter">{formName}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1.5">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  Residente Verificado
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                   {apartment} — {resident?.tower ? `Torre ${resident.tower}` : 'General'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center space-x-4 border-l-4 border-slate-900 pl-4 py-1">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] font-headline">Información de Contacto</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>Nombre Legal / Usuario</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-5 flex items-center text-slate-300">
                    <span className="material-symbols-outlined text-lg">person_edit</span>
                  </span>
                  <input 
                    type="text" 
                    value={formName} 
                    onChange={(e) => { setFormName(e.target.value); setSaved(false) }} 
                    className={`${inputClass} pl-12`} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-5 flex items-center text-slate-300">
                    <span className="material-symbols-outlined text-lg">alternate_email</span>
                  </span>
                  <input 
                    type="email" 
                    value={formEmail} 
                    onChange={(e) => { setFormEmail(e.target.value); setSaved(false) }} 
                    className={`${inputClass} pl-12`} 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Property Context (Read-only) */}
        <section className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                <span className="material-symbols-outlined text-lg">home_pin</span>
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] font-headline">Datos de Propiedad</h3>
            </div>
            <div className="px-4 py-2 bg-white/50 border border-white rounded-xl flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronizado</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className={labelClass}>Unidad Privativa</label>
              <input type="text" value={apartment} disabled className={disabledInputClass} />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight ml-2">Identificador único de vivienda</p>
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Torre / Sección</label>
              <input type="text" value={resident?.tower ? `Torre ${resident.tower}` : 'No asignado'} disabled className={disabledInputClass} />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight ml-2">Estructura arquitectónica</p>
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Complejo Residencial</label>
              <input type="text" value={state.buildingConfig.buildingName} disabled className={disabledInputClass} />
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Ubicación Geográfica</label>
              <input type="text" value={state.buildingConfig.buildingAddress} disabled className={disabledInputClass} />
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex items-start space-x-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
               <span className="material-symbols-outlined text-lg">verified_user</span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-900 font-black uppercase tracking-widest">Seguridad de la Información</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Los datos de propiedad son gestionados centralmente por la administración de {state.buildingConfig.buildingName} para garantizar la integridad fiscal y operativa del recinto.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
