/**
 * UsuariosPage — Unified People Management Module.
 *
 * Enterprise-grade directory consolidating Residents, Staff, and
 * Administrators into a single filterable view. Replaces the old
 * residents-only table with a unified directory that serves as the
 * single source of truth for people management.
 *
 * CRUD: Residents can be added/deleted here. Staff is read-only
 * (managed via StaffPanel on the dashboard).
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import Modal from '../../core/components/Modal'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import EmptyState from '../../core/components/EmptyState'

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

  // ── Detail modal state ──
  const [detailPersonId, setDetailPersonId] = useState<string | null>(null)

  // ── Add resident modal ──
  const [showAddModal, setShowAddModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formApartment, setFormApartment] = useState('')
  const [formTower, setFormTower] = useState('')
  const [formEmail, setFormEmail] = useState('')

  // ── Delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

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
      })),
      ...residents.map(r => ({
        id: r.id,
        name: r.name,
        type: 'Residente' as const,
        role: 'Residente',
        location: `${r.tower ? `${r.tower}-` : ''}${r.apartment}`,
        email: r.email,
        tower: r.tower,
      })),
    ]
    if (role === 'operador') return result.filter(p => p.type !== 'Residente')
    return result
  }, [residents, staff, bc, role])

  // ── Apply filters ──
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
    return list
  }, [people, typeFilter, towerFilter, search])

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
  const handleAdd = () => {
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
      },
    })
    setFormName(''); setFormApartment(''); setFormTower(''); setFormEmail('')
    setShowAddModal(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_RESIDENT', payload: deleteTarget.id })
      if (detailPersonId === deleteTarget.id) setDetailPersonId(null)
    }
  }

  const clearFilters = () => {
    setTypeFilter('all'); setTowerFilter('all'); setSearch('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Gestión de Personas
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {people.length} registros — {typeCounts.Residente} residentes, {typeCounts.Staff} staff, {typeCounts.Administrador} admin
            {towers.length > 0 && ` — ${towers.length} ${bc.type === 'towers' ? 'torres' : 'secciones'}`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          <span>Nuevo Residente</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
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

      {/* ── Active Filters Summary ── */}
      {hasActiveFilters && (
        <div className="flex items-center gap-3 animate-in fade-in duration-300">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Mostrando {filtered.length} de {people.length}
          </span>
          <button onClick={clearFilters} className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Info banner ── */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start space-x-3">
        <span className="material-symbols-outlined text-indigo-600 text-lg mt-0.5">info</span>
        <div className="text-[11px] text-indigo-700 font-medium space-y-1">
          <p>Este directorio unifica residentes, personal operativo y administración.</p>
          <p>En votaciones, solo se permite <strong>1 voto por departamento</strong> (no por persona).</p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Persona</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rol / Puesto</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ubicación</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
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
                        {/* Green dot for active status */}
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

            {/* Actions */}
            {detailPerson.type === 'Residente' && (
              <div className="pt-2">
                <button
                  onClick={() => { setDeleteTarget({ id: detailPerson.id, name: detailPerson.name }); setDetailPersonId(null) }}
                  className="w-full py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  Eliminar Residente
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Add Resident Modal ── */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Registrar Nuevo Residente">
        <div className="space-y-4 p-2">
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
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email *</label>
            <input
              type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              placeholder="correo@property.com"
            />
          </div>
          <button onClick={handleAdd}
            className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
          >
            Registrar Residente
          </button>
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
