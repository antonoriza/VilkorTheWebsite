import React from 'react'
import { BuildingConfig, Resident } from '../../../core/store/seed'

interface Props {
  bc: BuildingConfig
  residents: Resident[]
  newTower: string
  setNewTower: (val: string) => void
  handleAddTower: () => void
  handleDeleteTower: (tower: string) => void
  labelClass: string
  inputClass: string
}

export default function ArchitectureSettings({ 
  bc, 
  residents, 
  newTower, 
  setNewTower, 
  handleAddTower, 
  handleDeleteTower, 
  labelClass, 
  inputClass 
}: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">domain</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Topología del Edificio</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de Propiedad</label>
            <div className="flex gap-3">
              <button 
                onClick={() => {}} // This will need a proxy or we pass dispatch
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  bc.type === 'towers' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                disabled // We'll handle full state in parent or pass handlers
              >
                <span className="material-symbols-outlined text-lg">apartment</span> Torres
              </button>
              {/* Note: I'll actually pass a simpler update function to handle bc type changes if needed */}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">Solo disponible para visualización en este prototipo.</p>
          </div>
          <div>
            <label className={labelClass}>{bc.type === 'towers' ? 'Torres' : 'Secciones'}</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {bc.towers.map(t => (
                <div key={t} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-bold text-slate-700">{bc.type === 'towers' ? `Torre ${t}` : `Sección ${t}`}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({residents.filter(r => r.tower === t).length} res.)</span>
                  <button onClick={() => handleDeleteTower(t)} className="text-slate-400 hover:text-rose-600 transition-colors ml-1">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTower} onChange={(e) => setNewTower(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTower()}
                placeholder={bc.type === 'towers' ? 'Ej: C' : 'Ej: Norte'}
                className={inputClass + ' flex-1'}
              />
              <button onClick={handleAddTower} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold">
                Agregar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
