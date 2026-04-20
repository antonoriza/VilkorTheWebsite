import React, { useState } from 'react'
import { BuildingConfig, Resident, Amenity, PropertyCategory } from '../../../core/store/seed'

interface Props {
  bc: BuildingConfig
  residents: Resident[]
  amenities: Amenity[]
  newAmenity: string
  setNewAmenity: (val: string) => void
  handleAddAmenity: () => void
  handleDeleteAmenity: (id: string, name: string) => void
  update: (key: string, value: any) => void
  handleSave: () => void
  saved: boolean
  labelClass: string
  inputClass: string
}

export default function ArchitectureSettings({ 
  bc, 
  residents, 
  amenities,
  newAmenity,
  setNewAmenity,
  handleAddAmenity,
  handleDeleteAmenity,
  update,
  handleSave,
  saved,
  labelClass, 
  inputClass 
}: Props) {
  const [activeTab, setActiveTab] = useState('categoria')

  const tabs = [
    { id: 'categoria', label: 'Categoría', icon: 'account_tree' },
    { id: 'amenidades', label: 'Amenidades', icon: 'outdoor_grill' },
    { id: 'anexos', label: 'Anexos', icon: 'link' },
    { id: 'equipamiento', label: 'Equipamiento', icon: 'settings_input_component' },
    { id: 'identidad', label: 'Identidad', icon: 'branding_watermark' },
  ]

  const SectionHeader = ({ label, icon }: { label: string, icon: string }) => (
    <div className="flex items-center justify-between mt-4 mb-6 first:mt-0">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
           <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
           <h3 className="text-lg font-headline font-black text-slate-900 uppercase tracking-tight">
             {label}
           </h3>
        </div>
      </div>
    </div>
  )

  const ContextualSaveFooter = ({ label }: { label: string }) => (
    <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-end">
      <button 
        onClick={handleSave}
        className={`flex items-center space-x-3 px-8 py-3 font-black rounded-2xl transition-all shadow-2xl text-[10px] tracking-widest uppercase ${
          saved ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{saved ? 'check_circle' : 'save_as'}</span>
        <span>{saved ? 'Ajustes Aplicados' : 'Guardar Cambios'}</span>
      </button>
    </div>
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-4 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all shrink-0 ${
              activeTab === tab.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm flex flex-col min-h-[600px]">
        {activeTab === 'categoria' && (
          <div className="animate-in fade-in duration-500">
            <SectionHeader label="Categoría de inmueble" icon="account_tree" />
            <div className="space-y-8">
              <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-slate-200">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <span className="material-symbols-outlined text-3xl">home_work</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Categoría de Inmueble</p>
                    <h4 className="text-xl font-headline font-black uppercase tracking-tight">Residencial</h4>
                  </div>
                </div>
                <div className="px-5 py-2 bg-white/10 rounded-full border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest">Activo</span>
                </div>
              </div>

              <div className="space-y-6">
                <label className={labelClass}>Agrupación</label>
                <div className="flex gap-4">
                  {[
                    { id: 'vertical', label: 'Estructura Vertical', icon: 'apartment' },
                    { id: 'horizontal', label: 'Estructura Horizontal', icon: 'holiday_village' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        update('groupingMode', mode.id);
                        const defaults = mode.id === 'vertical' 
                          ? ['Lobby Principal', 'Elevadores A', 'Elevadores B', 'Acceso Peatonal', 'Estacionamiento IN', 'Estacionamiento OUT']
                          : ['Caseta de Vigilancia', 'Portón Principal', 'Acceso Proveedores', 'Casa Club', 'Senda Peatonal', 'Zona de Carga'];
                        
                        update('zoning', defaults.map((name, i) => ({
                          id: `zn-${mode.id}-${i}`,
                          name,
                          type: mode.id === 'vertical' ? (name.includes('Lobby') ? 'lobby' : name.includes('Elevador') ? 'elevator' : 'other') : 'gate',
                          linkedContainer: bc.topology?.containers?.[0]?.name || ''
                        })));
                      }}
                      className={`flex-1 flex items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
                        bc.groupingMode === mode.id 
                          ? 'border-slate-900 bg-white text-slate-900 shadow-xl' 
                          : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl">{mode.icon}</span>
                      <p className="text-[11px] font-black uppercase tracking-tight text-left">{mode.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8 py-6">
                <div className="flex items-center justify-between mt-4 mb-6 first:mt-0">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">
                      Topología
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configuración de {bc.groupingMode === 'vertical' ? 'Torres' : 'Etapas'} y Unidades</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad</span>
                    <select 
                      value={bc.topology?.containers?.length || 1}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        const currentContainers = bc.topology?.containers || [];
                        const newContainers = [...currentContainers];
                        if (count > newContainers.length) {
                          for (let i = newContainers.length; i < count; i++) {
                            newContainers.push({ 
                              id: `top-${Date.now()}-${i}`, 
                              name: `${bc.groupingMode === 'vertical' ? 'Torre' : 'Etapa'} ${String.fromCharCode(65 + i)}`, 
                              unitsCount: 10 
                            });
                          }
                        } else {
                          newContainers.splice(count);
                        }
                        update('topology', { ...bc.topology, containers: newContainers });
                      }}
                      className="h-10 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[11px] font-black shadow-sm focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>{num} {bc.groupingMode === 'vertical' ? (num === 1 ? 'Torre' : 'Torres') : (num === 1 ? 'Etapa' : 'Etapas')}</option>
                      ))}
                    </select>
                  </div>
                </div>
 
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-2 mb-4">
                    <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      {bc.groupingMode === 'vertical' ? 'Número de Torre' : 'Número de Etapa'}
                    </div>
                    <div className="col-span-7 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      {bc.groupingMode === 'vertical' ? 'Nombre de Torre' : 'Nombre de Etapa'}
                    </div>
                    <div className="col-span-3 text-right text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Unidades</div>
                  </div>

                  <div className="space-y-1">
                    {bc.topology?.containers?.map((container, idx) => (
                      <div key={container.id} className="grid grid-cols-12 gap-4 items-center group py-3 px-2 hover:bg-slate-50 rounded-xl transition-all duration-300">
                        <div className="col-span-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            {bc.groupingMode === 'vertical' ? 'Torre' : 'Etapa'} {idx + 1}
                          </span>
                        </div>
                        <div className="col-span-7">
                          <input 
                            type="text" 
                            maxLength={30}
                            value={container.name}
                            placeholder="Sin nombre..."
                            onChange={(e) => {
                              const newContainers = [...(bc.topology?.containers || [])];
                              newContainers[idx].name = e.target.value;
                              update('topology', { ...bc.topology, containers: newContainers });
                            }}
                            className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 py-1 text-[12px] font-bold text-slate-900 placeholder:text-slate-200 focus:border-slate-900 transition-all outline-none"
                          />
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-2">
                          <input 
                            type="number" 
                            value={container.unitsCount || ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/^0+/, '') || '0';
                              const num = parseInt(val, 10);
                              const newContainers = [...(bc.topology?.containers || [])];
                              newContainers[idx].unitsCount = num;
                              update('topology', { ...bc.topology, containers: newContainers });
                            }}
                            onBlur={(e) => {
                              // Force value to state value on blur to clear any remaining '058' string artifacts in browser
                              e.target.value = String(container.unitsCount);
                            }}
                            className="w-16 bg-transparent border-none p-0 text-[12px] font-black text-right focus:ring-0 outline-none text-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              </div>
            <ContextualSaveFooter label="Categoría" />
          </div>
        )}

        {activeTab === 'amenidades' && (
          <div className="animate-in fade-in duration-500">
            <SectionHeader label="Amenidades" icon="outdoor_grill" />
            <div className="space-y-8">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Catálogo de Áreas Comunes</h4>
                {amenities.length === 0 && (
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
                    <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      No hay amenidades habilitadas. Configure al menos una área compartida para activar el motor de reservaciones.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenities.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-slate-300 hover:bg-white transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined">deck</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{a.name}</span>
                      </div>
                      <button onClick={() => handleDeleteAmenity(a.id, a.name)} className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-6">
                  <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()} placeholder="Siguiente área..." className={inputClass + ' flex-1'} />
                  <button onClick={handleAddAmenity} className="px-8 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest">Confirmar</button>
                </div>
              </div>

              <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] flex gap-6 items-start">
                <span className="material-symbols-outlined text-emerald-600 text-3xl">insights</span>
                <div>
                  <p className="text-[11px] font-black text-emerald-900 uppercase tracking-widest mb-1">Métricas de Uso</p>
                  <p className="text-[11px] text-emerald-800/80 font-medium leading-relaxed">Las amenidades configuradas aquí alimentan el motor de reservas.</p>
                </div>
              </div>
            </div>
            <ContextualSaveFooter label="Amenidades" />
          </div>
        )}

        {activeTab === 'anexos' && (
          <div className="animate-in fade-in duration-500">
            <SectionHeader label="Anexos del inmueble" icon="link" />
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">directions_car</span>
                  <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Estacionamientos</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 mb-6">Mapeo de cajones y carga EV</p>
                  <button className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Gestionar</button>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">inventory_2</span>
                  <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Bodegas y Lockers</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 mb-6">Asociación de m²</p>
                  <button className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Vincular</button>
                </div>
              </div>
            </div>
            <ContextualSaveFooter label="Anexos" />
          </div>
        )}

        {activeTab === 'equipamiento' && (
          <div className="animate-in fade-in duration-500">
            <SectionHeader label="Equipamiento" icon="settings_input_component" />
            <div className="space-y-8">
              <div className="space-y-6">
                <label className={labelClass}>Equipamiento Crítico</label>
                <div className="space-y-3">
                  {bc.equipment.map(eq => (
                    <div key={eq.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-slate-300 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-2xl">
                            {eq.type === 'solar' ? 'wb_sunny' : eq.type === 'pump' ? 'water_drop' : 'ac_unit'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{eq.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mantenimiento: {eq.nextMaintenance}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">Ok</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <ContextualSaveFooter label="Equipamiento" />
          </div>
        )}

        {activeTab === 'identidad' && (
          <div className="animate-in fade-in duration-500">
            <SectionHeader label="Datos del inmueble" icon="branding_watermark" />
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Administración</h4>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Responsable</label>
                      <input type="text" value={bc.adminName} onChange={(e) => update('adminName', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Teléfono</label>
                      <input type="tel" value={bc.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input type="email" value={bc.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Inmueble</h4>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Nombre Comercial</label>
                      <input type="text" value={bc.buildingName} onChange={(e) => update('buildingName', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Dirección</label>
                      <input type="text" value={bc.buildingAddress} onChange={(e) => update('buildingAddress', e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>CP</label>
                        <input type="text" value={bc.zipCode || ''} onChange={(e) => update('zipCode', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Ciudad</label>
                        <input type="text" value={bc.city || ''} onChange={(e) => update('city', e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex gap-6 items-start">
                <span className="material-symbols-outlined text-slate-400 text-3xl">info</span>
                <div>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Nota Legal</p>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Estos datos se utilizan para la generación de avisos de cobro y recibos fiscales.</p>
                </div>
              </div>
            </div>
            <ContextualSaveFooter label="Identidad" />
          </div>
        )}
      </div>
    </div>
  )
}
