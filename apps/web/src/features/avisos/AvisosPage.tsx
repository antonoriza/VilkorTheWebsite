/**
 * AvisosPage — Community Announcements & Assembly Management.
 *
 * Features:
 *   - Unified AvisoFormModal for create/edit (shared with AdminDashboard)
 *   - Rich text descriptions with 2500 char limit
 *   - Assembly uniqueness enforcement
 *   - Status analytics mini-dashboard (Total | Active | Expired | Scheduled)
 *   - Pinning system for admins
 *   - Visual differentiation for assembly vs general notices
 *   - Read receipts and confirmation tracking
 *   - Full audit modal with search/filter
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import Modal from '../../core/components/Modal'
import AvisoFormModal from '../../core/components/AvisoFormModal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import { type Aviso } from '../../core/store/seed'

export default function Avisos() {
  const { role, user, apartment } = useAuth()
  const { state, dispatch } = useStore()
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null)
  const [activeAviso, setActiveAviso] = useState<Aviso | null>(null)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  /** ID of aviso pending delete confirmation (quick-delete from card) */
  const [confirmDeleteAvisoId, setConfirmDeleteAvisoId] = useState<string | null>(null)
  /** Active status filter driven by metric card clicks. null = show all */
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all')

  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'
  const bc = state.buildingConfig
  const todayStr = new Date().toISOString().split('T')[0]

  // ── Business rules ──

  const hasActiveAsamblea = useMemo(() => {
    return state.avisos.some(a =>
      a.category === 'asamblea' && (!a.endDate || a.endDate >= todayStr)
    )
  }, [state.avisos, todayStr])

  // ── Analytics ──
  const analytics = useMemo(() => {
    const total = state.avisos.length
    let active = 0, expired = 0, scheduled = 0
    state.avisos.forEach(a => {
      if (a.startDate && a.startDate > todayStr) {
        scheduled++
      } else if (a.endDate && a.endDate < todayStr) {
        expired++
      } else {
        active++
      }
    })
    return { total, active, expired, scheduled }
  }, [state.avisos, todayStr])

  /** Sort: pinned first → date descending. Applies status filter when set. */
  const visibleAvisos = useMemo(() => {
    const filtered = state.avisos.filter(a => {
      // Role-based gating for residents
      if (!isAdmin) {
        if (a.startDate && a.startDate > todayStr) return false
        if (a.endDate && a.endDate < todayStr) return false
      }
      // Status filter (admin only — residents always see "active" view)
      if (isAdmin && activeFilter !== 'all') {
        if (activeFilter === 'scheduled') return !!(a.startDate && a.startDate > todayStr)
        if (activeFilter === 'expired')   return !!(a.endDate && a.endDate < todayStr)
        if (activeFilter === 'active')    return !(a.startDate && a.startDate > todayStr) && !(a.endDate && a.endDate < todayStr)
      }
      return true
    })
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.date.localeCompare(a.date)
    })
  }, [state.avisos, isAdmin, todayStr, activeFilter])

  // ── Handlers ──

  const handleOpenCreate = () => {
    setEditingAviso(null)
    setShowFormModal(true)
  }

  const handleOpenEdit = (aviso: Aviso) => {
    setActiveAviso(null)
    setEditingAviso(aviso)
    setShowFormModal(true)
  }

  const handleSaveAviso = (data: Omit<Aviso, 'id'> & { id?: string }) => {
    if (data.id) {
      const existing = state.avisos.find(a => a.id === data.id)
      if (existing) {
        dispatch({ type: 'UPDATE_AVISO', payload: { ...existing, ...data } as Aviso })
      }
    } else {
      dispatch({
        type: 'ADD_AVISO',
        payload: { id: `av-${Date.now()}`, ...data } as Aviso,
      })
    }
  }

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_AVISO', payload: id })
  }

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_PIN_AVISO', payload: id })
  }

  const handleConfirmAsamblea = (avisoId: string) => {
    if (!apartment || !user) return
    const timestamp = new Date().toISOString()
    dispatch({
      type: 'TRACK_AVISO',
      payload: { avisoId, apartment, resident: user, type: 'confirm', timestamp }
    })
    setActiveAviso(prev => prev ? {
      ...prev,
      tracking: [...(prev.tracking || []), { type: 'confirm', apartment, resident: user, timestamp }]
    } : null)
  }

  const calcDuration = (start?: string, end?: string): string | null => {
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

  // ── Audit helpers ──
  const auditData = useMemo(() => {
    if (!activeAviso || activeAviso.category !== 'asamblea') return { byApartment: {} as Record<string, typeof events>, confirmedCount: 0 }
    const events = activeAviso.tracking || []
    const byApartment: Record<string, typeof events> = {}
    events.forEach(t => {
      if (!byApartment[t.apartment]) byApartment[t.apartment] = []
      byApartment[t.apartment].push(t)
    })
    let confirmedCount = 0
    Object.values(byApartment).forEach(list => {
      if (list.some(t => t.type === 'confirm')) confirmedCount++
    })
    return { byApartment, confirmedCount }
  }, [activeAviso])

  const filteredAuditEntries = useMemo(() => {
    const entries = Object.entries(auditData.byApartment)
    if (!auditSearch.trim()) return entries
    const q = auditSearch.toLowerCase()
    return entries.filter(([apt, events]) => {
      if (apt.toLowerCase().includes(q)) return true
      if (apt.charAt(0).toLowerCase() === q) return true
      if (events.some(e => e.resident.toLowerCase().includes(q))) return true
      return false
    })
  }, [auditData.byApartment, auditSearch])

  // ── Analytics metric cards config ──
  const metricCards = [
    { key: 'all'       as const, label: 'Total Avisos', value: analytics.total,     icon: 'campaign',    color: 'text-slate-900 bg-slate-100 border-slate-200',   activeColor: 'ring-2 ring-slate-900' },
    { key: 'active'    as const, label: 'Activos',      value: analytics.active,    icon: 'check_circle', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', activeColor: 'ring-2 ring-emerald-500' },
    { key: 'expired'   as const, label: 'Expirados',    value: analytics.expired,   icon: 'event_busy',  color: 'text-slate-500 bg-slate-50 border-slate-200',    activeColor: 'ring-2 ring-slate-400' },
    { key: 'scheduled' as const, label: 'Programados',  value: analytics.scheduled, icon: 'schedule',    color: 'text-amber-700 bg-amber-50 border-amber-200',    activeColor: 'ring-2 ring-amber-500' },
  ]

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
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Nuevo Aviso</span>
          </button>
        )}
      </div>

      {/* Analytics Mini-Dashboard (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricCards.map(card => {
            const isActive = activeFilter === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveFilter(prev => prev === card.key ? 'all' : card.key)}
                className={[
                  'flex items-center gap-3 p-4 rounded-2xl border transition-all text-left w-full',
                  'hover:shadow-md hover:-translate-y-px',
                  card.color,
                  isActive ? `${card.activeColor} shadow-md -translate-y-px` : '',
                ].join(' ')}
                title={isActive ? `Mostrando: ${card.label} — clic para ver todos` : `Filtrar: ${card.label}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${isActive ? 'bg-white' : 'bg-white/60'}`}>
                  <span className="material-symbols-outlined text-lg">{card.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-headline font-black leading-none">{card.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{card.label}</p>
                </div>
                {isActive && (
                  <span className="ml-auto material-symbols-outlined text-[16px] opacity-50">filter_alt</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Active filter label */}
      {isAdmin && activeFilter !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Filtrando:
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-full">
            {metricCards.find(c => c.key === activeFilter)?.label}
          </span>
          <button
            onClick={() => setActiveFilter('all')}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* ── Assembly cards (full-width) ── */}
      {visibleAvisos.filter(a => a.category === 'asamblea').map((aviso) => {
        const tracking = aviso.tracking || []
        const confirmedApts = new Set<string>()
        tracking.forEach(t => { if (t.type === 'confirm') confirmedApts.add(t.apartment) })
        const quorumPct = Math.round((confirmedApts.size / (bc.totalUnits || 1)) * 100)
        const duration = calcDuration(aviso.startTime, aviso.endTime)

        let statusBadge = null
        if (isAdmin) {
          if (aviso.startDate && aviso.startDate > todayStr)
            statusBadge = <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-1 rounded-md font-bold uppercase border border-amber-400/30">Programado</span>
          else if (aviso.endDate && aviso.endDate < todayStr)
            statusBadge = <span className="text-[10px] bg-white/10 text-white/50 px-2 py-1 rounded-md font-bold uppercase border border-white/10">Caducado</span>
        }

        return (
          <div
            key={aviso.id}
            className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all group cursor-pointer text-white overflow-hidden"
            onClick={() => {
              setActiveAviso(aviso)
              if (!isAdmin && user && apartment) {
                const hasViewed = aviso.tracking?.some(t => t.resident === user && t.type === 'view')
                if (!hasViewed) {
                  const timestamp = new Date().toISOString()
                  dispatch({ type: 'TRACK_AVISO', payload: { avisoId: aviso.id, apartment, resident: user, type: 'view', timestamp } })
                  setActiveAviso(prev => prev ? { ...prev, tracking: [...(prev.tracking || []), { type: 'view', apartment, resident: user, timestamp }] } : null)
                }
              }
            }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <span className="material-symbols-outlined text-[10rem]">gavel</span>
            </div>
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                    <span className="material-symbols-outlined text-lg">campaign</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">Asamblea Ordinaria</span>
                  {aviso.pinned && (
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">push_pin</span>
                      Fijado
                    </span>
                  )}
                  {statusBadge}
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => handleTogglePin(aviso.id, e)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${aviso.pinned ? 'bg-amber-400/20 text-amber-400' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'}`}
                    title={aviso.pinned ? 'Desfijar' : 'Fijar arriba'}
                  >
                    <span className="material-symbols-outlined text-lg">push_pin</span>
                  </button>
                )}
              </div>
              <h3 className="text-2xl font-headline font-black tracking-tight">{aviso.title}</h3>
              {aviso.description && (
                <p className="text-white/70 font-medium text-sm line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: aviso.description }} />
              )}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                {aviso.startDate && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    <span>{aviso.startDate}</span>
                  </div>
                )}
                {aviso.startTime && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{aviso.startTime} – {aviso.endTime}</span>
                  </div>
                )}
                {duration && <span className="px-2 py-0.5 bg-white/10 rounded-md">Duración: {duration}</span>}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                  <span>Quórum</span>
                  <span className="text-white">{quorumPct}% ({confirmedApts.size}/{bc.totalUnits})</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${quorumPct}%` }} />
                </div>
              </div>
              {aviso.attachment && (
                <div className="flex items-center space-x-2 text-white/50">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{aviso.attachment}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* ── General notices grid ── */}
      {visibleAvisos.filter(a => a.category === 'general').length > 0 && (
        <>
          {isAdmin && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Avisos Generales</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleAvisos.filter(a => a.category === 'general').map((aviso) => {
              let statusBadge = null
              if (isAdmin) {
                if (aviso.startDate && aviso.startDate > todayStr)
                  statusBadge = <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase border border-amber-200">Prog.</span>
                else if (aviso.endDate && aviso.endDate < todayStr)
                  statusBadge = <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase border border-slate-200">Venc.</span>
              }

              const iconName = 'notifications'

              return (
                <div
                  key={aviso.id}
                  onClick={() => setActiveAviso(aviso)}
                  className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer flex flex-col aspect-square"
                >
                  {/* Top row: icon chip + status + admin actions */}
                  <div className="flex items-start justify-between mb-3">
                    {/* Notification icon chip */}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-white text-[18px]">{iconName}</span>
                      </div>
                      {aviso.pinned && (
                        <span className="material-symbols-outlined text-amber-400 text-[16px]" title="Fijado">push_pin</span>
                      )}
                    </div>

                    {/* Admin action buttons — visible on hover, pin always visible if pinned */}
                    {isAdmin && (
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Pin button */}
                        <button
                          onClick={() => dispatch({ type: 'TOGGLE_PIN_AVISO', payload: aviso.id })}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            aviso.pinned
                              ? 'bg-amber-50 text-amber-500 border border-amber-200'
                              : 'bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={aviso.pinned ? 'Desfijar' : 'Fijar arriba'}
                        >
                          <span className="material-symbols-outlined text-[14px]">push_pin</span>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => setConfirmDeleteAvisoId(aviso.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          title="Eliminar aviso"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Date — prominent */}
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                    {aviso.date}
                  </p>

                  {statusBadge && <div className="mb-1">{statusBadge}</div>}

                  {/* Title */}
                  <h3 className="font-headline font-extrabold text-slate-900 tracking-tight text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {aviso.title}
                  </h3>

                  {/* Description snippet */}
                  {aviso.description && (
                    <p
                      className="mt-1.5 text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{ __html: aviso.description }}
                    />
                  )}

                  {/* Footer arrow */}
                  <div className="flex justify-end mt-auto pt-2">
                    <span className="material-symbols-outlined text-slate-200 text-[16px] group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                      arrow_forward
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}


      {/* ── Unified Form Modal ── */}
      <AvisoFormModal
        open={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingAviso(null) }}
        onSave={handleSaveAviso}
        editingAviso={editingAviso}
        hasActiveAsamblea={hasActiveAsamblea}
      />

      {/* ── Quick-Delete Confirm Dialog ── */}
      <ConfirmDialog
        open={!!confirmDeleteAvisoId}
        onClose={() => setConfirmDeleteAvisoId(null)}
        onConfirm={() => {
          if (confirmDeleteAvisoId) dispatch({ type: 'DELETE_AVISO', payload: confirmDeleteAvisoId })
          setConfirmDeleteAvisoId(null)
        }}
        title="Eliminar Aviso"
        confirmLabel="Eliminar"
        variant="danger"
      >
        ¿Seguro que deseas eliminar este aviso? Esta acción no se puede deshacer.
      </ConfirmDialog>

      {/* ── Detail Modal ── */}
      <Modal open={!!activeAviso} onClose={() => setActiveAviso(null)} title={activeAviso?.title || 'Detalle del Aviso'}>
        {activeAviso && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeAviso.date}</span>
              {activeAviso.category === 'asamblea' && (
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">campaign</span>
                  Asamblea
                </span>
              )}
            </div>

            {/* Render rich text description */}
            {activeAviso.description ? (
              <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: activeAviso.description }} />
            ) : (
              <p className="text-slate-400 text-sm italic">Sin descripción detallada.</p>
            )}

            {/* Duration info */}
            {activeAviso.category === 'asamblea' && activeAviso.startTime && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{activeAviso.startDate || activeAviso.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horario</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{activeAviso.startTime} – {activeAviso.endTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duración</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{calcDuration(activeAviso.startTime, activeAviso.endTime) || '—'}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {activeAviso.attachmentData && activeAviso.attachmentType === 'image' && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img src={activeAviso.attachmentData} alt="Adjunto" className="max-w-full max-h-[60vh] object-contain rounded-xl" />
              </div>
            )}
            {activeAviso.attachmentData && activeAviso.attachmentType === 'pdf' && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-3xl text-rose-500">picture_as_pdf</span>
                  <div>
                    <p className="font-bold text-sm text-slate-900">{activeAviso.attachment}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Documento PDF</p>
                  </div>
                </div>
                <a href={activeAviso.attachmentData} download={activeAviso.attachment}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-900 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md transition-all flex items-center space-x-1">
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  <span>Descargar</span>
                </a>
              </div>
            )}

            {/* Assembly confirmation section */}
            {activeAviso.category === 'asamblea' && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Residentes Confirmados ({activeAviso.tracking?.filter(t => t.type === 'confirm').length || 0})
                      </p>
                      {(!activeAviso.tracking || activeAviso.tracking.filter(t => t.type === 'confirm').length === 0) ? (
                        <p className="text-sm font-medium text-slate-500">Ningún residente ha confirmado.</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {activeAviso.tracking.filter(t => t.type === 'confirm').map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-sm font-medium bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-slate-900 font-bold">{c.apartment} — {c.resident}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(c.timestamp).toLocaleString('es-MX')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setShowAuditModal(true); setAuditSearch('') }}
                      className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center space-x-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      <span>Auditoría de Asistencia</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {activeAviso.tracking?.some(c => c.resident === user && c.type === 'confirm') ? (
                      <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl">
                        <span className="material-symbols-outlined text-2xl">verified</span>
                        <div>
                          <p className="font-bold text-sm">Asistencia Confirmada</p>
                          <p className="text-xs font-medium opacity-80">Gracias, tu participación ha sido registrada.</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConfirmAsamblea(activeAviso.id)}
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
                  onClick={() => handleOpenEdit(activeAviso)}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[11px] tracking-widest uppercase hover:border-slate-300"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => { handleDelete(activeAviso.id); setActiveAviso(null) }}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-[11px] tracking-widest uppercase hover:border-rose-300"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Borrar</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Audit Modal ── */}
      <Modal open={showAuditModal} onClose={() => setShowAuditModal(false)} title="Auditoría de Asistencia">
        {activeAviso && activeAviso.category === 'asamblea' && (
          <div className="space-y-5">
            <p className="text-sm font-medium text-slate-600">
              Rastreo completo de interacciones para: <strong className="text-slate-900">{activeAviso.title}</strong>
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={`Buscar por nombre, departamento o torre (${bc.towers.join(', ')})...`}
                className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
              />
            </div>
            <div className="max-h-[45vh] overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actividad</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditEntries.map(([apt, events]) => {
                    const isConfirmed = events.some(e => e.type === 'confirm')
                    return (
                      <tr key={apt} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{apt}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div className="space-y-1">
                            {events.map((e, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                {e.type === 'confirm' ? (
                                  <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                                ) : (
                                  <span className="material-symbols-outlined text-[14px] text-slate-300">visibility</span>
                                )}
                                <span className={e.type === 'confirm' ? 'font-bold text-slate-900' : 'text-slate-500'}>
                                  {e.resident} <span className="opacity-50 text-[10px]">{new Date(e.timestamp).toLocaleString('es-MX')}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isConfirmed ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100">Confirmado</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200">Solo Visto</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredAuditEntries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400 font-medium text-sm">
                        {auditSearch ? 'Sin resultados para la búsqueda.' : 'Nadie ha interactuado aún.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Departamentos Confirmados</p>
                <p className="text-lg font-black text-slate-900">{auditData.confirmedCount} Unidades</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Quórum Pendiente</p>
                <p className="text-lg font-black text-slate-900">{bc.totalUnits - auditData.confirmedCount} Unidades</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
