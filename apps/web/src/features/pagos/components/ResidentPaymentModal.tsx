/**
 * ResidentPaymentModal — Resident payment flow with banking details + receipt upload.
 * Extracted from PagosPage.
 */
import Modal from '../../../core/components/Modal'
import type { Pago, BuildingConfig } from '../../../types'

interface ResidentPaymentModalProps {
  pago: Pago | null
  banking: BuildingConfig['banking']
  myApartment: string
  receiptName: string
  receiptData: string
  receiptError: string
  onClose: () => void
  onSubmit: () => void
  onReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ResidentPaymentModal({
  pago, banking, myApartment,
  receiptName, receiptData, receiptError,
  onClose, onSubmit, onReceiptUpload,
}: ResidentPaymentModalProps) {
  const b = banking || { acceptsTransfer: false, acceptsCash: false, acceptsOxxo: false }

  return (
    <Modal open={!!pago} onClose={onClose} title="Instrucciones de Pago">
      {pago && (
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
            <p className="text-3xl font-headline font-black text-slate-900">${pago.amount.toLocaleString('es-MX')} MXN</p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{pago.concepto}</p>
            <p className="text-xs text-slate-400 mt-1">Status: <span className="font-bold">{pago.status}</span></p>
          </div>

          {/* Banking Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900">1. Realiza tu pago</h3>

            {b.acceptsTransfer ? (
              <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-[0.02] transform rotate-45 translate-x-10 -translate-y-10" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-[0.02] rounded-full transform -translate-x-8 translate-y-8" />

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Banco</p>
                    <p className="text-sm font-semibold">{b.bankName || 'Por definir'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Titular</p>
                    <p className="text-sm font-semibold truncate" title={b.accountHolder}>{b.accountHolder || 'Por definir'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">CLABE Interbancaria</p>
                    <p className="text-xl font-bold tracking-widest font-mono text-emerald-400">{b.clabe || '000 0000 0000 0000 00'}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Referencia</p>
                    <p className="text-sm font-semibold">
                      {b.referenceFormat === 'apartment' ? `Depto ${myApartment}` : b.customReferenceNote || `Depto ${myApartment}`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-center text-rose-600 text-sm font-bold">
                No hay cuenta bancaria configurada. Contacta a administración.
              </div>
            )}

            {/* Method Pills */}
            <div className="flex gap-2 justify-center">
              {b.acceptsTransfer && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">SPEI</span>}
              {b.acceptsCash && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Efectivo</span>}
              {b.acceptsOxxo && <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">OXXO Pay</span>}
            </div>

            {b.notes && (
              <p className="text-xs text-slate-500 italic text-center px-4">{b.notes}</p>
            )}
          </div>

          {/* Receipt Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-black text-slate-900">2. Adjunta Comprobante</h3>
            <div className="space-y-2">
              <input type="file" accept=".pdf, image/jpeg, image/png" onChange={onReceiptUpload}
                className="block w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-slate-900 file:text-white" />
              {receiptError && <p className="text-xs text-rose-600 font-bold ml-1">{receiptError}</p>}
              {receiptName && !receiptError && (
                <div className="flex items-center gap-2 ml-1">
                  <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                  <span className="text-xs text-emerald-600 font-bold max-w-[250px] truncate">{receiptName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button onClick={onSubmit} disabled={!receiptData && b.acceptsTransfer}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex justify-center items-center gap-2 ${
                !receiptData && b.acceptsTransfer ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] hover:shadow-lg'
              }`}>
              <span className="material-symbols-outlined text-[16px]">send</span> Enviar Comprobante
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
