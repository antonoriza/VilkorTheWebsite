/**
 * Demo Fixture — Pagos
 *
 * Payment constants for the current month.
 * Month is derived dynamically so demo data is never stale.
 */

export const PAGO_STATUSES = [
  'Pagado',
  'Pagado',
  'Pagado',
  'Pendiente',
  'Por validar',
  'Pendiente',
  'Pagado',
  'Vencido',
] as const

export type PagoStatus = (typeof PAGO_STATUSES)[number]

export const PAGO_CONCEPTO = 'Mantenimiento'
export const PAGO_AMOUNT = 1800

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

/** Payment date for records marked as "Pagado" — 5th of current month */
export const PAGO_PAYMENT_DATE = (() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-05`
})()
