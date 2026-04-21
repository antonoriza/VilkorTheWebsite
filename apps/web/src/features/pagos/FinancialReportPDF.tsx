/**
 * FinancialReportPDF — A4 Income Statement PDF document.
 *
 * Uses @react-pdf/renderer to generate a professional, vector-text,
 * selectable PDF for HOA/condominium financial reporting.
 *
 * Usage:
 *   const blob = await pdf(<FinancialReportPDF data={...} />).toBlob()
 *   saveAs(blob, 'reporte.pdf')
 */
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { EGRESO_CATEGORIA_LABELS, type EgresoCategoria } from '../../core/store/seed'

// ─── Types ────────────────────────────────────────────────────────────

export interface IncomeRow {
  concepto: string
  amount: number
}

export interface ExpenseRow {
  categoria: EgresoCategoria
  label: string
  amount: number
  items: { concepto: string; amount: number }[]
}

export interface ReportData {
  buildingName: string
  buildingAddress: string
  managementCompany: string
  periodLabel: string
  generatedAt: string
  ingresos: IncomeRow[]
  totalIngresos: number
  egresos: ExpenseRow[]
  totalEgresos: number
  netResult: number
  pendingCharges: number
  activeAdeudos: number
  activeAdeudosAmount: number
}

// ─── Styles ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 40,
    color: '#1e293b',
    lineHeight: 1.4,
  },
  // Header
  headerBlock: {
    marginBottom: 20,
    borderBottom: '2pt solid #0f172a',
    paddingBottom: 12,
  },
  buildingName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  buildingAddress: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 1,
  },
  managementCo: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  periodLabel: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
  },
  generatedAt: {
    fontSize: 8,
    color: '#94a3b8',
  },
  // Section
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 6,
    borderBottom: '0.5pt solid #cbd5e1',
    paddingBottom: 4,
  },
  // Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  rowAlt: {
    backgroundColor: '#f8fafc',
  },
  rowLabel: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
  },
  rowAmount: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'right',
    width: 100,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 12,
  },
  subRowLabel: {
    fontSize: 8,
    color: '#64748b',
    flex: 1,
  },
  subRowAmount: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'right',
    width: 100,
  },
  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTop: '1pt solid #0f172a',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    flex: 1,
  },
  totalAmount: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'right',
    width: 100,
  },
  // Net result
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 12,
    borderTop: '2pt solid #0f172a',
    borderBottom: '2pt solid #0f172a',
  },
  netLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    flex: 1,
  },
  netAmountPositive: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    textAlign: 'right',
    width: 120,
  },
  netAmountNegative: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    textAlign: 'right',
    width: 120,
  },
  // Delinquency
  delinquencyBlock: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    border: '0.5pt solid #fecaca',
  },
  delinquencyTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  delinquencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  delinquencyLabel: {
    fontSize: 8,
    color: '#7f1d1d',
  },
  delinquencyAmount: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.5pt solid #e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
})

function fmt(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Component ────────────────────────────────────────────────────────

export default function FinancialReportPDF({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerBlock}>
          <Text style={s.buildingName}>{data.buildingName}</Text>
          <Text style={s.buildingAddress}>{data.buildingAddress}</Text>
          <Text style={s.managementCo}>{data.managementCompany}</Text>
        </View>

        <Text style={s.reportTitle}>Estado de Resultados</Text>
        <Text style={s.periodLabel}>Período: {data.periodLabel}</Text>
        <Text style={s.generatedAt}>Generado: {data.generatedAt}</Text>

        {/* ═══ INGRESOS ═══ */}
        <Text style={s.sectionTitle}>Ingresos</Text>
        {data.ingresos.map((row, i) => (
          <View key={row.concepto} style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}>
            <Text style={s.rowLabel}>{row.concepto}</Text>
            <Text style={s.rowAmount}>{fmt(row.amount)}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total Ingresos</Text>
          <Text style={s.totalAmount}>{fmt(data.totalIngresos)}</Text>
        </View>

        {/* ═══ EGRESOS ═══ */}
        <Text style={s.sectionTitle}>Egresos</Text>
        {data.egresos.map((cat, i) => (
          <View key={cat.categoria}>
            <View style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}>
              <Text style={s.rowLabel}>{EGRESO_CATEGORIA_LABELS[cat.categoria] || cat.label}</Text>
              <Text style={s.rowAmount}>{fmt(cat.amount)}</Text>
            </View>
            {cat.items.map(item => (
              <View key={item.concepto} style={s.subRow}>
                <Text style={s.subRowLabel}>• {item.concepto}</Text>
                <Text style={s.subRowAmount}>{fmt(item.amount)}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total Egresos</Text>
          <Text style={s.totalAmount}>{fmt(data.totalEgresos)}</Text>
        </View>

        {/* ═══ NET RESULT ═══ */}
        <View style={s.netRow}>
          <Text style={s.netLabel}>Resultado del Período</Text>
          <Text style={data.netResult >= 0 ? s.netAmountPositive : s.netAmountNegative}>
            {fmt(data.netResult)}
          </Text>
        </View>

        {/* ═══ DELINQUENCY ═══ */}
        {(data.pendingCharges > 0 || data.activeAdeudos > 0) && (
          <View style={s.delinquencyBlock}>
            <Text style={s.delinquencyTitle}>Cartera Vencida / Pendientes</Text>
            <View style={s.delinquencyRow}>
              <Text style={s.delinquencyLabel}>Cargos pendientes de cobro</Text>
              <Text style={s.delinquencyAmount}>{fmt(data.pendingCharges)}</Text>
            </View>
            <View style={s.delinquencyRow}>
              <Text style={s.delinquencyLabel}>Adeudos activos ({data.activeAdeudos} registros)</Text>
              <Text style={s.delinquencyAmount}>{fmt(data.activeAdeudosAmount)}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generado por CantonAlfa · {data.managementCompany}</Text>
          <Text style={s.footerText}>{data.generatedAt}</Text>
        </View>

      </Page>
    </Document>
  )
}
