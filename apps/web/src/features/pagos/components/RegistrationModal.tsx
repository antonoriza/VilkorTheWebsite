/**
 * RegistrationModal — unified ingreso/egreso registration form.
 * Consumed by: PagosPage.
 * Does NOT handle: business logic dispatch. Uses callbacks to parent.
 */
import { type EgresoCategoria, EGRESO_CATEGORIA_LABELS } from '../../../types/financial'
import Modal from '../../../core/components/Modal'
import { monthKeyToLabel } from '../../../lib/month-utils'

export interface RegistrationModalProps {
  open: boolean
  chargeType: 'ingreso' | 'egreso'
  // ── Ingreso state ──
  towers: string[]
  modalUnits: string[]
  mTower: string
  mUnit: string
  mConcepto: string
  mSubConcepto: string
  mMotivo: string
  mMulti: boolean
  mMonths: string[]
  mSingleMonth: string
  mAmount: string
  mReceiptError: string
  mReceiptName: string
  isMantenimientoSelected: boolean
  isReasonRequired: boolean
  monthRange: string[]
  conceptosPago: string[]
  subConceptos?: Record<string, string[]>
  formValid: boolean
  // ── Egreso state ──
  egCategoria: EgresoCategoria
  egConcepto: string
  egAmount: string
  egDate: string
  egDescription: string
  // ── Callbacks ──
  onClose: () => void
  onRegister: () => void
  onTowerChange: (v: string) => void
  onUnitChange: (v: string) => void
  onConceptoChange: (v: string) => void
  onSubConceptoChange: (v: string) => void
  onMotivoChange: (v: string) => void
  onMultiToggle: () => void
  onMonthToggle: (mk: string) => void
  onSingleMonthChange: (v: string) => void
  onAmountChange: (v: string) => void
  onReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  // Egreso callbacks
  onEgCategoriaChange: (v: EgresoCategoria) => void
  onEgConceptoChange: (v: string) => void
  onEgAmountChange: (v: string) => void
  onEgDateChange: (v: string) => void
  onEgDescriptionChange: (v: string) => void
}

export default function RegistrationModal(props: RegistrationModalProps) {
  const {
    open, chargeType, towers, modalUnits,
    mTower, mUnit, mConcepto, mSubConcepto, mMotivo,
    mMulti, mMonths, mSingleMonth, mAmount,
    mReceiptError, mReceiptName,
    isMantenimientoSelected, isReasonRequired,
    monthRange, conceptosPago, subConceptos,
    formValid,
    egCategoria, egConcepto, egAmount, egDate, egDescription,
    onClose, onRegister,
    onTowerChange, onUnitChange, onConceptoChange, onSubConceptoChange,
    onMotivoChange, onMultiToggle, onMonthToggle, onSingleMonthChange,
    onAmountChange, onReceiptUpload,
    onEgCategoriaChange, onEgConceptoChange, onEgAmountChange, onEgDateChange, onEgDescriptionChange,
  } = props

  const subs = subConceptos?.[(mConcepto || 'Mantenimiento')]

  return (
    <Modal open={open} onClose={onClose} title={chargeType === 'ingreso' ? 'Nuevo Cargo' : 'Nuevo Gasto'}>
      <div className="space-y-5">

        {/* ═══ INGRESO FORM ═══ */}
        {chargeType === 'ingreso' && (
          <>
            {/* Unit */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unidad *</label>
              <div className="grid grid-cols-2 gap-2">
                <select value={mTower} onChange={e => { onTowerChange(e.target.value); onUnitChange('') }}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todas las torres</option>
                  {towers.map(t => <option key={t} value={t}>Torre {t}</option>)}
                </select>
                <select value={mUnit} onChange={e => onUnitChange(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Seleccionar…</option>
                  {modalUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {/* Concepto */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto *</label>
              <select value={mConcepto || 'Mantenimiento'}
                onChange={e => onConceptoChange(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                {[...conceptosPago].sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Motivo for Multa/Otros */}
            {isReasonRequired && (
              <div className="space-y-2 animate-[fadeIn_0.2s_ease-out]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo / Descripción *</label>
                <textarea value={mMotivo} onChange={e => onMotivoChange(e.target.value)}
                  rows={2} maxLength={100} placeholder="Ej: Ruido excesivo, Arreglo de pintura…"
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm resize-none" />
                <div className="flex justify-end">
                  <span className={`text-[9px] font-bold ${mMotivo.length >= 90 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {mMotivo.length} / 100
                  </span>
                </div>
              </div>
            )}
            {/* Sub-Concepto */}
            {subs && subs.length > 0 && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Detalle</label>
                <div className="space-y-1.5">
                  {[...subs].sort().map(sub => (
                    <label key={sub} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      mSubConcepto === sub ? 'border-slate-900 bg-slate-900/5' : 'border-slate-100 hover:border-slate-200'
                    }`}>
                      <input type="radio" name="subConcepto" checked={mSubConcepto === sub} onChange={() => onSubConceptoChange(sub)}
                        className="w-4 h-4 accent-slate-900" />
                      <span className={`text-sm font-medium ${mSubConcepto === sub ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>{sub}</span>
                    </label>
                  ))}
                </div>
                {mSubConcepto && (
                  <button type="button" onClick={() => onSubConceptoChange('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest ml-1">
                    Limpiar selección
                  </button>
                )}
              </div>
            )}
            {/* Month */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  {isMantenimientoSelected && mMulti ? 'Mes(es) *' : 'Mes *'}
                </label>
                {isMantenimientoSelected && (
                  <button type="button" onClick={onMultiToggle}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900">
                    <div className={`relative w-8 h-4 rounded-full transition-colors ${mMulti ? 'bg-slate-900' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${mMulti ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    Multi-mes
                  </button>
                )}
              </div>
              {isMantenimientoSelected && mMulti ? (
                <>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                    {monthRange.slice().reverse().map(mk => (
                      <label key={mk} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={mMonths.includes(mk)} onChange={() => onMonthToggle(mk)} className="w-4 h-4 rounded accent-slate-900" />
                        <span className="text-sm font-medium text-slate-700 capitalize">{monthKeyToLabel(mk)}</span>
                      </label>
                    ))}
                  </div>
                  {mMonths.length > 1 && (
                    <p className="text-[10px] font-bold text-amber-600 ml-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">info</span>
                      {mMonths.length} meses · los meses adelantados se anotan como "pago anticipado"
                    </p>
                  )}
                  {mMonths.length > 0 && mMonths.length <= 1 && <p className="text-[10px] font-bold text-slate-500 ml-1">{mMonths.length} mes seleccionado</p>}
                </>
              ) : (
                <input type="month" value={mSingleMonth} min={monthRange[0]} max={monthRange[monthRange.length - 1]}
                  onChange={e => onSingleMonthChange(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
              )}
            </div>
            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto (MXN) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input type="number" value={mAmount} onChange={e => onAmountChange(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-black text-sm tabular-nums" />
              </div>
              {isMantenimientoSelected && mMulti && mMonths.length > 1 && (
                <p className="text-[10px] text-slate-400 font-medium ml-1">
                  Total: <span className="font-black text-slate-900">${((Number(mAmount) || 0) * mMonths.length).toLocaleString('es-MX')} MXN</span> ({mMonths.length} × ${(Number(mAmount) || 0).toLocaleString('es-MX')})
                </p>
              )}
            </div>
            {/* Receipt */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Comprobante <span className="text-slate-300">(PDF ≤5MB · IMG ≤2MB)</span>
              </label>
              <input type="file" accept=".pdf, image/jpeg, image/png" onChange={onReceiptUpload}
                className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800" />
              {mReceiptError && <p className="text-xs text-rose-600 font-bold ml-1">{mReceiptError}</p>}
              {mReceiptName && !mReceiptError && (
                <div className="flex items-center gap-2 ml-1">
                  <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                  <span className="text-xs text-emerald-600 font-bold">{mReceiptName}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ EGRESO FORM ═══ */}
        {chargeType === 'egreso' && (
          <>
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría *</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => (
                  <button key={cat} onClick={() => onEgCategoriaChange(cat)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all text-left ${
                      egCategoria === cat ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    {EGRESO_CATEGORIA_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
            {/* Concepto */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto *</label>
              <input type="text" value={egConcepto} onChange={e => onEgConceptoChange(e.target.value)}
                placeholder="Ej: Pago mensual jardinero, Recibo de luz…"
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
            </div>
            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto (MXN) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input type="number" value={egAmount} onChange={e => onEgAmountChange(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-black text-sm tabular-nums" />
              </div>
            </div>
            {/* Date */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha *</label>
              <input type="date" value={egDate} onChange={e => onEgDateChange(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
            </div>
            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notas <span className="text-slate-300">(opcional)</span></label>
              <textarea value={egDescription} onChange={e => onEgDescriptionChange(e.target.value)}
                rows={2} maxLength={500} placeholder="Detalle adicional…"
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm resize-none" />
            </div>
            {/* Receipt for Egreso */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Comprobante / Factura <span className="text-slate-300">(PDF/JPG/PNG)</span>
              </label>
              <input type="file" accept=".pdf, image/jpeg, image/png" onChange={onReceiptUpload}
                className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800" />
              {mReceiptError && <p className="text-xs text-rose-600 font-bold ml-1">{mReceiptError}</p>}
              {mReceiptName && !mReceiptError && (
                <div className="flex items-center gap-2 ml-1">
                  <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                  <span className="text-xs text-emerald-600 font-bold">{mReceiptName}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Submit ── */}
        <button onClick={onRegister} disabled={!formValid}
          className={`w-full py-3 font-bold rounded-2xl transition-all uppercase tracking-widest text-[11px] ${
            !formValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
          }`}>
          {chargeType === 'ingreso'
            ? (isMantenimientoSelected && mMulti && mMonths.length > 1 ? `Registrar ${mMonths.length} pagos` : 'Registrar Ingreso')
            : 'Registrar Egreso'}
        </button>
      </div>
    </Modal>
  )
}
