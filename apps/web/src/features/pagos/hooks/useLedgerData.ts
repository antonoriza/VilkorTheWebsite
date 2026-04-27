/**
 * Ledger data hook — unified pagos, filtering, sorting, and topology.
 * Consumed by: PagosPage (LedgerTab future).
 * Does NOT handle: KPIs, actions, or rendering.
 */
import { useMemo } from 'react'
import { monthKeyToLabel } from '../../../lib/month-utils'
import type { Pago, Adeudo, Egreso } from '../../../types/financial'
import type { Resident } from '../../../types/residents'

export type LedgerSortKey = 'apartment' | 'concepto' | 'month' | 'amount' | 'paymentDate' | 'status'
export type SortDir = 'asc' | 'desc'

/**
 * Merges pagos with active adeudos into a unified ledger view.
 */
export function useUnifiedPagos(pagos: Pago[], adeudos: Adeudo[], residents: Resident[]) {
  return useMemo(() => {
    const basePagos = pagos.map(p => ({ ...p, _isAdeudo: false }))
    const activeAdeudos = adeudos
      .filter(a => a.status === 'Activo' && a.amount > 0 && !a.id.startsWith('ad-auto-'))
      .map(a => ({
        id: a.id,
        apartment: a.apartment,
        resident: residents.find(r => r.apartment === a.apartment)?.name || a.apartment,
        month: monthKeyToLabel(a.createdAt.slice(0, 7)),
        monthKey: a.createdAt.slice(0, 7),
        concepto: a.concepto,
        amount: a.amount,
        status: 'Pendiente' as const,
        paymentDate: null,
        _isAdeudo: true,
      })) as (Pago & { _isAdeudo: boolean })[]
    return [...basePagos, ...activeAdeudos]
  }, [pagos, adeudos, residents])
}

/**
 * Filters and sorts unified pagos based on current filter/sort state.
 */
export function useFilteredPagos(
  unifiedPagos: (Pago & { _isAdeudo: boolean })[],
  residents: Resident[],
  isAdmin: boolean,
  myApartment: string,
  lFilterMonth: string,
  lFilterTower: string,
  lFilterUnit: string,
  lFilterStatus: string,
  lFilterConcepto: string,
  lSortKey: LedgerSortKey,
  lSortDir: SortDir,
  searchQuery: string = '',
) {
  return useMemo(() => {
    let data = isAdmin ? unifiedPagos : unifiedPagos.filter(p => p.apartment === myApartment)
    if (isAdmin && lFilterMonth) data = data.filter(p => (p.monthKey || '') === lFilterMonth)
    if (isAdmin && lFilterTower) {
      data = data.filter(p => {
        const res = residents.find(r => r.apartment === p.apartment)
        return res?.tower === lFilterTower
      })
    }
    if (isAdmin && lFilterUnit) data = data.filter(p => p.apartment === lFilterUnit)
    if (isAdmin && lFilterStatus) data = data.filter(p => p.status === lFilterStatus)
    if (isAdmin && lFilterConcepto) data = data.filter(p => (p.concepto || 'Mantenimiento') === lFilterConcepto)
    // Freetext search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      data = data.filter(p =>
        p.apartment.toLowerCase().includes(q) ||
        (p.resident || '').toLowerCase().includes(q) ||
        (p.concepto || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q) ||
        (p.month || '').toLowerCase().includes(q)
      )
    }
    return [...data].sort((a, b) => {
      let va: string | number, vb: string | number
      switch (lSortKey) {
        case 'apartment':   va = a.apartment;         vb = b.apartment;         break
        case 'concepto':    va = a.concepto || '';     vb = b.concepto || '';    break
        case 'month':       va = a.monthKey || a.month; vb = b.monthKey || b.month; break
        case 'amount':      va = a.amount;             vb = b.amount;            break
        case 'paymentDate': va = a.paymentDate || '';  vb = b.paymentDate || ''; break
        case 'status':      va = a.status;             vb = b.status;            break
        default: return 0
      }
      if (va < vb) return lSortDir === 'asc' ? -1 : 1
      if (va > vb) return lSortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [unifiedPagos, isAdmin, myApartment, lFilterMonth, lFilterTower, lFilterUnit, lFilterStatus, lFilterConcepto, lSortKey, lSortDir, residents, searchQuery])
}

/** Unique concepto values for filter dropdown */
export function useConceptoOptions(unifiedPagos: (Pago & { _isAdeudo: boolean })[]) {
  return useMemo(() => {
    const set = new Set<string>()
    unifiedPagos.forEach(p => set.add(p.concepto || 'Mantenimiento'))
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [unifiedPagos])
}

/** Egresos filtered by the same month as the ledger */
export function useLedgerEgresos(egresos: Egreso[], lFilterMonth: string) {
  return useMemo(() => {
    const data = lFilterMonth
      ? egresos.filter(e => e.monthKey === lFilterMonth)
      : egresos
    return [...data].sort((a, b) => b.date.localeCompare(a.date))
  }, [egresos, lFilterMonth])
}

/** All known unit identifiers across residents, pagos, and adeudos */
export function useAllUnits(residents: Resident[], pagos: Pago[], adeudos: Adeudo[]) {
  return useMemo(() => {
    const u = new Set<string>()
    residents.forEach(r => u.add(r.apartment))
    pagos.forEach(p => u.add(p.apartment))
    adeudos.forEach(a => u.add(a.apartment))
    return [...u].sort()
  }, [residents, pagos, adeudos])
}
