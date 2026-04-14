/**
 * ConfirmDialog — In-app confirmation dialog component.
 *
 * Replaces all native `window.confirm()` calls with a styled,
 * accessible modal dialog that matches the app's design system.
 * Supports two visual variants:
 *   - "danger" (red accent)  — for destructive actions like deletions
 *   - "neutral" (slate accent) — for non-destructive but important confirmations
 */
import { useEffect, type ReactNode } from 'react'

interface ConfirmDialogProps {
  /** Controls visibility of the dialog */
  open: boolean
  /** Callback when user cancels or dismisses */
  onClose: () => void
  /** Callback when user confirms the action */
  onConfirm: () => void
  /** Dialog title displayed at the top */
  title: string
  /** Body content — can be a string or JSX for richer formatting */
  children: ReactNode
  /** Label for the confirmation button (defaults to "Confirmar") */
  confirmLabel?: string
  /** Label for the cancel button (defaults to "Cancelar") */
  cancelLabel?: string
  /** Visual variant: "danger" for destructive, "neutral" for informational */
  variant?: 'danger' | 'neutral'
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  // Close the dialog when the user presses Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  // Determine button styling based on variant
  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200'
      : 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-200'

  const iconName = variant === 'danger' ? 'warning' : 'help'
  const iconBg = variant === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200 w-full max-w-md animate-in fade-in zoom-in-95 duration-300 p-8">
        {/* Icon + Title */}
        <div className="flex items-start space-x-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <span className="material-symbols-outlined text-xl">{iconName}</span>
          </div>
          <div>
            <h3 className="text-lg font-headline font-extrabold text-slate-900 tracking-tight">{title}</h3>
            <div className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{children}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all focus:outline-none focus:ring-2 ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
