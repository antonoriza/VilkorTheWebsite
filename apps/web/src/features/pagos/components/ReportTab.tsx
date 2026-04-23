/**
 * ReportTab — Financial income statement (Estado de Resultados).
 * Consumed by: PagosPage (report tab).
 * Does NOT handle: data computation (uses useReportData hook) or PDF rendering.
 */
import { EGRESO_CATEGORIA_LABELS } from '../../../types/financial'
import type { ReportData } from '../FinancialReportPDF'
import { monthKeyToLabel, todayMonthKey } from '../../../lib/month-utils'

const TODAY_KEY = todayMonthKey()

interface ReportTabProps {
  reportData: ReportData
  reportPeriod: 'month' | 'ytd'
  reportMonth: string
  monthRange: string[]
  pdfLoading: boolean
  managementCompany: string
  onPeriodChange: (period: 'month' | 'ytd') => void
  onMonthChange: (month: string) => void
  onDownloadPDF: () => void
}

export default function ReportTab({
  reportData, reportPeriod, reportMonth, monthRange,
  pdfLoading, managementCompany,
  onPeriodChange, onMonthChange, onDownloadPDF,
}: ReportTabProps) {
  return (
    <>
      {/* ── Period selector + actions ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
            <button onClick={() => onPeriodChange('month')}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                reportPeriod === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>Mensual</button>
            <button onClick={() => onPeriodChange('ytd')}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                reportPeriod === 'ytd' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
              }`}>Acumulado Anual</button>
          </div>
          {reportPeriod === 'month' && (
            <input type="month" value={reportMonth} min={monthRange[0]} max={monthRange[monthRange.length - 1]}
              onChange={e => onMonthChange(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 font-medium text-sm" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onDownloadPDF} disabled={pdfLoading}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-[11px] tracking-widest uppercase transition-all ${
              pdfLoading ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-900/10'
            }`}>
            <span className="material-symbols-outlined text-[16px]">{pdfLoading ? 'hourglass_empty' : 'picture_as_pdf'}</span>
            {pdfLoading ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      {/* ── Income Statement Card ── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{managementCompany}</p>
          <h2 className="text-xl font-headline font-extrabold text-slate-900 mt-1">Estado de Resultados</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {reportPeriod === 'month' ? `Período: ${monthKeyToLabel(reportMonth)}` : `Acumulado Enero — ${monthKeyToLabel(TODAY_KEY)} ${new Date().getFullYear()}`}
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* ── INGRESOS ── */}
          <div>
            <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Ingresos
            </h3>
            <div className="space-y-0.5">
              {reportData.ingresos.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium py-2">Sin ingresos cobrados en este período.</p>
              ) : reportData.ingresos.map((row, i) => (
                <div key={row.concepto} className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${i % 2 === 0 ? '' : 'bg-slate-50/70'}`}>
                  <span className="text-sm font-medium text-slate-700">{row.concepto}</span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">${row.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 mt-1 border-t-2 border-emerald-200 bg-emerald-50/50 rounded-lg">
              <span className="text-sm font-bold text-emerald-800">Total Ingresos</span>
              <span className="text-lg font-headline font-black text-emerald-700 tabular-nums">${reportData.totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* ── EGRESOS ── */}
          <div>
            <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              Egresos
            </h3>
            <div className="space-y-0.5">
              {reportData.egresos.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium py-2">Sin egresos registrados en este período.</p>
              ) : reportData.egresos.map((cat, i) => (
                <div key={cat.categoria}>
                  <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${i % 2 === 0 ? '' : 'bg-slate-50/70'}`}>
                    <span className="text-sm font-semibold text-slate-700">{EGRESO_CATEGORIA_LABELS[cat.categoria]}</span>
                    <span className="text-sm font-black text-slate-900 tabular-nums">${cat.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {cat.items.map(item => (
                    <div key={item.concepto} className="flex items-center justify-between px-8 py-1.5">
                      <span className="text-xs text-slate-400 font-medium">• {item.concepto}</span>
                      <span className="text-xs text-slate-500 tabular-nums">${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 mt-1 border-t-2 border-rose-200 bg-rose-50/50 rounded-lg">
              <span className="text-sm font-bold text-rose-800">Total Egresos</span>
              <span className="text-lg font-headline font-black text-rose-700 tabular-nums">${reportData.totalEgresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* ── NET RESULT ── */}
          <div className={`flex items-center justify-between px-6 py-5 rounded-2xl border-2 ${
            reportData.netResult >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
          }`}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Resultado del Período</p>
              <p className="text-sm font-bold text-slate-600 mt-0.5">Ingresos − Egresos</p>
            </div>
            <p className={`text-3xl font-headline font-black tabular-nums ${reportData.netResult >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ${reportData.netResult.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* ── DELINQUENCY ── */}
          {(reportData.pendingCharges > 0 || reportData.activeAdeudos > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Cartera Pendiente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xl font-headline font-black text-amber-800 tabular-nums">${reportData.pendingCharges.toLocaleString('es-MX')}</p>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">Cargos sin cobrar</p>
                </div>
                <div>
                  <p className="text-xl font-headline font-black text-amber-800 tabular-nums">${reportData.activeAdeudosAmount.toLocaleString('es-MX')}</p>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">{reportData.activeAdeudos} adeudo(s) activo(s)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
