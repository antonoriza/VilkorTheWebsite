/**
 * SettingsShell — Shared enterprise layout primitives for all Configuration sections.
 *
 * Provides the unified tab bar, section header, save footer, and coming-soon
 * placeholder used across every settings module. This ensures visual homogeneity
 * with the main dashboard design language.
 */

// ─── SubTab Bar ─────────────────────────────────────────────────────────────
// Pill-style tab bar matching the main dashboard tab pattern (PagosPage, etc.)

interface Tab {
  id: string
  label: string
  icon: string
}

export function SettingsTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border transition-all shrink-0 ${
            activeTab === tab.id
              ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{tab.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────
// Consistent section title with icon badge — matches dashboard card headers.

export function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center justify-between mt-4 mb-6 first:mt-0">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-lg font-headline font-black text-slate-900 uppercase tracking-tight">
            {label}
          </h3>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-Section Header ─────────────────────────────────────────────────────
// Lightweight divider for sub-groups within a section.

export function SubSectionHeader({ label, description }: { label: string; description?: string }) {
  return (
    <div>
      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">
        {label}
      </h4>
      {description && (
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 pl-5">{description}</p>
      )}
    </div>
  )
}

// ─── Save Footer ────────────────────────────────────────────────────────────
// Unified save bar for all settings sections.

export function SaveFooter({
  handleSave,
  saved,
}: {
  handleSave: () => void
  saved: boolean
}) {
  return (
    <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-end">
      <button
        onClick={handleSave}
        className={`flex items-center space-x-3 px-8 py-3 font-black rounded-2xl transition-all shadow-2xl text-[10px] tracking-widest uppercase ${
          saved
            ? 'bg-emerald-600 text-white shadow-emerald-100'
            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {saved ? 'check_circle' : 'save_as'}
        </span>
        <span>{saved ? 'Ajustes Aplicados' : 'Guardar Cambios'}</span>
      </button>
    </div>
  )
}

// ─── Content Card ───────────────────────────────────────────────────────────
// White card wrapper matching the enterprise dashboard card style.

export function SettingsCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-8 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ─── Coming Soon ────────────────────────────────────────────────────────────
// Placeholder for modules still in development.

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
        <span className="material-symbols-outlined text-slate-300 text-4xl">construction</span>
      </div>
      <h3 className="text-xl font-headline font-black text-slate-900 uppercase tracking-widest">
        {label}
      </h3>
      <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
        Estamos trabajando en la infraestructura de este componente para el siguiente release de Canton Alfa.
      </p>
    </div>
  )
}

// ─── Info Banner ────────────────────────────────────────────────────────────
// Consistent info/warning banner matching the enterprise style.

export function InfoBanner({
  icon = 'info',
  children,
  variant = 'neutral',
}: {
  icon?: string
  children: React.ReactNode
  variant?: 'neutral' | 'warning' | 'agent'
}) {
  const styles = {
    neutral: 'bg-slate-50 border-slate-100 text-slate-500',
    warning: 'bg-amber-50 border-amber-100 text-amber-900',
    agent: 'bg-slate-900 border-slate-800 text-white/60',
  }
  const iconStyles = {
    neutral: 'text-slate-400',
    warning: 'text-amber-600',
    agent: 'text-white',
  }

  return (
    <div className={`p-6 border rounded-[2.5rem] flex items-start gap-5 ${styles[variant]}`}>
      <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${iconStyles[variant]}`}>
        {icon}
      </span>
      <div className="text-[11px] font-medium leading-relaxed">{children}</div>
    </div>
  )
}
