/**
 * SortableTh — Reusable sortable table header cell.
 *
 * Renders a column header that:
 * - Shows an unfold_more icon when not sorted
 * - Shows arrow_upward/arrow_downward when active
 * - Cycles asc ↔ desc on click
 *
 * Usage:
 *   <SortableTh<MyKey> col="name" label="Nombre" sortKey={sk} sortDir={sd} onSort={handleSort} />
 */
import type { SortDir } from '../hooks/useSortable'

interface SortableThProps<K extends string> {
  col: K
  label: string
  sortKey: K
  sortDir: SortDir
  onSort: (k: K) => void
  right?: boolean
  className?: string
}

export default function SortableTh<K extends string>({
  col, label, sortKey, sortDir, onSort, right, className = ''
}: SortableThProps<K>) {
  const isActive = sortKey === col
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none whitespace-nowrap hover:text-slate-700 transition-colors ${right ? 'text-right' : 'text-left'} ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <span className={`material-symbols-outlined text-[11px] ml-0.5 transition-colors ${isActive ? 'text-slate-600' : 'text-slate-300'}`}>
          {isActive ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
        </span>
      </span>
    </th>
  )
}
