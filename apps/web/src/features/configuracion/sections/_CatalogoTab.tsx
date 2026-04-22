import { useState } from 'react'
import { BuildingConfig, ConceptoFinanciero, ConceptoCategoria, CONCEPTO_CATEGORIA_LABELS } from '../../../types'

interface Props {
  bc: BuildingConfig
  dispatch: (a: any) => void
  handleSave: () => void
  saved: boolean
}

const DEFAULT_MENSUALIDAD: ConceptoFinanciero = {
  id: 'mensualidad',
  concepto: 'Mensualidad',
  monto: 0,
  categoria: 'ingreso',
  descripcion: 'Cuota de mantenimiento mensual',
  vencimiento: 'next_month_01',
  diasGracia: 10,
  recargoPct: 5,
  recargoMonto: null,
  sistema: true,
}

const VENCIMIENTO_OPTIONS = [
  { v: 'next_month_01', l: 'Día 01 mes sig.' },
  { v: 'next_month_10', l: 'Día 10 (gracia)' },
  { v: 'current_month_end', l: 'Último día mes' },
  { v: 'immediate', l: 'Inmediato' },
  { v: 'na', l: 'N/A' },
]

const CATEGORIA_COLORS: Record<ConceptoCategoria, string> = {
  ingreso: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  egreso: 'bg-rose-50 text-rose-700 border-rose-100',
}

const EMPTY_ROW: Omit<ConceptoFinanciero, 'id'> = {
  concepto: '', monto: 0, categoria: 'ingreso', descripcion: '',
  vencimiento: 'na', diasGracia: 0, recargoPct: null, recargoMonto: null,
}

const SUB_TABS = [
  { id: 'resumen', label: 'Resumen Financiero', icon: 'analytics' },
  { id: 'conceptos', label: 'Conceptos', icon: 'receipt_long' },
]

export default function CatalogoTab({ bc, dispatch, handleSave, saved }: Props) {
  const [subTab, setSubTab] = useState('resumen')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ ...EMPTY_ROW })

  // Derive conceptos — always guarantee Mensualidad system entry is present
  const conceptos: ConceptoFinanciero[] = (() => {
    const saved = bc.conceptosFinancieros ?? []
    // Build the canonical Mensualidad from legacy fields or existing entry
    const existingMens = saved.find(c => c.id === 'mensualidad')
    const mensualidad: ConceptoFinanciero = {
      ...DEFAULT_MENSUALIDAD,
      monto: existingMens?.monto ?? bc.monthlyFee ?? 0,
      diasGracia: existingMens?.diasGracia ?? bc.surcharge?.graceDays ?? 10,
      recargoPct: existingMens !== undefined
        ? existingMens.recargoPct
        : (bc.surcharge?.type === 'percent' ? (bc.surcharge.amount || 5) : null),
      recargoMonto: existingMens !== undefined
        ? existingMens.recargoMonto
        : (bc.surcharge?.type === 'fixed' ? bc.surcharge.amount : null),
      vencimiento: existingMens?.vencimiento ?? bc.maturityRules?.mantenimiento ?? 'next_month_01',
      descripcion: existingMens?.descripcion ?? DEFAULT_MENSUALIDAD.descripcion,
      // Always force categoria to 'ingreso' for the system entry
      categoria: 'ingreso',
      sistema: true,
    }
    const rest = saved.filter(c => c.id !== 'mensualidad')
    return [mensualidad, ...rest]
  })()

  const save = (updated: ConceptoFinanciero[]) => {
    // Sync legacy fields from Mensualidad entry
    const mens = updated.find(c => c.id === 'mensualidad')
    const legacy: Partial<BuildingConfig> = { conceptosFinancieros: updated }
    if (mens) {
      legacy.monthlyFee = mens.monto
      legacy.surcharge = {
        enabled: (mens.recargoPct ?? 0) > 0 || (mens.recargoMonto ?? 0) > 0,
        type: mens.recargoPct != null ? 'percent' : 'fixed',
        amount: mens.recargoPct ?? mens.recargoMonto ?? 0,
        graceDays: mens.diasGracia,
        frequency: 'monthly',
      }
    }
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: legacy })
  }

  const updateRow = (id: string, patch: Partial<ConceptoFinanciero>) => {
    save(conceptos.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  const removeRow = (id: string) => {
    save(conceptos.filter(c => c.id !== id))
  }

  const addRow = () => {
    if (!draft.concepto.trim()) return
    const row: ConceptoFinanciero = { ...draft, id: `cf-${Date.now()}`, concepto: draft.concepto.trim() }
    save([...conceptos, row])
    setDraft({ ...EMPTY_ROW })
    setAdding(false)
  }

  // Financial summary calcs
  const ingresos = conceptos.filter(c => c.categoria === 'ingreso')
  const egresos = conceptos.filter(c => c.categoria === 'egreso')
  const totalIngreso = ingresos.reduce((s, c) => s + c.monto * (c.id === 'mensualidad' ? bc.totalUnits : 1), 0)
  const totalEgreso = egresos.reduce((s, c) => s + c.monto, 0)
  const margen = totalIngreso > 0 ? Math.round(((totalIngreso - totalEgreso) / totalIngreso) * 100) : 0

  return (
    <div>
      {/* ─── Nested sub-tabs ─── */}
      <div className="flex gap-1 mb-8 border-b border-slate-100 overflow-x-auto">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px ${
              subTab === t.id ? 'text-slate-900 border-slate-900' : 'text-slate-300 border-transparent hover:text-slate-500'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ RESUMEN ═══ */}
      {subTab === 'resumen' && (
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">Resumen Financiero Mensual</p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Ingreso Proyectado</p>
                <p className="text-2xl font-black tracking-tight">${totalIngreso.toLocaleString()}</p>
                <p className="text-[8px] text-slate-500 font-bold mt-1">{ingresos.length} conceptos de ingreso</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-1">Egreso Operativo</p>
                <p className="text-2xl font-black tracking-tight">${totalEgreso.toLocaleString()}</p>
                <p className="text-[8px] text-slate-500 font-bold mt-1">{egresos.length} partidas de egreso</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1">Margen Operativo</p>
                <p className="text-2xl font-black tracking-tight">${(totalIngreso - totalEgreso).toLocaleString()}</p>
                <p className={`text-[8px] font-black mt-1 ${margen >= 50 ? 'text-emerald-400' : margen >= 20 ? 'text-amber-400' : 'text-rose-400'}`}>{margen}% del ingreso</p>
              </div>
            </div>
          </div>

          {/* Quick concept breakdown */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-slate-100 rounded-2xl p-5">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-4">Ingresos</p>
              {ingresos.length === 0 ? <p className="text-[10px] text-slate-300">Sin conceptos</p> : ingresos.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[10px] font-bold text-slate-700">{c.concepto}</span>
                  <span className="text-[10px] font-black text-slate-900">${c.monto.toLocaleString()}{c.id === 'mensualidad' ? ` × ${bc.totalUnits}` : ''}</span>
                </div>
              ))}
            </div>
            <div className="border border-slate-100 rounded-2xl p-5">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-4">Egresos</p>
              {egresos.length === 0 ? <p className="text-[10px] text-slate-300">Sin conceptos</p> : egresos.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[10px] font-bold text-slate-700">{c.concepto}</span>
                  <span className="text-[10px] font-black text-slate-900">${c.monto.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONCEPTOS TABLE ═══ */}
      {subTab === 'conceptos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Catálogo de Conceptos</h3>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Ingresos y egresos en un solo lugar. La mensualidad es un concepto del sistema.</p>
            </div>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Agregar
            </button>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Concepto','Monto','Categoría','Descripción','Vencimiento','Gracia','Recargo %','Recargo $',''].map(h => (
                      <th key={h} className="px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conceptos.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-900">{c.concepto}</span>
                          {c.sistema && <span className="text-[6px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Sistema</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min={0} value={c.monto}
                          onChange={e => updateRow(c.id, { monto: parseFloat(e.target.value) || 0 })}
                          className="w-20 bg-transparent border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.categoria}
                          onChange={e => updateRow(c.id, { categoria: e.target.value as ConceptoCategoria })}
                          disabled={c.sistema}
                          className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${CATEGORIA_COLORS[c.categoria]} ${c.sistema ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          {Object.entries(CONCEPTO_CATEGORIA_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={c.descripcion || ''}
                          onChange={e => updateRow(c.id, { descripcion: e.target.value })}
                          placeholder="—"
                          className="w-28 bg-transparent border border-slate-100 rounded-lg px-2 py-1 text-[9px] text-slate-600 outline-none focus:border-slate-900"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.vencimiento}
                          onChange={e => updateRow(c.id, { vencimiento: e.target.value })}
                          className="bg-transparent border border-slate-100 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
                        >
                          {VENCIMIENTO_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min={0} value={c.diasGracia}
                          onChange={e => updateRow(c.id, { diasGracia: parseInt(e.target.value) || 0 })}
                          className="w-14 bg-transparent border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min={0} step={0.5}
                          value={c.recargoPct ?? ''}
                          onChange={e => {
                            const v = parseFloat(e.target.value)
                            updateRow(c.id, { recargoPct: isNaN(v) ? null : v, recargoMonto: isNaN(v) ? c.recargoMonto : null })
                          }}
                          placeholder="—"
                          disabled={c.recargoMonto != null}
                          className={`w-14 bg-transparent border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 text-center ${c.recargoMonto != null ? 'opacity-30 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min={0}
                          value={c.recargoMonto ?? ''}
                          onChange={e => {
                            const v = parseFloat(e.target.value)
                            updateRow(c.id, { recargoMonto: isNaN(v) ? null : v, recargoPct: isNaN(v) ? c.recargoPct : null })
                          }}
                          placeholder="—"
                          disabled={c.recargoPct != null}
                          className={`w-16 bg-transparent border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-900 outline-none focus:border-slate-900 text-center ${c.recargoPct != null ? 'opacity-30 cursor-not-allowed' : ''}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {!c.sistema && (
                          <button onClick={() => removeRow(c.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-rose-400 text-sm hover:text-rose-600">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
              Los campos <strong>Recargo %</strong> y <strong>Recargo $</strong> son mutuamente exclusivos: al llenar uno se desactiva el otro. La <strong>Mensualidad</strong> es un concepto del sistema y no puede eliminarse.
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4">
            <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all duration-500 ${saved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'}`}>
              <span className="material-symbols-outlined text-sm">{saved ? 'check_circle' : 'save'}</span>
              {saved ? 'Guardado' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Agregar Concepto ═══ */}
      {adding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setAdding(false); setDraft({ ...EMPTY_ROW }) }}
        >
          <div
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">add_circle</span>
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Nuevo Concepto</h2>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Ingreso o egreso al catálogo financiero</p>
                </div>
              </div>
              <button
                onClick={() => { setAdding(false); setDraft({ ...EMPTY_ROW }) }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500 text-sm">close</span>
              </button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* ── Información básica ── */}
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Información Básica</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Concepto *</label>
                    <input
                      value={draft.concepto}
                      onChange={e => setDraft(d => ({ ...d, concepto: e.target.value }))}
                      placeholder="Ej: Multa ruido, Reserva amenidad, Agua..."
                      autoFocus
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-medium text-slate-900 outline-none focus:border-slate-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Monto (MXN)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">$</span>
                      <input
                        type="number" min={0}
                        value={draft.monto || ''}
                        onChange={e => setDraft(d => ({ ...d, monto: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        className="w-full border border-slate-200 rounded-xl pl-6 pr-4 py-2.5 text-[11px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Categoría</label>
                    <div className="flex gap-2">
                      {(['ingreso', 'egreso'] as ConceptoCategoria[]).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setDraft(d => ({ ...d, categoria: cat }))}
                          className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                            draft.categoria === cat
                              ? cat === 'ingreso' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {CONCEPTO_CATEGORIA_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descripción</label>
                    <input
                      value={draft.descripcion || ''}
                      onChange={e => setDraft(d => ({ ...d, descripcion: e.target.value }))}
                      placeholder="Opcional — aparece como nota en el cobro"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] text-slate-600 outline-none focus:border-slate-900 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ── Reglas de vencimiento ── */}
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Reglas de Vencimiento</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha de vencimiento</label>
                    <select
                      value={draft.vencimiento}
                      onChange={e => setDraft(d => ({ ...d, vencimiento: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-700 outline-none focus:border-slate-900 cursor-pointer"
                    >
                      {VENCIMIENTO_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Días de gracia</label>
                    <input
                      type="number" min={0}
                      value={draft.diasGracia || ''}
                      onChange={e => setDraft(d => ({ ...d, diasGracia: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* ── Recargos ── */}
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recargos Moratorios</p>
                <p className="text-[8px] text-slate-400 mb-3">Elige uno: porcentaje <strong>o</strong> monto fijo. Son mutuamente exclusivos.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`transition-opacity ${draft.recargoMonto != null ? 'opacity-30 pointer-events-none' : ''}`}>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      Recargo %
                      {draft.recargoMonto != null && <span className="material-symbols-outlined text-[10px] text-slate-400">lock</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="number" min={0} step={0.5}
                        value={draft.recargoPct ?? ''}
                        onChange={e => { const v = parseFloat(e.target.value); setDraft(d => ({ ...d, recargoPct: isNaN(v) ? null : v, recargoMonto: isNaN(v) ? d.recargoMonto : null })) }}
                        placeholder="—"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                    </div>
                  </div>
                  <div className={`transition-opacity ${draft.recargoPct != null ? 'opacity-30 pointer-events-none' : ''}`}>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      Recargo $
                      {draft.recargoPct != null && <span className="material-symbols-outlined text-[10px] text-slate-400">lock</span>}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">$</span>
                      <input
                        type="number" min={0}
                        value={draft.recargoMonto ?? ''}
                        onChange={e => { const v = parseFloat(e.target.value); setDraft(d => ({ ...d, recargoMonto: isNaN(v) ? null : v, recargoPct: isNaN(v) ? d.recargoPct : null })) }}
                        placeholder="—"
                        className="w-full border border-slate-200 rounded-xl pl-6 pr-4 py-2.5 text-[11px] font-bold text-slate-900 outline-none focus:border-slate-900 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 pb-8">
              <button
                onClick={() => { setAdding(false); setDraft({ ...EMPTY_ROW }) }}
                className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addRow}
                disabled={!draft.concepto.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                Agregar Concepto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
