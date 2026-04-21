import { useState } from 'react'
import { BuildingConfig, Vendor, VendorCategory, VENDOR_CATEGORY_LABELS, InventoryItem, InventoryCategory, Resident, StaffMember } from '../../../types'

// ─── Shared ───────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'paquetes',   label: 'Paquetes',              icon: 'package_2' },
  { id: 'directorio', label: 'Directorio Proveedores', icon: 'contact_phone' },
  { id: 'inventario', label: 'Inventario',             icon: 'inventory_2' },
]

function SaveFooter({ handleSave, saved }: { handleSave: () => void; saved: boolean }) {
  return (
    <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-end">
      <button
        onClick={handleSave}
        className={`flex items-center space-x-3 px-8 py-3 font-black rounded-2xl transition-all shadow-2xl text-[10px] tracking-widest uppercase ${
          saved ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{saved ? 'check_circle' : 'save_as'}</span>
        <span>{saved ? 'Ajustes Aplicados' : 'Guardar Cambios'}</span>
      </button>
    </div>
  )
}



// ─── Tab: Paquetes ────────────────────────────────────────────────────────────

function PaquetesTab({ handleSave, saved, labelClass, inputClass }: { handleSave: () => void; saved: boolean; labelClass: string; inputClass: string }) {
  const [retention, setRetention] = useState('7')
  const [alertDays, setAlertDays] = useState('3')
  const [alertOnArrival, setAlertOnArrival] = useState(true)
  const [requireSignature, setRequireSignature] = useState(true)

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all">
      <span className="text-[11px] font-bold text-slate-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? 'bg-slate-900' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${value ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Tiempos de Almacenaje</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Días máximos de retención</label>
            <select value={retention} onChange={(e) => setRetention(e.target.value)} className={inputClass}>
              <option value="3">3 días</option>
              <option value="5">5 días</option>
              <option value="7">7 días (recomendado)</option>
              <option value="14">14 días</option>
              <option value="30">30 días</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Alertar residente si no retira en…</label>
            <select value={alertDays} onChange={(e) => setAlertDays(e.target.value)} className={inputClass}>
              <option value="1">1 día</option>
              <option value="2">2 días</option>
              <option value="3">3 días</option>
              <option value="5">5 días</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Reglas Operativas</h4>
        <div className="space-y-2">
          <Toggle value={alertOnArrival} onChange={setAlertOnArrival} label="Notificar al residente al registrar arribo del paquete" />
          <Toggle value={requireSignature} onChange={setRequireSignature} label="Requerir firma digital al recoger el paquete" />
        </div>
      </div>

      <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4">
        <span className="material-symbols-outlined text-slate-400 text-xl">info</span>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Estas reglas se aplican automáticamente al módulo de Paquetería. El agente escalará al administrador si un paquete supera el tiempo de retención.
        </p>
      </div>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Tab: Directorio de Proveedores ──────────────────────────────────────────

const TYPE_BADGE: Record<Vendor['type'], string> = {
  urgencias:    'bg-rose-50 text-rose-700 border-rose-100',
  mantenimiento: 'bg-amber-50 text-amber-700 border-amber-100',
  recurrente:   'bg-emerald-50 text-emerald-700 border-emerald-100',
}

const TYPE_LABEL: Record<Vendor['type'], string> = {
  urgencias:    'Urgencias',
  mantenimiento: 'Mantenimiento',
  recurrente:   'Recurrente',
}

const VENDOR_CATEGORY_ICONS: Record<VendorCategory, string> = {
  limpieza:     'delete_sweep',
  plomeria:     'plumbing',
  elevadores:   'elevator',
  electricidad: 'electrical_services',
  seguridad:    'shield',
  jardineria:   'yard',
  hvac:         'ac_unit',
  otro:         'handyman',
}

const EMPTY_VENDOR: Omit<Vendor, 'id'> = {
  service: '', name: '', category: 'otro', phone: '', email: '', schedule: '', type: 'mantenimiento', notes: '',
}

function DirectorioTab({
  vendors, dispatch, handleSave, saved, labelClass, inputClass,
}: {
  vendors: Vendor[]
  dispatch: React.Dispatch<any>
  handleSave: () => void
  saved: boolean
  labelClass: string
  inputClass: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(EMPTY_VENDOR)

  const handleAdd = () => {
    if (!form.service.trim() || !form.phone.trim()) return
    const newVendor: Vendor = { id: `v-${Date.now()}`, ...form }
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { vendors: [...vendors, newVendor] } })
    setForm(EMPTY_VENDOR)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    dispatch({ type: 'UPDATE_BUILDING_CONFIG', payload: { vendors: vendors.filter((v) => v.id !== id) } })
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-2 mb-2">
        <div className="col-span-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Servicio</div>
        <div className="col-span-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Empresa / Proveedor</div>
        <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Contacto</div>
        <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Horario</div>
        <div className="col-span-1 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Tipo</div>
        <div className="col-span-1" />
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {vendors.map((v) => (
          <div key={v.id} className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 px-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
            {/* Service */}
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px] text-slate-500">{VENDOR_CATEGORY_ICONS[v.category]}</span>
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight">{v.service}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{VENDOR_CATEGORY_LABELS[v.category]}</p>
              </div>
            </div>
            {/* Company */}
            <div className="col-span-3">
              <p className="text-[11px] font-bold text-slate-700">{v.name}</p>
              {v.email && <p className="text-[9px] text-slate-400 font-medium">{v.email}</p>}
            </div>
            {/* Phone */}
            <div className="col-span-2">
              <p className="text-[11px] font-bold text-slate-900 font-mono">{v.phone}</p>
            </div>
            {/* Schedule */}
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 font-medium">{v.schedule || '—'}</p>
            </div>
            {/* Type badge */}
            <div className="col-span-1">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${TYPE_BADGE[v.type]}`}>
                {TYPE_LABEL[v.type]}
              </span>
            </div>
            {/* Delete */}
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => handleDelete(v.id)}
                className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add vendor button */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all w-full justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Agregar Proveedor
        </button>
      ) : (
        <div className="space-y-4 p-6 bg-slate-50 border border-slate-200 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Nuevo Proveedor</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Servicio *</label>
              <input type="text" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Ej: Plomería (Urgencias)" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Empresa / Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fontanería Rápida 24h" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as VendorCategory })} className={inputClass}>
                {(Object.entries(VENDOR_CATEGORY_LABELS) as [VendorCategory, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Vendor['type'] })} className={inputClass}>
                <option value="urgencias">Urgencias (llamar inmediatamente)</option>
                <option value="mantenimiento">Mantenimiento (programado)</option>
                <option value="recurrente">Recurrente (visita fija)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Teléfono *</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="55 0000 0000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contacto@empresa.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Horario</label>
              <input type="text" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="L-V 8:00-17:00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notas</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas para el agente…" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAdd} className="h-11 px-6 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all">
              Agregar
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_VENDOR) }} className="h-11 px-5 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4">
        <span className="material-symbols-outlined text-slate-400 text-xl">smart_toy</span>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          El agente de resolución usa este directorio para contactar al proveedor adecuado al escalar un incidente. Los de tipo <strong className="text-slate-700">Urgencias</strong> serán contactados de inmediato.
        </p>
      </div>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Tab: Inventario ──────────────────────────────────────────────────────────

const INVENTORY_CATEGORY_ICONS: Record<InventoryCategory, string> = {
  Guardia: 'shield_person',
  Jardinero: 'yard',
  Limpieza: 'mop',
  'Administradora General': 'manage_accounts',
  Propiedad: 'corporate_fare',
}

const EMPTY_INVENTORY: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', 
  category: 'Propiedad', 
  ownerId: 'building',
  owner: 'Lote Alemania', 
  currentUserId: null,
  currentUser: '', 
  notes: '',
}

function InventarioTab({
  inventory, residents, staff, dispatch, handleSave, saved, labelClass, inputClass,
}: {
  inventory: InventoryItem[]
  residents: Resident[]
  staff: StaffMember[]
  dispatch: React.Dispatch<any>
  handleSave: () => void
  saved: boolean
  labelClass: string
  inputClass: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>(EMPTY_INVENTORY)

  const handleAdd = () => {
    if (!form.name.trim()) return
    const now = new Date().toISOString()
    
    // Auto-fill names if only IDs were selected (for robustness)
    let finalOwner = form.owner
    let finalUser = form.currentUser

    if (form.ownerId === 'building') finalOwner = 'Lote Alemania'
    else {
      const res = residents.find(r => r.id === form.ownerId)
      if (res) finalOwner = res.name
    }

    if (form.currentUserId) {
      const s = staff.find(st => st.id === form.currentUserId)
      if (s) finalUser = s.name
    }

    const payload = {
      ...form,
      owner: finalOwner,
      currentUser: finalUser || 'Sin asignar',
      createdAt: now,
      updatedAt: now
    }
    
    if (editingId) {
      dispatch({ type: 'UPDATE_INVENTORY', payload: { id: editingId, ...payload } })
    } else {
      dispatch({ type: 'ADD_INVENTORY', payload: { id: `inv-${Date.now()}`, ...payload } })
    }
    
    setForm(EMPTY_INVENTORY)
    setEditingId(null)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_INVENTORY', payload: id })
  }

  const handleEdit = (item: InventoryItem) => {
    setForm({
      name: item.name,
      category: item.category,
      ownerId: item.ownerId,
      owner: item.owner,
      currentUserId: item.currentUserId,
      currentUser: item.currentUser,
      notes: item.notes || '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-2 mb-2">
        <div className="col-span-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Artefacto / Equipo</div>
        <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Categoría</div>
        <div className="col-span-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Dueño (Owner)</div>
        <div className="col-span-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Quien lo usa</div>
        <div className="col-span-1" />
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {inventory.length === 0 && !showForm && (
          <div className="py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No hay elementos en el inventario</p>
          </div>
        )}
        {inventory.map((item) => (
          <div key={item.id} className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-4 px-4 hover:bg-white hover:shadow-xl hover:shadow-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-100 bg-white shadow-sm shadow-slate-50 mb-1">
            <div className="col-span-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-slate-400">{INVENTORY_CATEGORY_ICONS[item.category]}</span>
              </div>
              <div>
                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-tight">{item.name}</p>
                {item.notes && <p className="text-[9px] text-slate-400 font-medium line-clamp-1">{item.notes}</p>}
              </div>
            </div>
            
            <div className="col-span-2">
               <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded tracking-widest uppercase">
                  {item.category}
               </span>
            </div>

            <div className="col-span-2">
              <p className="text-[11px] font-bold text-slate-700">{item.owner}</p>
              <p className="text-[8px] text-slate-400 font-mono">{item.ownerId}</p>
            </div>

            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-tight">{item.currentUser}</p>
                  {item.currentUserId && <p className="text-[8px] text-slate-400 font-mono tracking-tighter">{item.currentUserId}</p>}
                </div>
              </div>
            </div>

            <div className="col-span-1 flex justify-end gap-1">
              <button onClick={() => handleEdit(item)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button 
                onClick={() => handleDelete(item.id)} 
                className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all w-full justify-center bg-slate-50/50"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          Agregar Item a Inventario
        </button>
      ) : (
        <div className="space-y-6 p-8 bg-white border border-slate-200 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
               {editingId ? 'Editar Item de Inventario' : 'Nuevo Registro de Inventario'}
            </h4>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_INVENTORY) }} className="text-slate-400 hover:text-slate-900">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Nombre del Artefacto / Equipo *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Camioneta de Mantenimiento, Aspiradora Industrial..." className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Categoría Responsable</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InventoryCategory })} className={inputClass}>
                 <option value="Propiedad">Propiedad (General)</option>
                 <option value="Guardia">Guardia / Seguridad</option>
                 <option value="Jardinero">Jardinero / Áreas Verdes</option>
                 <option value="Limpieza">Limpieza</option>
                 <option value="Administradora General">Administración</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Dueño (Owner) *</label>
              <select 
                value={form.ownerId} 
                onChange={(e) => {
                  const id = e.target.value
                  const res = residents.find(r => r.id === id)
                  setForm({ ...form, ownerId: id, owner: id === 'building' ? 'Lote Alemania' : (res?.name || '') })
                }} 
                className={inputClass}
              >
                <option value="building">Edificio (Lote Alemania)</option>
                <optgroup label="Residentes">
                  {residents.map(r => <option key={r.id} value={r.id}>{r.name} ({r.apartment})</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className={labelClass}>Quien lo usa (User) *</label>
              <select 
                value={form.currentUserId || ''} 
                onChange={(e) => {
                  const id = e.target.value
                  const s = staff.find(st => st.id === id)
                  setForm({ ...form, currentUserId: id || null, currentUser: s?.name || 'Bodega Central' })
                }} 
                className={inputClass}
              >
                <option value="">Bodega Central / Sin asignar</option>
                <optgroup label="Staff en Turno">
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} — {s.role}</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className={labelClass}>Notas o Ubicación</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ej: Pasillo C, requiere batería..." className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleAdd} className="h-12 px-8 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              {editingId ? 'Actualizar' : 'Registrar'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_INVENTORY) }} className="h-12 px-6 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="p-6 bg-slate-900 rounded-3xl flex items-start gap-5 shadow-xl shadow-slate-200">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
           <span className="material-symbols-outlined text-white text-xl">inventory_2</span>
        </div>
        <div className="space-y-1">
           <p className="text-[11px] text-white font-black uppercase tracking-widest">Control de Activos Fisicos</p>
           <p className="text-[11px] text-white/60 font-medium leading-relaxed">
             Este registro permite llevar el control de activos vinculados a roles de personal o a la propiedad. Útil para auditorías y traspaso de responsabilidades en cambios de turno.
           </p>
        </div>
      </div>

      <SaveFooter handleSave={handleSave} saved={saved} />
    </div>
  )
}

// ─── Main: LogisticaSettings ──────────────────────────────────────────────────

export default function LogisticaSettings({
  bc,
  inventory,
  residents,
  staff,
  dispatch,
  handleSave,
  saved,
  labelClass,
  inputClass,
}: {
  bc: BuildingConfig
  inventory: InventoryItem[]
  residents: Resident[]
  staff: StaffMember[]
  dispatch: React.Dispatch<any>
  handleSave: () => void
  saved: boolean
  labelClass: string
  inputClass: string
}) {
  const [activeTab, setActiveTab] = useState('paquetes')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Bar */}
      <div className="flex gap-1 mb-10 border-b border-slate-100 pb-0 overflow-x-auto overflow-y-hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px ${
              activeTab === t.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'paquetes'   && <PaquetesTab handleSave={handleSave} saved={saved} labelClass={labelClass} inputClass={inputClass} />}
      {activeTab === 'directorio' && (
        <DirectorioTab
          vendors={bc.vendors || []}
          dispatch={dispatch}
          handleSave={handleSave}
          saved={saved}
          labelClass={labelClass}
          inputClass={inputClass}
        />
      )}
      {activeTab === 'inventario' && (
        <InventarioTab 
          inventory={inventory} 
          residents={residents} 
          staff={staff}
          dispatch={dispatch}
          handleSave={handleSave}
          saved={saved}
          labelClass={labelClass}
          inputClass={inputClass}
        />
      )}
    </div>
  )
}
