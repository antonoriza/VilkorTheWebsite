/**
 * PaqueteriaPage — Package receipt and delivery management.
 *
 * Admin view: Full list of received packages with the ability to
 * register new arrivals, filter by recipient/apartment, and
 * marks packages as delivered.
 * Resident view: Personalized list of pending and received packages.
 *
 * This module ensures secure tracking of physical items within
 * the residential complex.
 */
import { useState, useMemo } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { useStore } from '../../core/store/store'
import StatusBadge from '../../core/components/StatusBadge'
import Modal from '../../core/components/Modal'
import EmptyState from '../../core/components/EmptyState'
import SortableTh from '../../core/components/SortableTh'


export default function PaqueteriaPage() {
  const { role, apartment } = useAuth()
  const { state, dispatch } = useStore()

  // ── Form state ──
  const [showModal, setShowModal] = useState(false)
  const [formRecipient, setFormRecipient] = useState('')
  const [formApartment, setFormApartment] = useState('')
  const [formLocation, setFormLocation] = useState('')

  // ── Sort state ──
  type PaqSortKey = 'recipient' | 'apartment' | 'receivedDate' | 'status'
  const [sortKey, setSortKey] = useState<PaqSortKey>('receivedDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const handleSort = (key: PaqSortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Filter state ──
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterApartment, setFilterApartment] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const isAdmin = role === 'super_admin' || role === 'administracion' || role === 'operador'

  // ── Scoped base dataset ──
  const scoped = useMemo(() =>
    isAdmin ? state.paquetes : state.paquetes.filter(p => p.apartment === apartment),
    [state.paquetes, isAdmin, apartment]
  )

  // ── Stats (always from scoped, never filtered) ──
  const stats = useMemo(() => ({
    pending:   scoped.filter(p => p.status === 'Pendiente').length,
    delivered: scoped.filter(p => p.status === 'Entregado').length,
    total:     scoped.length,
  }), [scoped])

  // ── Filtered + sorted list ──
  const filteredPaquetes = useMemo(() => {
    let data = scoped
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(p =>
        p.recipient.toLowerCase().includes(q) ||
        p.apartment.toLowerCase().includes(q)
      )
    }
    if (filterStatus)    data = data.filter(p => p.status === filterStatus)
    if (filterApartment) data = data.filter(p => p.apartment === filterApartment)
    if (filterDateFrom)  data = data.filter(p => p.receivedDate >= filterDateFrom)
    if (filterDateTo)    data = data.filter(p => p.receivedDate <= filterDateTo)
    if (filterLocation)  data = data.filter(p => (p.location || '').toLowerCase().includes(filterLocation.toLowerCase()))
    return [...data].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string
      const bv = (b[sortKey] ?? '') as string
      const cmp = av.localeCompare(bv, 'es', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [scoped, search, filterStatus, filterApartment, filterDateFrom, filterDateTo, filterLocation, sortKey, sortDir])

  const activeFilterCount = [filterStatus, filterApartment, filterDateFrom, filterDateTo, filterLocation].filter(Boolean).length
  const clearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterApartment('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterLocation('')
  }

  /** Derive unique location options from existing package data */
  const knownLocations = useMemo(() => {
    const locs = new Set<string>()
    state.paquetes.forEach(p => { if (p.location && p.location !== 'N/A') locs.add(p.location) })
    return [...locs].sort()
  }, [state.paquetes])

  const knownApartments = useMemo(() =>
    [...new Set(state.paquetes.map(p => p.apartment))].sort(),
    [state.paquetes]
  )

  /** Admin-only: Clears all packages marked as 'Entregado' (Delivered) */
  const handleCleanDelivered = () => dispatch({ type: 'DELETE_PAQUETES_DELIVERED' })

  /** Registers a new package arrival */
  const handleAdd = () => {
    if (!formRecipient.trim() || !formApartment.trim()) return
    dispatch({
      type: 'ADD_PAQUETE',
      payload: {
        id: `pq-${Date.now()}`,
        recipient: formRecipient,
        apartment: formApartment,
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'Pendiente',
        location: formLocation,
      },
    })
    setFormRecipient('')
    setFormApartment('')
    setFormLocation('')
    setShowModal(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Control de Paquetería
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestión y seguimiento de paquetes recibidos en el edificio.
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Registrar paquete</span>
            </button>
            <button
              onClick={handleCleanDelivered}
              className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[11px] tracking-widest uppercase"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              <span>Limpiar entregados</span>
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En espera',  count: stats.pending,   status: 'Pendiente', bg: 'bg-amber-50 border-amber-100 hover:bg-amber-100',     text: 'text-amber-700',   icon: 'inbox' },
          { label: 'Entregados', count: stats.delivered, status: 'Entregado', bg: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100', text: 'text-emerald-700', icon: 'check_circle' },
          { label: 'Total',      count: stats.total,     status: '',          bg: 'bg-slate-50 border-slate-100 hover:bg-slate-100',       text: 'text-slate-700',   icon: 'package_2' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(filterStatus === s.status ? '' : s.status)}
            className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer text-left ${s.bg} ${filterStatus === s.status && s.status ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            <span className={`material-symbols-outlined text-3xl ${s.text}`}>{s.icon}</span>
            <div>
              <p className={`text-2xl font-extrabold ${s.text}`}>{s.count}</p>
              <p className={`text-[11px] font-bold uppercase tracking-widest ${s.text} opacity-70`}>{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Packages Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por destinatario o departamento..."
                className="pl-9 pr-8 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder:text-slate-300"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[11px] text-slate-500">close</span>
                </button>
              )}
            </div>

            {/* Result count */}
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
              {filteredPaquetes.length} de {scoped.length}
            </span>

            {/* Filter toggle */}
            <button
              onClick={() => { if (showFilters) clearFilters(); setShowFilters(!showFilters) }}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                showFilters
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                  : activeFilterCount > 0
                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 shadow-sm',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Filtros
              {activeFilterCount > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${showFilters ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Clear button (only when filters active) */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Collapsible filter grid */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              {/* Status */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Estado</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              {/* Apartment (admin only) */}
              {isAdmin && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Departamento</label>
                  <select
                    value={filterApartment}
                    onChange={e => setFilterApartment(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Todos</option>
                    {knownApartments.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}

              {/* Date from */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Recibido desde</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Date to */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Recibido hasta</label>
                <input
                  type="date"
                  value={filterDateTo}
                  min={filterDateFrom || undefined}
                  onChange={e => setFilterDateTo(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Location */}
              {isAdmin && knownLocations.length > 0 && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Ubicación</label>
                  <select
                    value={filterLocation}
                    onChange={e => setFilterLocation(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Todas</option>
                    {knownLocations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && !showFilters && (
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-slate-50">
              {filterStatus && (
                <button onClick={() => setFilterStatus('')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group">
                  Estado: {filterStatus}<span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100">close</span>
                </button>
              )}
              {filterApartment && (
                <button onClick={() => setFilterApartment('')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group">
                  Depto: {filterApartment}<span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100">close</span>
                </button>
              )}
              {filterDateFrom && (
                <button onClick={() => setFilterDateFrom('')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group">
                  Desde: {filterDateFrom}<span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100">close</span>
                </button>
              )}
              {filterDateTo && (
                <button onClick={() => setFilterDateTo('')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group">
                  Hasta: {filterDateTo}<span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100">close</span>
                </button>
              )}
              {filterLocation && (
                <button onClick={() => setFilterLocation('')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold tracking-wide hover:bg-rose-50 hover:text-rose-600 transition-all group">
                  Ubicación: {filterLocation}<span className="material-symbols-outlined text-[11px] opacity-40 group-hover:opacity-100">close</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-100">
                <SortableTh<PaqSortKey> col="recipient" label="Destinatario" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-8" />
                <SortableTh<PaqSortKey> col="apartment" label="Departamento" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-8" />
                <SortableTh<PaqSortKey> col="receivedDate" label="Recibido" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-8" />
                <SortableTh<PaqSortKey> col="status" label="Estado" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-8" />
                <th className="px-8 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</th>
                <th className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPaquetes.map((pkg) => (
                <tr key={pkg.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 text-sm font-bold text-slate-900">{pkg.recipient}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{pkg.apartment}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pkg.receivedDate}</td>
                  <td className="px-8 py-5"><StatusBadge status={pkg.status} /></td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{pkg.location}</td>
                  <td className="px-8 py-5 text-center">
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          const newStatus = pkg.status === 'Pendiente' ? 'Entregado' : 'Pendiente'
                          dispatch({ 
                            type: 'UPDATE_PAQUETE', 
                            payload: { 
                              ...pkg, 
                              status: newStatus, 
                              location: newStatus === 'Entregado' ? 'N/A' : pkg.location 
                            } 
                          })
                        }}
                        className={`w-10 h-10 inline-flex items-center justify-center rounded-xl transition-all shadow-sm ${
                          pkg.status === 'Entregado' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50'
                        }`}
                        title={pkg.status === 'Pendiente' ? 'Confirmar Entrega' : 'Revertir a Pendiente'}
                      >
                        <span className="material-symbols-outlined text-lg font-bold">check_circle</span>
                      </button>
                    ) : (
                      <span className={`inline-flex items-center text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-widest ${
                        pkg.status === 'Pendiente' 
                          ? 'text-amber-600 bg-amber-50 border-amber-100' 
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      }`}>
                        {pkg.status === 'Pendiente' ? 'En espera' : 'Recibido'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPaquetes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-10">
                    {scoped.length === 0 ? (
                      <EmptyState
                        icon="package_2"
                        title={isAdmin ? 'Sin paquetes registrados' : 'Sin paquetes pendientes'}
                        subtitle={isAdmin
                          ? state.residents.length === 0
                            ? 'Agrega residentes primero para poder registrar la recepción de paquetes.'
                            : 'Registra la llegada de un paquete y notifica al residente.'
                          : 'No tienes paquetes pendientes de recogida en recepción.'
                        }
                        action={isAdmin && state.residents.length > 0 ? { label: 'Registrar Paquete', onClick: () => setShowModal(true) } : undefined}
                      />
                    ) : (
                      <EmptyState
                        icon="search_off"
                        title="Sin resultados"
                        subtitle="No se encontraron paquetes con esos criterios de búsqueda."
                        action={{ label: 'Limpiar filtros', onClick: clearFilters }}
                      />
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal (Admin Only) */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Paquete">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destinatario</label>
            <select
              value={formRecipient}
              onChange={(e) => {
                setFormRecipient(e.target.value)
                const r = state.residents.find(r => r.name === e.target.value)
                if (r) setFormApartment(r.apartment)
              }}
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            >
              <option value="">Seleccionar residente...</option>
              {state.residents.map(r => <option key={r.name} value={r.name}>{r.name} — {r.apartment}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
            <input
              type="text"
              value={formApartment}
              readOnly
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-medium cursor-not-allowed"
              placeholder="Auto-completado"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación de Almacenamiento</label>
            <input
              type="text"
              list="pkg-location-options"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Ubicación donde se almacena el paquete"
              className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
            />
            <datalist id="pkg-location-options">
              {knownLocations.map(loc => <option key={loc} value={loc} />)}
            </datalist>
          </div>
          <button
            onClick={handleAdd}
            disabled={!formRecipient || !formApartment}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Registrar Paquete
          </button>
        </div>
      </Modal>
    </div>
  )
}
