import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import Modal from '../components/Modal'

export default function Avisos() {
  const { role } = useAuth()
  const { state, dispatch } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formFile, setFormFile] = useState('')

  const handleAdd = () => {
    if (!formTitle.trim()) return
    dispatch({
      type: 'ADD_AVISO',
      payload: {
        id: `av-${Date.now()}`,
        title: formTitle,
        attachment: formFile || 'documento.pdf',
        date: new Date().toISOString().split('T')[0],
      },
    })
    setFormTitle('')
    setFormFile('')
    setShowModal(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Noticias y Avisos
          </h1>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-lg">upload</span>
            <span>Subir nuevo aviso</span>
          </button>
        )}
      </div>

      {/* Aviso cards */}
      <div className="space-y-6">
        {state.avisos.map((aviso) => (
          <div
            key={aviso.id}
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <h3 className="text-xl font-headline font-extrabold text-slate-900 tracking-tight">
                  {aviso.title}
                </h3>
                <div className="flex items-center space-x-2 text-slate-500">
                  <span className="material-symbols-outlined text-base">description</span>
                  <span className="text-sm font-medium">{aviso.attachment}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  {aviso.date}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-[11px] tracking-widest uppercase group-hover:border-slate-300">
                <span className="material-symbols-outlined text-lg">download</span>
                <span>Descargar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Subir Nuevo Aviso">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Título del aviso
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              placeholder="Mantenimiento de elevadores..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Archivo adjunto
            </label>
            <input
              type="text"
              value={formFile}
              onChange={(e) => setFormFile(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              placeholder="documento.pdf"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Publicar Aviso
          </button>
        </div>
      </Modal>
    </div>
  )
}
