import { useState, useMemo } from 'react'
import { Resident, StaffMember, BuildingConfig, UserGroup, Resource, PermissionAction } from '../../../core/store/seed'
import { useStore } from '../../../core/store/store'
import { useAuth } from '../../../core/auth/AuthContext'
import Modal from '../../../core/components/Modal'
import ConfirmDialog from '../../../core/components/ConfirmDialog'

// ─── Types & Shared ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'directorio', label: 'Directorio General', icon: 'groups' },
  { id: 'roles',      label: 'Roles y Permisos',    icon: 'rule_settings' },
]

interface UnifiedPerson {
  id: string
  name: string
  role: string
  subtext: string
  type: 'Residente' | 'Staff' | 'Administrador'
  email?: string
  photo?: string
}

const ROLE_COLOR: Record<UnifiedPerson['type'], string> = {
  Residente: 'bg-blue-50 text-blue-700 border-blue-100',
  Staff: 'bg-slate-50 text-slate-700 border-slate-100',
  Administrador: 'bg-emerald-50 text-emerald-700 border-emerald-100',
}

// ─── Tab: Directorio General ────────────────────────────────────────────────

function DirectorioTab({
  people, search, setSearch, labelClass, inputClass, inventory
}: {
  people: UnifiedPerson[]
  search: string
  setSearch: (v: string) => void
  labelClass: string
  inputClass: string
  inventory: any[]
}) {
  const { role } = useAuth()
  
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<UnifiedPerson | null>(null)
  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = people.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subtext.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase())
    )

    // PRIVACY RULE: Operators only see Staff/Admins
    if (role === 'operador') {
      list = list.filter(p => p.type !== 'Residente')
    }

    return list
  }, [people, search, role])

  const selectedPerson = useMemo(() => 
    people.find(p => p.id === selectedPersonId), 
    [people, selectedPersonId]
  )

  const assignedAssets = useMemo(() => 
    inventory.filter(i => i.currentUserId === selectedPersonId || i.ownerId === selectedPersonId),
    [inventory, selectedPersonId]
  )

  const handleBlock = () => {
    console.log('[PERMISOS] Bloqueando acceso para:', confirmBlockId)
    setConfirmBlockId(null)
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="w-full md:max-w-md">
          <label className={labelClass}>
            {role === 'operador' ? 'Buscar Compañeros de Staff' : 'Buscar en el Directorio'}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, departamento o puesto..." 
              className={`${inputClass} pl-12 pr-10`} 
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3">
          Mostrando {filtered.length} de {people.length} registros
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* List of People */}
        <div className="lg:col-span-7 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
              <span className="material-symbols-outlined text-slate-200 text-5xl mb-4">person_search</span>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No hay resultados o acceso restringido</p>
            </div>
          ) : (
            filtered.map((p) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPersonId(p.id)}
                className={`group flex items-center gap-4 p-4 border rounded-3xl transition-all cursor-pointer ${
                  selectedPersonId === p.id 
                    ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-200 text-white' 
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-900'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border ${selectedPersonId === p.id ? 'border-white/20 bg-white/10' : 'bg-slate-50 border-slate-100'}`}>
                  {p.photo ? (
                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`material-symbols-outlined text-2xl ${selectedPersonId === p.id ? 'text-white/40' : 'text-slate-300'}`}>
                      {p.type === 'Residente' ? 'person' : (p.type === 'Administrador' ? 'verified_user' : 'engineering')}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-[12px] font-black uppercase tracking-tight truncate ${selectedPersonId === p.id ? 'text-white' : 'text-slate-900'}`}>{p.name}</p>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${selectedPersonId === p.id ? 'bg-white/10 border-white/20 text-white' : ROLE_COLOR[p.type]}`}>
                      {p.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${selectedPersonId === p.id ? 'text-white/50' : 'text-slate-400'}`}>
                      <span className="material-symbols-outlined text-[12px]">{p.type === 'Residente' ? 'home' : 'badge'}</span>
                      {p.subtext}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                   <button 
                    onClick={(e) => { e.stopPropagation(); setEditingPerson(p) }} 
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${selectedPersonId === p.id ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                   >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmBlockId(p.id) }} 
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${selectedPersonId === p.id ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/40' : 'bg-rose-50 text-rose-400 hover:text-rose-600'}`}
                   >
                      <span className="material-symbols-outlined text-[18px]">block</span>
                   </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Person Details & Assets */}
        <div className="lg:col-span-5 space-y-6">
          {selectedPerson ? (
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] sticky top-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
               <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-white shadow-xl overflow-hidden">
                    {selectedPerson.photo ? (
                      <img src={selectedPerson.photo} alt={selectedPerson.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                        <span className="material-symbols-outlined text-4xl">
                          {selectedPerson.type === 'Residente' ? 'person' : 'engineering'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xl font-headline font-black text-slate-900 tracking-tight">{selectedPerson.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedPerson.subtext}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">inventory_2</span>
                       Activos Asignados
                    </p>
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-lg">{assignedAssets.length}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {assignedAssets.length === 0 ? (
                      <p className="text-[11px] text-slate-400 font-medium italic text-center py-4 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                        No hay artefactos vinculados a esta persona
                      </p>
                    ) : (
                      assignedAssets.map(asset => (
                        <div key={asset.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-sm">construction</span>
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-slate-900 leading-none">{asset.name}</p>
                                 <p className="text-[9px] text-slate-400 font-medium mt-1">{asset.category}</p>
                              </div>
                           </div>
                           <span className="material-symbols-outlined text-slate-200 text-sm">arrow_forward_ios</span>
                        </div>
                      ))
                    )}
                  </div>
               </div>

               <div className="pt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setEditingPerson(selectedPerson)} className="py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                    Editar Perfil
                  </button>
                  <button className="py-3 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">
                    Ver Historial
                  </button>
               </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2.5rem]">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">touch_app</span>
               </div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selecciona una persona para ver detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals for Functional Actions */}
      <Modal 
        open={!!editingPerson} 
        onClose={() => setEditingPerson(null)} 
        title={`Editar Perfil: ${editingPerson?.name}`}
      >
        <div className="p-8 space-y-6">
           <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-3xl">
              <span className="material-symbols-outlined text-amber-600">report_problem</span>
              <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                Estás editando un perfil maestro. Los cambios afectarán el acceso del usuario y el historial vinculado a sus activos.
              </p>
           </div>
           
           <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre Completo</label>
                <input type="text" defaultValue={editingPerson?.name} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className={labelClass}>Identificador (ID/Depto)</label>
                   <input type="text" defaultValue={editingPerson?.subtext} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Tipo de Usuario</label>
                   <select defaultValue={editingPerson?.type} className={inputClass}>
                      <option value="Administrador">Administrador</option>
                      <option value="Staff">Operador (Staff)</option>
                      <option value="Residente">Residente</option>
                   </select>
                </div>
              </div>
           </div>

           <div className="pt-4 flex gap-3">
              <button 
                onClick={() => setEditingPerson(null)}
                className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={() => setEditingPerson(null)}
                className="px-6 py-4 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl"
              >
                Cancelar
              </button>
           </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmBlockId}
        onClose={() => setConfirmBlockId(null)}
        onConfirm={handleBlock}
        title="Bloquear Acceso"
        confirmLabel="Bloquear Permanente"
        variant="danger"
      >
        ¿Estás seguro de que deseas revocar el acceso a este usuario? Esto invalidará todas sus llaves digitales y detendrá sus procesos operativos.
      </ConfirmDialog>
    </div>
  )
}

// ─── Tab: Roles y Permisos (ThingWorx Style Matrix) ──────────────────────────

const GROUPS: { id: UserGroup; label: string; icon: string; color: string }[] = [
  { id: 'super_admin',    label: 'Super Admin',  icon: 'shield_person',     color: 'text-emerald-500' },
  { id: 'administracion', label: 'Admin (Staff)', icon: 'manage_accounts',   color: 'text-slate-500' },
  { id: 'operador',       label: 'Operador',     icon: 'security',          color: 'text-blue-500' },
  { id: 'residente',      label: 'Residente',    icon: 'person',            color: 'text-indigo-500' },
]

const RESOURCES: { id: Resource; label: string; icon: string; actions: PermissionAction[] }[] = [
  { id: 'finanzas',      label: 'Finanzas e Ingresos', icon: 'payments',      actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'logistica',     label: 'Logística y Activos', icon: 'inventory_2',   actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'comunicacion',  label: 'Avisos y Noticias',   icon: 'campaign',     actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'gobernanza',    label: 'Gobernanza (Votos)',  icon: 'how_to_vote',  actions: ['ver', 'crear', 'votar', 'eliminar'] },
  { id: 'directorio',    label: 'Directorio y Gente',  icon: 'groups',       actions: ['ver', 'crear', 'editar', 'eliminar'] },
  { id: 'configuracion', label: 'Configuración Propie.', icon: 'settings',     actions: ['ver', 'editar'] },
]

function RolesMatrixTab({ bc }: { bc: BuildingConfig }) {
  const { dispatch } = useStore()
  const matrix = bc.permissionsMatrix || {}

  const togglePermission = (resource: string, action: string, groupId: UserGroup) => {
    const current = matrix[resource]?.[action] || []
    const nextGroups = current.includes(groupId)
      ? current.filter(g => g !== groupId)
      : [...current, groupId]
    
    dispatch({
      type: 'UPDATE_PERMISSIONS_MATRIX',
      payload: { resource, action, groups: nextGroups }
    })
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      {/* Header / Intro */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="max-w-xl space-y-2">
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Matriz de Acceso de la Propiedad</h3>
          <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
            Configura qué áreas y acciones puede realizar cada grupo de usuarios. Este modelo de control de acceso granular asegura la integridad operativa del inmueble.
          </p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-500">lock_open</span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Cambios se guardan en tiempo real</span>
        </div>
      </div>

      {/* The Matrix Grid */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 divide-x divide-slate-100">
          <div className="col-span-4 p-5 flex flex-col gap-1">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recurso / Acción</span>
          </div>
          {GROUPS.map(g => (
            <div key={g.id} className="col-span-2 p-5 flex flex-col items-center justify-center gap-2 bg-white">
              <div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center ${g.color}`}>
                <span className="material-symbols-outlined text-lg">{g.icon}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 text-center leading-tight">{g.label}</span>
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {RESOURCES.map(res => (
            <div key={res.id} className="divide-y divide-slate-50">
              {res.actions.map((action, idx) => (
                <div key={`${res.id}-${action}`} className="grid grid-cols-12 hover:bg-slate-50/50 transition-colors divide-x divide-slate-50">
                  {/* Label Column */}
                  <div className="col-span-4 p-4 pl-6 flex items-center gap-4">
                    {idx === 0 ? (
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">{res.icon}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 shrink-0" />
                    )}
                    <div>
                      {idx === 0 && <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{res.label}</p>}
                      <div className="flex items-center gap-2 opacity-60">
                        <span className="material-symbols-outlined text-[14px] text-slate-500">
                          {action === 'ver' ? 'visibility' : action === 'crear' ? 'add_circle' : action === 'votar' ? 'how_to_vote' : 'edit'}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action}</p>
                      </div>
                    </div>
                  </div>

                  {/* Permission Toggles */}
                  {GROUPS.map(group => {
                    const isSuperAdmin = group.id === 'super_admin'
                    const isEnabled = matrix[res.id]?.[action]?.includes(group.id) || false
                    
                    return (
                      <div key={group.id} className="col-span-2 flex items-center justify-center p-4">
                        <button
                          disabled={isSuperAdmin}
                          onClick={() => togglePermission(res.id, action, group.id)}
                          className={`
                            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2
                            ${isEnabled ? 'bg-slate-900' : 'bg-slate-200'}
                            ${isSuperAdmin ? 'opacity-40 cursor-not-allowed' : ''}
                          `}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                              ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Safety Alert */}
      <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
           <span className="material-symbols-outlined text-amber-500 text-3xl">verified_user</span>
        </div>
        <div className="space-y-1">
           <p className="text-[13px] text-amber-900 font-black uppercase tracking-widest">Seguridad de Infraestructura</p>
           <p className="text-[12px] text-amber-800/80 font-medium leading-relaxed">
             Los permisos del **Super Admin** son inmutables para evitar bloqueos del sistema. Cualquier modificación en la matriz afecta instantáneamente la visibilidad de los módulos en el menú lateral de los usuarios.
           </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PermisosSettings({
  bc,
  residents,
  staff,
  labelClass,
  inputClass,
}: {
  bc: BuildingConfig
  residents: Resident[]
  staff: StaffMember[]
  labelClass: string
  inputClass: string
}) {
  const { state } = useStore()
  const [activeTab, setActiveTab] = useState('directorio')
  const [search, setSearch] = useState('')

  // Build unified directory with memoization
  const unifiedDirectory: UnifiedPerson[] = useMemo(() => [
    // 1. Dynamic Super-Admin from BuildingConfig
    { 
      id: 'admin-0', 
      name: bc.adminName || 'Administrador Principal', 
      role: 'Super Administrador', 
      subtext: 'Responsable de la Propiedad', 
      type: 'Administrador',
      email: bc.adminEmail || 'admin@propiedad.com'
    },
    // 2. Map Staff with Intelligent Role Detection
    ...staff.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role,
      subtext: `Turno: ${s.shiftStart} - ${s.shiftEnd}`,
      type: (s.role === 'Administradora General' ? 'Administrador' : 'Staff') as any,
      photo: s.photo
    })),
    // 3. Map Residents
    ...residents.map(r => ({
      id: r.id,
      name: r.name,
      role: 'Residente',
      subtext: `${r.tower ? `${r.tower}-` : ''}${r.apartment}`,
      type: 'Residente' as const,
      email: r.email
    }))
  ], [residents, staff, bc.adminName, bc.adminEmail])

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

      {activeTab === 'directorio' && (
        <DirectorioTab 
          people={unifiedDirectory} 
          search={search} 
          setSearch={setSearch} 
          labelClass={labelClass} 
          inputClass={inputClass}
          inventory={state.inventory || []}
        />
      )}
      {activeTab === 'roles' && <RolesMatrixTab bc={bc} />}
    </div>
  )
}
