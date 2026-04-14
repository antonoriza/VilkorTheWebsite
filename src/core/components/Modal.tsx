/**
 * Modal — Generic full-screen modal container component.
 *
 * Renders a centered dialog panel with a glassmorphism backdrop.
 * Used throughout the app for forms, detail views, and data entry.
 *
 * Features:
 *   - Closes on Escape key press
 *   - Closes on backdrop click
 *   - Scrollable content area with sticky header
 *   - Consistent border-radius and shadow styling
 */
import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  /** Controls visibility of the modal */
  open: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Title displayed in the sticky header */
  title: string
  /** Modal body content */
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  // Dismiss when user presses Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-8 pt-8 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-headline font-extrabold text-slate-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
