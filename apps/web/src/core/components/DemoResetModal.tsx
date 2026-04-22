/**
 * DemoResetModal — Context-aware reset dialog for demo mode.
 *
 * Shown instead of the plain ConfirmDialog when isDemoMode is true.
 * Presents two options:
 *   1. Restore Demo  — factory-reset + re-seed demo fixtures (primary)
 *   2. True Factory Reset — wipe everything, no re-seed (secondary/destructive)
 *
 * Option 2 requires a second confirmation step to prevent live-demo accidents.
 */
import { useState } from 'react'

type Step =
  | 'choose'           // Initial two-option screen
  | 'confirm-factory'  // Secondary confirmation before true factory reset
  | 'loading-restore'  // Restoring demo data (takes a few seconds)
  | 'loading-factory'  // Wiping everything

interface Props {
  open: boolean
  onClose: () => void
  onDemoRestore: () => Promise<void>
  onFactoryReset: () => Promise<void>
}

export default function DemoResetModal({ open, onClose, onDemoRestore, onFactoryReset }: Props) {
  const [step, setStep] = useState<Step>('choose')

  if (!open) return null

  const handleClose = () => {
    setStep('choose')
    onClose()
  }

  const handleDemoRestore = async () => {
    setStep('loading-restore')
    await onDemoRestore()
    // Parent handles navigation after completion
  }

  const handleFactoryReset = async () => {
    setStep('loading-factory')
    await onFactoryReset()
    // Parent handles navigation after completion
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={step === 'choose' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-slate-300/50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

        {/* ── Amber demo header ── */}
        <div className="bg-gradient-to-r from-amber-400 to-amber-300 px-8 py-5 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-900 text-xl">science</span>
          <div>
            <p className="text-[9px] font-black text-amber-900/60 uppercase tracking-[0.25em]">Demo Environment</p>
            <p className="text-sm font-black text-amber-900">Restablecer Sistema</p>
          </div>
          {step === 'choose' && (
            <button
              onClick={handleClose}
              className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg bg-amber-900/10 hover:bg-amber-900/20 transition-colors text-amber-900"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* ── Step: Choose ── */}
        {step === 'choose' && (
          <div className="p-8 space-y-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              ¿Qué tipo de restablecimiento deseas realizar?
            </p>

            {/* Option 1 — Restore Demo (PRIMARY) */}
            <button
              onClick={handleDemoRestore}
              className="w-full group text-left p-6 bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-2xl transition-all shadow-lg shadow-slate-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                  <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white tracking-tight">Restaurar Demo</p>
                  <p className="text-[11px] text-white/60 font-medium mt-1 leading-relaxed">
                    Restablece todos los datos de demostración — residentes, pagos, tickets y staff. El sistema vuelve a su estado inicial de demo.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 bg-amber-400/20 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                    <span className="material-symbols-outlined text-[11px]">recommend</span>
                    Recomendado para demos
                  </span>
                </div>
              </div>
            </button>

            {/* Option 2 — True Factory Reset (SECONDARY/DESTRUCTIVE) */}
            <button
              onClick={() => setStep('confirm-factory')}
              className="w-full group text-left p-5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center shrink-0 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-rose-600 text-xl transition-colors">delete_forever</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 group-hover:text-rose-700 transition-colors">Reset de Fábrica Real</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                    Elimina todos los datos sin re-sembrar. Simula lo que vería un cliente real en el Día 1.
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-rose-400 transition-colors text-lg shrink-0">
                  chevron_right
                </span>
              </div>
            </button>
          </div>
        )}

        {/* ── Step: Confirm Factory Reset ── */}
        {step === 'confirm-factory' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <span className="material-symbols-outlined text-rose-600 text-2xl">warning</span>
              <div>
                <p className="text-sm font-black text-rose-700">¿Estás seguro?</p>
                <p className="text-[11px] text-rose-600 font-medium mt-0.5">
                  Esta acción elimina todos los datos sin posibilidad de recuperación. No se re-sembrarán datos de demo.
                </p>
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Escribe <span className="text-rose-600 font-black">CONFIRMAR</span> para continuar
            </p>
            <ConfirmInput onConfirm={handleFactoryReset} onBack={() => setStep('choose')} />
          </div>
        )}

        {/* ── Step: Loading ── */}
        {(step === 'loading-restore' || step === 'loading-factory') && (
          <div className="p-12 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-900 text-xl">
                  {step === 'loading-restore' ? 'auto_awesome' : 'delete_forever'}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-900">
                {step === 'loading-restore' ? 'Restaurando demo...' : 'Restableciendo sistema...'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {step === 'loading-restore'
                  ? 'Cargando residentes, pagos, tickets y staff de demostración'
                  : 'Eliminando todos los datos del sistema'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Internal: typed confirmation input ──────────────────────────────────────

function ConfirmInput({
  onConfirm,
  onBack,
}: {
  onConfirm: () => void
  onBack: () => void
}) {
  const [value, setValue] = useState('')
  const isValid = value === 'CONFIRMAR'

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Escribe CONFIRMAR"
        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent font-mono text-sm transition-all"
        autoFocus
      />
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-[11px] uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={!isValid}
          className={`flex-1 py-3 font-bold rounded-xl transition-all text-[11px] uppercase tracking-widest ${
            isValid
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          Restablecer
        </button>
      </div>
    </div>
  )
}
