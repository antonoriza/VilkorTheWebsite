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

/**
 * Resident payment profile — determines what records to generate.
 *   paid       → current month Pagado
 *   pending    → current month Pendiente (not yet overdue)
 *   validating → current month Por validar (receipt uploaded)
 *   debtor     → previous month Pendiente + current month Pendiente
 *               (PROCESS_MATURITY will flip the old one to Vencido)
 */
export type PaymentProfile = 'paid' | 'pending' | 'validating' | 'debtor'

/**
 * Round-robin distribution (per 8 residents):
 *   4 paid · 2 pending · 1 validating · 1 debtor
 *   → 50% collection rate, 25% open, 12.5% awaiting validation, 12.5% with debt
 */
export const PAYMENT_PROFILES: PaymentProfile[] = [
  'paid', 'paid', 'paid', 'pending',
  'validating', 'pending', 'paid', 'debtor',
]

/** Current month in display format, e.g. "abril de 2026" */
export const PAGO_MONTH = (() => {
  const now = new Date()
  return now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
})()

/** Current month key for DB queries, e.g. "2026-04" */
export const PAGO_MONTH_KEY = (() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})()

/** Previous month in display format, e.g. "marzo de 2026" */
export const PAGO_PREV_MONTH = (() => {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  return now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
})()

/** Previous month key for DB queries, e.g. "2026-03" */
export const PAGO_PREV_MONTH_KEY = (() => {
  const now = new Date()
  now.setMonth(now.getMonth() - 1)
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
})()

/** Payment date for records marked as "Pagado" — 5th of current month */
export const PAGO_PAYMENT_DATE = (() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-05`
})()
