/**
 * Financial maturity helpers — determines when charges become overdue.
 * Consumed by: store reducer (PROCESS_MATURITY), PagosPage KPI computation.
 * Does NOT handle: surcharge calculation, UI rendering, or API persistence.
 */
import type { Pago, FinancialMaturityRules } from '../../types'

/**
 * Determines the exact maturity Date for a pending Pago, returning null if uncertain.
 */
export function getMaturityTargetDate(p: Pago, rules: FinancialMaturityRules, nowIso: string): Date | null {
  const baseConcepto = (p.concepto || '').split(/[:—]/)[0].trim()

  // 1. Mantenimiento
  if (baseConcepto === 'Mantenimiento') {
    if (!p.monthKey) return null
    const [y, m] = p.monthKey.split('-').map(Number)
    
    if (rules.mantenimiento === 'next_month_10') {
      return new Date(y, m, 10) // Month 'm' is already index for next month in JS (0-indexed)
    } else if (rules.mantenimiento === 'next_month_01') {
      return new Date(y, m, 1)
    } else if (rules.mantenimiento === 'current_month_end') {
      return new Date(y, m, 0)
    }
    return null
  }

  // 2. Reserva Amenidad
  if (baseConcepto === 'Reserva Amenidad') {
    if (rules.amenidad === 'immediate') return null
    if (!p.monthKey) return null
    
    const parts = p.monthKey.split('-').map(Number)
    let eventDate: Date
    
    if (parts.length === 3) {
      const [y, m, d] = parts
      eventDate = new Date(y, m - 1, d)
    } else if (parts.length === 2) {
      const [y, m] = parts
      eventDate = new Date(y, m, 0)
    } else {
      return null
    }
    
    if (rules.amenidad === '1_day_before') {
      eventDate.setDate(eventDate.getDate() - 1)
    }
    return eventDate
  }

  // 3. Multas & Otros
  if (baseConcepto === 'Multa' || baseConcepto === 'Otros') {
    if (rules.multaOtros === '7_days_grace') {
      const [y, m] = (p.monthKey || nowIso.slice(0, 7)).split('-').map(Number)
      return new Date(y, m - 1, 7) // 7th day of the month
    }
    return null
  }

  return null
}

/**
 * Determines if a financial charge (Pago) should be treated as an effective debt
 * (Adeudo) based on its category and current date.
 * 
 * Rules:
 * - Multas / Otros: Immediately effective.
 * - Reserva Amenidad: Effective on the day of the event (00:00).
 * - Mantenimiento: Effective on the first day of the FOLLOWING month.
 */
export function isEffectiveDebt(p: Pago, nowIso: string, rules: FinancialMaturityRules): boolean {
  if (p.status === 'Pagado') return false
  if (p.status === 'Vencido') return true
  
  const targetDate = getMaturityTargetDate(p, rules, nowIso)
  if (!targetDate) return true // Immediate fallback
  
  const now = new Date(nowIso)
  return now.getTime() >= targetDate.getTime()
}
