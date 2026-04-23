/**
 * Financial report data assembly hook.
 * Consumed by: ReportTab (future), PagosPage.
 * Does NOT handle: PDF rendering, download logic, or UI.
 */
import { useMemo } from 'react'
import { monthKeyToLabel, todayMonthKey } from '../../../lib/month-utils'
import { EGRESO_CATEGORIA_LABELS } from '../../../types/financial'
import type { Pago, Adeudo, Egreso, EgresoCategoria } from '../../../types/financial'
import type { BuildingConfig } from '../../../types/config'
import type { ReportData, IncomeRow, ExpenseRow } from '../FinancialReportPDF'

const TODAY_KEY = todayMonthKey()

export function useReportData(
  pagos: Pago[],
  egresos: Egreso[],
  adeudos: Adeudo[],
  bc: BuildingConfig,
  reportPeriod: 'month' | 'ytd',
  reportMonth: string,
): ReportData {
  const reportMonthKeys = useMemo(() => {
    if (reportPeriod === 'month') return [reportMonth]
    const year = new Date().getFullYear()
    const curMonth = new Date().getMonth() + 1
    const keys: string[] = []
    for (let m = 1; m <= curMonth; m++) keys.push(`${year}-${String(m).padStart(2, '0')}`)
    return keys
  }, [reportPeriod, reportMonth])

  return useMemo((): ReportData => {
    const monthSet = new Set(reportMonthKeys)

    // INGRESOS: paid pagos in period, grouped by concepto
    const paidPagos = pagos.filter(p => p.status === 'Pagado' && monthSet.has(p.monthKey || ''))
    const incomeMap = new Map<string, number>()
    paidPagos.forEach(p => {
      const key = p.concepto || 'Mantenimiento'
      incomeMap.set(key, (incomeMap.get(key) || 0) + p.amount)
    })
    const ingresos: IncomeRow[] = [...incomeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([concepto, amount]) => ({ concepto, amount }))
    const totalIngresos = ingresos.reduce((s, r) => s + r.amount, 0)

    // EGRESOS: expenses in period, grouped by categoria
    const periodEgresos = egresos.filter(e => monthSet.has(e.monthKey))
    const expenseMap = new Map<EgresoCategoria, { amount: number; items: { concepto: string; amount: number }[] }>()
    periodEgresos.forEach(e => {
      const entry = expenseMap.get(e.categoria) || { amount: 0, items: [] }
      entry.amount += e.amount
      entry.items.push({ concepto: e.concepto, amount: e.amount })
      expenseMap.set(e.categoria, entry)
    })
    const egresosRows: ExpenseRow[] = [...expenseMap.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([cat, data]) => ({ categoria: cat, label: EGRESO_CATEGORIA_LABELS[cat], amount: data.amount, items: data.items }))
    const totalEgresos = egresosRows.reduce((s, r) => s + r.amount, 0)

    // Pending + Adeudos
    const pendingCharges = pagos.filter(p => p.status === 'Pendiente' && monthSet.has(p.monthKey || '')).reduce((s, p) => s + p.amount, 0)
    const activeAdeudosList = adeudos.filter(a => a.status === 'Activo' && a.amount > 0)

    const periodLabel = reportPeriod === 'month'
      ? monthKeyToLabel(reportMonth)
      : `Enero – ${monthKeyToLabel(TODAY_KEY)} ${new Date().getFullYear()} (acumulado)`

    return {
      buildingName: bc.buildingName,
      buildingAddress: bc.buildingAddress,
      managementCompany: bc.managementCompany,
      periodLabel,
      generatedAt: new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
      ingresos,
      totalIngresos,
      egresos: egresosRows,
      totalEgresos,
      netResult: totalIngresos - totalEgresos,
      pendingCharges,
      activeAdeudos: activeAdeudosList.length,
      activeAdeudosAmount: activeAdeudosList.reduce((s, a) => s + a.amount, 0),
    }
  }, [pagos, egresos, adeudos, reportMonthKeys, reportPeriod, reportMonth, bc])
}
