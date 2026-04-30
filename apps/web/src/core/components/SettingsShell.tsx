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
    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border transition-all shrink-0 ${
            activeTab === tab.id
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/50'
              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{tab.icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────
// Consistent section title with icon badge — matches dashboard card headers.

export function SectionHeader({ label, icon, color = 'bg-emerald-50 text-emerald-600' }: { label: string; icon: string; color?: string }) {
  return (
    <div className="flex items-center gap-4 mb-4 first:mt-0">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <h3 className="text-xl font-headline font-extrabold text-slate-900 tracking-tight">
        {label}
      </h3>
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
    <div className="flex items-center justify-end">
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
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm ${className}`}>
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
        Estamos trabajando en la infraestructura de este componente para el siguiente release de Vilkor.
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
    <div className={`p-6 border rounded-3xl flex items-start gap-5 ${styles[variant]}`}>
      <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${iconStyles[variant]}`}>
        {icon}
      </span>
      <div className="text-[11px] font-medium leading-relaxed">{children}</div>
    </div>
  )
}

// ─── Field Group ────────────────────────────────────────────────────────────
// Card container for a group of related form fields with icon + title header.

export function FieldGroup({
  icon,
  title,
  children,
  className = '',
  iconColor = 'bg-slate-50 text-slate-500',
}: {
  icon: string
  title: string
  children: React.ReactNode
  className?: string
  iconColor?: string
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </div>
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">{title}</h4>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

// ─── Form Input ─────────────────────────────────────────────────────────────
// Elevated input with optional icon prefix and premium focus state.

export function FormInput({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  error,
}: {
  label: string
  icon?: string
  type?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  readOnly?: boolean
  error?: string
}) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5 ml-1">
        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
          {label}
        </label>
        {error && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-in fade-in slide-in-from-right-1">{error}</span>}
      </div>
      <div className="relative group">
        {icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className={`material-symbols-outlined ${error ? 'text-rose-300' : 'text-slate-300 group-focus-within:text-slate-600'} text-lg transition-colors`}>
              {icon}
            </span>
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`block w-full ${icon ? 'pl-11' : 'px-4'} pr-4 py-3 bg-white border ${error ? 'border-rose-200 focus:border-rose-400 focus:ring-rose-50' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'} rounded-xl text-slate-900 outline-none font-medium text-sm transition-all hover:border-slate-300 ${readOnly ? 'bg-slate-50 text-slate-500 cursor-default' : ''}`}
        />
      </div>
    </div>
  )
}

// ─── Stat Bar ───────────────────────────────────────────────────────────────
// Horizontal KPI summary with animated badges — "Digital Twin" summary strip.

export function StatBar({
  stats,
}: {
  stats: Array<{ label: string; value: number | string; icon: string; color?: string }>
}) {
  return (
    <div className="flex items-stretch gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {stats.map(s => (
        <div
          key={s.label}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-100 bg-white flex-1 min-w-[140px]"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color || 'bg-slate-100 text-slate-500'}`}>
            <span className="material-symbols-outlined text-lg">{s.icon}</span>
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">{s.label}</p>
            <p className="text-lg font-headline font-black text-slate-900 tracking-tight leading-none mt-0.5">
              {s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Topology Card ──────────────────────────────────────────────────────────
// Visual card for tower/privada entries — replaces flat grid rows.

export function TopologyCard({
  index,
  label,
  name,
  units,
  parking,
  storage,
  onNameChange,
  onUnitsChange,
  onParkingChange,
  onStorageChange,
}: {
  index: number
  label: string
  name: string
  units: number
  parking: number
  storage: number
  onNameChange: (v: string) => void
  onUnitsChange: (v: number) => void
  onParkingChange: (v: number) => void
  onStorageChange: (v: number) => void
}) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300 p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-sm font-black shrink-0">
          {index + 1}
        </div>
        <input
          type="text"
          maxLength={30}
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={`${label} ${index + 1}`}
          className="flex-1 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none border-b border-transparent focus:border-slate-300 transition-colors py-1"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: 'door_front', lbl: 'Unidades', val: units, max: 200, fn: onUnitsChange },
          { icon: 'local_parking', lbl: 'Estacionam.', val: parking, max: 1000, fn: onParkingChange },
          { icon: 'warehouse', lbl: 'Bodegas', val: storage, max: 200, fn: onStorageChange },
        ].map(f => (
          <div key={f.icon} className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
            <span className="material-symbols-outlined text-slate-400 text-base">{f.icon}</span>
            <div className="flex-1">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{f.lbl}</p>
              <input
                type="number"
                min={0}
                max={f.max}
                value={f.val || ''}
                onChange={e => {
                  const v = e.target.value.replace(/^0+/, '') || '0'
                  f.fn(Math.min(parseInt(v, 10) || 0, f.max))
                }}
                className="w-full bg-transparent text-sm font-black text-slate-900 outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
