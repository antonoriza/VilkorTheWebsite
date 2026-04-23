/**
 * AvisoDetailModal — Full aviso detail view with attachment preview,
 * assembly confirmation tracking, and admin actions.
 * Consumed by: AvisosPage.
 */
import Modal from '../../../core/components/Modal'
import type { Aviso } from '../../../types'

interface AvisoDetailModalProps {
  /** The aviso being viewed (null = closed) */
  aviso: Aviso | null
  onClose: () => void
  /** Admin flag */
  isAdmin: boolean
  /** Current user identity (for resident confirmation) */
  user: string | null
  apartment: string | null
  /** Callbacks */
  onEdit: (aviso: Aviso) => void
  onDelete: (id: string) => void
  onConfirmAsamblea: (avisoId: string) => void
  onOpenAudit: () => void
  /** Duration calculator */
  calcDuration: (start?: string, end?: string) => string | null
}

export default function AvisoDetailModal({
  aviso, onClose, isAdmin, user,
  onEdit, onDelete, onConfirmAsamblea, onOpenAudit, calcDuration,
}: AvisoDetailModalProps) {
  if (!aviso) return null

  return (
    <Modal open={!!aviso} onClose={onClose} title={aviso.title || 'Detalle del Aviso'}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{aviso.date}</span>
          {aviso.category === 'asamblea' && (
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">campaign</span>
              Asamblea
            </span>
          )}
        </div>

        {/* Rich text description */}
        {aviso.description ? (
          <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aviso.description }} />
        ) : (
          <p className="text-slate-400 text-sm italic">Sin descripción detallada.</p>
        )}

        {/* Duration info */}
        {aviso.category === 'asamblea' && aviso.startTime && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
              <p className="text-sm font-black text-slate-900 mt-1">{aviso.startDate || aviso.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</p>
              <p className="text-sm font-black text-slate-900 mt-1">{aviso.startTime} – {aviso.endTime}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duración</p>
              <p className="text-sm font-black text-slate-900 mt-1">{calcDuration(aviso.startTime, aviso.endTime) || '—'}</p>
            </div>
          </div>
        )}

        {/* Attachments — image */}
        {aviso.attachmentData && aviso.attachmentType === 'image' && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
            <img src={aviso.attachmentData} alt="Adjunto" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
          </div>
        )}
        {/* Attachments — PDF */}
        {aviso.attachmentData && aviso.attachmentType === 'pdf' && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-3xl text-rose-500">picture_as_pdf</span>
              <div>
                <p className="font-bold text-sm text-slate-900">{aviso.attachment}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Documento PDF</p>
              </div>
            </div>
            <a href={aviso.attachmentData} download={aviso.attachment}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-900 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-1">
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>Descargar</span>
            </a>
          </div>
        )}

        {/* Assembly confirmation section */}
        {aviso.category === 'asamblea' && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            {isAdmin ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Residentes Confirmados ({aviso.tracking?.filter(t => t.type === 'confirm').length || 0})
                  </p>
                  {(!aviso.tracking || aviso.tracking.filter(t => t.type === 'confirm').length === 0) ? (
                    <p className="text-sm font-medium text-slate-500">Ningún residente ha confirmado.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {aviso.tracking.filter(t => t.type === 'confirm').map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-sm font-medium bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-slate-900 font-bold">{c.apartment} — {c.resident}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(c.timestamp).toLocaleString('es-MX')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={onOpenAudit}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center space-x-2"
                >
                  <span className="material-symbols-outlined text-[16px]">group</span>
                  <span>Auditoría de Asistencia</span>
                </button>
              </div>
            ) : (
              <div>
                {aviso.tracking?.some(c => c.resident === user && c.type === 'confirm') ? (
                  <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                    <div>
                      <p className="font-bold text-sm">Asistencia Confirmada</p>
                      <p className="text-xs font-medium opacity-80">Gracias, tu participación ha sido registrada.</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onConfirmAsamblea(aviso.id)}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Confirmar Asistencia</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
            <button
              onClick={() => onEdit(aviso)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[11px] tracking-widest uppercase hover:border-slate-300"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Editar</span>
            </button>
            <button
              onClick={() => { onDelete(aviso.id); onClose() }}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-[11px] tracking-widest uppercase hover:border-rose-300"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Borrar</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
