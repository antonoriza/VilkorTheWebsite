/**
 * LedgerToolbar — Sub-tab switcher, add button, search, filter toggle,
 * active filter chips, and collapsible month-picker + dropdown grid.
 * Extracted from PagosPage.
 */
import { useState, useMemo } from 'react'
import { MONTH_ABBR_ES, monthKeyToLabel, generateMonthRange } from '../../../lib/month-utils'

const MONTH_RANGE = generateMonthRange()

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface ActiveFilter {
  key: string
  label: string
  onClear: () => void
}

interface LedgerToolbarProps {
  isAdmin: boolean
  ledgerSubTab: 'ingresos' | 'egresos'
  ingresoCount: number
  egresoCount: number
  activeFilters: ActiveFilter[]
  showFilters: boolean
  // Filter values
  lFilterMonth: string
  lFilterTower: string
  lFilterUnit: string
  lFilterConcepto: string
  lFilterStatus: string
  searchQuery: string
  // Options
  towers: string[]
  filteredUnits: string[]
  conceptoOptions: string[]
  // Callbacks
  onSubTabChange: (tab: 'ingresos' | 'egresos') => void
  onAddClick: () => void
  onExportCSV: () => void
  onToggleFilters: () => void
  clearAllFilters: () => void
  // Filter setters
  onMonthChange: (v: string) => void
  onTowerChange: (v: string) => void
  onUnitChange: (v: string) => void
  onConceptoChange: (v: string) => void
  onStatusChange: (v: string) => void
  onSearchChange: (v: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export default function LedgerToolbar({
  isAdmin, ledgerSubTab, ingresoCount, egresoCount,
  activeFilters, showFilters,
  lFilterMonth, lFilterTower, lFilterUnit, lFilterConcepto, lFilterStatus,
  searchQuery,
  towers, filteredUnits, conceptoOptions,
  onSubTabChange, onAddClick, onExportCSV, onToggleFilters, clearAllFilters,
  onMonthChange, onTowerChange, onUnitChange, onConceptoChange, onStatusChange,
  onSearchChange,
}: LedgerToolbarProps) {

  // ── Month picker local state ──
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())

  const monthsByYear = useMemo(() => {
    const map: Record<number, string[]> = {}
    MONTH_RANGE.forEach(m => {
      const y = parseInt(m.split('-')[0], 10)
      if (!map[y]) map[y] = []
      map[y].push(m)
    })
    return map
  }, [])
  const pickerYears = useMemo(() => Object.keys(monthsByYear).map(Number).sort((a,b) => b-a), [monthsByYear])

  const count = ledgerSubTab === 'ingresos' ? ingresoCount : egresoCount
  const isEgresos = ledgerSubTab === 'egresos'

  return (
    <div className="px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div>
          {isAdmin ? (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {([
                { key: 'ingresos' as const, label: 'Ingresos', icon: 'trending_up', count: ingresoCount },
                { key: 'egresos' as const, label: 'Egresos', icon: 'trending_down', count: egresoCount },
              ]).map(t => (
                <button key={t.key} onClick={() => onSubTabChange(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest transition-all ${
                    ledgerSubTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}>
                  <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
                  {t.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] tabular-nums ${
                    ledgerSubTab === t.key ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>{t.count}</span>
                </button>
              ))}
            </div>
          ) : (
            <h2 className="text-base font-headline font-extrabold text-slate-900">Mis Pagos</h2>
          )}
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            {count} registro{count !== 1 ? 's' : ''}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {/* ── Search Input ── */}
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Buscar unidad, residente…"
                className="pl-9 pr-8 py-2 w-52 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder:text-slate-300"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px] text-slate-500">close</span>
                </button>
              )}
            </div>

            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-900/10 text-[10px] tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span className="hidden sm:inline">
                {ledgerSubTab === 'ingresos' ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
              </span>
            </button>

            {showFilters && (
              <button
                onClick={onExportCSV}
                title={`Exportar ${ledgerSubTab} a CSV`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-[10px] tracking-widest uppercase shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleFilters}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all',
                showFilters
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                  : activeFilters.length > 0
                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 shadow-sm',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
                Filtros
              {activeFilters.length > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  showFilters ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                }`}>{activeFilters.length}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Chips Tray */}
      {isAdmin && activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-slate-50">
          {activeFilters.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={f.onClear}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group"
              title={`Quitar filtro: ${f.label}`}
            >
              <span>{f.label}</span>
              <span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100 transition-opacity">close</span>
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-500 underline underline-offset-2 transition-colors uppercase tracking-widest ml-1"
            >Limpiar todo</button>
          )}
        </div>
      )}

      {/* Collapsible Dropdown Grid */}
      {isAdmin && showFilters && (
        <div className={`grid gap-3 mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-[fadeIn_0.15s_ease-out] ${
          isEgresos ? 'grid-cols-2 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-5'
        }`}>

          {/* ── Month picker (both tabs) ── */}
          <div className="relative">
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Mes / Año</label>
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm text-left flex items-center justify-between group hover:border-slate-300 transition-all"
            >
              <span>{lFilterMonth ? monthKeyToLabel(lFilterMonth) : 'Histórico (Todos)'}</span>
              <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {isMonthPickerOpen && (
              <>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-40" onClick={() => setIsMonthPickerOpen(false)} />

                {/* Popover */}
                <div className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-2xl z-50 p-4 animate-[fadeIn_0.1s_ease-out] origin-top-left">
                  {/* Year Switcher */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                    <p className="text-sm font-black text-slate-900 tracking-tight">{pickerYear}</p>
                    <div className="flex items-center gap-1">
                      {pickerYears.map(y => (
                        <button
                          key={y}
                          onClick={() => setPickerYear(y)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            pickerYear === y ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >{y}</button>
                      ))}
                    </div>
                  </div>

                  {/* Month Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const monthNum = i + 1
                      const monthKey = `${pickerYear}-${String(monthNum).padStart(2, '0')}`
                      const exists = MONTH_RANGE.includes(monthKey)
                      const isActive = lFilterMonth === monthKey

                      return (
                        <button
                          key={i}
                          disabled={!exists}
                          onClick={() => {
                            onMonthChange(monthKey)
                            setIsMonthPickerOpen(false)
                          }}
                          className={`
                            py-2.5 rounded-xl text-[11px] font-bold transition-all
                            ${isActive
                              ? 'bg-slate-900 text-white shadow-lg'
                              : exists
                                ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                : 'text-slate-200 cursor-not-allowed'}`}
                        >
                          {MONTH_ABBR_ES[i]}
                        </button>
                      )
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <button
                      onClick={() => {
                        onMonthChange('')
                        setIsMonthPickerOpen(false)
                      }}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        !lFilterMonth ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Acumulado Histórico
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Egreso-specific: only status filter ── */}
          {isEgresos && (
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Estado</label>
              <select value={lFilterStatus} onChange={e => onStatusChange(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                <option value="">Todos</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Pagado">Pagados</option>
              </select>
            </div>
          )}

          {/* ── Ingreso-specific filters ── */}
          {!isEgresos && (
            <>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Torre</label>
                <select value={lFilterTower} onChange={e => { onTowerChange(e.target.value); onUnitChange('') }}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todas</option>
                  {towers.map(t => <option key={t} value={t}>Torre {t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Unidad</label>
                <select value={lFilterUnit} onChange={e => onUnitChange(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todas</option>
                  {filteredUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Concepto</label>
                <select value={lFilterConcepto} onChange={e => onConceptoChange(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todos</option>
                  {conceptoOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Estado</label>
                <select value={lFilterStatus} onChange={e => onStatusChange(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm">
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Vencido">Vencidos</option>
                  <option value="Por validar">En Revisión</option>
                  <option value="Pagado">Pagados</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
