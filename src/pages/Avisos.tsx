import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import Modal from '../components/Modal'
import { type Aviso } from '../data/seed'

export default function Avisos() {
  const { role } = useAuth()
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formFile, setFormFile] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')

  const isAdmin = role === 'admin'

  const visibleAvisos = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return state.avisos.filter(a => {
      if (isAdmin) return true // Admin sees all
      // Content gating for residents
      if (a.startDate && a.startDate > today) return false
      if (a.endDate && a.endDate < today) return false
      return true
    })
  }, [state.avisos, isAdmin])

  const handleOpenModal = (aviso?: Aviso) => {
    if (aviso) {
      setEditingId(aviso.id)
      setFormTitle(aviso.title)
      setFormDesc(aviso.description || '')
      setFormFile(aviso.attachment)
      setFormStartDate(aviso.startDate || '')
      setFormEndDate(aviso.endDate || '')
    } else {
      setEditingId(null)
      setFormTitle('')
      setFormDesc('')
      setFormFile('')
      setFormStartDate('')
      setFormEndDate('')
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!formTitle.trim()) return

    const baseAviso = {
      title: formTitle,
      description: formDesc,
      attachment: formFile || 'documento.pdf',
      startDate: formStartDate || undefined,
      endDate: formEndDate ? formEndDate : null,
      date: new Date().toISOString().split('T')[0],
    }

    if (editingId) {
      const existing = state.avisos.find(a => a.id === editingId)
      if (existing) {
        dispatch({
          type: 'UPDATE_AVISO',
          payload: { ...existing, ...baseAviso }
        })
      }
    } else {
      dispatch({
        type: 'ADD_AVISO',
        payload: {
          id: `av-${Date.now()}`,
          ...baseAviso
        },
      })
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_AVISO', payload: id })
  }

  const handleDownload = (aviso: Aviso) => {
    // Simulate file download with a generated text file
    const content = [
      `═══════════════════════════════════════`,
      `  AVISO — ${aviso.title}`,
      `═══════════════════════════════════════`,
      ``,
      `Fecha de publicación: ${aviso.date}`,
      `Archivo original: ${aviso.attachment}`,
      ``,
      `Descripción:`,
      aviso.description || 'Sin descripción.',
      ``,
      `Este es un documento de demostración generado por CantonAlfa.`,
      `En producción, este botón descargaría el archivo real adjunto.`,
      ``,
      `Lote Alemania — Cosmopol HU Lifestyle`,
      ``,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = aviso.attachment.replace(/\.[^.]+$/, '') + '.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Noticias y Avisos
          </h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-lg">upload</span>
            <span>Nuevo Aviso</span>
          </button>
        )}
      </div>

      {/* Aviso cards */}
      <div className="space-y-6">
        {visibleAvisos.map((aviso) => {
          let statusBadge = null
          if (isAdmin) {
            if (aviso.startDate && aviso.startDate > todayStr) {
              statusBadge = <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md font-bold uppercase ml-3 border border-amber-200">Programado</span>
            } else if (aviso.endDate && aviso.endDate < todayStr) {
              statusBadge = <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase ml-3 border border-slate-200">Caducado</span>
            }
          }

          return (
            <div
              key={aviso.id}
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center">
                    <h3 className="text-xl font-headline font-extrabold text-slate-900 tracking-tight">
                      {aviso.title}
                    </h3>
                    {statusBadge}
                  </div>
                  {aviso.description && (
                    <p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">
                      {aviso.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-primary font-bold bg-primary-container/30 px-3 py-1.5 rounded-lg border border-primary-dim">
                      <span className="material-symbols-outlined text-[1rem]">description</span>
                      <span className="text-xs uppercase tracking-widest">{aviso.attachment}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    {aviso.date}
                  </span>
                  {isAdmin && (aviso.startDate || aviso.endDate) && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      Vi: {aviso.startDate || '—'} a {aviso.endDate || '—'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6 gap-3 pt-6 border-t border-slate-50">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleOpenModal(aviso)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[11px] tracking-widest uppercase hover:border-slate-300"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(aviso.id)}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-[11px] tracking-widest uppercase hover:border-rose-300"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Borrar</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDownload(aviso)}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 border border-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-[11px] tracking-widest uppercase"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Descargar Muestra</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Aviso' : 'Subir Nuevo Aviso'}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título *</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Archivo Adjunto</label>
            <input
              type="text"
              value={formFile}
              onChange={(e) => setFormFile(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              placeholder="documento.pdf"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inicio Visible (Opcional)</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Expiración (Opcional)</label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            {editingId ? 'Guardar Cambios' : 'Publicar Aviso'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
