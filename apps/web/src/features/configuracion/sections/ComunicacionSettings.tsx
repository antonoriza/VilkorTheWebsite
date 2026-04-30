import { useState, useEffect } from 'react'
import { SettingsTabBar, SaveFooter, SectionHeader, FieldGroup, InfoBanner } from '../../../core/components/SettingsShell'
import { avisosApi } from '../../../lib/api'
import type { BuildingConfig, Aviso } from '@vilkor/shared'

// ─── Shared ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'canales',    label: 'Canales',    icon: 'cell_tower' },
  { id: 'plantillas', label: 'Plantillas', icon: 'article' },
  { id: 'asambleas',  label: 'Asambleas',  icon: 'groups' },
  { id: 'historial',  label: 'Historial',  icon: 'history' },
]



// ─── Channel config ───────────────────────────────────────────────────────────

const CHANNELS = [
  { id: 'push',      label: 'Push App',   desc: 'Notificaciones en tiempo real', icon: 'smartphone',      color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { id: 'email',     label: 'Email',      desc: 'Correo electrónico SMTP',       icon: 'mail',            color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { id: 'sms',       label: 'SMS',        desc: 'Mensajes de texto directo',     icon: 'sms',             color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'whatsapp',  label: 'WhatsApp',   desc: 'API de WhatsApp Business',      icon: 'chat',            color: 'bg-green-50 text-green-700 border-green-100' },
]

function CanalesTab({ bc, update, handleSave, saved }: { bc: BuildingConfig; update: (key: string, value: any) => void; handleSave: () => void; saved: boolean }) {
  const comm = bc.communication || { canales: { push: true, email: true, sms: false, whatsapp: false }, asambleas: { quorumRequired: 51, advanceNoticeDays: 15, allowProxies: true, proxyMaxPerResident: 1 } }
  const enabled = comm.canales

  const toggleChannel = (id: keyof typeof enabled) => {
    update('communication', { ...comm, canales: { ...enabled, [id]: !enabled[id] } })
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-8">
      <SectionHeader label="Canales de Comunicación" icon="cell_tower" />

      <FieldGroup icon="settings_input_antenna" title="Canales Activos">
        <p className="text-[10px] text-slate-400 font-medium -mt-2">
          Define qué canales puede usar el motor de avisos del agente para contactar a residentes y staff.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => (
            <div
              key={ch.id}
              className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
                enabled[ch.id as keyof typeof enabled] ? 'border-slate-900 bg-white shadow-lg shadow-slate-100' : 'border-slate-100 bg-white/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${ch.color}`}>
                  <span className="material-symbols-outlined text-[22px]">{ch.icon}</span>
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{ch.label}</p>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">{ch.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleChannel(ch.id as keyof typeof enabled)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled[ch.id as keyof typeof enabled] ? 'bg-slate-900' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled[ch.id as keyof typeof enabled] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </FieldGroup>

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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
      <SectionHeader label="Plantillas de Envío" icon="article" />

      <FieldGroup icon="auto_awesome" title="Automatizaciones">
        <div className="space-y-3">
          {DEFAULT_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="group flex items-start justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all duration-300">
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
      </FieldGroup>

      <InfoBanner icon="info" variant="warning">
        El motor de avisos del agente usa estas plantillas para envíos automáticos. Editar el contenido estará disponible en el siguiente release.
      </InfoBanner>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Asambleas Tab ────────────────────────────────────────────────────────────

function AsambleasTab({ bc, update, handleSave, saved }: { bc: BuildingConfig; update: (key: string, value: any) => void; handleSave: () => void; saved: boolean }) {
  const comm = bc.communication || { canales: { push: true, email: true, sms: false, whatsapp: false }, asambleas: { quorumRequired: 51, advanceNoticeDays: 15, allowProxies: true, proxyMaxPerResident: 1 } }
  const asambleas = comm.asambleas

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all shadow-inner"

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
      <SectionHeader label="Configuración de Asambleas" icon="groups" />

      <FieldGroup icon="gavel" title="Reglas Generales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Quórum Requerido (%)</label>
            <input 
              type="number" 
              min="1" max="100"
              value={asambleas.quorumRequired}
              onChange={(e) => update('communication', { ...comm, asambleas: { ...asambleas, quorumRequired: Number(e.target.value) } })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Días de Anticipación para Convocatoria</label>
            <input 
              type="number" 
              min="1"
              value={asambleas.advanceNoticeDays}
              onChange={(e) => update('communication', { ...comm, asambleas: { ...asambleas, advanceNoticeDays: Number(e.target.value) } })}
              className={inputClass}
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup icon="how_to_reg" title="Representación (Cartas Poder)">
        <div className="space-y-6">
          <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={asambleas.allowProxies}
              onChange={(e) => update('communication', { ...comm, asambleas: { ...asambleas, allowProxies: e.target.checked } })}
              className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Permitir Representación por Carta Poder</p>
              <p className="text-[10px] font-medium text-slate-500">Un residente puede delegar su voto a otro asistente.</p>
            </div>
          </label>

          {asambleas.allowProxies && (
            <div className="space-y-1.5 animate-in fade-in pl-4 border-l-2 border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Límite de representaciones por residente</label>
              <input 
                type="number" 
                min="1"
                value={asambleas.proxyMaxPerResident}
                onChange={(e) => update('communication', { ...comm, asambleas: { ...asambleas, proxyMaxPerResident: Number(e.target.value) } })}
                className="block w-48 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Máximo número de unidades que un solo asistente puede representar.</p>
            </div>
          )}
        </div>
      </FieldGroup>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Historial Tab ────────────────────────────────────────────────────────────

function HistorialTab() {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    avisosApi.list().then(data => {
      setAvisos(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-6">
      <SectionHeader label="Historial de Comunicados" icon="history" />

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-400 text-sm">campaign</span>
            <h3 className="text-[10px] font-black uppercase tracking-widest">Avisos y Asambleas Enviadas</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-400">{avisos.length} ENVÍOS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asunto</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Alcance</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Impacto</th>
              </tr>
            </thead>
            <tbody className="font-sans text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Cargando historial...</td>
                </tr>
              ) : avisos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">No se han realizado envíos masivos.</td>
                </tr>
              ) : (
                avisos.map(a => {
                  const d = new Date(a.date)
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {d.toLocaleString('es-MX', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                          a.category === 'asamblea' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {a.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{a.title}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">Todos los residentes</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-max">
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          Entregado
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main: ComunicacionSettings ───────────────────────────────────────────────

export default function ComunicacionSettings({
  bc,
  update,
  handleSave,
  saved,
}: {
  bc: BuildingConfig
  update: (key: string, value: any) => void
  handleSave: () => void
  saved: boolean
}) {
  const [activeTab, setActiveTab] = useState('canales')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'canales'    && <CanalesTab bc={bc} update={update} handleSave={handleSave} saved={saved} />}
      {activeTab === 'plantillas' && <PlantillasTab handleSave={handleSave} saved={saved} />}
      {activeTab === 'asambleas'  && <AsambleasTab bc={bc} update={update} handleSave={handleSave} saved={saved} />}
      {activeTab === 'historial'  && <HistorialTab />}
    </div>
  )
}
