import { useState } from 'react'
import { BuildingConfig, BankingConfig } from '../../../types'
import { SettingsTabBar, SaveFooter } from '../../../core/components/SettingsShell'
import CatalogoTab from './_CatalogoTab'

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

// ─── Constants for CuentasTab ─────────────────────────────────────────────────

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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'catalogo' && <CatalogoTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} />}

      {activeTab === 'cuentas' && <CuentasTab bc={bc} dispatch={dispatch} handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />}
    </div>
  )
}

