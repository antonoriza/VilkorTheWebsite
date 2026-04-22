import { useState } from 'react'
import { BuildingConfig, EGRESO_CATEGORIA_LABELS, EgresoCategoria, SurchargeConfig, BankingConfig } from '../../../types'

// ─── Shared ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'catalogo',    label: 'Catálogo Financiero', icon: 'receipt_long' },
  { id: 'cuentas',     label: 'Cuentas y Bancos',   icon: 'account_balance' },
]

interface Props {
  bc: BuildingConfig
  dispatch: React.Dispatch<any>
  handleSave: () => void
  saved: boolean
  labelClass: string
  inputClass: string
}

// ─── Save Footer ──────────────────────────────────────────────────────────────

function SaveFooter({ handleSave, saved }: { handleSave: () => void; saved: boolean }) {
  return (
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
}

// ─── Toggle Util ──────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? 'bg-slate-900' : 'bg-slate-200'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${value ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

// ─── Tab: Cuotas y Reglas ────────────────────────────────────────────────────

function CuotasTab({ bc, dispatch, handleSave: _handleSave, saved: _saved }: Props) {
  const totalUnits = bc.totalUnits
  const projected = totalUnits * bc.monthlyFee
  const surcharge = bc.surcharge || { enabled: false, type: 'percent', amount: 5, graceDays: 10, frequency: 'monthly' }

  const updateSurcharge = (patch: Partial<SurchargeConfig>) =>
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { surcharge: { ...surcharge, ...patch } } })



  return (
    <div className="animate-in fade-in duration-500 space-y-10">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Cuota Base Card */}
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-7 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-[4rem]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[20px]">payments</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuota de Mantenimiento</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Cargo mensual por unidad</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-[11px] font-black text-slate-400 uppercase">$</span>
              <input
                type="number"
                value={bc.monthlyFee}
                onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { monthlyFee: parseFloat(e.target.value) || 0 } })}
                className="text-4xl font-black text-slate-900 bg-transparent border-none outline-none w-40 tracking-tight"
              />
              <span className="text-[11px] font-bold text-slate-400 uppercase">MXN/mes</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
              <span className="material-symbols-outlined text-[12px]">calculate</span>
              <span>{totalUnits} unidades × ${bc.monthlyFee.toLocaleString()} = </span>
              <span className="text-slate-900 font-black">${projected.toLocaleString()} /mes</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Cuota Fija</span>
              <span className="text-[8px] text-slate-300 font-bold ml-1">· Proporcional al indiviso próximamente</span>
            </div>
          </div>
        </div>

        {/* Recargos Moratorios Card */}
        <div className={`relative overflow-hidden border rounded-3xl p-7 hover:shadow-lg transition-all ${surcharge.enabled ? 'bg-white border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[4rem] bg-gradient-to-bl ${surcharge.enabled ? 'from-rose-50' : 'from-slate-50'} to-transparent`} />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${surcharge.enabled ? 'bg-rose-600' : 'bg-rose-100'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${surcharge.enabled ? 'text-white' : 'text-rose-600'}`}>trending_up</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recargos Moratorios</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Penalización por mora</p>
                </div>
              </div>
              <Toggle value={surcharge.enabled} onChange={(v) => updateSurcharge({ enabled: v })} />
            </div>

            {surcharge.enabled ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Type toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSurcharge({ type: 'percent' })}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${surcharge.type === 'percent' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    onClick={() => updateSurcharge({ type: 'fixed' })}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${surcharge.type === 'fixed' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                  >
                    $ Monto Fijo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">
                      {surcharge.type === 'percent' ? 'Porcentaje (%)' : 'Monto (MXN)'}
                    </p>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <span className="text-[10px] font-black text-slate-400 pl-3">
                        {surcharge.type === 'percent' ? '%' : '$'}
                      </span>
                      <input
                        type="number"
                        value={surcharge.amount}
                        min={0}
                        max={surcharge.type === 'percent' ? 100 : 99999}
                        onChange={(e) => updateSurcharge({ amount: parseFloat(e.target.value) || 0 })}
                        className="flex-1 bg-transparent px-2 py-2.5 text-[12px] font-black text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Días de gracia</p>
                    <select
                      value={surcharge.graceDays}
                      onChange={(e) => updateSurcharge({ graceDays: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
                    >
                      {[0, 5, 10, 15, 30].map(d => (
                        <option key={d} value={d}>{d === 0 ? 'Sin gracia' : `${d} días`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 bg-rose-50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-[14px]">info</span>
                    <p className="text-[9px] font-bold text-rose-700">
                      {surcharge.graceDays > 0 ? `Se aplica ${surcharge.graceDays} días después del vencimiento` : 'Se aplica en cuanto vence el cargo'}
                      {surcharge.type === 'percent' ? ` · ${surcharge.amount}%` : ` · $${surcharge.amount} MXN`} / mes
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-6">
                <span className="material-symbols-outlined text-slate-200 text-3xl">trending_flat</span>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin recargos activados</p>
                  <p className="text-[9px] text-slate-300 font-medium mt-0.5">Activa el toggle para configurar penalizaciones por mora.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reglas de Vencimiento ── */}
      <div className="space-y-5">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Reglas de Vencimiento</h4>
        <p className="text-[10px] text-slate-400 font-medium ml-1 -mt-2">
          Define cuándo un cargo pendiente se convierte en adeudo vencido. El agente usa estas reglas para automatizar el cobro.
        </p>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-100">
          {[
            { key: 'mantenimiento', label: 'Mantenimiento', sub: 'Cuota ordinaria', icon: 'home', color: 'bg-blue-50 text-blue-600', badgeColor: 'text-blue-600 bg-blue-50',
              value: bc.maturityRules.mantenimiento,
              options: [{ v: 'next_month_01', l: 'Día 01 del mes siguiente' }, { v: 'next_month_10', l: 'Día 10 (Gracia)' }, { v: 'current_month_end', l: 'Último día del mes' }] },
            { key: 'amenidad', label: 'Amenidades', sub: 'Reservaciones', icon: 'sports_tennis', color: 'bg-violet-50 text-violet-600', badgeColor: 'text-violet-600 bg-violet-50',
              value: bc.maturityRules.amenidad,
              options: [{ v: 'day_of_event', l: 'Día del evento' }, { v: '1_day_before', l: '24h antes' }, { v: 'immediate', l: 'Inmediato' }] },
            { key: 'multaOtros', label: 'Multas y Otros', sub: 'Cargos disciplinarios', icon: 'gavel', color: 'bg-amber-50 text-amber-600', badgeColor: 'text-amber-600 bg-amber-50',
              value: bc.maturityRules.multaOtros,
              options: [{ v: 'immediate', l: 'Inmediato' }, { v: '7_days_grace', l: '7 días de gracia' }] },
          ].map((rule) => (
            <div key={rule.key} className="grid grid-cols-12 items-center px-6 py-5 gap-4 hover:bg-slate-50/50 transition-all">
              <div className="col-span-5 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${rule.color}`}>
                  <span className="material-symbols-outlined text-[16px]">{rule.icon}</span>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{rule.label}</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{rule.sub}</p>
                </div>
              </div>
              <div className="col-span-4">
                <select
                  value={rule.value}
                  onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { maturityRules: { ...bc.maturityRules, [rule.key]: e.target.value } } })}
                  className="w-full bg-transparent border border-slate-100 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:border-slate-900 transition-all cursor-pointer"
                >
                  {rule.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div className="col-span-3 flex justify-end">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${rule.badgeColor}`}>
                  {rule.options.find(o => o.v === rule.value)?.l.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Tab: Conceptos ───────────────────────────────────────────────────────────

const CONCEPTO_META: Record<string, { type: 'recurrente' | 'eventual'; icon: string; color: string; desc: string }> = {
  'Mantenimiento':    { type: 'recurrente', icon: 'home',         color: 'bg-blue-50 text-blue-700 border-blue-100',       desc: 'Auto-generado cada mes' },
  'Multa':            { type: 'eventual',   icon: 'gavel',        color: 'bg-rose-50 text-rose-700 border-rose-100',       desc: 'Registro manual por infracción' },
  'Reserva Amenidad': { type: 'eventual',   icon: 'sports_tennis',color: 'bg-violet-50 text-violet-700 border-violet-100', desc: 'Auto-cobro al reservar' },
  'Otros':            { type: 'eventual',   icon: 'more_horiz',   color: 'bg-slate-100 text-slate-600 border-slate-200',   desc: 'Cargo general — manual' },
}
const DEFAULT_META = { type: 'eventual' as const, icon: 'receipt_long', color: 'bg-slate-100 text-slate-600 border-slate-200', desc: 'Concepto personalizado' }

function ConceptosTab({ bc, dispatch, handleSave: _handleSave, saved: _saved }: Props) {
  const [newConcepto, setNewConcepto] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newSub, setNewSub] = useState('')

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="hidden md:grid grid-cols-12 gap-4 px-5 mb-1">
        <div className="col-span-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Concepto</div>
        <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Tipo</div>
        <div className="col-span-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Comportamiento</div>
        <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-right">Sub-conceptos</div>
        <div className="col-span-1" />
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-100">
        {bc.conceptosPago.map((c) => {
          const meta = CONCEPTO_META[c] || DEFAULT_META
          const subs = bc.subConceptos?.[c] || []
          const isOpen = expanded === c

          return (
            <div key={c} className="group">
              <div className="grid grid-cols-12 items-center px-5 py-4 gap-4 hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => setExpanded(isOpen ? null : c)}>
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{c}</span>
                    {c === 'Mantenimiento' && <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">Oblig.</span>}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${meta.type === 'recurrente' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {meta.type}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-[9px] text-slate-400 font-medium">{meta.desc}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-[10px] font-black text-slate-300">{subs.length > 0 ? subs.length : '—'}</span>
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-300 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
                  {c !== 'Mantenimiento' && (
                    <button onClick={(e) => { e.stopPropagation(); const u = bc.conceptosPago.filter(x => x !== c); const us = { ...bc.subConceptos }; delete us[c]; dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: u, subConceptos: us } }) }} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="px-6 pb-5 pt-2 bg-slate-50/70 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="ml-12 space-y-2">
                    {subs.length === 0 && <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest py-2">Sin sub-conceptos definidos</p>}
                    {subs.map(sub => (
                      <div key={sub} className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-100 rounded-xl group/sub hover:border-slate-200 transition-all">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-bold text-slate-700">{sub}</span>
                        </div>
                        <button onClick={() => { const u = { ...bc.subConceptos }; u[c] = (u[c] || []).filter(s => s !== sub); if (u[c].length === 0) delete u[c]; dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: u } }) }} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover/sub:opacity-100 transition-all">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                    <input type="text" value={newSub} onChange={e => setNewSub(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { const val = newSub.trim(); if (!val || subs.includes(val)) return; const u = { ...bc.subConceptos }; u[c] = [...(u[c] || []), val]; dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: u } }); setNewSub('') } }}
                      placeholder="Agregar sub-concepto… (Enter)"
                      className="w-full bg-white border border-dashed border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:border-slate-400 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 items-center">
        <input type="text" value={newConcepto} onChange={e => setNewConcepto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { const val = newConcepto.trim(); if (!val || bc.conceptosPago.includes(val)) return; dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: [...bc.conceptosPago, val] } }); setNewConcepto('') } }}
          placeholder="Nuevo concepto de cobro… (Enter)"
          className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded-2xl px-5 py-3.5 text-[10px] font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:border-slate-400 hover:border-slate-300 transition-all"
        />
      </div>

      <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4">
        <span className="material-symbols-outlined text-slate-400 text-xl">smart_toy</span>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Estos conceptos alimentan los selectores de <strong className="text-slate-700">Pagos</strong> y el motor de cobro automático. Los <em>recurrentes</em> generan cargos mensuales; los <em>eventuales</em> se registran bajo demanda.
        </p>
      </div>

    </div>
  )
}

// ─── Tab: Egresos Recurrentes ─────────────────────────────────────────────────

function RecurrentesTab({ bc, dispatch, handleSave, saved, labelClass, inputClass }: Props) {
  const [form, setForm] = useState({ concepto: '', categoria: 'nomina' as EgresoCategoria, amount: '', description: '' })
  const total = (bc.recurringEgresos || []).reduce((s, r) => s + r.amount, 0)

  const handleAdd = () => {
    if (!form.concepto.trim() || !form.amount) return
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { recurringEgresos: [...(bc.recurringEgresos || []), { id: `re-${Date.now()}`, concepto: form.concepto.trim(), categoria: form.categoria, amount: parseFloat(form.amount), description: form.description }] } })
    setForm({ concepto: '', categoria: 'nomina', amount: '', description: '' })
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {(bc.recurringEgresos || []).length > 0 && (
        <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]">stat_minus_1</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Egreso Operativo Mensual</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">${total.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">MXN/mes</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400">{(bc.recurringEgresos || []).length} partidas</p>
            <p className="text-[9px] font-bold text-slate-300">Auto-generadas cada mes</p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {(bc.recurringEgresos || []).length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
            <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">Sin egresos recurrentes configurados. Agrégalos para que el agente los contabilice automáticamente cada mes.</p>
          </div>
        ) : (bc.recurringEgresos || []).map(re => (
          <div key={re.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px] text-slate-400">autorenew</span>
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{re.concepto}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{EGRESO_CATEGORIA_LABELS[re.categoria]}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-black text-slate-900 font-mono">${re.amount.toLocaleString()}</p>
              <button onClick={() => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { recurringEgresos: (bc.recurringEgresos || []).filter(r => r.id !== re.id) } })} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Agregar Egreso</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Concepto</label><input type="text" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Nómina Porteros" className={inputClass} /></div>
          <div><label className={labelClass}>Monto (MXN/mes)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inputClass} /></div>
          <div><label className={labelClass}>Categoría</label>
            <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as EgresoCategoria })} className={inputClass}>
              {Object.entries(EGRESO_CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Descripción (opcional)</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Nota interna…" className={inputClass} /></div>
        </div>
        <button onClick={handleAdd} className="h-11 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all">Agregar Egreso</button>
      </div>
      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Tab: Cuentas y Bancos ────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { key: 'acceptsTransfer', label: 'Transferencia / SPEI', icon: 'account_balance', color: 'bg-blue-50 text-blue-600' },
  { key: 'acceptsCash',     label: 'Efectivo',            icon: 'payments',         color: 'bg-emerald-50 text-emerald-600' },
  { key: 'acceptsOxxo',     label: 'OXXO Pay',            icon: 'store',            color: 'bg-red-50 text-red-600' },
]

function formatClabe(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 18)
}

function CuentasTab({ bc, dispatch, handleSave, saved, labelClass, inputClass }: Props) {
  const banking = bc.banking || { clabe: '', bankName: '', accountHolder: '', acceptsTransfer: true, acceptsCash: false, acceptsOxxo: false, referenceFormat: 'apartment', notes: '' }

  const update = (patch: Partial<BankingConfig>) =>
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { banking: { ...banking, ...patch } } })

  const clabeFormatted = banking.clabe.replace(/(\d{4})(?=\d)/g, '$1 ')

  return (
    <div className="animate-in fade-in duration-500 space-y-10">

      {/* ── Datos Bancarios ── */}
      <div className="space-y-5">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Datos Bancarios</h4>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
          {/* CLABE */}
          <div>
            <label className={labelClass}>CLABE Interbancaria</label>
            <div className="relative">
              <input
                type="text"
                value={clabeFormatted}
                onChange={e => update({ clabe: formatClabe(e.target.value) })}
                placeholder="0000 0000 0000 0000 00"
                maxLength={22} // 18 digits + 4 spaces
                className={`${inputClass} font-mono tracking-widest pr-14`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {banking.clabe.length === 18 ? (
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                ) : (
                  <span className="text-[9px] font-black text-slate-300">{banking.clabe.length}/18</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Banco</label>
              <input type="text" value={banking.bankName} onChange={e => update({ bankName: e.target.value })} placeholder="BBVA, Santander, HSBC…" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nombre del Titular</label>
              <input type="text" value={banking.accountHolder} onChange={e => update({ accountHolder: e.target.value })} placeholder="Razón social o nombre" className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Métodos de Pago ── */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Métodos Aceptados</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map(method => {
            const isActive = banking[method.key as keyof BankingConfig] as boolean
            return (
              <button
                key={method.key}
                onClick={() => update({ [method.key]: !isActive })}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left ${isActive ? 'border-slate-900 bg-white shadow-lg shadow-slate-100' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isActive ? method.color : 'bg-slate-100'}`}>
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? '' : 'text-slate-300'}`}>{method.icon}</span>
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{method.label}</p>
                  <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-300'}`}>
                    {isActive ? 'Habilitado' : 'Deshabilitado'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Formato de Referencia ── */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Referencia de Pago</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { v: 'apartment', label: 'Número de Departamento', desc: 'El residente usa su depto. como referencia (e.g. "A101")' },
            { v: 'custom', label: 'Instrucción Personalizada', desc: 'Define una referencia fija o formato para todos los residentes' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => update({ referenceFormat: opt.v as 'apartment' | 'custom' })}
              className={`p-5 text-left rounded-3xl border-2 transition-all ${banking.referenceFormat === opt.v ? 'border-slate-900 bg-white shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${banking.referenceFormat === opt.v ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                  {banking.referenceFormat === opt.v && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-tight ${banking.referenceFormat === opt.v ? 'text-slate-900' : 'text-slate-400'}`}>{opt.label}</p>
              </div>
              <p className="text-[9px] text-slate-400 font-medium ml-6">{opt.desc}</p>
            </button>
          ))}
        </div>
        {banking.referenceFormat === 'custom' && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <label className={labelClass}>Nota de referencia personalizada</label>
            <input type="text" value={banking.customReferenceNote || ''} onChange={e => update({ customReferenceNote: e.target.value })} placeholder="Ej: LOTE-[DEPTO]-MANT" className={inputClass} />
          </div>
        )}
      </div>

      {/* ── Instrucciones adicionales ── */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Notas para Residentes</h4>
        <p className="text-[10px] text-slate-400 font-medium ml-1 -mt-2">Se muestra en el recibo de pago y en las instrucciones de cobro.</p>
        <textarea
          value={banking.notes || ''}
          onChange={e => update({ notes: e.target.value })}
          rows={3}
          placeholder="Instrucciones especiales para residentes al momento de pagar…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Preview card */}
      {banking.clabe && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 animate-in fade-in duration-300">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vista Previa — Instrucciones de Pago</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Banco</span>
              <span className="text-[11px] font-black text-white">{banking.bankName || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Titular</span>
              <span className="text-[11px] font-black text-white">{banking.accountHolder || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CLABE</span>
              <span className="text-[12px] font-black text-white font-mono tracking-wider">{clabeFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Referencia</span>
              <span className="text-[11px] font-bold text-slate-300">{banking.referenceFormat === 'apartment' ? 'Número de departamento' : (banking.customReferenceNote || '—')}</span>
            </div>
          </div>
          {banking.notes && <p className="text-[9px] text-slate-400 font-medium border-t border-slate-800 pt-3">{banking.notes}</p>}
        </div>
      )}

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FinanceSettings({ bc, dispatch, handleSave, saved, labelClass, inputClass }: Props) {
  const [activeTab, setActiveTab] = useState('catalogo')
  const [mensualidadOpen, setMensualidadOpen] = useState(false)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-1 mb-10 border-b border-slate-100 pb-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'catalogo' && (
        <div className="space-y-12">

          {/* ═══ MENSUALIDAD HERO CARD ═══ */}
          <div className={`border-2 rounded-[2rem] overflow-hidden transition-all duration-300 ${mensualidadOpen ? 'border-slate-900 shadow-2xl shadow-slate-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'}`}>
            {/* Collapsed header — always visible */}
            <button
              onClick={() => setMensualidadOpen(!mensualidadOpen)}
              className="w-full flex items-center justify-between p-6 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">home</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-headline font-black text-slate-900 uppercase tracking-tight">Mensualidad</h3>
                    <span className="text-[7px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Sistema</span>
                    <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Recurrente</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cuota de mantenimiento · Auto-generada cada mes por unidad</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 tracking-tight">${bc.monthlyFee.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MXN / mes</p>
                </div>
                <span className={`material-symbols-outlined text-slate-300 text-xl transition-transform duration-300 ${mensualidadOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </div>
            </button>

            {/* Expanded detail — cuota config inline */}
            {mensualidadOpen && (
              <div className="border-t border-slate-100 bg-slate-50/30 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <CuotasTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />
              </div>
            )}
          </div>

          {/* ═══ OTROS CONCEPTOS ═══ */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-500 text-lg">receipt_long</span>
              </div>
              <div>
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Otros Conceptos de Cobro</h3>
                <p className="text-[9px] text-slate-400 font-medium">Multas, reservaciones, cargos eventuales y personalizados</p>
              </div>
            </div>
            <ConceptosTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />
          </section>

          {/* ═══ DIVIDER ═══ */}
          <div className="border-t-2 border-dashed border-slate-100" />

          {/* ═══ EGRESOS ═══ */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-rose-500 text-xl">trending_down</span>
              </div>
              <div>
                <h3 className="text-sm font-headline font-black text-slate-900 uppercase tracking-tight">Egresos Operativos</h3>
                <p className="text-[10px] text-slate-400 font-medium">Gastos fijos mensuales que el agente contabiliza automáticamente</p>
              </div>
            </div>
            <RecurrentesTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />
          </section>

          {/* ═══ RESUMEN FINANCIERO ═══ */}
          {(() => {
            const ingreso = bc.totalUnits * bc.monthlyFee
            const egreso = (bc.recurringEgresos || []).reduce((s, r) => s + r.amount, 0)
            const margen = ingreso > 0 ? Math.round(((ingreso - egreso) / ingreso) * 100) : 0
            return (
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">Resumen Financiero Mensual</p>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Ingreso Proyectado</p>
                    <p className="text-2xl font-black tracking-tight">${ingreso.toLocaleString()}</p>
                    <p className="text-[8px] text-slate-500 font-bold mt-1">{bc.totalUnits} unidades × ${bc.monthlyFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Egreso Operativo</p>
                    <p className="text-2xl font-black tracking-tight">${egreso.toLocaleString()}</p>
                    <p className="text-[8px] text-slate-500 font-bold mt-1">{(bc.recurringEgresos || []).length} partidas fijas</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1">Margen Operativo</p>
                    <p className="text-2xl font-black tracking-tight">${(ingreso - egreso).toLocaleString()}</p>
                    <p className={`text-[8px] font-black mt-1 ${margen >= 50 ? 'text-emerald-400' : margen >= 20 ? 'text-amber-400' : 'text-rose-400'}`}>{margen}% del ingreso</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {activeTab === 'cuentas' && <CuentasTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />}
    </div>
  )
}
