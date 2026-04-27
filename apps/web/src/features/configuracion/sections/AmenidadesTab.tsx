/**
 * AmenidadesTab — Amenity management with template picker.
 * Extracted from ArchitectureSettings.
 */
import { useState } from 'react'
import type { Amenity } from '../../../types'
import { SaveFooter } from '../../../core/components/SettingsShell'

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

interface AmenidadesTabProps {
  amenities: Amenity[]
  handleDeleteAmenity: (id: string, name: string) => void
  handleAddAmenity: (name: string, icon: string) => void
  handleSave: () => void
  saved: boolean
}

export default function AmenidadesTab({ amenities, handleDeleteAmenity, handleAddAmenity, handleSave, saved }: AmenidadesTabProps) {
  const [selected, setSelected] = useState<typeof AMENITY_TEMPLATES[0] | null>(null)
  const [identifier, setIdentifier] = useState('')

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



  return (
    <div className="animate-in fade-in duration-500">
      <div className="space-y-8">
      {/* Active amenities listing */}
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
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{a.name}</span>
                  </div>
                  <button onClick={() => handleDeleteAmenity(a.id, a.name)} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
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
      </div>
      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}
