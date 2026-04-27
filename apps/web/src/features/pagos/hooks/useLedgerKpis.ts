/**
 * Ledger KPI computation hook.
 * Consumed by: KpiStrip (future), PagosPage.
 * Does NOT handle: filtering, sorting, or display logic.
 */
import { useMemo } from 'react'
import { isEffectiveDebt } from '../../../core/store/maturity'
import type { Pago, Adeudo, Egreso, FinancialMaturityRules, ConceptoFinanciero } from '../../../types/financial'

export interface LedgerKpiValues {
  paidTotal: number
  overdueTotal: number
  upcomingTotal: number
  porValidarTotal: number
  paidCount: number
  overdueCount: number
  upcomingCount: number
  porValidarCount: number
  expectedMantenimientoTotal: number
  paidMantenimientoTotal: number
  paidMantenimientoCount: number
}

export interface EgresoKpiValues {
  paidTotal: number
  pendingTotal: number
  paidCount: number
  pendingCount: number
  total: number
}

const isMaintenance = (p: Pago) => (p.concepto || '').split(/[:—]/)[0].trim() === 'Mantenimiento'

function computeKpis(
  pagos: Pago[],
  adeudos: Adeudo[],
  nowIso: string,
  rules: FinancialMaturityRules,
  isAdmin: boolean,
  myApartment: string,
  catalog?: ConceptoFinanciero[],
): LedgerKpiValues {
  const paid = pagos.filter(p => p.status === 'Pagado')
  const overdue = pagos.filter(p => p.status === 'Vencido' || isEffectiveDebt(p, nowIso, rules, catalog))
  const upcoming = pagos.filter(p => p.status === 'Pendiente' && !isEffectiveDebt(p, nowIso, rules, catalog))
  const porValidar = pagos.filter(p => p.status === 'Por validar')

  const myAdeudos = adeudos.filter(a => a.status === 'Activo' && (isAdmin || a.apartment === myApartment))
  const adeudosTotal = myAdeudos.reduce((s, a) => s + a.amount, 0)

  const maintenancePagos = pagos.filter(isMaintenance)
  const paidMaintenancePagos = maintenancePagos.filter(p => p.status === 'Pagado')
  const expectedMantenimientoTotal = maintenancePagos.reduce((s, p) => s + p.amount, 0)
  const paidMantenimientoTotal = paidMaintenancePagos.reduce((s, p) => s + p.amount, 0)
  const paidMantenimientoCount = paidMaintenancePagos.length

  return {
    paidTotal: paid.reduce((s, p) => s + p.amount, 0),
    overdueTotal: overdue.reduce((s, p) => s + p.amount, 0) + adeudosTotal,
    upcomingTotal: upcoming.reduce((s, p) => s + p.amount, 0),
    porValidarTotal: porValidar.reduce((s, p) => s + p.amount, 0),
    paidCount: paid.length,
    overdueCount: overdue.length + myAdeudos.length,
    upcomingCount: upcoming.length,
    porValidarCount: porValidar.length,
    expectedMantenimientoTotal,
    paidMantenimientoTotal,
    paidMantenimientoCount,
  }
}

/** Global KPIs — computed from ALL pagos, independent of dropdown filters */
export function useGlobalKpis(
  pagos: Pago[], adeudos: Adeudo[], rules: FinancialMaturityRules,
  isAdmin: boolean, myApartment: string, nowIso: string,
  catalog?: ConceptoFinanciero[],
): LedgerKpiValues {
  return useMemo(() => {
    const scope = isAdmin ? pagos : pagos.filter(p => p.apartment === myApartment)
    return computeKpis(scope, adeudos, nowIso, rules, isAdmin, myApartment, catalog)
  }, [pagos, adeudos, isAdmin, myApartment, rules, nowIso, catalog])
}

/** Contextual KPIs — filtered by dropdowns (month/tower/unit/concepto), NOT by status */
export function useContextualKpis(
  pagos: Pago[], adeudos: Adeudo[], residents: { apartment: string; tower: string }[],
  rules: FinancialMaturityRules, isAdmin: boolean, myApartment: string, nowIso: string,
  lFilterMonth: string, lFilterTower: string, lFilterUnit: string, lFilterConcepto: string,
  todayKey: string,
  catalog?: ConceptoFinanciero[],
): LedgerKpiValues {
  return useMemo(() => {
    let data = isAdmin ? pagos : pagos.filter(p => p.apartment === myApartment)
    if (lFilterMonth) data = data.filter(p => (p.monthKey || '') === lFilterMonth)
    if (lFilterTower) {
      data = data.filter(p => {
        const res = residents.find(r => r.apartment === p.apartment)
        return res?.tower === lFilterTower
      })
    }
    if (lFilterUnit) data = data.filter(p => p.apartment === lFilterUnit)
    if (lFilterConcepto) data = data.filter(p => (p.concepto || 'Mantenimiento') === lFilterConcepto)

    // Contextual adeudos — only if no month filter or current month
    const showAdeudos = !lFilterMonth || lFilterMonth === todayKey
    const scopedAdeudos = showAdeudos ? adeudos : []

    return computeKpis(data, scopedAdeudos, nowIso, rules, isAdmin, myApartment, catalog)
  }, [pagos, adeudos, residents, isAdmin, myApartment, lFilterMonth, lFilterTower, lFilterUnit, lFilterConcepto, rules, nowIso, todayKey, catalog])
}

/** Egreso KPIs — derived from filtered egresos */
export function useEgresoKpis(egresos: Egreso[]): EgresoKpiValues {
  return useMemo(() => {
    const paid = egresos.filter(e => e.status === 'Pagado')
    const pending = egresos.filter(e => e.status === 'Pendiente')
    return {
      paidTotal: paid.reduce((s, e) => s + e.amount, 0),
      pendingTotal: pending.reduce((s, e) => s + e.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
      total: egresos.reduce((s, e) => s + e.amount, 0),
    }
  }, [egresos])
}
