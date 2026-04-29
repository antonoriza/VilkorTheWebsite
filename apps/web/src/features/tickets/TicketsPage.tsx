import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import EmptyState from '../../core/components/EmptyState'
import TicketDetailModal from './components/TicketDetailModal'
import {
  type Ticket,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory
} from '../../types'

const PRIORITIES: TicketPriority[] = ['Alta', 'Media', 'Baja']
const STATUSES: TicketStatus[] = ['Nuevo', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado']

export default function TicketsPage() {
  const { user, role, apartment } = useAuth()
  const { state, dispatch } = useStore()
  
  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'
  const isResident = role === 'residente'
  const bc = state.buildingConfig

  const categories = useMemo(() => bc.ticketCategories || ['Plomería', 'Electricidad', 'Áreas Comunes', 'Seguridad', 'Limpieza', 'Otro'], [bc.ticketCategories])
  const commonLocations = useMemo(() => bc.commonLocations || [], [bc.commonLocations])

  const [searchParams, setSearchParams] = useSearchParams()

  // Admin Filters
  const [filterStatus, setFilterStatus] = useState<string>(
    () => searchParams.get('status') || ''
  )

  // Sync state when URL changes (e.g. navigating from dashboard)
  useEffect(() => {
    setFilterStatus(searchParams.get('status') || '')
  }, [searchParams])
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterDept, setFilterDept] = useState<string>('')

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formSubject, setFormSubject] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<TicketCategory>('Otro')
  const [formPriority, setFormPriority] = useState<TicketPriority>('Media')
  const [formLocation, setFormLocation] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)
  const [formProxyApartment, setFormProxyApartment] = useState('')

  // Smart default: Public for common areas / security
  useEffect(() => {
    if (formCategory === 'Áreas Comunes' || formCategory === 'Seguridad') {
      setFormIsPublic(true)
    } else {
      setFormIsPublic(false)
    }
  }, [formCategory])

  // Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  // Sort
  type TicketSortKey = 'newest' | 'oldest' | 'priority' | 'status'
  const [ticketSort, setTicketSort] = useState<TicketSortKey>('newest')

  // Derived queries
  const allTickets = useMemo(() => {
    let t = state.tickets
    if (isResident) {
      t = t.filter(ticket => ticket.apartment === apartment || ticket.isPublic)
    }
    
    if (filterStatus) t = t.filter(ticket => ticket.status === filterStatus)
    if (filterCategory) t = t.filter(ticket => ticket.category === filterCategory)
    if (filterPriority) t = t.filter(ticket => ticket.priority === filterPriority)
    if (filterDept) t = t.filter(ticket => ticket.apartment.toLowerCase().includes(filterDept.toLowerCase()))
    
    const PRIORITY_ORDER: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 }
    const STATUS_ORDER: Record<string, number> = { 'Nuevo': 0, 'Asignado': 1, 'En Proceso': 2, 'Resuelto': 3, 'Cerrado': 4 }

    return [...t].sort((a, b) => {
      if (ticketSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (ticketSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (ticketSort === 'priority') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
      if (ticketSort === 'status') return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      return 0
    })
  }, [state.tickets, isResident, apartment, filterStatus, filterCategory, filterPriority, filterDept, ticketSort])

  const openTicketsCount = allTickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Resuelto').length
  const processingCount = allTickets.filter(t => t.status === 'En Proceso').length

  const availableDepts = [...new Set(state.tickets.map(t => t.apartment))].sort()

  const handleCreateTicket = () => {
    if (!formSubject.trim() || !formDescription.trim()) return

    const now = new Date().toISOString()
    const newNumber = state.ticketCounter + 1

    const targetApt = isAdmin ? formProxyApartment : apartment
    if (!targetApt) return // Enforce selection for admin or ensure resident apt exists
    const proxyResident = state.residents.find(r => r.apartment === targetApt)
    const targetUser = isAdmin ? (proxyResident?.name || targetApt) : user

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      number: newNumber,
      subject: formSubject,
      description: formDescription,
      category: formCategory,
      priority: formPriority,
      status: 'Nuevo',
      createdBy: targetUser,
      apartment: targetApt,
      location: formLocation || undefined,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      activities: [
        {
          id: `act-${Date.now()}`,
          author: 'Sistema',
          visibility: 'public',
          message: `Ticket creado por ${user}.`,
          createdAt: now,
        }
      ],
      isPublic: formIsPublic
    }

    dispatch({ type: 'ADD_TICKET', payload: newTicket })
    
    // Reset form
    setFormSubject('')
    setFormDescription('')
    setFormCategory(categories[0] || 'Otro')
    setFormPriority('Media')
    setFormLocation('')
    setFormIsPublic(false)
    setFormProxyApartment('')
    setShowCreateModal(false)
  }

  const handleStatusChange = (ticket: Ticket, newStatus: TicketStatus) => {
    if (newStatus === ticket.status) return

    const now = new Date().toISOString()
    let resolvedAtUpdate = ticket.resolvedAt
    if (newStatus === 'Resuelto' || newStatus === 'Cerrado') {
      if (!resolvedAtUpdate) resolvedAtUpdate = now
    } else {
      resolvedAtUpdate = null
    }

    const updatedTicket: Ticket = {
      ...ticket,
      status: newStatus,
      updatedAt: now,
      resolvedAt: resolvedAtUpdate
    }

    dispatch({ type: 'UPDATE_TICKET', payload: updatedTicket })

    // Also auto-add a public activity note
    dispatch({
      type: 'ADD_TICKET_ACTIVITY',
      payload: {
        ticketId: ticket.id,
        activity: {
          id: `act-${Date.now()}`,
          author: 'Sistema',
          visibility: 'public',
          message: `Estado actualizado a: ${newStatus}`,
          createdAt: now,
        }
      }
    })

    setSelectedTicket(updatedTicket)
  }

  const handleAddActivity = (ticketId: string, message: string, visibility: 'internal' | 'public') => {
    dispatch({
      type: 'ADD_TICKET_ACTIVITY',
      payload: {
        ticketId,
        activity: {
          id: `act-${Date.now()}`,
          author: user,
          visibility,
          message,
          createdAt: new Date().toISOString(),
        }
      }
    })

    // Update local selected ticket reference
    setSelectedTicket(prev => {
      if (!prev) return null
      return {
        ...prev,
        activities: [...prev.activities, {
          id: `act-${Date.now()}`,
          author: user,
          visibility,
          message,
          createdAt: new Date().toISOString(),
        }]
      }
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Tickets de Servicio
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Recepción y seguimiento de mantenimiento
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>Nuevo Ticket</span>
        </button>
      </div>

      {/* Admin KPI & Filters */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
               <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Tickets Abiertos</span>
               <span className="text-2xl font-black text-slate-900 mt-1">{openTicketsCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
               <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">En Proceso</span>
               <span className="text-2xl font-black text-emerald-600 mt-1">{processingCount}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select value={filterStatus} onChange={(e) => {
              const val = e.target.value
              setFilterStatus(val)
              setSearchParams(val ? { status: val } : {})
            }}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
            >
              <option value="">Todos los Estados</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
            >
              <option value="">Todas las Categorías</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
            >
              <option value="">Todas las Prioridades</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="relative">
              <input type="text" list="dept-options-tickets" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
                placeholder="Departamento"
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
              />
              <datalist id="dept-options-tickets">
                {availableDepts.map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Ordenar por</span>
            <div className="flex items-center gap-2">
              {([
                { id: 'newest', label: 'Más recientes' },
                { id: 'oldest', label: 'Más antiguos' },
                { id: 'priority', label: 'Prioridad' },
                { id: 'status', label: 'Estado' },
              ] as { id: TicketSortKey; label: string }[]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTicketSort(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    ticketSort === opt.id
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                      : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ticket List Grid */}
      <div className="grid grid-cols-1 gap-4">
        {allTickets.map(ticket => (
          <div 
            key={ticket.id} 
            onClick={() => setSelectedTicket(ticket)}
            className="group block p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden"
          >
            {/* Visual Icon Decal */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
              <span className="material-symbols-outlined text-8xl">handyman</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-black px-3 py-1 rounded-lg bg-slate-50 text-slate-400 border border-slate-100 font-mono tracking-widest">
                    #{ticket.number}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    {ticket.isPublic && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-primary border border-primary/20 px-2 py-0.5 rounded-lg uppercase tracking-widest bg-primary/5">
                        <span className="material-symbols-outlined text-[12px]">public</span>
                        Público
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-slate-200 bg-white text-slate-600`}>
                    {ticket.priority}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-headline font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {ticket.subject}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 line-clamp-1 mt-1">
                    {ticket.description}
                  </p>
                </div>
                
                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest gap-4 pt-2">
                   <span>
                    <span className="material-symbols-outlined text-[13px] mr-1 text-slate-300 align-text-bottom">person</span>
                    {ticket.createdBy} ({ticket.apartment})
                   </span>
                   <span>
                     <span className="material-symbols-outlined text-[13px] mr-1 text-slate-300 align-text-bottom">category</span>
                     {ticket.category}
                   </span>
                   {ticket.location && (
                     <span>
                       <span className="material-symbols-outlined text-[13px] mr-1 text-slate-300 align-text-bottom">location_on</span>
                       {ticket.location}
                     </span>
                   )}
                </div>
              </div>
              
              <div className="flex flex-col items-end shrink-0 pt-1">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1 border border-slate-100 rounded-full flex items-center space-x-1 uppercase tracking-widest">
                  Actualizado: {new Date(ticket.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        {allTickets.length === 0 && (
          <EmptyState
            icon="assignment_turned_in"
            title={isAdmin ? 'Sin tickets activos' : 'Sin solicitudes activas'}
            subtitle={isAdmin
              ? 'Los residentes pueden enviar solicitudes de mantenimiento desde su portal. Los tickets aparecerán aquí.'
              : 'Levanta una solicitud de servicio y el equipo de administración te responderá.'
            }
            action={{ label: 'Nuevo Ticket', onClick: () => setShowCreateModal(true) }}
          />
        )}
      </div>

      {/* ── Create Modal ── */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Levantar Ticket de Servicio">
        <div className="space-y-4">
          {/* Admin Proxy Selector */}
          {isAdmin && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reportar a nombre de:</label>
              <select 
                value={formProxyApartment} 
                onChange={(e) => setFormProxyApartment(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-sm transition-all"
              >
                <option value="">Seleccionar Departamento...</option>
                {state.residents.map(r => (
                  <option key={r.id} value={r.apartment}>{r.apartment} — {r.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asunto *</label>
            <input type="text" value={formSubject} onChange={(e) => setFormSubject(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              placeholder="Ej. Fuga de agua en pasillo"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Prioridad Impacto</label>
              <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
             <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación / Zona</label>
              <input list="common-locs" type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Ej. Pasillo Piso 4, Lobby..." className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium" />
              <datalist id="common-locs">
                {commonLocations.map(l => <option key={l} value={l} />)}
              </datalist>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/50 hover:border-slate-300 transition-all cursor-pointer group" onClick={() => setFormIsPublic(!formIsPublic)}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${formIsPublic ? 'bg-slate-900 text-white' : 'bg-white text-slate-300 shadow-sm'}`}>
                  <span className="material-symbols-outlined text-[18px]">public</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Publicar en la Comunidad</p>
                  <p className="text-[9px] text-slate-500 font-medium">Otros residentes podrán ver este ticket (anónimo).</p>
                </div>
              </div>
              <div className={`relative w-10 h-5 rounded-full transition-all duration-300 ${formIsPublic ? 'bg-slate-900' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${formIsPublic ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción Detallada *</label>
            <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              rows={4}
              placeholder="Describe la situación..."
            />
          </div>

          <button onClick={handleCreateTicket} disabled={!formSubject.trim() || !formDescription.trim()}
            className="w-full py-3 mt-4 bg-slate-900 disabled:opacity-50 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Enviar Solicitud
          </button>
        </div>
      </Modal>

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        isAdmin={isAdmin}
        onStatusChange={handleStatusChange}
        onAddActivity={handleAddActivity}
      />
    </div>
  )
}
