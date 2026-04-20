/**
 * AdminConfiguracion — Admin settings page.
 *
 * Manages building profile, topology (towers vs. houses),
 * amenities CRUD, and system reset.
 *
 * BUG FIX: All 3 window.confirm() calls replaced with ConfirmDialog:
 *   - Delete amenity
 *   - Delete tower
 *   - Reset system
 */
import { useState } from 'react'
import { useStore } from '../../core/store/store'
import ConfirmDialog from '../../core/components/ConfirmDialog'
import { EGRESO_CATEGORIA_LABELS, type EgresoCategoria } from '../../core/store/seed'

/** Tracks which confirmation dialog is currently visible */
type ConfirmTarget =
  | { action: 'deleteAmenity'; id: string; name: string }
  | { action: 'deleteTower'; tower: string; residentCount: number }
  | { action: 'reset' }
  | null

export default function AdminConfiguracion() {
  const { state, dispatch } = useStore()
  const bc = state.buildingConfig
  const [saved, setSaved] = useState(false)
  const [newAmenity, setNewAmenity] = useState('')
  const [newTower, setNewTower] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null)
  const [newConcepto, setNewConcepto] = useState('')
  const [expandedConcepto, setExpandedConcepto] = useState<string | null>(null)
  const [newSubConcepto, setNewSubConcepto] = useState('')

  // Recurring egresos form
  const [reConcepto, setReConcepto] = useState('')
  const [reCategoria, setReCategoria] = useState<EgresoCategoria>('nomina')
  const [reAmount, setReAmount] = useState('')
  const [reDescription, setReDescription] = useState('')

  /** Dispatches a partial building config update */
  const update = (key: string, value: string | number) => {
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { [key]: value } })
    setSaved(false)
  }

  /** Triggers the "saved" feedback animation */
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  /** Opens the reset confirmation dialog */
  const handleReset = () => {
    setConfirmTarget({ action: 'reset' })
  }

  /** Adds a new amenity to the store */
  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return
    dispatch({ type: 'ADD_AMENITY', payload: { id: `amen-${Date.now()}`, name: newAmenity.trim() } })
    setNewAmenity('')
  }

  /** Opens the delete-amenity confirmation dialog */
  const handleDeleteAmenity = (id: string, name: string) => {
    setConfirmTarget({ action: 'deleteAmenity', id, name })
  }

  /** Adds a new tower/section */
  const handleAddTower = () => {
    if (!newTower.trim()) return
    const t = newTower.trim().toUpperCase()
    if (bc.towers.includes(t)) return
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { towers: [...bc.towers, t] } })
    setNewTower('')
  }

  /** Opens the delete-tower confirmation dialog */
  const handleDeleteTower = (tower: string) => {
    const residentCount = state.residents.filter(r => r.tower === tower).length
    setConfirmTarget({ action: 'deleteTower', tower, residentCount })
  }

  /** Executes the confirmed action */
  const executeConfirm = () => {
    if (!confirmTarget) return
    switch (confirmTarget.action) {
      case 'deleteAmenity':
        dispatch({ type: 'DELETE_AMENITY', payload: confirmTarget.id })
        break
      case 'deleteTower':
        dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { towers: bc.towers.filter(t => t !== confirmTarget.tower) } })
        break
      case 'reset':
        dispatch({ type: 'RESET' })
        window.location.reload()
        break
    }
  }

  /** Generates confirm dialog title/message based on target */
  const getConfirmProps = () => {
    if (!confirmTarget) return { title: '', children: '' }
    switch (confirmTarget.action) {
      case 'deleteAmenity':
        return {
          title: 'Eliminar Amenidad',
          children: `¿Eliminar la amenidad "${confirmTarget.name}"? Si no quedan amenidades, el módulo se ocultará para todos los usuarios.`,
        }
      case 'deleteTower':
        return {
          title: `Eliminar ${bc.type === 'towers' ? 'Torre' : 'Sección'}`,
          children: confirmTarget.residentCount > 0
            ? `¿Eliminar ${bc.type === 'towers' ? 'torre' : 'sección'} "${confirmTarget.tower}"? Hay ${confirmTarget.residentCount} residente(s) asignados. Deberás reasignarlos manualmente.`
            : `¿Eliminar ${bc.type === 'towers' ? 'torre' : 'sección'} "${confirmTarget.tower}"?`,
        }
      case 'reset':
        return {
          title: 'Restablecer Sistema',
          children: '¿Seguro? Esto eliminará todos los datos y restaurará la aplicación a su estado inicial. Esta acción no se puede deshacer.',
        }
    }
  }

  const inputClass = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2"

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">Configuración</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Administra el perfil, datos del edificio, amenidades y preferencias del sistema.
          </p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center space-x-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase ${
            saved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{saved ? 'check_circle' : 'save'}</span>
          <span>{saved ? 'Guardado' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Admin Profile */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">person</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Perfil del Administrador</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre</label>
            <input type="text" value={bc.adminName} onChange={(e) => update('adminName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="tel" value={bc.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Email</label>
            <input type="email" value={bc.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {/* Building Info */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">apartment</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Información del Edificio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Nombre del Edificio</label>
            <input type="text" value={bc.buildingName} onChange={(e) => update('buildingName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Empresa Administradora</label>
            <input type="text" value={bc.managementCompany} onChange={(e) => update('managementCompany', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input type="text" value={bc.buildingAddress} onChange={(e) => update('buildingAddress', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Total de Unidades</label>
            <input type="number" value={bc.totalUnits} onChange={(e) => update('totalUnits', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cuota Mensual (MXN)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input type="number" value={bc.monthlyFee || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { monthlyFee: Number(e.target.value) || 0 } })}
                className={inputClass + ' !pl-8'} />
            </div>
          </div>
        </div>
      </section>

      {/* Building Topology */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">domain</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Topología del Edificio</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tipo de Propiedad</label>
            <div className="flex gap-3">
              <button onClick={() => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { type: 'towers' } })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  bc.type === 'towers' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">apartment</span> Torres
              </button>
              <button onClick={() => dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { type: 'houses' } })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                  bc.type === 'houses' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">home</span> Casas
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>{bc.type === 'towers' ? 'Torres' : 'Secciones'}</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {bc.towers.map(t => (
                <div key={t} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-bold text-slate-700">{bc.type === 'towers' ? `Torre ${t}` : `Sección ${t}`}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({state.residents.filter(r => r.tower === t).length} res.)</span>
                  <button onClick={() => handleDeleteTower(t)} className="text-slate-400 hover:text-rose-600 transition-colors ml-1">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTower} onChange={(e) => setNewTower(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTower()}
                placeholder={bc.type === 'towers' ? 'Ej: C' : 'Ej: Norte'}
                className={inputClass + ' flex-1'}
              />
              <button onClick={handleAddTower} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold">
                Agregar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">outdoor_grill</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Amenidades</h3>
        </div>
        {state.amenities.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
            <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">warning</span>
            <p className="text-[11px] text-amber-700 font-medium">
              No hay amenidades configuradas. El módulo de amenidades está oculto para todos los usuarios.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {state.amenities.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <span className="text-sm font-bold text-slate-900">{a.name}</span>
              <button onClick={() => handleDeleteAmenity(a.id, a.name)} className="text-slate-400 hover:text-rose-600 transition-colors">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAmenity()}
            placeholder="Ej: Asador 4, Salón de Eventos, Alberca..."
            className={inputClass + ' flex-1'}
          />
          <button onClick={handleAddAmenity}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold whitespace-nowrap"
          >
            Agregar
          </button>
        </div>
      </section>

      {/* Conceptos de Pago */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Conceptos de Pago</h3>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          Define los conceptos disponibles al registrar pagos, multas o adeudos. "Mantenimiento" es obligatorio y no puede eliminarse.
        </p>
        <div className="space-y-2">
          {bc.conceptosPago.map(c => {
            const subs = bc.subConceptos?.[c] || []
            const isExpanded = expandedConcepto === c
            return (
              <div key={c} className="rounded-xl border border-slate-100 hover:border-slate-200 transition-colors overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <button type="button" onClick={() => setExpandedConcepto(isExpanded ? null : c)}
                    className="flex items-center gap-2 flex-1 text-left">
                    <span className="material-symbols-outlined text-[14px] text-slate-400 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_right</span>
                    <span className="text-sm font-bold text-slate-900">{c}</span>
                    {c === 'Mantenimiento' && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">Obligatorio</span>
                    )}
                    {subs.length > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md tabular-nums">{subs.length}</span>
                    )}
                  </button>
                  {c !== 'Mantenimiento' && (
                    <button
                      onClick={() => {
                        const updated = bc.conceptosPago.filter(x => x !== c)
                        // Also remove sub-concepts for this concepto
                        const updatedSubs = { ...bc.subConceptos }
                        delete updatedSubs[c]
                        dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: updated, subConceptos: updatedSubs } })
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
                {/* Sub-concepts accordion */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 bg-slate-50/50 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium">Sub-conceptos para "{c}":</p>
                    {subs.map(sub => (
                      <div key={sub} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-100 rounded-lg">
                        <span className="text-xs font-medium text-slate-700">{sub}</span>
                        <button onClick={() => {
                          const updated = { ...bc.subConceptos }
                          updated[c] = (updated[c] || []).filter(s => s !== sub)
                          if (updated[c].length === 0) delete updated[c]
                          dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: updated } })
                        }} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input type="text" value={newSubConcepto} onChange={e => setNewSubConcepto(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = newSubConcepto.trim()
                            if (!val || subs.includes(val)) return
                            const updated = { ...bc.subConceptos }
                            updated[c] = [...(updated[c] || []), val]
                            dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: updated } })
                            setNewSubConcepto('')
                          }
                        }}
                        placeholder={`Ej: Sub-concepto de ${c}…`}
                        className={inputClass + ' flex-1 !py-1.5 !text-xs'}
                      />
                      <button onClick={() => {
                        const val = newSubConcepto.trim()
                        if (!val || subs.includes(val)) return
                        const updated = { ...bc.subConceptos }
                        updated[c] = [...(updated[c] || []), val]
                        dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { subConceptos: updated } })
                        setNewSubConcepto('')
                      }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        + Agregar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newConcepto} onChange={(e) => setNewConcepto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = newConcepto.trim()
                if (!val || bc.conceptosPago.includes(val)) return
                dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: [...bc.conceptosPago, val] } })
                setNewConcepto('')
              }
            }}
            placeholder="Ej: Cuota Extraordinaria, Penalización..."
            className={inputClass + ' flex-1'}
          />
          <button
            onClick={() => {
              const val = newConcepto.trim()
              if (!val || bc.conceptosPago.includes(val)) return
              dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { conceptosPago: [...bc.conceptosPago, val] } })
              setNewConcepto('')
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-bold whitespace-nowrap"
          >
            Agregar
          </button>
        </div>
      </section>

      {/* Egresos Recurrentes */}
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">autorenew</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Egresos Recurrentes</h3>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          Gastos operativos que se generan automáticamente como "Pendiente" al inicio de cada mes (nóminas, servicios, etc.).
        </p>
        <div className="space-y-2">
          {(bc.recurringEgresos || []).map(re => (
            <div key={re.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{re.concepto}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                    {EGRESO_CATEGORIA_LABELS[re.categoria]}
                  </span>
                  <span className="text-xs font-black text-slate-700 tabular-nums">${re.amount.toLocaleString('es-MX')} MXN</span>
                </div>
                {re.description && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{re.description}</p>}
              </div>
              <button
                onClick={() => {
                  const updated = (bc.recurringEgresos || []).filter(r => r.id !== re.id)
                  dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { recurringEgresos: updated } })
                }}
                className="text-slate-400 hover:text-rose-600 transition-colors ml-3"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
          {(bc.recurringEgresos || []).length === 0 && (
            <p className="text-sm text-slate-400 font-medium py-2">No hay egresos recurrentes configurados.</p>
          )}
        </div>
        {/* Add form */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agregar Egreso Recurrente</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Concepto *</label>
              <input type="text" value={reConcepto} onChange={e => setReConcepto(e.target.value)}
                placeholder="Ej: Salario Guardia — Juan Pérez"
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Categoría *</label>
              <select value={reCategoria} onChange={e => setReCategoria(e.target.value as EgresoCategoria)}
                className={inputClass}>
                {(Object.keys(EGRESO_CATEGORIA_LABELS) as EgresoCategoria[]).map(cat => (
                  <option key={cat} value={cat}>{EGRESO_CATEGORIA_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Monto (MXN) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input type="number" value={reAmount} onChange={e => setReAmount(e.target.value)}
                  placeholder="0"
                  className={inputClass + ' !pl-8'} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Descripción <span className="text-slate-300">(opcional)</span></label>
              <input type="text" value={reDescription} onChange={e => setReDescription(e.target.value)}
                placeholder="Detalle adicional…"
                className={inputClass} />
            </div>
          </div>
          <button
            onClick={() => {
              if (!reConcepto.trim() || !reAmount || Number(reAmount) <= 0) return
              const newEntry = {
                id: `re-${Date.now()}`,
                concepto: reConcepto.trim(),
                categoria: reCategoria,
                amount: Number(reAmount),
                description: reDescription.trim() || undefined,
              }
              dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { recurringEgresos: [...(bc.recurringEgresos || []), newEntry] } })
              setReConcepto(''); setReAmount(''); setReDescription('')
            }}
            disabled={!reConcepto.trim() || !reAmount || Number(reAmount) <= 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              !reConcepto.trim() || !reAmount || Number(reAmount) <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Agregar
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white border border-rose-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-rose-100 pb-4">
          <span className="material-symbols-outlined text-rose-600 text-xl">warning</span>
          <h3 className="text-[11px] font-bold text-rose-600 uppercase tracking-widest font-headline">Zona de Peligro</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Restablecer Sistema</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Elimina todos los datos de la aplicación y restaura los valores de demostración originales.
            </p>
          </div>
          <button onClick={handleReset}
            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-[11px] tracking-widest uppercase shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Restablecer</span>
          </button>
        </div>
      </section>

      {/* ── In-App Confirm Dialog (replaces all window.confirm calls) ── */}
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeConfirm}
        title={getConfirmProps().title}
        confirmLabel={confirmTarget?.action === 'reset' ? 'Restablecer' : 'Eliminar'}
        variant="danger"
      >
        {getConfirmProps().children}
      </ConfirmDialog>
    </div>
  )
}
