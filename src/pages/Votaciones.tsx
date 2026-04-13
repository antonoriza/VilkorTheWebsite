import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

export default function Votaciones() {
  const { role, user } = useAuth()
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formOptions, setFormOptions] = useState('')
  const [selections, setSelections] = useState<Record<string, string>>({})

  const isAdmin = role === 'admin'

  const handleVote = (votacionId: string) => {
    const selected = selections[votacionId]
    if (!selected) return
    dispatch({ type: 'VOTE', payload: { votacionId, optionLabel: selected, voterId: user } })
  }

  const handleAdd = () => {
    if (!formTitle.trim() || !formOptions.trim()) return
    const options = formOptions.split(',').map(o => o.trim()).filter(Boolean)
    dispatch({
      type: 'ADD_VOTACION',
      payload: {
        id: `vot-${Date.now()}`,
        title: formTitle,
        description: formDesc,
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Activa',
        options: options.map(label => ({ label, votes: 0 })),
        voters: [],
      },
    })
    setFormTitle('')
    setFormDesc('')
    setFormOptions('')
    setShowModal(false)
  }

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
          const hasVoted = vot.voters.includes(user)

          return (
            <div
              key={vot.id}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all"
            >
              {/* Title & Status */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-xl font-headline font-extrabold text-slate-900 tracking-tight">
                    {vot.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">{vot.description}</p>
                </div>
                <StatusBadge status={vot.status} size="md" />
              </div>

              {/* Period */}
              <div className="flex items-center space-x-2 text-slate-400 mb-8">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Periodo: {vot.periodStart} — {vot.periodEnd}
                </span>
              </div>

              {/* Options */}
              <div className="space-y-5">
                {vot.options.map((opt) => {
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0

                  return (
                    <div key={opt.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Resident: radio to vote. Admin: just show label */}
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
                            {pct}% ({opt.votes} Total de votos)
                          </span>
                        )}
                      </div>

                      {/* Progress bar (shown to admin or after voting) */}
                      {(isAdmin || hasVoted) && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full transition-all duration-700"
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
                  <span>Tu voto ha sido registrado</span>
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total de votos: {totalVotes}
                </span>
                {isAdmin && (
                  <button className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest transition-colors flex items-center space-x-1">
                    <span className="material-symbols-outlined text-sm">group</span>
                    <span>Votantes</span>
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
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              placeholder="Nombre de la votación..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium resize-none h-20"
              placeholder="Descripción de la votación..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Opciones (separadas por coma)
            </label>
            <input
              type="text"
              value={formOptions}
              onChange={(e) => setFormOptions(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              placeholder="Opción 1, Opción 2, Opción 3"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Crear Votación
          </button>
        </div>
      </Modal>
    </div>
  )
}
