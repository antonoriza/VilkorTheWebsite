import React from 'react'
import { BuildingConfig } from '../../../core/store/seed'

interface Props {
  bc: BuildingConfig
  update: (key: string, value: string | number) => void
  labelClass: string
  inputClass: string
}

export default function GeneralSettings({ bc, update, labelClass, inputClass }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Admin Profile */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">person</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Perfil del Administrador</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={bc.adminName} onChange={(e) => update('adminName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" value={bc.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Email</label>
            <input type="email" value={bc.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Building Info */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">apartment</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Información del Edificio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre del Edificio</label>
            <input type="text" value={bc.buildingName} onChange={(e) => update('buildingName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Empresa Administradora</label>
            <input type="text" value={bc.managementCompany} onChange={(e) => update('managementCompany', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input type="text" value={bc.buildingAddress} onChange={(e) => update('buildingAddress', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total de Unidades</label>
            <input type="number" value={bc.totalUnits} onChange={(e) => update('totalUnits', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cuota Mensual (MXN)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input type="number" value={bc.monthlyFee || ''}
                onChange={(e) => update('monthlyFee', Number(e.target.value) || 0)}
                className={inputClass + ' !pl-8'} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
