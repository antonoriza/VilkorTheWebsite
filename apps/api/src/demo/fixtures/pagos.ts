/**
 * Demo Fixture — Pagos
 *
 * Payment profile distribution and month helpers.
 * Months are derived dynamically so demo data is never stale.
 *
 * Status assignment is intentionally simple: the seed never assigns
 * "Vencido" — the frontend's PROCESS_MATURITY engine handles that
 * transition at runtime based on the Catálogo de Conceptos rules.
 */

export type PaymentProfile = 'paid' | 'pending' | 'validating' | 'debtor'

export const PAYMENT_PROFILES: PaymentProfile[] = [
  'paid', 'paid', 'paid', 'pending',
  'validating', 'pending', 'paid', 'debtor',
]

/**
 * Generates month metadata for the last N months up to now.
 * Year-agnostic: always uses the current year.
 */
export function getMonthsUpToNow() {
  const now = new Date()
  const currentMonth = now.getMonth() // 0-11
  const currentYear = now.getFullYear()

  // Custom limit from CLI (1-12)
  const limitStr = process.env.SEED_MONTH_LIMIT
  const limit = (limitStr && !isNaN(parseInt(limitStr))) 
    ? Math.min(Math.max(parseInt(limitStr), 1), currentMonth + 1)
    : (currentMonth + 1)
  
  const months: { name: string; key: string; isCurrent: boolean }[] = []
  
  for (let m = 0; m < limit; m++) {
    const d = new Date(currentYear, m, 1)
    months.push({
      name: d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
      key: `${currentYear}-${String(m + 1).padStart(2, '0')}`,
      isCurrent: m === (limit - 1)
    })
  }
  
  return months
}

/** Payment date helper: 5th of the month */
export function getPaymentDate(monthKey: string) {
  return `${monthKey}-05`
}

