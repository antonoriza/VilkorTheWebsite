/**
 * Financial types — payments, debts, expenses, and billing configuration.
 * Consumed by: PagosPage, store, maturity helpers.
 * Does NOT contain: UI components, notification logic, or ticket management.
 */

// ─── Payment ─────────────────────────────────────────────────────────

/** A charge/payment record in the billing ledger for a residential unit */
export interface Pago {
  id: string
  /** Apartment identifier (e.g. "A101") */
  apartment: string
  /** Name of the responsible resident */
  resident: string
  /** Human-readable month (e.g. "abril de 2026") */
  month: string
  /** ISO YYYY-MM used for reliable ordering and filtering */
  monthKey: string
  /** Billing concept — admin-defined, non-disciplinary (e.g. "Mantenimiento", "Otros") */
  concepto: string
  /** Amount in MXN */
  amount: number
  status: 'Pagado' | 'Pendiente' | 'Por validar' | 'Vencido'
  /** ISO date of payment, null if unpaid */
  paymentDate: string | null
  /** If this pago was auto-generated from an Adeudo, stores the source adeudo id */
  adeudoId?: string
  /** Base64 data URL of the uploaded receipt (image or PDF) */
  receiptData?: string
  /** MIME category for rendering the receipt */
  receiptType?: 'image' | 'pdf'
  /** Original filename of the receipt */
  receiptName?: string
  /** Admin/system notes (e.g. advance payment annotations) */
  notes?: string
}

// ─── Adeudo (Debt / Fine / Warning) ──────────────────────────────────

/** Type of administrative record against a unit */
export type AdeudoType = 'multa' | 'llamado_atencion' | 'adeudo'

/** An administrative record: fine, formal warning, or collected overdue debt */
export interface Adeudo {
  id: string
  /** Target unit/apartment (e.g. "A101") */
  apartment: string
  /** Classification */
  type: AdeudoType
  /** Free-text description of the reason (e.g. "Mantenimiento atrasada Mar-2025", "Daños en elevador") */
  concepto: string
  /** Admin notes / detailed reason for this record */
  description: string
  /** Amount in MXN (0 for llamado_atencion) */
  amount: number
  status: 'Activo' | 'Pagado' | 'Anulado'
  /** ISO timestamp when this record was created */
  createdAt: string
  /** ISO timestamp when resolved, null if still active */
  resolvedAt: string | null
  /** Name of the admin who resolved it */
  resolvedBy: string | null
  /** If a billing charge was generated from this adeudo, stores the linked Pago id */
  pagoId?: string
}

// ─── Egreso (Operational Expense) ────────────────────────────────────

/** Category of operational expense */
export type EgresoCategoria =
  | 'nomina'
  | 'mantenimiento'
  | 'servicios'
  | 'equipo'
  | 'seguros'
  | 'administracion'
  | 'otros'

export const EGRESO_CATEGORIA_LABELS: Record<EgresoCategoria, string> = {
  nomina: 'Nómina / Personal',
  mantenimiento: 'Mantenimiento',
  servicios: 'Servicios (Agua, Luz, Gas)',
  equipo: 'Equipo y Suministros',
  seguros: 'Seguros',
  administracion: 'Administración',
  otros: 'Otros Egresos',
}

/** An operational expense record for the building */
export interface Egreso {
  id: string
  /** Expense category */
  categoria: EgresoCategoria
  /** Short description (e.g. "Pago mensual jardinero") */
  concepto: string
  /** Detailed notes */
  description?: string
  /** Amount in MXN */
  amount: number
  /** ISO YYYY-MM period this expense belongs to */
  monthKey: string
  /** ISO date of the expense */
  date: string
  /** Admin who recorded this expense */
  registeredBy: string
  /** Payment status — Pendiente until admin confirms disbursement */
  status: 'Pendiente' | 'Pagado'
  /** Base64 data URL of the uploaded receipt (image or PDF) */
  receiptData?: string
  /** MIME category for rendering the receipt */
  receiptType?: 'image' | 'pdf'
  /** Original filename of the receipt */
  receiptName?: string
}

// ─── A recurring monthly expense configured by the admin ─────────────

export interface RecurringEgreso {
  id: string
  concepto: string
  categoria: EgresoCategoria
  amount: number
  description?: string
}

// ─── Rule-based maturity ─────────────────────────────────────────────

/** Rule-based maturity settings for financial charges */
export interface FinancialMaturityRules {
  mantenimiento: 'next_month_01' | 'next_month_10' | 'current_month_end'
  amenidad: 'day_of_event' | '1_day_before' | 'immediate'
  multaOtros: 'immediate' | '7_days_grace'
}

/** Moratory surcharge rule applied after grace period on unpaid debts */
export interface SurchargeConfig {
  /** Whether surcharges are active */
  enabled: boolean
  /** percent = % of outstanding balance; fixed = flat MXN amount */
  type: 'percent' | 'fixed'
  /** The rate or amount (e.g. 5 for 5% or 500 for $500 MXN flat) */
  amount: number
  /** Days overdue before the first surcharge is applied */
  graceDays: number
  /** How often the surcharge compounds */
  frequency: 'monthly' | 'one_time'
}

/** Building bank account and payment method configuration */
export interface BankingConfig {
  /** 18-digit CLABE interbancaria */
  clabe: string
  bankName: string
  accountHolder: string
  acceptsTransfer: boolean
  acceptsCash: boolean
  acceptsOxxo: boolean
  /** How resident constructs their payment reference */
  referenceFormat: 'apartment' | 'custom'
  customReferenceNote?: string
  notes?: string
}

// ─── Vencimiento (Maturity Rule) ──────────────────────────────────────

/** The 5 admin-configurable due-date modes */
export type VencimientoTipo =
  | 'n_dias'               // N days after charge generation
  | 'dia_n_mes_siguiente'  // Day N of the following month
  | 'ultimo_dia_mes'       // Last day of the current month
  | 'inmediato'            // Same day as generation
  | 'na'                   // No due date (e.g. one-off concepts)

export const VENCIMIENTO_TIPO_LABELS: Record<VencimientoTipo, string> = {
  n_dias:              'N días',
  dia_n_mes_siguiente: 'Día N mes sig.',
  ultimo_dia_mes:      'Último día del mes',
  inmediato:           'Inmediato',
  na:                  'N/A',
}

/** Structured due-date rule stored per concept */
export interface VencimientoRule {
  tipo: VencimientoTipo
  /** Parametric N — only used for n_dias and dia_n_mes_siguiente */
  n?: number
}

/** Human-readable label for a VencimientoRule */
export function vencimientoLabel(v: VencimientoRule): string {
  switch (v.tipo) {
    case 'n_dias':              return `${v.n ?? 1} día${(v.n ?? 1) !== 1 ? 's' : ''}`
    case 'dia_n_mes_siguiente': return `Día ${String(v.n ?? 1).padStart(2, '0')} mes sig.`
    case 'ultimo_dia_mes':      return 'Último día del mes'
    case 'inmediato':           return 'Inmediato'
    case 'na':                  return 'N/A'
  }
}

/** Parse legacy string vencimiento keys or passthrough new VencimientoRule */
export function parseVencimiento(v: unknown): VencimientoRule {
  if (v && typeof v === 'object' && 'tipo' in v) return v as VencimientoRule
  if (typeof v === 'string') {
    if (v === 'next_month_01') return { tipo: 'dia_n_mes_siguiente', n: 1 }
    if (v === 'next_month_10') return { tipo: 'dia_n_mes_siguiente', n: 10 }
    if (v === 'current_month_end') return { tipo: 'ultimo_dia_mes' }
    if (v === 'immediate')     return { tipo: 'inmediato' }
  }
  return { tipo: 'na' }
}

/** Compute the actual due date from a VencimientoRule relative to a charge date */
export function computeDueDate(rule: VencimientoRule, from: Date = new Date()): Date | null {
  const d = new Date(from)
  switch (rule.tipo) {
    case 'n_dias':
      d.setDate(d.getDate() + (rule.n ?? 1))
      return d
    case 'dia_n_mes_siguiente':
      d.setMonth(d.getMonth() + 1, rule.n ?? 1)
      return d
    case 'ultimo_dia_mes':
      d.setMonth(d.getMonth() + 1, 0)
      return d
    case 'inmediato':
      return d
    case 'na':
      return null
  }
}

// ─── ConceptoFinanciero ───────────────────────────────────────────────

/** Concept category — groups ingresos and egresos in one catalog */
export type ConceptoCategoria = 'ingreso' | 'egreso'

export const CONCEPTO_CATEGORIA_LABELS: Record<ConceptoCategoria, string> = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
}

/** A unified financial concept: both income charges and operational expenses */
export interface ConceptoFinanciero {
  id: string
  /** Human name, e.g. "Mensualidad", "Multa", "Nómina Porteros" */
  concepto: string
  /** Amount in MXN */
  monto: number
  /** Income or expense */
  categoria: ConceptoCategoria
  /** Optional description */
  descripcion?: string
  /** Structured due-date rule — admin-defined */
  vencimiento: VencimientoRule
  /** Grace days before surcharge applies */
  diasGracia: number
  /** Surcharge as percentage — mutually exclusive with recargoMonto */
  recargoPct: number | null
  /** Surcharge as fixed MXN amount — mutually exclusive with recargoPct */
  recargoMonto: number | null
  /** System-default concepts cannot be deleted */
  sistema?: boolean
}
