/**
 * TicketDetailModal — Ticket detail view with activity stream,
 * status controls, and activity entry form.
 * Consumed by: TicketsPage.
 */
import { useState } from 'react'
import { useAuth } from '../../../core/auth/AuthContext'
import Modal from '../../../core/components/Modal'
import ConfirmDialog from '../../../core/components/ConfirmDialog'
import StatusBadge from '../../../core/components/StatusBadge'
import type { Ticket, TicketStatus } from '../../../types'

const PRIORITY_COLORS = {
  Alta: 'text-rose-600 bg-rose-50 border-rose-200',
  Media: 'text-amber-600 bg-amber-50 border-amber-200',
  Baja: 'text-emerald-600 bg-emerald-50 border-emerald-200',
}

const STATUSES: TicketStatus[] = ['Nuevo', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado']

interface TicketDetailModalProps {
  ticket: Ticket | null
  onClose: () => void
  isAdmin: boolean
  /** Callbacks */
  onStatusChange: (ticket: Ticket, newStatus: TicketStatus) => void
  onAddActivity: (ticketId: string, message: string, visibility: 'internal' | 'public') => void
}

export default function TicketDetailModal({
  ticket, onClose, isAdmin,
  onStatusChange, onAddActivity,
}: TicketDetailModalProps) {
  const [activityMsg, setActivityMsg] = useState('')
  const [activityVisibility, setActivityVisibility] = useState<'internal' | 'public'>('public')
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  const { apartment } = useAuth()
  const isOwner = ticket?.apartment === apartment
  const shouldAnonymize = ticket?.isPublic && !isOwner && !isAdmin

  if (!ticket) return null

  const visibleActivities = ticket.activities.filter(a => {
    if (isAdmin) return true
    return a.visibility === 'public'
  })

  const handleSendActivity = () => {
    if (!activityMsg.trim()) return
    onAddActivity(ticket.id, activityMsg, activityVisibility)
    setActivityMsg('')
  }

  const handleClose = () => {
    setActivityMsg('')
    setActivityVisibility('public')
    setCloseDialogOpen(false)
    onClose()
  }

  return (
    <>
      <Modal open={!!ticket} onClose={handleClose} title={`Ticket #${ticket.number}`}>
        <div className="space-y-8">
          {/* Meta */}
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <StatusBadge status={ticket.status} size="md" />
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${PRIORITY_COLORS[ticket.priority]}`}>
                Impacto {ticket.priority}
              </span>
              {ticket.isPublic && (
                <span className="flex items-center gap-1 text-[9px] font-black text-primary border border-primary/20 px-3 py-1 rounded-md uppercase tracking-widest bg-primary/5 shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">public</span>
                  Público
                </span>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-headline font-black text-slate-900">{ticket.subject}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center">
                  <span className="material-symbols-outlined text-[14px] mr-1 text-slate-400">person</span> 
                  {shouldAnonymize ? 'Residente Anónimo' : `${ticket.createdBy} (${ticket.apartment})`}
                </span>
                <span className="flex items-center"><span className="material-symbols-outlined text-[14px] mr-1 text-slate-400">category</span> {ticket.category}</span>
                {ticket.location && <span className="flex items-center"><span className="material-symbols-outlined text-[14px] mr-1 text-slate-400">location_on</span> {ticket.location}</span>}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && ticket.status !== 'Cerrado' && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar Estado</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={ticket.status}
                  onChange={(e) => onStatusChange(ticket, e.target.value as TicketStatus)}
                  className="pl-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-sm"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => setCloseDialogOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-xs"
                >
                  Forzar Cierre
                </button>
              </div>
            </div>
          )}

          {/* Activity Stream */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Bitácora de Actividad
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {visibleActivities.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center py-4 uppercase tracking-widest">Sin actividad registrada.</p>
              ) : (
                visibleActivities.map(act => (
                  <div key={act.id} className={`p-4 rounded-2xl border ${act.visibility === 'internal' ? 'bg-amber-50/50 border-amber-100/50' : 'bg-white border-slate-100 shadow-sm'} ${act.author === 'Sistema' ? 'opacity-80' : ''}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{act.author}</span>
                        {act.visibility === 'internal' && (
                          <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Nota Interna</span>
                        )}
                        {act.author === 'Sistema' && (
                          <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Sistema</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    <p className={`text-sm tracking-tight ${act.visibility === 'internal' ? 'text-amber-900/80 font-medium' : 'text-slate-600'}`}>{act.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Activity Form */}
            {ticket.status !== 'Cerrado' && (isAdmin || isOwner) && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <textarea
                  value={activityMsg}
                  onChange={(e) => setActivityMsg(e.target.value)}
                  placeholder="Escribe una actualización o nota..."
                  rows={2}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
                <div className="flex items-center justify-between">
                  {isAdmin ? (
                    <div className="flex items-center space-x-4 ml-1">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="radio" checked={activityVisibility === 'public'} onChange={() => setActivityVisibility('public')} className="text-slate-900 focus:ring-slate-900" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Respuesta Pública</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input type="radio" checked={activityVisibility === 'internal'} onChange={() => setActivityVisibility('internal')} className="text-amber-600 focus:ring-amber-600" />
                        <span className="text-xs font-bold text-amber-600/70 uppercase tracking-widest group-hover:text-amber-600 transition-colors">Nota Interna</span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Respuesta al Administrador</div>
                  )}
                  <button
                    onClick={handleSendActivity}
                    disabled={!activityMsg.trim()}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all text-[10px] uppercase tracking-widest"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm Close Dialog */}
      <ConfirmDialog
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        onConfirm={() => {
          onStatusChange(ticket, 'Cerrado')
          setCloseDialogOpen(false)
        }}
        title="Cerrar Ticket"
        confirmLabel="Sí, Cerrar"
        variant="neutral"
      >
        Estás a punto de forzar el cierre del ticket #{ticket.number}. Ya no se podrán agregar nuevas actividades. ¿Proceder?
      </ConfirmDialog>
    </>
  )
}
