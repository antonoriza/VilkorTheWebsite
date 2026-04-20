import React from 'react'
import { Amenity } from '../../../core/store/seed'

interface Props {
  amenities: Amenity[]
  newAmenity: string
  setNewAmenity: (val: string) => void
  handleAddAmenity: () => void
  handleDeleteAmenity: (id: string, name: string) => void
  labelClass: string
  inputClass: string
}

export default function AmenitySettings({ 
  amenities, 
  newAmenity, 
  setNewAmenity, 
  handleAddAmenity, 
  handleDeleteAmenity, 
  labelClass, 
  inputClass 
}: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">outdoor_grill</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Amenidades Configuradas</h3>
        </div>
        
        {amenities.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
             <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">warning</span>
             <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
               No hay amenidades habilitadas. Los residentes no verán el módulo de reservaciones hasta que agregues al menos una.
             </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {amenities.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all group">
              <span className="text-sm font-bold text-slate-900">{a.name}</span>
              <button 
                onClick={() => handleDeleteAmenity(a.id, a.name)} 
                className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <input 
            type="text" 
            value={newAmenity} 
            onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()}
            placeholder="Ej: Salón de Eventos, Gimnasio, Sala de Cine..."
            className={inputClass + ' flex-1'}
          />
          <button 
            onClick={handleAddAmenity}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold whitespace-nowrap shadow-lg shadow-slate-200"
          >
            Agregar
          </button>
        </div>
      </section>
    </div>
  )
}
