/**
 * Spanish month utilities — shared date-to-label formatters.
 * Consumed by: PagosPage, AmenidadesPage, store (GENERATE_MONTHLY_RECORDS).
 * Does NOT handle: date arithmetic, maturity logic, or filtering.
 */

export const MONTH_NAMES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]

export const MONTH_ABBR_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/**
 * Converts a `YYYY-MM` key to a human-readable Spanish label.
 * @example monthKeyToLabel('2026-04') → 'abril de 2026'
 */
export function monthKeyToLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_NAMES_ES[parseInt(month, 10) - 1] || ''} de ${year}`
}

/**
 * Converts a `YYYY-MM-DD` date string to a Spanish month label.
 * @example dateToMonthLabel('2026-04-15') → 'abril de 2026'
 */
export function dateToMonthLabel(dateStr: string): string {
  const [y, m] = dateStr.split('-')
  return `${MONTH_NAMES_ES[parseInt(m, 10) - 1] || ''} de ${y}`
}

/**
 * Generates an array of `YYYY-MM` keys spanning from 12 months ago to 12 months ahead.
 */
export function generateMonthRange(): string[] {
  const keys: string[] = []
  const now = new Date()
  const start = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const end = new Date(now.getFullYear() + 1, now.getMonth(), 1)
  const cur = new Date(start)
  while (cur <= end) {
    keys.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }
  return keys
}

/**
 * Returns today's `YYYY-MM` key.
 */
export function todayMonthKey(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Returns today's `YYYY-MM-DD` ISO date string.
 */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}
