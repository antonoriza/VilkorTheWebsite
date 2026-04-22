/**
 * Demo Fixture — Pagos
 *
 * Payment status distribution for the current month.
 * Cycles through statuses so the dashboard shows a realistic mix.
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
export const PAGO_MONTH = 'abril de 2026'
export const PAGO_MONTH_KEY = '2026-04'
export const PAGO_PAYMENT_DATE = '2026-04-05'
