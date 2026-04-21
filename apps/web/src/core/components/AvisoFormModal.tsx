/**
 * AvisoFormModal — Unified form for creating and editing announcements.
 *
 * Shared between AdminDashboard (quick create) and AvisosPage (full CRUD).
 * Handles both 'general' and 'asamblea' categories with proper validation.
 *
 * Features:
 *   - Rich text description with 2500 char limit
 *   - Assembly singleton enforcement (blocks creation if one is active)
 *   - Temporal validation (future dates only for assemblies)
 *   - Optional scheduling toggle for general notices
 *   - File attachments (PDF ≤5MB, Images ≤2MB)
 *   - Duration preview for assemblies
 */
import { useState, useMemo, useCallback } from 'react'
import Modal from './Modal'
import RichTextEditor from './RichTextEditor'
import { type Aviso } from '../store/seed'

interface AvisoFormModalProps {
  /** Controls modal visibility */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback when form is submitted with valid data */
  onSave: (aviso: Omit<Aviso, 'id'> & { id?: string }) => void
  /** Existing aviso data when editing */
  editingAviso?: Aviso | null
  /** Whether an active assembly already exists in the system */
  hasActiveAsamblea: boolean
}

/** Calculate human-readable duration between two HH:mm strings */
function calcDuration(start?: string, end?: string): string | null {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}min`
  if (h > 0) return `${h} hora${h > 1 ? 's' : ''}`
  return `${m} min`
}

export default function AvisoFormModal({ open, onClose, onSave, editingAviso, hasActiveAsamblea }: AvisoFormModalProps) {
  // ── Form state ──
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'general' | 'asamblea'>('general')
  const [description, setDescription] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileData, setFileData] = useState('')
  const [fileType, setFileType] = useState<'image' | 'pdf' | undefined>()
  const [fileError, setFileError] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  /** Minimum allowed date/time (today's ISO date) */
  const todayISO = new Date().toISOString().split('T')[0]

  /** Populate form when editing or reset when creating */
  const resetForm = useCallback(() => {
    if (editingAviso) {
      setTitle(editingAviso.title)
      setCategory(editingAviso.category || 'general')
      setDescription(editingAviso.description || '')
      setFileName(editingAviso.attachment)
      setFileData(editingAviso.attachmentData || '')
      setFileType(editingAviso.attachmentType)
      setFileError('')
      setStartDate(editingAviso.startDate || '')
      setEndDate(editingAviso.endDate || '')
      setStartTime(editingAviso.startTime || '')
      setEndTime(editingAviso.endTime || '')
      setShowSchedule(!!(editingAviso.startDate || editingAviso.endDate))
    } else {
      setTitle('')
      setCategory('general')
      setDescription('')
      setFileName('')
      setFileData('')
      setFileType(undefined)
      setFileError('')
      setShowSchedule(false)
      setStartDate('')
      setEndDate('')
      setStartTime('')
      setEndTime('')
    }
  }, [editingAviso])

  // Reset form when modal opens
  // Using a simple approach: reset when `open` transitions to true
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    resetForm()
    setWasOpen(true)
  }
  if (!open && wasOpen) {
    setWasOpen(false)
  }

  // ── File upload handler ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('')
    const file = e.target.files?.[0]
    if (!file) return

    const isPdf = file.type === 'application/pdf'
    const isImg = file.type.startsWith('image/')

    if (!isPdf && !isImg) {
      setFileError('Formato no válido. Solo PDF o imágenes (JPG/PNG).')
      return
    }
    if (isPdf && file.size > 5 * 1024 * 1024) {
      setFileError('El PDF excede el límite de 5 MB.')
      return
    }
    if (isImg && file.size > 2 * 1024 * 1024) {
      setFileError('La imagen excede el límite de 2 MB.')
      return
    }

    setFileName(file.name)
    setFileType(isPdf ? 'pdf' : 'image')

    const reader = new FileReader()
    reader.onload = (event) => setFileData(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Validation ──
  const isFormValid = useMemo(() => {
    if (!title.trim()) return false
    if (fileError) return false
    if (category === 'asamblea') {
      if (!startDate || !endDate || !startTime || !endTime) return false
      // Future-only validation
      if (startDate < todayISO) return false
    }
    if (category === 'general' && showSchedule) {
      if (!startDate && !endDate) return false // Must provide at least one
    }
    return true
  }, [title, fileError, category, startDate, endDate, startTime, endTime, showSchedule, todayISO])

  /** Whether the asamblea option should be disabled */
  const asambleaDisabled = hasActiveAsamblea && editingAviso?.category !== 'asamblea'

  const handleSave = () => {
    if (!isFormValid) return

    const payload: Omit<Aviso, 'id'> & { id?: string } = {
      title,
      category,
      description: description || undefined,
      attachment: fileName,
      attachmentData: fileData || undefined,
      attachmentType: fileType || undefined,
      startDate: (category === 'asamblea' || showSchedule) ? startDate || undefined : undefined,
      endDate: (category === 'asamblea' || showSchedule) ? (endDate || null) : null,
      startTime: category === 'asamblea' ? startTime || undefined : undefined,
      endTime: category === 'asamblea' ? endTime || undefined : undefined,
      date: editingAviso?.date || new Date().toISOString().split('T')[0],
    }

    if (editingAviso) {
      payload.id = editingAviso.id
    }

    onSave(payload)
    onClose()
  }

  const duration = calcDuration(startTime, endTime)
  const isEditing = !!editingAviso

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar Aviso' : 'Publicar Nuevo Aviso'}>
      <div className="space-y-5">
        {/* Title + Category row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              placeholder="Nombre del aviso..."
            />
          </div>
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'general' | 'asamblea')}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
            >
              <option value="general">Aviso General</option>
              <option value="asamblea" disabled={asambleaDisabled}>
                Asamblea Ordinaria {asambleaDisabled ? '(ya existe una activa)' : ''}
              </option>
            </select>
          </div>
        </div>

        {/* Assembly info banner */}
        {category === 'asamblea' && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
            <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
            <div>
              <p className="font-bold">Modo Asamblea</p>
              <p className="opacity-80 mt-0.5">Las fechas, horas de inicio y fin son obligatorias. Solo se permite fechas futuras.</p>
            </div>
          </div>
        )}

        {/* Rich text description */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            maxLength={2500}
            placeholder="Escribe los detalles del aviso..."
          />
        </div>

        {/* File attachment */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Archivo Adjunto <span className="text-slate-300">(PDF ≤5MB · JPG/PNG ≤2MB)</span>
          </label>
          <input type="file" accept=".pdf, image/jpeg, image/png" onChange={handleFileUpload}
            className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
          />
          {fileError && <p className="text-xs text-rose-600 font-bold ml-1">{fileError}</p>}
          {fileName && !fileError && (
            <div className="flex items-center gap-2 ml-1">
              <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
              <span className="text-xs text-emerald-600 font-bold">{fileName}</span>
            </div>
          )}
        </div>

        {/* ── Scheduling section ── */}
        {category === 'general' && (
          <button
            type="button"
            onClick={() => {
              const next = !showSchedule
              setShowSchedule(next)
              if (!next) { 
                setStartDate('')
                setEndDate('') 
              } else {
                if (!startDate) setStartDate(todayISO)
              }
            }}
            className="flex items-center gap-3 cursor-pointer group w-full text-left"
          >
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${showSchedule ? 'bg-slate-900' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${showSchedule ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Programar Visibilidad</span>
          </button>
        )}

        {/* Date fields — always shown for asamblea, conditional for general */}
        {(category === 'asamblea' || (category === 'general' && showSchedule)) && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Fecha Inicio {category === 'asamblea' ? '*' : ''}
              </label>
              <input
                type="date"
                value={startDate}
                min={todayISO}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Fecha Expiración {category === 'asamblea' ? '*' : ''}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate || todayISO}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
          </div>
        )}

        {/* Time fields — assembly only */}
        {category === 'asamblea' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hora de Inicio *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hora de Fin *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
            {duration && (
              <div className="col-span-2 flex items-center gap-2 text-xs text-slate-500 font-bold ml-1">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                Duración estimada: {duration}
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSave}
          disabled={!isFormValid}
          className={`w-full py-3 mt-2 font-bold rounded-2xl transition-all uppercase tracking-widest text-[11px] ${
            !isFormValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isEditing ? 'Guardar Cambios' : 'Publicar Aviso'}
        </button>
      </div>
    </Modal>
  )
}
