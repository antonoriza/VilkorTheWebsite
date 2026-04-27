/**
 * Financial maturity helpers — determines when charges become overdue.
 *
 * The canonical source of due-date rules is the **Catálogo de Conceptos**
 * (`ConceptoFinanciero.vencimiento` + `diasGracia`).  The legacy
 * `FinancialMaturityRules` preset strings are transparently converted
 * via `parseVencimiento`.
 *
 * Consumed by: store reducer (PROCESS_MATURITY), PagosPage KPI computation,
 *              LedgerTables (vence-date display).
 */
import type { Pago, FinancialMaturityRules, ConceptoFinanciero, VencimientoRule } from '../../types'
import { parseVencimiento } from '../../types/financial'

// ── Concept lookup ────────────────────────────────────────────────────

/** Extract the base concept name from a Pago (strips sub-concept / motivo) */
export function baseConcepto(p: Pago): string {
  return (p.concepto || 'Mantenimiento').split(/[:—]/)[0].trim()
}

/**
 * Resolve the VencimientoRule + grace days for a given Pago.
 *
 * Resolution order:
 *  1. Catalog entry matching the base concept name.
 *  2. Legacy FinancialMaturityRules presets (converted via parseVencimiento).
 *  3. Fallback: { tipo: 'ultimo_dia_mes' } with 0 grace days.
 */
export function resolveVencimiento(
  p: Pago,
  rules: FinancialMaturityRules,
  catalog?: ConceptoFinanciero[],
): { rule: VencimientoRule; graceDays: number } {
  const name = baseConcepto(p)

  // 1. Try catalog
  if (catalog?.length) {
    // Match "Mantenimiento" concept → system "Mensualidad" entry
    const catalogName = name === 'Mantenimiento' ? 'Mensualidad' : name
    const entry = catalog.find(c => c.concepto === catalogName)
    if (entry) return { rule: entry.vencimiento, graceDays: entry.diasGracia }
  }

  // 2. Legacy preset fallback
  if (name === 'Mantenimiento') {
    return { rule: parseVencimiento(rules.mantenimiento), graceDays: 0 }
  }
  if (name === 'Reserva Amenidad') {
    if (rules.amenidad === 'immediate') return { rule: { tipo: 'inmediato' }, graceDays: 0 }
    return { rule: { tipo: 'ultimo_dia_mes' }, graceDays: 0 }
  }
  if (name === 'Multa' || name === 'Otros') {
    if (rules.multaOtros === '7_days_grace') return { rule: { tipo: 'n_dias', n: 7 }, graceDays: 0 }
    return { rule: { tipo: 'inmediato' }, graceDays: 0 }
  }

  // 3. Unknown concept — not immediately overdue
  return { rule: { tipo: 'na' }, graceDays: 0 }
}

// ── Due date calculation ──────────────────────────────────────────────

/**
 * Computes the exact due date for a Pago based on its VencimientoRule.
 * Returns null for 'na' (no due date) concepts.
 */
export function getMaturityTargetDate(
  p: Pago,
  rules: FinancialMaturityRules,
  _nowIso: string,
  catalog?: ConceptoFinanciero[],
): Date | null {
  const { rule, graceDays } = resolveVencimiento(p, rules, catalog)

  // Determine the base reference date for the charge
  let ref: Date
  if (p.monthKey) {
    const parts = p.monthKey.split('-').map(Number)
    if (parts.length === 3) {
      // Full date key (YYYY-MM-DD) — used by amenity reservations
      ref = new Date(parts[0], parts[1] - 1, parts[2])
    } else {
      // Month key (YYYY-MM) — use the 1st of the charge month
      ref = new Date(parts[0], parts[1] - 1, 1)
    }
  } else {
    ref = new Date(_nowIso)
  }

  let due: Date | null = null
  switch (rule.tipo) {
    case 'n_dias':
      due = new Date(ref)
      due.setDate(due.getDate() + (rule.n ?? 1))
      break
    case 'dia_n_mes_siguiente':
      due = new Date(ref.getFullYear(), ref.getMonth() + 1, rule.n ?? 1)
      break
    case 'ultimo_dia_mes':
      due = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
      break
    case 'inmediato':
      due = new Date(ref)
      break
    case 'na':
      return null
  }

  // Apply grace days
  if (due && graceDays > 0) {
    due.setDate(due.getDate() + graceDays)
  }

  return due
}

// ── Effective debt check ──────────────────────────────────────────────

/**
 * Determines if a charge should be treated as overdue right now.
 *
 * - Already Pagado → false
 * - Already Vencido → true
 * - Rule is 'na' → false (no due date = never overdue automatically)
 * - Otherwise compare now against due date + grace days
 */
export function isEffectiveDebt(
  p: Pago,
  nowIso: string,
  rules: FinancialMaturityRules,
  catalog?: ConceptoFinanciero[],
): boolean {
  if (p.status === 'Pagado' || p.status === 'Por validar') return false
  if (p.status === 'Vencido') return true

  const targetDate = getMaturityTargetDate(p, rules, nowIso, catalog)
  if (!targetDate) return false // 'na' concepts are never auto-overdue

  const now = new Date(nowIso)
  return now.getTime() >= targetDate.getTime()
}
