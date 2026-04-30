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
import { useStore } from '../../../core/store/store'
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
  onAssign: (ticket: Ticket, assignee: string) => void
}

export default function TicketDetailModal({
  ticket, onClose, isAdmin,
  onStatusChange, onAddActivity, onAssign
}: TicketDetailModalProps) {
  const [activityMsg, setActivityMsg] = useState('')
  const [activityVisibility, setActivityVisibility] = useState<'internal' | 'public'>('public')
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  const { apartment, user: currentUser } = useAuth()
  const { state } = useStore()
  const isOwner = ticket?.apartment === apartment
  const shouldAnonymize = ticket?.isPublic && !isOwner && !isAdmin

  const staffNames = state.staff.map(s => s.name)
  const assignablePeople = Array.from(new Set([
    state.buildingConfig.adminName,
    currentUser,
    ...staffNames
  ])).filter(Boolean) as string[]

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
                <span className="flex items-center text-primary">
                  <span className="material-symbols-outlined text-[14px] mr-1">assignment_ind</span> 
                  {ticket.assignedTo ? `Responsable: ${ticket.assignedTo}` : 'Sin asignar'}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && ticket.status !== 'Cerrado' && (
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</p>
                  <select
                    value={ticket.assignedTo || ''}
                    onChange={(e) => onAssign(ticket, e.target.value)}
                    className="w-full md:w-64 pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {assignablePeople.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={ticket.status}
                      onChange={(e) => onStatusChange(ticket, e.target.value as TicketStatus)}
                      className="pl-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-sm"
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
              </div>
            </div>
          )}

          {/* Activity Stream */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Bitácora de Actividad
            </h4>
            <div className="space-y-6 max-h-96 overflow-y-auto pr-4 relative">
              {/* Timeline Connector Line */}
              <div className="absolute left-6 top-2 bottom-8 w-0.5 bg-slate-100 -z-10" />

              {visibleActivities.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">history</span>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sin actividad registrada.</p>
                </div>
              ) : (
                visibleActivities.map((act) => {
                  const isSystem = act.author === 'Sistema'
                  const isInternal = act.visibility === 'internal'
                  
                  return (
                    <div key={act.id} className="relative pl-12">
                      {/* Timeline Dot/Icon */}
                      <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ring-4 ring-slate-50 transition-all ${
                        isSystem ? 'bg-slate-400' : isInternal ? 'bg-amber-500' : 'bg-primary'
                      }`} />

                      <div className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
                        isInternal 
                          ? 'bg-amber-50/50 border-amber-100 shadow-sm shadow-amber-900/5' 
                          : isSystem 
                            ? 'bg-slate-50 border-slate-100 opacity-90' 
                            : 'bg-white border-slate-100 shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isInternal ? 'text-amber-700' : 'text-slate-900'}`}>
                              {act.author}
                            </span>
                            {isInternal && (
                              <span className="flex items-center gap-0.5 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                                <span className="material-symbols-outlined text-[10px]">lock</span>
                                Interno
                              </span>
                            )}
                            {isSystem && (
                              <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Sistema</span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          isInternal ? 'text-amber-900/80 font-medium' : 'text-slate-600'
                        }`}>
                          {act.message}
                        </p>
                        <div className="mt-2 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                           {new Date(act.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })
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
