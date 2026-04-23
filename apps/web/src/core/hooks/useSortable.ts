/**
 * useSortable — Generic reusable sort hook for table columns.
 *
 * Returns [sortKey, sortDir, handleSort, sortedItems].
 * - sortKey: currently sorted column key
 * - sortDir: 'asc' | 'desc'
 * - handleSort: toggle sort on a key (same key → flip dir; new key → asc)
 * - sortedItems: sorted copy of `items`
 *
 * Usage:
 *   const [sortKey, sortDir, handleSort, sorted] = useSortable(items, 'name', (item, key) => item[key])
 */
import { useState, useMemo } from 'react'

export type SortDir = 'asc' | 'desc'

export function useSortable<T, K extends string>(
  items: T[],
  defaultKey: K,
  getValue: (item: T, key: K) => string | number | undefined | null,
  defaultDir: SortDir = 'asc'
): [K, SortDir, (key: K) => void, T[]] {
  const [sortKey, setSortKey] = useState<K>(defaultKey)
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir)

  const handleSort = (key: K) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = getValue(a, sortKey) ?? ''
      const bv = getValue(b, sortKey) ?? ''
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else {
        cmp = String(av).localeCompare(String(bv), 'es', { sensitivity: 'base' })
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir, getValue])

  return [sortKey, sortDir, handleSort, sorted]
}
