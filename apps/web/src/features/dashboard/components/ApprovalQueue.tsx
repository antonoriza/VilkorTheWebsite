/**
 * ApprovalQueue — Pending reservation approvals panel.
 * Consumed by: AdminDashboard (right column).
 *
 * Only rendered when reservationApprovalMode !== 'auto_approve'.
 * Pure UI component — receives pre-computed data via props.
 */
import type { Reservacion } from '../../../types'

interface ApprovalItem {
  id: string
  type: string
  detail: string
  date: string
  icon: string
  original: Reservacion
}

interface ApprovalQueueProps {
  approvals: ApprovalItem[]
  onApproval: (id: string, action: 'approve' | 'reject') => void
}

export default function ApprovalQueue({ approvals, onApproval }: ApprovalQueueProps) {
  if (approvals.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">approval</span>
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Reservaciones Pendientes</h3>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">0</span>
        </div>
        <div className="p-8 text-center text-emerald-600 font-medium bg-emerald-50/50 border border-emerald-100/50 rounded-2xl animate-in fade-in">
          <span className="material-symbols-outlined text-2xl mb-1 block">check_circle</span>
          <span className="text-[11px] uppercase tracking-widest font-black">Sin solicitudes pendientes</span>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-[18px]">approval</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Reservaciones Pendientes</h3>
        </div>
        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100 animate-pulse">{approvals.length}</span>
      </div>
      <div className="space-y-4">
        {approvals.map((item) => (
          <div key={item.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center space-x-5 hover:border-amber-200 transition-all group">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-lg font-bold">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">{item.type}</span>
              <h4 className="text-[14px] font-bold text-slate-900 truncate">{item.detail}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{item.date}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onApproval(item.id, 'approve')}
                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all flex items-center justify-center border border-emerald-100"
                title="Aprobar"
              >
                <span className="material-symbols-outlined font-bold">check</span>
              </button>
              <button
                onClick={() => onApproval(item.id, 'reject')}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:scale-105 transition-all flex items-center justify-center border border-slate-100 hover:border-rose-100"
                title="Rechazar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
