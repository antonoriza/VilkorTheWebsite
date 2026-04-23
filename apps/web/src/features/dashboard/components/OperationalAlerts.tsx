/**
 * OperationalAlerts — Critical alerts + approval queue panels.
 * Consumed by: AdminDashboard (right column).
 *
 * Pure UI component — receives pre-computed data via props.
 */
import { Link } from 'react-router-dom'
import type { Pago, Ticket, Paquete, Reservacion } from '../../../types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface AlertItem {
  title: string
  body: string
  icon: string
  severity: 'critical' | 'warning'
  link: string
}

interface ApprovalItem {
  id: string
  type: string
  detail: string
  date: string
  icon: string
  original: Reservacion
}

interface OperationalAlertsProps {
  /** Raw store data for alert derivation */
  pagos: Pago[]
  tickets: Ticket[]
  paquetes: Paquete[]
  buildingName: string
  totalUnits: number
  /** Pre-derived approval queue */
  approvals: ApprovalItem[]
  /** Callback for approve/reject */
  onApproval: (id: string, action: 'approve' | 'reject') => void
}

// ═══════════════════════════════════════════════════════════════════
// ALERT DERIVATION
// ═══════════════════════════════════════════════════════════════════

function deriveAlerts(
  pagos: Pago[], tickets: Ticket[], paquetes: Paquete[],
  buildingName: string, totalUnits: number,
): AlertItem[] {
  const alerts: AlertItem[] = []

  // Overdue payments
  const overdueCount = pagos.filter(p => p.status === 'Vencido').length
  if (overdueCount > 0) {
    alerts.push({
      title: `${overdueCount} pago${overdueCount > 1 ? 's' : ''} vencido${overdueCount > 1 ? 's' : ''}`,
      body: 'Existen cargos vencidos pendientes de gestión.',
      icon: 'payments', severity: overdueCount > 5 ? 'critical' : 'warning', link: '/pagos',
    })
  }

  // Pending approval payments
  const porValidarCount = pagos.filter(p => p.status === 'Por validar').length
  if (porValidarCount > 0) {
    alerts.push({
      title: `${porValidarCount} comprobante${porValidarCount > 1 ? 's' : ''} por validar`,
      body: 'Residentes han subido comprobantes esperando revisión.',
      icon: 'fact_check', severity: 'warning', link: '/pagos',
    })
  }

  // Stale open tickets (open > 72h)
  const staleThreshold = Date.now() - 72 * 60 * 60 * 1000
  const staleTickets = tickets.filter(t =>
    t.status !== 'Cerrado' && t.status !== 'Resuelto' && new Date(t.createdAt).getTime() < staleThreshold
  ).length
  if (staleTickets > 0) {
    alerts.push({
      title: `${staleTickets} ticket${staleTickets > 1 ? 's' : ''} sin resolver (+72h)`,
      body: 'Tickets de servicio abiertos requieren atención.',
      icon: 'schedule', severity: staleTickets > 3 ? 'critical' : 'warning', link: '/tickets',
    })
  }

  // Undelivered packages > 3 days
  const pkgThreshold = Date.now() - 3 * 24 * 60 * 60 * 1000
  const stalePkgs = paquetes.filter(p =>
    p.status === 'Pendiente' && new Date(p.receivedDate).getTime() < pkgThreshold
  ).length
  if (stalePkgs > 0) {
    alerts.push({
      title: `${stalePkgs} paquete${stalePkgs > 1 ? 's' : ''} sin entregar (+3 días)`,
      body: 'Paquetes en espera requieren notificación a residentes.',
      icon: 'package_2', severity: 'warning', link: '/paqueteria',
    })
  }

  // Building not configured
  if (!buildingName || totalUnits === 0) {
    alerts.push({
      title: 'Configuración pendiente',
      body: 'Configura nombre, torres y unidades del edificio para habilitar todas las funciones.',
      icon: 'settings', severity: 'warning', link: '/configuracion',
    })
  }

  return alerts
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

/** Empty state badge reused for both sections */
function EmptyBadge() {
  return (
    <div className="p-8 text-center text-emerald-600 font-medium bg-emerald-50/50 border border-emerald-100/50 rounded-2xl animate-in fade-in">
      <span className="material-symbols-outlined text-2xl mb-1 block">check_circle</span>
      <span className="text-[11px] uppercase tracking-widest font-black">Todo en orden</span>
    </div>
  )
}

export default function OperationalAlerts({
  pagos, tickets, paquetes, buildingName, totalUnits,
  approvals, onApproval,
}: OperationalAlertsProps) {
  const alerts = deriveAlerts(pagos, tickets, paquetes, buildingName, totalUnits)

  return (
    <>
      {/* ── Critical Alerts ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[18px]">warning</span>
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Alertas Críticas</h3>
          </div>
        </div>
        <div className="space-y-4">
          {alerts.length === 0 ? <EmptyBadge /> : alerts.map((alert) => (
            <Link to={alert.link} key={alert.title} className={`p-6 border rounded-3xl shadow-sm flex items-center space-x-5 group transition-all ${
              alert.severity === 'critical' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
            }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                alert.severity === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                <span className="material-symbols-outlined">{alert.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[15px] font-bold text-slate-900">{alert.title}</h4>
                <p className="text-sm text-slate-600 font-medium mt-1">{alert.body}</p>
              </div>
              <span className="material-symbols-outlined w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                trending_flat
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Approval Queue ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Cola de Aprobaciones</h3>
          <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded-lg">{approvals.length}</span>
        </div>
        <div className="space-y-4">
          {approvals.length === 0 && <EmptyBadge />}
          {approvals.map((item) => (
            <div key={item.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center space-x-5 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary border border-slate-100">
                <span className="material-symbols-outlined text-lg font-bold">{item.icon}</span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">{item.type}</span>
                <h4 className="text-[14px] font-bold text-slate-900">{item.detail}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{item.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onApproval(item.id, 'approve')} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center" title="Aprobar">
                  <span className="material-symbols-outlined font-bold">check</span>
                </button>
                <button onClick={() => onApproval(item.id, 'reject')} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center" title="Rechazar">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
