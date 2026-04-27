import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BuildingConfig, Amenity } from '../../../types'
import {
  SettingsTabBar, SectionHeader, SaveFooter, SettingsCard,
  FieldGroup, FormInput, StatBar, TopologyCard, InfoBanner,
} from '../../../core/components/SettingsShell'
import AmenidadesTab from './AmenidadesTab'
import EquipamientoTab from './EquipamientoTab'

interface Props {
  bc: BuildingConfig
  amenities: Amenity[]
  handleAddAmenity: (name: string, icon: string) => void
  handleDeleteAmenity: (id: string, name: string) => void
  update: (key: string, value: any) => void
  onRequestGroupingModeChange: (mode: 'vertical' | 'horizontal') => void
  handleSave: () => void
  saved: boolean
}

export default function ArchitectureSettings({ 
  bc, 
  amenities,
  handleAddAmenity,
  handleDeleteAmenity,
  update,
  onRequestGroupingModeChange,
  handleSave,
  saved,
}: Props) {
  // Read subtab from URL so setup checklist can deep-link (e.g. ?tab=perfil&subtab=identidad)
  const [searchParams] = useSearchParams()
  const initialSubtab = searchParams.get('subtab')
  const validSubtabs = ['categoria', 'amenidades', 'equipamiento', 'identidad']
  const [activeTab, setActiveTab] = useState(
    initialSubtab && validSubtabs.includes(initialSubtab) ? initialSubtab : 'identidad'
  )
  // Sync subtab when URL changes while component is mounted
  useEffect(() => {
    const subtab = searchParams.get('subtab')
    if (subtab && validSubtabs.includes(subtab)) setActiveTab(subtab)
  }, [searchParams])

  const tabs = [
    { id: 'identidad', label: 'Identidad', icon: 'branding_watermark' },
    { id: 'categoria', label: 'Categoría', icon: 'account_tree' },
    { id: 'equipamiento', label: 'Equipo', icon: 'settings_input_component' },
    { id: 'amenidades', label: 'Amenidades', icon: 'outdoor_grill' },
  ]

  // ── Computed topology stats for the StatBar ──
  const topoStats = useMemo(() => {
    const containers = bc.topology?.containers || []
    return {
      totalUnits: containers.reduce((s, c) => s + (c.unitsCount || 0), 0),
      totalParking: containers.reduce((s, c) => s + (c.parkingCount || 0), 0),
      totalStorage: containers.reduce((s, c) => s + (c.storageCount || 0), 0),
      containerCount: containers.length,
    }
  }, [bc.topology?.containers])

  const containerLabel = bc.groupingMode === 'vertical' ? 'Torre' : 'Privada'
  const containerLabelPlural = bc.groupingMode === 'vertical' ? 'Torres' : 'Privadas'
  const unitLabel = bc.groupingMode === 'vertical' ? 'Departamentos' : 'Viviendas'

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <SettingsCard className="flex flex-col min-h-[600px]">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* IDENTIDAD TAB                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'identidad' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <SectionHeader label="Datos del inmueble" icon="branding_watermark" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Administración Group */}
              <FieldGroup icon="admin_panel_settings" title="Administración">
                <FormInput
                  label="Responsable"
                  icon="person"
                  value={bc.adminName}
                  onChange={e => update('adminName', e.target.value)}
                  placeholder="Nombre del administrador"
                />
                <FormInput
                  label="Teléfono"
                  icon="call"
                  type="tel"
                  value={bc.adminPhone}
                  onChange={e => update('adminPhone', e.target.value)}
                  placeholder="+52 55 1234 5678"
                />
                <FormInput
                  label="Email"
                  icon="mail"
                  type="email"
                  value={bc.adminEmail}
                  onChange={e => update('adminEmail', e.target.value)}
                  placeholder="admin@condominio.com"
                />
              </FieldGroup>

              {/* Inmueble Group */}
              <FieldGroup icon="apartment" title="Inmueble">
                <FormInput
                  label="Nombre Comercial"
                  icon="badge"
                  value={bc.buildingName}
                  onChange={e => update('buildingName', e.target.value)}
                  placeholder="Ej: Residencial Las Lomas"
                />
                <FormInput
                  label="Dirección"
                  icon="location_on"
                  value={bc.buildingAddress}
                  onChange={e => update('buildingAddress', e.target.value)}
                  placeholder="Calle, número, colonia"
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Código Postal"
                    value={bc.zipCode || ''}
                    onChange={e => update('zipCode', e.target.value)}
                    placeholder="00000"
                  />
                  <FormInput
                    label="Ciudad"
                    icon="map"
                    value={bc.city || ''}
                    onChange={e => update('city', e.target.value)}
                    placeholder="CDMX"
                  />
                </div>
              </FieldGroup>
            </div>

            <div className="mt-6">
              <InfoBanner icon="gavel">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Nota Legal</p>
                <p>Estos datos se utilizan para la generación de avisos de cobro, recibos fiscales y actas de asamblea.</p>
              </InfoBanner>
            </div>

            <SaveFooter handleSave={handleSave} saved={saved} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* CATEGORÍA TAB                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'categoria' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <SectionHeader label="Categoría de inmueble" icon="account_tree" />

            {/* Category hero card */}
            <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between shadow-2xl shadow-slate-200 mb-8">
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

            {/* Grouping mode selector */}
            <FieldGroup icon="view_in_ar" title="Agrupación Arquitectónica">
              <div className="flex gap-4">
                {[
                  { id: 'vertical', label: 'Estructura Vertical', desc: 'Torres · Departamentos', icon: 'apartment' },
                  { id: 'horizontal', label: 'Estructura Horizontal', desc: 'Privadas · Casas', icon: 'holiday_village' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (bc.groupingMode === mode.id) return;
                      onRequestGroupingModeChange(mode.id as 'vertical' | 'horizontal');
                    }}
                    className={`flex-1 flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                      bc.groupingMode === mode.id 
                        ? 'border-slate-900 bg-white text-slate-900 shadow-xl' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl">{mode.icon}</span>
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-tight">{mode.label}</p>
                      <p className="text-[9px] font-medium mt-0.5 opacity-60">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </FieldGroup>

            {/* Digital Twin Summary — StatBar */}
            <div className="mt-6">
              <StatBar stats={[
                { label: containerLabelPlural, value: topoStats.containerCount, icon: bc.groupingMode === 'vertical' ? 'apartment' : 'holiday_village', color: 'bg-slate-100 text-slate-600' },
                { label: unitLabel, value: topoStats.totalUnits, icon: 'door_front', color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Estacionamientos', value: topoStats.totalParking, icon: 'local_parking', color: 'bg-blue-50 text-blue-600' },
                { label: 'Bodegas', value: topoStats.totalStorage, icon: 'warehouse', color: 'bg-amber-50 text-amber-600' },
              ]} />
            </div>

            {/* Topology section header + container count */}
            <div className="flex items-center justify-between mt-8 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-500 border border-slate-100 shadow-sm">
                  <span className="material-symbols-outlined text-lg">domain_add</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Topología</h4>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Configuración de {containerLabelPlural} y {unitLabel}</p>
                </div>
              </div>
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
                        name: `${containerLabel} ${String.fromCharCode(65 + i)}`, 
                        unitsCount: 10,
                        parkingCount: 0,
                        storageCount: 0
                      });
                    }
                  } else {
                    newContainers.splice(count);
                  }
                  update('topology', { ...bc.topology, containers: newContainers });
                }}
                className="h-10 bg-white border border-slate-200 rounded-xl px-4 text-[11px] font-black shadow-sm focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer hover:border-slate-300 transition-colors"
              >
                {[1, 2, 3, 4].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? containerLabel : containerLabelPlural}</option>
                ))}
              </select>
            </div>

            {/* Topology Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bc.topology?.containers?.map((container, idx) => (
                <TopologyCard
                  key={container.id}
                  index={idx}
                  label={containerLabel}
                  name={container.name}
                  units={container.unitsCount}
                  parking={container.parkingCount}
                  storage={container.storageCount}
                  onNameChange={(v) => {
                    const updated = [...(bc.topology?.containers || [])];
                    updated[idx] = { ...updated[idx], name: v };
                    update('topology', { ...bc.topology, containers: updated });
                  }}
                  onUnitsChange={(v) => {
                    const updated = [...(bc.topology?.containers || [])];
                    updated[idx] = { ...updated[idx], unitsCount: v };
                    update('topology', { ...bc.topology, containers: updated });
                  }}
                  onParkingChange={(v) => {
                    const updated = [...(bc.topology?.containers || [])];
                    updated[idx] = { ...updated[idx], parkingCount: v };
                    update('topology', { ...bc.topology, containers: updated });
                  }}
                  onStorageChange={(v) => {
                    const updated = [...(bc.topology?.containers || [])];
                    updated[idx] = { ...updated[idx], storageCount: v };
                    update('topology', { ...bc.topology, containers: updated });
                  }}
                />
              ))}
            </div>

            <SaveFooter handleSave={handleSave} saved={saved} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* AMENIDADES TAB                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'amenidades' && (
          <AmenidadesTab
            amenities={amenities}
            handleDeleteAmenity={handleDeleteAmenity}
            handleAddAmenity={handleAddAmenity}
            handleSave={handleSave}
            saved={saved}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* EQUIPAMIENTO TAB                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === 'equipamiento' && (
          <EquipamientoTab
            equipment={bc.equipment}
            containers={bc.topology?.containers || []}
            groupingMode={bc.groupingMode}
            update={update}
            handleSave={handleSave}
            saved={saved}
          />
        )}
      </SettingsCard>
    </div>
  )
}
