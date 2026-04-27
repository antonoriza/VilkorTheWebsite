import { useState } from 'react'
import { SettingsTabBar, SaveFooter, ComingSoon } from '../../../core/components/SettingsShell'

// ─── Shared ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'canales',    label: 'Canales',    icon: 'cell_tower' },
  { id: 'plantillas', label: 'Plantillas', icon: 'article' },
  { id: 'asambleas',  label: 'Asambleas',  icon: 'groups' },
  { id: 'historial',  label: 'Historial',  icon: 'history' },
]



// ─── Channel config ───────────────────────────────────────────────────────────

const CHANNELS = [
  { id: 'push',      label: 'Push App',   icon: 'smartphone',      color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { id: 'email',     label: 'Email',      icon: 'mail',            color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'sms',       label: 'SMS',        icon: 'sms',             color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'whatsapp',  label: 'WhatsApp',   icon: 'chat',            color: 'bg-green-50 text-green-700 border-green-100' },
]

function CanalesTab({ handleSave, saved }: { handleSave: () => void; saved: boolean }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ push: true, email: true, sms: false, whatsapp: false })

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Canales Activos</h4>
        <p className="text-[11px] text-slate-400 font-medium ml-1">
          Define qué canales puede usar el motor de avisos del agente para contactar a residentes y staff.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${
                enabled[ch.id] ? 'border-slate-900 bg-white shadow-lg shadow-slate-100' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${ch.color}`}>
                  <span className="material-symbols-outlined text-[22px]">{ch.icon}</span>
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{ch.label}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                    {enabled[ch.id] ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnabled({ ...enabled, [ch.id]: !enabled[ch.id] })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled[ch.id] ? 'bg-slate-900' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled[ch.id] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Templates tab ────────────────────────────────────────────────────────────

const DEFAULT_TEMPLATES = [
  { id: 'tpl-1', title: 'Aviso de Cobro', trigger: 'Día 28 de cada mes', channel: 'push', audience: 'Residentes con saldo pendiente' },
  { id: 'tpl-2', title: 'Bienvenida a Residente Nuevo', trigger: 'Alta de cuenta', channel: 'email', audience: 'Residente recién dado de alta' },
  { id: 'tpl-3', title: 'Alerta de Visita', trigger: 'Registro de acceso', channel: 'push', audience: 'Titular de la unidad' },
  { id: 'tpl-4', title: 'Recordatorio de Asamblea', trigger: '48h antes del evento', channel: 'push + email', audience: 'Todos los residentes' },
]

const CHANNEL_BADGE: Record<string, string> = {
  push:         'bg-violet-50 text-violet-700',
  email:        'bg-blue-50 text-blue-700',
  sms:          'bg-emerald-50 text-emerald-700',
  'push + email': 'bg-amber-50 text-amber-700',
}

function PlantillasTab({ handleSave, saved }: { handleSave: () => void; saved: boolean }) {
  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="space-y-3">
        {DEFAULT_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className="group flex items-start justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-slate-300 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-slate-400">article</span>
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{tpl.title}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${CHANNEL_BADGE[tpl.channel] || 'bg-slate-50 text-slate-500'} border-transparent`}>
                    {tpl.channel}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                    {tpl.trigger}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">groups</span>
                  {tpl.audience}
                </p>
              </div>
            </div>
            <button className="text-slate-200 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all mt-1">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
        ))}
      </div>
      <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
        <span className="material-symbols-outlined text-amber-600 text-xl">info</span>
        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
          El motor de avisos del agente usa estas plantillas para envíos automáticos. Editar el contenido estará disponible en el siguiente release.
        </p>
      </div>
      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Main: ComunicacionSettings ───────────────────────────────────────────────

export default function ComunicacionSettings({
  handleSave,
  saved,
}: {
  handleSave: () => void
  saved: boolean
}) {
  const [activeTab, setActiveTab] = useState('canales')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'canales'    && <CanalesTab handleSave={handleSave} saved={saved} />}
      {activeTab === 'plantillas' && <PlantillasTab handleSave={handleSave} saved={saved} />}
      {activeTab === 'asambleas'  && <ComingSoon label="Asambleas" />}
      {activeTab === 'historial'  && <ComingSoon label="Historial de Envíos" />}
    </div>
  )
}
