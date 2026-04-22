/**
 * DemoBanner — Thin top environment bar shown only in demo mode.
 *
 * Signals to the user that they are in a demo environment.
 * Includes a direct link to factory reset (Resiliencia tab).
 * Hidden completely in production (renders null).
 *
 * Design: amber, minimal, editorial — matches CantonAlfa aesthetic.
 */
import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../hooks/useDemoMode'

export default function DemoBanner() {
  const isDemo = useDemoMode()
  const navigate = useNavigate()

  if (!isDemo) return null

  return (
    <div
      id="demo-environment-banner"
      className="fixed top-0 left-0 right-0 z-[100] h-8 flex items-center justify-center gap-3
                 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-300
                 border-b border-amber-500/30 shadow-sm shadow-amber-200/50"
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[13px] text-amber-900 font-black">science</span>
        <span className="text-[9px] font-black text-amber-900 uppercase tracking-[0.25em]">
          Demo Environment
        </span>
      </div>

      {/* Divider */}
      <span className="text-amber-600/50 text-[10px]">·</span>

      {/* Center: info */}
      <span className="text-[9px] font-semibold text-amber-900/70 tracking-wide hidden sm:block">
        Data is real and persists — use Factory Reset to restore to base state
      </span>

      {/* Divider */}
      <span className="text-amber-600/50 text-[10px] hidden sm:block">·</span>

      {/* Right: CTA */}
      <button
        onClick={() => navigate('/configuracion?tab=resiliencia')}
        className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-900/10 hover:bg-amber-900/20
                   text-amber-900 text-[9px] font-black uppercase tracking-widest
                   rounded-full border border-amber-900/15 transition-all hover:border-amber-900/30"
      >
        <span className="material-symbols-outlined text-[11px]">restart_alt</span>
        Reset System
      </button>
    </div>
  )
}
