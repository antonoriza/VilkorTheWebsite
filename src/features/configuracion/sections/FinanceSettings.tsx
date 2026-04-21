import { useState } from 'react'
import { BuildingConfig, EGRESO_CATEGORIA_LABELS, EgresoCategoria } from '../../../core/store/seed'

// ─── Shared ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'cuotas',      label: 'Cuotas y Reglas',       icon: 'gavel' },
  { id: 'catalogo',    label: 'Catálogo',                icon: 'receipt_long' },
  { id: 'recurrentes', label: 'Egresos Recurrentes',    icon: 'autorenew' },
  { id: 'cuentas',     label: 'Cuentas y Bancos',       icon: 'account_balance' },
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

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
        <span className="material-symbols-outlined text-slate-300 text-3xl">construction</span>
      </div>
      <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{label}</p>
      <p className="text-[11px] text-slate-400 font-medium">Módulo en construcción para el próximo release.</p>
    </div>
  )
}

// ─── Tab: Cuotas y Reglas ────────────────────────────────────────────────────

function CuotasTab({ bc, dispatch, handleSave, saved, labelClass, inputClass }: Props) {
  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      {/* Monthly Fee */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Cuota Base</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Mantenimiento Mensual (MXN)</label>
            <input
              type="number"
              value={bc.monthlyFee}
              onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { monthlyFee: parseFloat(e.target.value) || 0 } })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Maturity Rules */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Reglas de Vencimiento</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>Mantenimiento</label>
            <select
              value={bc.maturityRules.mantenimiento}
              onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { maturityRules: { ...bc.maturityRules, mantenimiento: e.target.value as any } } })}
              className={inputClass}
            >
              <option value="next_month_01">Día 01 del mes siguiente</option>
              <option value="next_month_10">Día 10 del mes siguiente (Gracia)</option>
              <option value="current_month_end">Último día del mes en curso</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Amenidades</label>
            <select
              value={bc.maturityRules.amenidad}
              onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { maturityRules: { ...bc.maturityRules, amenidad: e.target.value as any } } })}
              className={inputClass}
            >
              <option value="day_of_event">Día del evento (00:00h)</option>
              <option value="1_day_before">24h antes del evento</option>
              <option value="immediate">Inmediato al reservar</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Multas y Otros Cargos</label>
            <select
              value={bc.maturityRules.multaOtros}
              onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { maturityRules: { ...bc.maturityRules, multaOtros: e.target.value as any } } })}
              className={inputClass}
            >
              <option value="immediate">Inmediato al registro</option>
              <option value="7_days_grace">7 días de gracia</option>
            </select>
          </div>
        </div>
      </div>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Tab: Catálogo de Conceptos ──────────────────────────────────────────────

function CatalogoTab({ bc, dispatch, handleSave, saved, inputClass }: Props & { inputClass: string }) {
  const [newConcepto, setNewConcepto] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newSub, setNewSub] = useState('')

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="space-y-2">
        {bc.conceptosPago.map((c) => {
          const subs = bc.subConceptos?.[c] || []
          const isOpen = expanded === c
          return (
            <div key={c} className="rounded-2xl border border-slate-100 hover:border-slate-200 transition-all overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : c)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span
                    className="material-symbols-outlined text-[14px] text-slate-400 transition-transform duration-200"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  >chevron_right</span>
                  <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{c}</span>
                  {c === 'Mantenimiento' && (
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">Obligatorio</span>
                  )}
                  {subs.length > 0 && (
                    <span className="text-[8px] font-bold text-slate-400">{subs.length} sub-conceptos</span>
                  )}
                </button>
                {c !== 'Mantenimiento' && (
                  <button
                    onClick={() => {
                      const updated = bc.conceptosPago.filter((x) => x !== c)
                      const updatedSubs = { ...bc.subConceptos }
                      delete updatedSubs[c]
                      dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: updated, subConceptos: updatedSubs } })
                    }}
                    className="text-slate-200 hover:text-rose-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="px-5 pb-4 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-2">
                  {subs.map((sub) => (
                    <div key={sub} className="flex items-center justify-between px-4 py-2 bg-white border border-slate-100 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-700">{sub}</span>
                      <button
                        onClick={() => {
                          const updated = { ...bc.subConceptos }
                          updated[c] = (updated[c] || []).filter((s) => s !== sub)
                          if (updated[c].length === 0) delete updated[c]
                          dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: updated } })
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = newSub.trim()
                        if (!val || subs.includes(val)) return
                        const updated = { ...bc.subConceptos }
                        updated[c] = [...(updated[c] || []), val]
                        dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: updated } })
                        setNewSub('')
                      }
                    }}
                    placeholder="Agregar sub-concepto… (Enter)"
                    className={inputClass + ' !py-2 !text-[11px]'}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add new concepto */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newConcepto}
          onChange={(e) => setNewConcepto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = newConcepto.trim()
              if (!val || bc.conceptosPago.includes(val)) return
              dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: [...bc.conceptosPago, val] } })
              setNewConcepto('')
            }
          }}
          placeholder="Nuevo concepto… (Enter)"
          className={inputClass + ' flex-1'}
        />
      </div>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Tab: Egresos Recurrentes ─────────────────────────────────────────────────

function RecurrentesTab({ bc, dispatch, handleSave, saved, labelClass, inputClass }: Props) {
  const [form, setForm] = useState({ concepto: '', categoria: 'nomina' as EgresoCategoria, amount: '', description: '' })

  const handleAdd = () => {
    if (!form.concepto.trim() || !form.amount) return
    const newItem = {
      id: `re-${Date.now()}`,
      concepto: form.concepto.trim(),
      categoria: form.categoria,
      amount: parseFloat(form.amount),
      description: form.description
    }
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { recurringEgresos: [...(bc.recurringEgresos || []), newItem] } })
    setForm({ concepto: '', categoria: 'nomina', amount: '', description: '' })
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* List */}
      <div className="space-y-2">
        {(bc.recurringEgresos || []).length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
            <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">Sin egresos recurrentes configurados. Agrégalos para que el agente los contabilice automáticamente cada mes.</p>
          </div>
        ) : (bc.recurringEgresos || []).map((re) => (
          <div key={re.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 transition-all group">
            <div>
              <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{re.concepto}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {EGRESO_CATEGORIA_LABELS[re.categoria]} · ${re.amount.toLocaleString()} MXN/mes
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { recurringEgresos: (bc.recurringEgresos || []).filter((r) => r.id !== re.id) } })}
              className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="space-y-4 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Agregar Egreso</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Concepto</label>
            <input type="text" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Nómina Porteros" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Monto (MXN/mes)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as EgresoCategoria })} className={inputClass}>
              {Object.entries(EGRESO_CATEGORIA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Descripción (opcional)</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Nota interna…" className={inputClass} />
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="h-11 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all"
        >
          Agregar Egreso
        </button>
      </div>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Main: FinanceSettings ────────────────────────────────────────────────────

export default function FinanceSettings({ bc, dispatch, handleSave, saved, labelClass, inputClass }: Props) {
  const [activeTab, setActiveTab] = useState('cuotas')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Bar */}
      <div className="flex gap-1 mb-10 border-b border-slate-100 pb-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === t.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'cuotas'      && <CuotasTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />}
      {activeTab === 'catalogo'    && <CatalogoTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />}
      {activeTab === 'recurrentes' && <RecurrentesTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />}
      {activeTab === 'cuentas'     && <ComingSoon label="Cuentas y Bancos" />}
    </div>
  )
}
