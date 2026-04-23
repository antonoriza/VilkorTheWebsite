/**
 * EquipamientoTab — Critical equipment inventory with template picker.
 * Extracted from ArchitectureSettings.
 */
import { useState } from 'react'
import type { CriticalEquipment } from '../../../types'

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const EQUIPMENT_TEMPLATES: { label: string; type: CriticalEquipment['type']; category: CriticalEquipment['category']; icon: string }[] = [
  // Transporte
  { label: 'Elevador', type: 'elevator', category: 'transporte', icon: 'elevator' },
  // Hidráulica
  { label: 'Bomba', type: 'pump', category: 'hidraulica', icon: 'water_drop' },
  { label: 'Cisterna', type: 'cistern', category: 'hidraulica', icon: 'water' },
  // Energía
  { label: 'Paneles Solares', type: 'solar', category: 'energia', icon: 'wb_sunny' },
  { label: 'Planta Eléctrica', type: 'electric_plant', category: 'energia', icon: 'bolt' },
  { label: 'Transformador', type: 'transformer', category: 'energia', icon: 'settings_input_component' },
  { label: 'Climatización', type: 'hvac', category: 'energia', icon: 'ac_unit' },
  // Seguridad
  { label: 'CCTV', type: 'cctv', category: 'seguridad', icon: 'videocam' },
  { label: 'Portón/Acceso', type: 'gate', category: 'seguridad', icon: 'gate' },
  { label: 'Interfón', type: 'intercom', category: 'seguridad', icon: 'call' },
]

const CATEGORY_META: Record<CriticalEquipment['category'], { label: string; icon: string; color: string; bg: string }> = {
  transporte: { label: 'Transporte Vertical', icon: 'elevator', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
  hidraulica: { label: 'Sistemas Hidráulicos', icon: 'water_drop', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
  energia: { label: 'Energía', icon: 'bolt', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  seguridad: { label: 'Seguridad', icon: 'security', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
}

const EQUIPMENT_ICON_MAP: Record<CriticalEquipment['type'], string> = {
  elevator: 'elevator', pump: 'water_drop', cistern: 'water', solar: 'wb_sunny',
  electric_plant: 'bolt', transformer: 'settings_input_component', hvac: 'ac_unit',
  cctv: 'videocam', gate: 'gate', intercom: 'call', ac: 'ac_unit', boiler: 'local_fire_department',
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface EquipamientoTabProps {
  equipment: CriticalEquipment[]
  containers: { name: string }[]
  groupingMode: string
  update: (key: string, value: any) => void
  handleSave: () => void
  saved: boolean
}

export default function EquipamientoTab({ equipment, containers, groupingMode, update, handleSave, saved }: EquipamientoTabProps) {
  const [selected, setSelected] = useState<typeof EQUIPMENT_TEMPLATES[0] | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [location, setLocation] = useState('*')

  const getNextName = (label: string, id: string) => {
    if (id) return `${label} ${id}`
    const regex = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\d+$`)
    const count = equipment.filter(e => regex.test(e.name)).length
    return `${label} ${count + 1}`
  }

  const handleAdd = () => {
    if (!selected) return
    const newItem: CriticalEquipment = {
      id: `eq-${Date.now()}`,
      name: getNextName(selected.label, identifier),
      type: selected.type,
      category: selected.category,
      location,
    }
    update('equipment', [...equipment, newItem])
    setSelected(null)
    setIdentifier('')
    setLocation('*')
  }

  const handleDelete = (id: string) => {
    update('equipment', equipment.filter(e => e.id !== id))
  }

  const categories: CriticalEquipment['category'][] = ['transporte', 'hidraulica', 'energia', 'seguridad']

  const SaveFooter = () => (
    <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-end">
      <button onClick={handleSave} className={`flex items-center space-x-3 px-8 py-3 font-black rounded-2xl transition-all shadow-2xl text-[10px] tracking-widest uppercase ${saved ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'}`}>
        <span className="material-symbols-outlined text-[18px]">{saved ? 'check_circle' : 'save_as'}</span>
        <span>{saved ? 'Ajustes Aplicados' : 'Guardar Cambios'}</span>
      </button>
    </div>
  )

  return (
    <div className="animate-in fade-in duration-500 space-y-8">

      {/* Grouped asset matrix */}
      {categories.map(cat => {
        const items = equipment.filter(e => e.category === cat)
        if (items.length === 0) return null
        const meta = CATEGORY_META[cat]
        return (
          <div key={cat} className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${meta.bg} ${meta.color}`}>
              <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
              {meta.label}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(eq => (
                <div key={eq.id} className="group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg}`}>
                      <span className={`material-symbols-outlined text-[20px] ${meta.color}`}>{EQUIPMENT_ICON_MAP[eq.type] || 'settings'}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{eq.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {eq.location && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">location_on</span>
                            {eq.location === '*' ? 'Todas' : eq.location}
                          </span>
                        )}
                        {eq.nextMaintenance && (
                          <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">
                            · Mant. {eq.nextMaintenance}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(eq.id)} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {equipment.length === 0 && (
        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
          <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
          <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
            Sin equipos registrados. Selecciona una plantilla para comenzar el inventario técnico.
          </p>
        </div>
      )}

      {/* Template picker */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Agregar Equipo</h4>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
          {EQUIPMENT_TEMPLATES.filter(t => {
            if (groupingMode === 'horizontal' && t.type === 'elevator') return false
            return true
          }).map(t => {
            const meta = CATEGORY_META[t.category]
            return (
              <button
                key={t.label}
                onClick={() => setSelected(selected?.label === t.label ? null : t)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center ${
                  selected?.label === t.label
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xl'
                    : `border-slate-100 bg-slate-50 ${meta.color} hover:border-slate-300 hover:bg-white`
                }`}
              >
                <span className="material-symbols-outlined text-xl">{t.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-tight leading-tight">{t.label}</span>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 rounded-2xl shrink-0">
                <span className="material-symbols-outlined text-[18px] text-slate-600">{selected.icon}</span>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{selected.label}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CATEGORY_META[selected.category].bg} ${CATEGORY_META[selected.category].color}`}>
                  {CATEGORY_META[selected.category].label}
                </span>
              </div>
              {containers.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asignado a</span>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none"
                  >
                    <option value="*">Todas las {groupingMode === 'vertical' ? 'Torres' : 'Privadas'}</option>
                    {containers.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <input
                type="text"
                maxLength={15}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                placeholder="Identificador (ej. norte)"
                className="flex-1 min-w-[140px] h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-[11px] font-bold text-slate-900 placeholder:text-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none"
              />
              <button onClick={handleAdd} className="h-12 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shrink-0">
                Agregar
              </button>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-1">
              {`→ Se agregará como: "${getNextName(selected.label, identifier)}"`}
            </p>
          </div>
        )}
      </div>

      <SaveFooter />
    </div>
  )
}
