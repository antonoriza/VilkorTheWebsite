import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { type Votacion } from '../data/seed'

export default function Votaciones() {
  const { role, user, apartment } = useAuth()
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [viewAuditModal, setViewAuditModal] = useState<Votacion | null>(null)
  
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formOptions, setFormOptions] = useState<string[]>(['Opción 1', 'Opción 2'])
  const [selections, setSelections] = useState<Record<string, string>>({})

  const isAdmin = role === 'admin'

  const handleVote = (votacionId: string) => {
    const selected = selections[votacionId]
    if (!selected) return
    dispatch({
      type: 'VOTE',
      payload: {
        votacionId,
        optionLabel: selected,
        voter: {
          name: user,
          apartment: apartment || 'N/A',
          optionLabel: selected,
          votedAt: new Date().toISOString(),
        }
      }
    })
  }

  const handleAdd = () => {
    const validOptions = formOptions.map(o => o.trim()).filter(Boolean)
    if (!formTitle.trim() || validOptions.length < 2) return
    
    dispatch({
      type: 'ADD_VOTACION',
      payload: {
        id: `vot-${Date.now()}`,
        title: formTitle,
        description: formDesc,
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Activa',
        options: validOptions.map(label => ({ label, votes: 0 })),
        voters: [],
      },
    })
    setFormTitle('')
    setFormDesc('')
    setFormOptions(['Opción 1', 'Opción 2'])
    setShowModal(false)
  }

  const handleAddOption = () => {
    setFormOptions([...formOptions, `Opción ${formOptions.length + 1}`])
  }
  
  const updateOption = (index: number, val: string) => {
    const newOptions = [...formOptions]
    newOptions[index] = val
    setFormOptions(newOptions)
  }
  
  const removeOption = (index: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== index))
  }

  const PRESET_COLORS = [
    'from-rose-400 to-amber-400',
    'from-emerald-400 to-teal-400',
    'from-sky-400 to-indigo-400',
    'from-fuchsia-400 to-purple-400',
    'from-orange-400 to-rose-400'
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
          Votaciones Comunitarias
        </h1>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Nueva votación</span>
          </button>
        )}
      </div>

      {/* Votación cards */}
      <div className="space-y-8">
        {state.votaciones.map((vot) => {
          const totalVotes = vot.options.reduce((sum, o) => sum + o.votes, 0)
          
          // 1 vote per apartment
          const votersList = Array.isArray(vot.voters) ? vot.voters : []
          const hasVoted = votersList.some(v => v.apartment === (apartment || 'N/A'))

          return (
            <div
              key={vot.id}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all"
            >
              {/* Title & Status */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-xl font-headline font-extrabold text-slate-900 tracking-tight">
                    {vot.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{vot.description}</p>
                </div>
                <StatusBadge status={vot.status} size="md" />
              </div>

              {/* Period */}
              <div className="flex items-center space-x-2 text-slate-400 mb-8 mt-4">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Periodo: {vot.periodStart} — {vot.periodEnd}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-5">
                {vot.options.map((opt, idx) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
                  const colorGradient = PRESET_COLORS[idx % PRESET_COLORS.length]

                  return (
                    <div key={opt.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {!isAdmin && vot.status === 'Activa' && !hasVoted ? (
                            <label className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="radio"
                                name={`vote-${vot.id}`}
                                value={opt.label}
                                checked={selections[vot.id] === opt.label}
                                onChange={() => setSelections(s => ({ ...s, [vot.id]: opt.label }))}
                                className="w-5 h-5 text-primary border-slate-300 focus:ring-primary/20"
                              />
                              <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {opt.label}
                              </span>
                            </label>
                          ) : (
                            <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                          )}
                        </div>
                        {(isAdmin || hasVoted) && (
                          <span className="text-xs font-bold text-slate-500 tabular-nums">
                            {pct}% ({opt.votes} Votos)
                          </span>
                        )}
                      </div>

                      {(isAdmin || hasVoted) && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${colorGradient} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Vote button (resident only) */}
              {!isAdmin && vot.status === 'Activa' && !hasVoted && selections[vot.id] && (
                <div className="mt-8">
                  <button
                    onClick={() => handleVote(vot.id)}
                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
                  >
                    Votar
                  </button>
                </div>
              )}

              {hasVoted && !isAdmin && (
                <p className="mt-6 text-sm text-emerald-600 font-bold flex items-center space-x-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Tu voto ha sido registrado con éxito.</span>
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total de votos: {totalVotes}
                </span>
                {isAdmin && (
                  <button 
                    onClick={() => setViewAuditModal(vot)}
                    className="text-[10px] font-bold text-primary hover:text-primary-dim hover:bg-primary-container/20 px-4 py-2 rounded-lg border border-transparent hover:border-primary-dim uppercase tracking-widest transition-colors flex items-center space-x-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">group</span>
                    <span>Lista de Votantes</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Votación">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
              placeholder="Nombre de la votación..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium resize-none h-20"
              placeholder="Descripción de la votación..."
            />
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Opciones (Mínimo 2)
                </label>
                {formOptions.length < 6 && (
                   <button 
                     onClick={handleAddOption}
                     className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center transition-colors hover:text-primary-dim"
                   >
                     <span className="material-symbols-outlined text-[14px]">add</span>
                     Agregar
                   </button>
                )}
             </div>
             {formOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                    placeholder={`Opción ${idx + 1}`}
                  />
                  {formOptions.length > 2 && (
                    <button 
                      onClick={() => removeOption(idx)}
                      className="w-10 h-10 flex items-center justify-center shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                       <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
             ))}
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 mt-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Crear Votación
          </button>
        </div>
      </Modal>

      {/* Audit Modal — Fixed to read correct voter fields */}
      <Modal open={!!viewAuditModal} onClose={() => setViewAuditModal(null)} title="Auditoría de Votantes">
        {viewAuditModal && (
          <div className="space-y-4">
             <p className="text-sm font-medium text-slate-600 mb-4">
               Lista de residentes que han participado en: <strong className="text-slate-900">{viewAuditModal.title}</strong>
             </p>
             <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                     <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Residente</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Depto</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Elección</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fecha/Hora</th>
                     </tr>
                  </thead>
                  <tbody>
                     {Array.isArray(viewAuditModal.voters) && viewAuditModal.voters.map((v, idx) => (
                       <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm font-bold text-slate-900">{v.name}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{v.apartment}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{v.optionLabel || 'N/A'}</td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-500">
                            {v.votedAt ? new Date(v.votedAt).toLocaleString('es-MX') : '—'}
                          </td>
                       </tr>
                     ))}
                     {viewAuditModal.voters.length === 0 && (
                       <tr>
                         <td colSpan={4} className="px-4 py-6 text-center text-slate-400 font-medium text-sm">Nadie ha votado aún</td>
                       </tr>
                     )}
                  </tbody>
                </table>
             </div>
             <button
               onClick={() => setViewAuditModal(null)}
               className="w-full py-3 mt-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]"
             >
               Cerrar
             </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
