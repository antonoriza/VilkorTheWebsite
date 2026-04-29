/**
 * AmenidadesTab — Amenity management with template picker + approval mode settings.
 * Extracted from ArchitectureSettings.
 */
import { useState } from 'react'
import type { Amenity, BuildingConfig, ReservationApprovalMode } from '../../../types'
import { SaveFooter } from '../../../core/components/SettingsShell'
import Modal from '../../../core/components/Modal'

const AMENITY_TEMPLATES = [
  { label: 'Asador', icon: 'outdoor_grill' },
  { label: 'Alberca', icon: 'pool' },
  { label: 'Cancha de Tenis', icon: 'sports_tennis' },
  { label: 'Cancha de Fútbol', icon: 'sports_soccer' },
  { label: 'Cancha de Basquetbol', icon: 'sports_basketball' },
  { label: 'Cancha de Pádel', icon: 'sports_tennis' },
  { label: 'Gimnasio', icon: 'fitness_center' },
  { label: 'Coworking', icon: 'computer' },
  { label: 'Mesa de Ping-Pong', icon: 'sports' },
  { label: '\u00c1rea de Yoga', icon: 'self_improvement' },
  { label: 'Sauna', icon: 'local_fire_department' },
  { label: 'Ludoteca', icon: 'toys' },
  { label: 'Salón de Eventos', icon: 'celebration' },
]

const APPROVAL_MODES: { value: ReservationApprovalMode; label: string; desc: string; icon: string }[] = [
  { value: 'auto_approve', label: 'Aprobación Automática', desc: 'Sin conflictos → aprobado al instante', icon: 'bolt' },
  { value: 'manual_approval', label: 'Aprobación Manual', desc: 'Todas las reservaciones requieren revisión', icon: 'verified_user' },
  { value: 'auto_with_exceptions', label: 'Automático con Excepciones', desc: 'Automático, excepto departamentos marcados', icon: 'tune' },
]

interface AmenidadesTabProps {
  amenities: Amenity[]
  buildingConfig: BuildingConfig
  departments: string[]
  handleDeleteAmenity: (id: string, name: string) => void
  handleAddAmenity: (name: string, icon: string) => void
  handleUpdateAmenity: (amenity: Amenity) => void
  handleUpdateConfig: (partial: Partial<BuildingConfig>) => void
  handleSave: () => void
  saved: boolean
}

export default function AmenidadesTab({
  amenities, buildingConfig, departments,
  handleDeleteAmenity, handleAddAmenity, handleUpdateAmenity, handleUpdateConfig,
  handleSave, saved
}: AmenidadesTabProps) {
  const [selected, setSelected] = useState<typeof AMENITY_TEMPLATES[0] | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [editAmenity, setEditAmenity] = useState<Amenity | null>(null)
  const [exceptionInput, setExceptionInput] = useState('')

  const approvalMode = buildingConfig.reservationApprovalMode || 'auto_approve'
  const exceptionApts = buildingConfig.reservationExceptionApartments || []

  const getNextName = (label: string, id: string) => {
    if (id) return `${label} ${id}`
    const count = amenities.filter(a => a.name.startsWith(label)).length
    return `${label} ${count + 1}`
  }

  const handleAdd = () => {
    if (!selected) return
    handleAddAmenity(getNextName(selected.label, identifier), selected.icon)
    setSelected(null)
    setIdentifier('')
  }

  const addException = () => {
    const apt = exceptionInput.trim().toUpperCase()
    if (apt && !exceptionApts.includes(apt)) {
      handleUpdateConfig({ reservationExceptionApartments: [...exceptionApts, apt] })
    }
    setExceptionInput('')
  }

  const removeException = (apt: string) => {
    handleUpdateConfig({ reservationExceptionApartments: exceptionApts.filter(a => a !== apt) })
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="space-y-10">

        {/* ── Approval Mode ─────────────────────────────────── */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Modo de Aprobación</h4>
          <div className="space-y-3">
            {APPROVAL_MODES.map(mode => (
              <label key={mode.value}
                className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  approvalMode === mode.value
                    ? 'border-slate-900 bg-slate-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <input type="radio" name="approvalMode" value={mode.value}
                  checked={approvalMode === mode.value}
                  onChange={() => handleUpdateConfig({ reservationApprovalMode: mode.value })}
                  className="mt-0.5 w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-300"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-slate-500">{mode.icon}</span>
                    <span className="text-sm font-bold text-slate-900">{mode.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{mode.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Exception apartments */}
          {approvalMode === 'auto_with_exceptions' && (
            <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamentos que requieren aprobación</label>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {exceptionApts.map(apt => (
                  <span key={apt} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                    {apt}
                    <button onClick={() => removeException(apt)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
                {exceptionApts.length === 0 && (
                  <span className="text-xs text-slate-300 italic">Sin excepciones configuradas</span>
                )}
              </div>
              <div className="flex gap-2">
                <select value={exceptionInput} onChange={e => setExceptionInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10">
                  <option value="">Seleccionar departamento...</option>
                  {departments.filter(d => !exceptionApts.includes(d)).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <button onClick={addException} disabled={!exceptionInput}
                  className="px-4 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Active Amenities ──────────────────────────────── */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Áreas Comunes</h4>
          {amenities.length === 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
              <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
              <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                Sin áreas comunes habilitadas. Selecciona una plantilla para activar el motor de reservaciones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {amenities.map(a => (
                <div key={a.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-slate-300 hover:bg-white transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">{a.icon || 'deck'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight block">{a.name}</span>
                      <span className="text-[9px] text-slate-400">{a.openTime || '10:00'} – {a.closeTime || '22:00'} · {(a.slotDurationMinutes || 240) / 60}h</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setEditAmenity({ ...a, openTime: a.openTime || '10:00', closeTime: a.closeTime || '22:00', slotDurationMinutes: a.slotDurationMinutes || 240, cleaningBufferMinutes: a.cleaningBufferMinutes || 0, maxAdvanceDays: a.maxAdvanceDays || 30, depositAmount: a.depositAmount ?? 500, reglamentoType: a.reglamentoType || 'none', reglamentoText: a.reglamentoText || '', reglamentoPdfUrl: a.reglamentoPdfUrl || '' })}
                      className="text-slate-300 hover:text-slate-600 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                    </button>
                    <button onClick={() => handleDeleteAmenity(a.id, a.name)} className="text-slate-200 hover:text-rose-500 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template picker */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Agregar Área</h4>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {AMENITY_TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => setSelected(selected?.label === t.label ? null : t)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
                  selected?.label === t.label
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-tight leading-tight">{t.label}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-100 rounded-2xl shrink-0">
                  <span className="material-symbols-outlined text-[18px] text-slate-500">{selected.icon}</span>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{selected.label}</span>
                </div>
                <input
                  type="text"
                  maxLength={15}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                  placeholder="Identificador opcional (a-z)"
                  className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none"
                />
                <button
                  onClick={handleAdd}
                  className="h-12 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shrink-0"
                >
                  Agregar
                </button>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-1">
                {`→ Se agregará como: "${getNextName(selected.label, identifier)}"`}
              </p>
            </div>
          )}
        </div>

        {/* ── Penalty Reasons ─────────────────────────────────── */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Motivos de Multa</h4>
          <p className="text-[11px] text-slate-500 font-medium px-1">
            Configura las razones predefinidas que aparecen al aplicar una multa por mal uso de amenidades.
          </p>
          <div className="flex flex-wrap gap-2">
            {(buildingConfig.multaReasons || []).map(reason => (
              <span key={reason} className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-all">
                {reason}
                <button 
                  onClick={() => handleUpdateConfig({ multaReasons: (buildingConfig.multaReasons || []).filter(r => r !== reason) })}
                  className="ml-1 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input 
              type="text" 
              placeholder="Nuevo motivo..."
              className="block w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-100 font-medium text-sm transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim()
                  if (val && !(buildingConfig.multaReasons || []).includes(val)) {
                    handleUpdateConfig({ multaReasons: [...(buildingConfig.multaReasons || []), val] })
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
          </div>
        </div>

      </div>

      <SaveFooter saved={saved} handleSave={handleSave} />

      {/* ── Per-Amenity Config Modal ──────────────────────── */}
      <Modal open={!!editAmenity} onClose={() => setEditAmenity(null)} title={`Configurar — ${editAmenity?.name || ''}`}>
        {editAmenity && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apertura</label>
                <input type="time" value={editAmenity.openTime} onChange={e => setEditAmenity({ ...editAmenity, openTime: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cierre</label>
                <input type="time" value={editAmenity.closeTime} onChange={e => setEditAmenity({ ...editAmenity, closeTime: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turno (min)</label>
                <input type="number" value={editAmenity.slotDurationMinutes} min={30} step={30}
                  onChange={e => setEditAmenity({ ...editAmenity, slotDurationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limpieza (min)</label>
                <input type="number" value={editAmenity.cleaningBufferMinutes} min={0} step={15}
                  onChange={e => setEditAmenity({ ...editAmenity, cleaningBufferMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anticipo (días)</label>
                <input type="number" value={editAmenity.maxAdvanceDays} min={1}
                  onChange={e => setEditAmenity({ ...editAmenity, maxAdvanceDays: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Depósito (MXN)</label>
              <input type="number" value={editAmenity.depositAmount} min={0}
                onChange={e => setEditAmenity({ ...editAmenity, depositAmount: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-slate-900/10" />
            </div>

            {/* Reglamento */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reglamento</label>
              <div className="flex gap-2">
                {(['none', 'text', 'pdf'] as const).map(t => (
                  <button key={t} onClick={() => setEditAmenity({ ...editAmenity, reglamentoType: t })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      editAmenity.reglamentoType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}>
                    {t === 'none' ? 'Ninguno' : t === 'text' ? 'Texto' : 'PDF'}
                  </button>
                ))}
              </div>
              {editAmenity.reglamentoType === 'text' && (
                <textarea value={editAmenity.reglamentoText} onChange={e => setEditAmenity({ ...editAmenity, reglamentoText: e.target.value })}
                  rows={5} placeholder="Escribe las reglas de uso..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10 resize-none" />
              )}
              {editAmenity.reglamentoType === 'pdf' && (
                <input type="url" value={editAmenity.reglamentoPdfUrl} onChange={e => setEditAmenity({ ...editAmenity, reglamentoPdfUrl: e.target.value })}
                  placeholder="URL del PDF..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900/10" />
              )}
            </div>

            <button onClick={() => { handleUpdateAmenity(editAmenity); setEditAmenity(null) }}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]">
              Guardar Configuración
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
