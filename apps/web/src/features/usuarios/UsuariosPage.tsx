/**
 * UsuariosPage — Unified People Management Module.
 *
 * Enterprise-grade directory consolidating Residents, Staff, and
 * Administrators into a single filterable view. Replaces the old
 * residents-only table with a unified directory that serves as the
 * single source of truth for people management.
 *
 * CRUD: Residents and Staff can be added/deleted here.
 * Staff creation dispatches the same ADD_STAFF action used elsewhere.
 */
import { useState, useMemo, useRef } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import { StaffRole } from '../../types'
import type { ShiftOverride } from '../../types'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import EmptyState from '../../core/components/EmptyState'
import SortableTh from '../../core/components/SortableTh'

// ─── Staff Constants ─────────────────────────────────────────────────────────

const STAFF_ROLES: { value: StaffRole; label: string; icon: string }[] = [
  { value: 'Guardia',               label: 'Guardia',       icon: 'security' },
  { value: 'Jardinero',             label: 'Jardinero',     icon: 'yard' },
  { value: 'Limpieza',              label: 'Limpieza',      icon: 'cleaning_services' },
  { value: 'Administradora General', label: 'Administrador', icon: 'manage_accounts' },
]

const WORK_DAYS = [
  { id: 'L', label: 'L' },
  { id: 'M', label: 'M' },
  { id: 'Mi', label: 'Mi' },
  { id: 'J', label: 'J' },
  { id: 'V', label: 'V' },
  { id: 'S', label: 'S' },
  { id: 'D', label: 'D' },
]

// ─── Types ───────────────────────────────────────────────────────────────────

type PersonType = 'Residente' | 'Staff' | 'Administrador'

interface UnifiedPerson {
  id: string
  name: string
  type: PersonType
  role: string
  location: string
  email?: string
  photo?: string
  tower?: string
  tags?: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_FILTERS: { id: PersonType | 'all'; label: string; icon: string }[] = [
  { id: 'all',            label: 'Todos',          icon: 'groups' },
  { id: 'Residente',      label: 'Residentes',     icon: 'person' },
  { id: 'Staff',          label: 'Staff',           icon: 'engineering' },
  { id: 'Administrador',  label: 'Administración', icon: 'verified_user' },
]

const TYPE_BADGE: Record<PersonType, string> = {
  Residente:      'bg-blue-50 text-blue-700 border-blue-100',
  Staff:          'bg-slate-100 text-slate-700 border-slate-200',
  Administrador:  'bg-emerald-50 text-emerald-700 border-emerald-100',
}

const TYPE_ICON: Record<PersonType, string> = {
  Residente: 'person',
  Staff: 'engineering',
  Administrador: 'verified_user',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const { role } = useAuth()
  const { state, dispatch } = useStore()
  const bc = state.buildingConfig
  const residents = state.residents || []
  const staff = state.staff || []

  // ── Filter state ──
  const [typeFilter, setTypeFilter] = useState<PersonType | 'all'>('all')
  const [towerFilter, setTowerFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // ── Sort state (applied after filters) ──
  type PersonSortKey = 'name' | 'type' | 'role' | 'location'
  const [sortKey, setSortKey] = useState<PersonSortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const handleSort = (key: PersonSortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Detail modal state ──
  const [detailPersonId, setDetailPersonId] = useState<string | null>(null)

  // ── Add user modal ──
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTab, setAddTab] = useState<'residente' | 'staff'>('residente')

  // Resident form
  const [formName, setFormName] = useState('')
  const [formApartment, setFormApartment] = useState('')
  const [formTower, setFormTower] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')

  // Staff form
  const [staffName, setStaffName] = useState('')
  const [staffRole, setStaffRole] = useState<StaffRole>('Guardia')
  const [staffPhoto, setStaffPhoto] = useState('')
  const [staffDays, setStaffDays] = useState<string[]>(['L', 'M', 'Mi', 'J', 'V'])
  const [staffStart, setStaffStart] = useState('07:00')
  const [staffEnd, setStaffEnd] = useState('15:00')
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // ── Programación (planned overrides) state ──
  type PlannedType = 'vacation' | 'pre_authorized'
  const [progType, setProgType] = useState<PlannedType>('vacation')
  const [progStart, setProgStart] = useState('')
  const [progEnd, setProgEnd] = useState('')
  const [progSubStaffId, setProgSubStaffId] = useState('')
  const [progSubExternal, setProgSubExternal] = useState('')
  const [progSubMode, setProgSubMode] = useState<'none' | 'staff' | 'external'>('none')
  const [progNote, setProgNote] = useState('')
  const resetProgForm = () => {
    setProgType('vacation'); setProgStart(''); setProgEnd('')
    setProgSubStaffId(''); setProgSubExternal(''); setProgSubMode('none'); setProgNote('')
  }

  // ── Build unified directory ──
  const people: UnifiedPerson[] = useMemo(() => {
    const result: UnifiedPerson[] = [
      {
        id: 'admin-0',
        name: bc.adminName || 'Administrador Principal',
        type: 'Administrador',
        role: 'Super Administrador',
        location: 'Responsable de la Propiedad',
        email: bc.adminEmail || 'admin@propiedad.com',
      },
      ...staff.map(s => ({
        id: s.id,
        name: s.name,
        type: (s.role === 'Administradora General' ? 'Administrador' : 'Staff') as PersonType,
        role: s.role,
        location: `${s.shiftStart} – ${s.shiftEnd}`,
        photo: s.photo,
        tags: [],
      })),
      ...residents.map(r => ({
        id: r.id,
        name: r.name,
        type: 'Residente' as const,
        role: 'Residente',
        location: `${r.tower ? `${r.tower}-` : ''}${r.apartment}`,
        email: r.email,
        tower: r.tower,
        tags: r.tags || [],
      })),
    ]
    if (role === 'operador') return result.filter(p => p.type !== 'Residente')
    return result
  }, [residents, staff, bc, role])

  // ── Apply filters then sort ──
  const filtered = useMemo(() => {
    let list = people
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter)
    if (towerFilter !== 'all') list = list.filter(p => p.tower === towerFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      )
    }
    if (tagFilter.length > 0) {
      list = list.filter(p => p.tags && tagFilter.some(t => p.tags?.includes(t)))
    }
    return [...list].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      const cmp = av.localeCompare(bv, 'es', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [people, typeFilter, towerFilter, search, sortKey, sortDir])

  // ── Counts per type ──
  const typeCounts = useMemo(() => ({
    all: people.length,
    Residente: people.filter(p => p.type === 'Residente').length,
    Staff: people.filter(p => p.type === 'Staff').length,
    Administrador: people.filter(p => p.type === 'Administrador').length,
  }), [people])

  // ── Detail data ──
  const detailPerson = useMemo(() => people.find(p => p.id === detailPersonId), [people, detailPersonId])
  const assignedAssets = useMemo(
    () => (state.inventory || []).filter(i => i.currentUserId === detailPersonId || i.ownerId === detailPersonId),
    [state.inventory, detailPersonId]
  )

  const towers = bc.towers || []
  const apartments = [...new Set(residents.map(r => r.apartment))].sort()
  const hasActiveFilters = typeFilter !== 'all' || towerFilter !== 'all' || search !== ''

  // ── CRUD Handlers ──
  const handleAddResident = () => {
    if (!formName.trim() || !formApartment.trim() || !formEmail.trim()) return
    const tower = formTower || (bc.towers.length > 0 ? bc.towers[0] : 'A')
    dispatch({
      type: 'ADD_RESIDENT',
      payload: {
        id: `res-${Date.now()}`,
        name: formName,
        apartment: formApartment.toUpperCase(),
        tower: tower.toUpperCase(),
        email: formEmail.toLowerCase(),
        phone: formPhone || undefined,
      },
    })
    setFormName(''); setFormApartment(''); setFormTower(''); setFormEmail(''); setFormPhone('')
    setShowAddModal(false)
  }

  const handleAddStaff = () => {
    if (!staffName.trim()) return
    dispatch({
      type: 'ADD_STAFF',
      payload: {
        id: `staff-${Date.now()}`,
        name: staffName,
        role: staffRole,
        shiftStart: staffStart,
        shiftEnd: staffEnd,
        photo: staffPhoto || undefined,
        workDays: staffDays,
      },
    })
    setStaffName(''); setStaffRole('Guardia'); setStaffPhoto(''); setStaffDays(['L', 'M', 'Mi', 'J', 'V']); setStaffStart('07:00'); setStaffEnd('15:00')
    setShowAddModal(false)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) setStaffPhoto(ev.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  const toggleWorkDay = (day: string) => {
    setStaffDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const resetAndCloseModal = () => {
    setFormName(''); setFormApartment(''); setFormTower(''); setFormEmail(''); setFormPhone('')
    setStaffName(''); setStaffRole('Guardia'); setStaffPhoto(''); setStaffDays(['L', 'M', 'Mi', 'J', 'V']); setStaffStart('07:00'); setStaffEnd('15:00')
    setAddTab('residente')
    setShowAddModal(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      const isStaff = staff.some(s => s.id === deleteTarget.id)
      if (isStaff) {
        dispatch({ type: 'DELETE_STAFF', payload: deleteTarget.id })
        // Also clean up any overrides for this staff member
        ;(state.shiftOverrides || [])
          .filter(o => o.staffId === deleteTarget.id)
          .forEach(o => dispatch({ type: 'REMOVE_SHIFT_OVERRIDE', payload: o.id }))
      } else {
        dispatch({ type: 'DELETE_RESIDENT', payload: deleteTarget.id })
      }
      if (detailPersonId === deleteTarget.id) setDetailPersonId(null)
    }
  }

  const clearFilters = () => {
    setTypeFilter('all'); setTowerFilter('all'); setSearch(''); setTagFilter([])
  }

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Rol/Puesto', 'Ubicación/Torre', 'Email', 'Etiquetas']
    const rows = filtered.map(p => [
      p.name,
      p.type,
      p.role,
      p.location,
      p.email || 'N/A',
      (p.tags || []).map(tid => bc.userTags?.find(t => t.id === tid)?.label).filter(Boolean).join('; ')
    ])
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `directorio_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="pb-2">
        <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
          Gestión de Personas
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          {people.length} registros — {typeCounts.Residente} residentes, {typeCounts.Staff} staff, {typeCounts.Administrador} admin
          {towers.length > 0 && ` — ${towers.length} ${bc.type === 'towers' ? 'torres' : 'secciones'}`}
        </p>
      </div>



      {/* ── Info banner ── */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start space-x-3">
        <span className="material-symbols-outlined text-indigo-600 text-lg mt-0.5">info</span>
        <div className="text-[11px] text-indigo-700 font-medium space-y-1">
          <p>Este directorio unifica residentes, personal operativo y administración.</p>
          <p>En votaciones, solo se permite <strong>1 voto por departamento</strong> (no por persona).</p>
        </div>
      </div>

      {/* ── Directory Table Card ── */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-headline font-extrabold text-slate-900">
              Directorio General
            </h2>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {filtered.length} de {people.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 text-[10px] tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span className="hidden sm:inline">Nuevo Usuario</span>
            </button>

            {showFilters && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-[10px] tracking-widest uppercase shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all ${
                showFilters 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Filtros
            </button>
          </div>
        </div>

        {/* Filter Bar inside card */}
        {showFilters && (
          <div className="p-6 bg-slate-50 border-b border-slate-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Type chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {TYPE_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTypeFilter(f.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      typeFilter === f.id
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                        : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{f.icon}</span>
                    {f.label}
                    <span className={`ml-0.5 text-[9px] ${typeFilter === f.id ? 'text-white/60' : 'text-slate-300'}`}>
                      {typeCounts[f.id]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tower filter + search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                {towers.length > 1 && (
                  <select
                    value={towerFilter}
                    onChange={e => setTowerFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Todas las torres</option>
                    {towers.map(t => (
                      <option key={t} value={t}>{bc.type === 'towers' ? `Torre ${t}` : `Sección ${t}`}</option>
                    ))}
                  </select>
                )}
                <div className="relative flex-1 md:w-72">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                    <span className="material-symbols-outlined text-lg">search</span>
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="block w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="Buscar nombre, rol, ubicación..."
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tag Filter Row */}
            {bc.userTags && bc.userTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-full mb-1 ml-1">Filtrar por Etiqueta</span>
                {bc.userTags.map(tag => {
                  const isActive = tagFilter.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setTagFilter(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                      style={{
                        backgroundColor: isActive ? tag.color : 'white',
                        color: isActive ? 'white' : '#94a3b8',
                        borderColor: isActive ? tag.color : '#f1f5f9'
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        isActive ? 'shadow-sm ring-2 ring-offset-1 ring-slate-100' : 'hover:border-slate-200'
                      }`}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            )}
            
            <div className="flex items-center pt-4 border-t border-slate-200/50">
              <button 
                onClick={clearFilters}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortableTh<PersonSortKey> col="name" label="Persona" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh<PersonSortKey> col="type" label="Tipo" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh<PersonSortKey> col="role" label="Rol / Puesto" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh<PersonSortKey> col="location" label="Ubicación" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Etiquetas</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const sameAptCount = p.type === 'Residente'
                ? residents.filter(r => r.apartment === p.location.split('-').pop()).length
                : 0
              return (
                <tr
                  key={p.id}
                  onClick={() => setDetailPersonId(p.id)}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  {/* Person */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">
                            {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{p.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                    </div>
                  </td>
                  {/* Type badge */}
                  <td className="px-6 py-4">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${TYPE_BADGE[p.type]}`}>
                      {p.type}
                    </span>
                  </td>
                  {/* Role */}
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{p.role}</td>
                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-300 text-sm">
                        {p.type === 'Residente' ? 'home' : 'schedule'}
                      </span>
                      <span className="text-sm text-slate-600 font-medium">{p.location}</span>
                      {sameAptCount > 1 && (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                          {sameAptCount}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-6 py-4 text-sm font-medium text-slate-400">{p.email || '—'}</td>
                  {/* Tags */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.map(tagId => {
                        const tag = bc.userTags?.find(t => t.id === tagId)
                        if (!tag) return null
                        
                        return (
                          <span 
                            key={tagId} 
                            style={{ 
                              backgroundColor: `${tag.color}15`, 
                              color: tag.color,
                              borderColor: `${tag.color}30` 
                            }}
                            className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border"
                          >
                            {tag.label}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={e => { e.stopPropagation(); setDetailPersonId(p.id) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                      </button>
                      {p.type === 'Residente' && (
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.name }) }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  {people.length === 0 ? (
                    <EmptyState
                      icon="group"
                      title="Sin personas registradas"
                      subtitle="Agrega el primer residente para comenzar a gestionar la propiedad."
                      action={{ label: 'Agregar Residente', onClick: () => setShowAddModal(true) }}
                    />
                  ) : (
                    <EmptyState
                      icon="search_off"
                      title="Sin resultados"
                      subtitle="No se encontraron personas con los filtros aplicados."
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detail Modal ── */}
      <Modal open={!!detailPerson} onClose={() => setDetailPersonId(null)} title="Perfil de Persona">
        {detailPerson && (
          <div className="p-8 space-y-8">
            {/* Profile header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 border-4 border-white shadow-xl overflow-hidden">
                {detailPerson.photo ? (
                  <img src={detailPerson.photo} alt={detailPerson.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <span className="material-symbols-outlined text-3xl">{TYPE_ICON[detailPerson.type]}</span>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-headline font-black text-slate-900 tracking-tight">{detailPerson.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{detailPerson.role}</p>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${TYPE_BADGE[detailPerson.type]}`}>
                {detailPerson.type}
              </span>

              {/* Tags Display */}
              {detailPerson.type === 'Residente' && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {detailPerson.tags?.map(tagId => {
                    const tag = bc.userTags?.find(t => t.id === tagId)
                    if (!tag) return null
                    const colorCls = 
                      tag.color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      tag.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      tag.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      tag.color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      tag.color === 'sky' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                      tag.color === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                    
                    return (
                      <span key={tagId} className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${colorCls}`}>
                        {tag.label}
                      </span>
                    )
                  })}
                  {(!detailPerson.tags || detailPerson.tags.length === 0) && (
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Sin etiquetas</span>
                  )}
                </div>
              )}
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-slate-400">
                    {detailPerson.type === 'Residente' ? 'home' : 'schedule'}
                  </span>
                  {detailPerson.location}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contacto</p>
                <p className="text-sm font-bold text-slate-900 truncate">{detailPerson.email || '—'}</p>
              </div>
            </div>

            {/* Tag Assignment (Admin Only) */}
            {detailPerson.type === 'Residente' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de Etiquetas</h4>
                  <span className="material-symbols-outlined text-slate-300 text-sm">sell</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(bc.userTags || []).map(tag => {
                    const isAssigned = detailPerson.tags?.includes(tag.id)

                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          const resident = residents.find(r => r.id === detailPerson.id)
                          if (!resident) return
                          const newTags = isAssigned
                            ? (resident.tags || []).filter(id => id !== tag.id)
                            : [...(resident.tags || []), tag.id]
                          dispatch({ type: 'UPDATE_RESIDENT', payload: { ...resident, tags: newTags } })
                        }}
                        style={{
                          backgroundColor: isAssigned ? `${tag.color}15` : 'white',
                          color: isAssigned ? tag.color : '#94a3b8',
                          borderColor: isAssigned ? `${tag.color}30` : '#f1f5f9'
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                          isAssigned 
                            ? 'shadow-sm ring-2 ring-offset-1 ring-slate-100' 
                            : 'hover:border-slate-200 hover:text-slate-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isAssigned ? 'check_circle' : 'add_circle'}
                        </span>
                        {tag.label}
                      </button>
                    )
                  })}
                  {(bc.userTags || []).length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No hay etiquetas definidas en el catálogo.</p>
                  )}
                </div>
              </div>
            )}

            {/* Assigned assets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">inventory_2</span>
                  Activos Asignados
                </p>
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-lg">{assignedAssets.length}</span>
              </div>
              {assignedAssets.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-medium italic text-center py-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No hay artefactos vinculados a esta persona
                </p>
              ) : (
                <div className="space-y-2">
                  {assignedAssets.map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-sm">construction</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 leading-none">{asset.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-1">{asset.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Programación section (Staff only) ── */}
            {detailPerson.type === 'Staff' && (() => {
              const shiftOverrides = (state.shiftOverrides || []).filter(o => o.staffId === detailPerson.id)
              const staffList = (state.staff || []).filter(s => s.id !== detailPerson.id)
              const today = new Date().toISOString().slice(0, 10)

              const handleAddPlanned = () => {
                if (!progStart || !progEnd) return
                if (progEnd < progStart) return
                if (progSubMode === 'staff' && !progSubStaffId) return
                if (progSubMode === 'external' && !progSubExternal.trim()) return
                const override: ShiftOverride = {
                  id: `so-${Date.now()}`,
                  staffId: detailPerson.id,
                  type: progType,
                  startDate: progStart,
                  endDate: progEnd,
                  substituteStaffId: progSubMode === 'staff' ? progSubStaffId : undefined,
                  substituteExternal: progSubMode === 'external' ? progSubExternal.trim() : undefined,
                  note: progNote.trim() || undefined,
                  reportedBy: role,
                  reportedAt: new Date().toISOString(),
                }
                dispatch({ type: 'ADD_SHIFT_OVERRIDE', payload: override })
                resetProgForm()
              }

              const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

              return (
                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      Programación de Ausencias
                    </p>
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-lg">{shiftOverrides.length}</span>
                  </div>

                  {/* Existing overrides list */}
                  {shiftOverrides.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-medium italic text-center py-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      Sin ausencias ni vacaciones programadas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {shiftOverrides
                        .sort((a, b) => a.startDate.localeCompare(b.startDate))
                        .map(o => {
                          const isPast = o.endDate < today
                          const subName = o.substituteStaffId
                            ? staffList.find(s => s.id === o.substituteStaffId)?.name
                            : o.substituteExternal
                          return (
                            <div key={o.id} className={`flex items-start justify-between p-3 rounded-2xl border ${
                              isPast ? 'bg-slate-50/30 border-slate-100 opacity-50' : 'bg-white border-slate-200'
                            }`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                                    o.type === 'vacation' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {o.type === 'vacation' ? 'Vacaciones' : 'Ausencia Autorizada'}
                                  </span>
                                  {isPast && <span className="text-[9px] text-slate-300 font-bold uppercase">Pasado</span>}
                                </div>
                                <p className="text-[11px] font-bold text-slate-900">
                                  {fmtDate(o.startDate)}{o.startDate !== o.endDate ? ` → ${fmtDate(o.endDate)}` : ''}
                                </p>
                                {subName && (
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    Cubierto por: <span className="font-bold text-slate-700">{subName}</span>
                                  </p>
                                )}
                                {o.note && <p className="text-[10px] text-slate-400 italic">"{o.note}"</p>}
                              </div>
                              <button
                                onClick={() => dispatch({ type: 'REMOVE_SHIFT_OVERRIDE', payload: o.id })}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Add override form */}
                  <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary-dim transition-colors list-none select-none">
                      <span className="material-symbols-outlined text-sm group-open:rotate-45 transition-transform">add_circle</span>
                      Programar Ausencia
                    </summary>

                    <div className="mt-4 space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      {/* Type */}
                      <div className="grid grid-cols-2 gap-2">
                        {([['vacation', 'Vacaciones', 'beach_access'], ['pre_authorized', 'Ausencia Autorizada', 'event_busy']] as [PlannedType, string, string][]).map(([v, l, icon]) => (
                          <button key={v} onClick={() => setProgType(v)}
                            className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                              progType === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}>
                            <span className="material-symbols-outlined text-sm">{icon}</span>{l}
                          </button>
                        ))}
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inicio</p>
                          <input type="date" value={progStart} min={today} onChange={e => { setProgStart(e.target.value); if (!progEnd || e.target.value > progEnd) setProgEnd(e.target.value) }}
                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary font-medium text-sm" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fin</p>
                          <input type="date" value={progEnd} min={progStart || today} onChange={e => setProgEnd(e.target.value)}
                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary font-medium text-sm" />
                        </div>
                      </div>

                      {/* Optional substitute */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sustituto (opcional)</p>
                        <div className="flex gap-2">
                          {(['none', 'staff', 'external'] as const).map(m => (
                            <button key={m} onClick={() => setProgSubMode(m)}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                progSubMode === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'
                              }`}>
                              {m === 'none' ? 'Ninguno' : m === 'staff' ? 'Del Staff' : 'Externo'}
                            </button>
                          ))}
                        </div>
                        {progSubMode === 'staff' && (
                          <select value={progSubStaffId} onChange={e => setProgSubStaffId(e.target.value)}
                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary font-medium text-sm">
                            <option value="">Seleccionar...</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                          </select>
                        )}
                        {progSubMode === 'external' && (
                          <input type="text" value={progSubExternal} onChange={e => setProgSubExternal(e.target.value)}
                            placeholder="Nombre del sustituto externo"
                            className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary font-medium text-sm" />
                        )}
                      </div>

                      {/* Note */}
                      <textarea value={progNote} onChange={e => setProgNote(e.target.value)} rows={2}
                        placeholder="Nota interna (opcional)"
                        className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary font-medium text-sm resize-none" />

                      <button onClick={handleAddPlanned}
                        disabled={!progStart || !progEnd || progEnd < progStart}
                        className="w-full py-3 bg-slate-900 text-white font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        Guardar Programación
                      </button>
                    </div>
                  </details>
                </div>
              )
            })()}

            {/* Actions */}
            {(detailPerson.type === 'Residente' || detailPerson.type === 'Staff') && (
              <div className="pt-2">
                <button
                  onClick={() => { setDeleteTarget({ id: detailPerson.id, name: detailPerson.name }); setDetailPersonId(null) }}
                  className="w-full py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  Eliminar {detailPerson.type === 'Residente' ? 'Residente' : 'Personal'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Add User Modal (Tabbed) ── */}
      <Modal open={showAddModal} onClose={resetAndCloseModal} title="Registrar Nuevo Usuario">
        <div className="p-2 space-y-6">
          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setAddTab('residente')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                addTab === 'residente'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-sm">person</span>
              Residente
            </button>
            <button
              onClick={() => setAddTab('staff')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                addTab === 'staff'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-sm">engineering</span>
              Staff
            </button>
          </div>

          {/* ─── Resident Form ─── */}
          {addTab === 'residente' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
                <input
                  type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  placeholder="Juan Antonio Pérez"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {bc.type === 'towers' ? 'Torre' : 'Sección'} *
                  </label>
                  <select
                    value={formTower} onChange={e => setFormTower(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  >
                    <option value="">Seleccionar</option>
                    {bc.towers.map(t => <option key={t} value={t}>{bc.type === 'towers' ? `Torre ${t}` : `Sección ${t}`}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento *</label>
                  <input
                    type="text" value={formApartment} onChange={e => setFormApartment(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="A101" list="apartment-list"
                  />
                  <datalist id="apartment-list">
                    {apartments.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email *</label>
                  <input
                    type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="correo@property.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input
                    type="tel" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="55 1234 5678"
                  />
                </div>
              </div>
              <button onClick={handleAddResident}
                className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
              >
                Registrar Residente
              </button>
            </div>
          )}

          {/* ─── Staff Form ─── */}
          {addTab === 'staff' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Photo + Name row */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center shrink-0 overflow-hidden hover:border-slate-400 transition-all cursor-pointer group"
                >
                  {staffPhoto ? (
                    <img src={staffPhoto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-slate-300 text-2xl group-hover:text-slate-500 transition-colors">add_a_photo</span>
                      <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1 group-hover:text-slate-500 transition-colors">Foto</span>
                    </>
                  )}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <div className="flex-1 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label>
                  <input
                    type="text" value={staffName} onChange={e => setStaffName(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                    placeholder="Ricardo Hernández"
                  />
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría *</label>
                <div className="grid grid-cols-4 gap-2">
                  {STAFF_ROLES.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setStaffRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        staffRole === r.value
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{r.icon}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work days */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Días Laborales</label>
                <div className="flex gap-2">
                  {WORK_DAYS.map(d => (
                    <button
                      key={d.id}
                      onClick={() => toggleWorkDay(d.id)}
                      className={`w-10 h-10 rounded-xl text-[11px] font-black uppercase transition-all ${
                        staffDays.includes(d.id)
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                          : 'bg-slate-50 border border-slate-200 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shift times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hora de Entrada</label>
                  <input
                    type="time" value={staffStart} onChange={e => setStaffStart(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Hora de Salida</label>
                  <input
                    type="time" value={staffEnd} onChange={e => setStaffEnd(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  />
                </div>
              </div>

              <button onClick={handleAddStaff}
                className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
              >
                Registrar Staff
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar Residente"
        confirmLabel="Eliminar"
        variant="danger"
      >
        {deleteTarget
          ? `¿Seguro que desea eliminar a ${deleteTarget.name}? El departamento y registros históricos se conservan.`
          : ''}
      </ConfirmDialog>
    </div>
  )
}
