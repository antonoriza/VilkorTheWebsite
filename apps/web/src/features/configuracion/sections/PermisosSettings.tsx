import { useState, useMemo } from 'react'
import { Resident, StaffMember, BuildingConfig, UserGroup, Resource, PermissionAction } from '../../../types'
import { useStore } from '../../../core/store/store'
import { useAuth } from '../../../core/auth/AuthContext'
import ConfirmDialog from '../../../core/components/ConfirmDialog'

// ─── Types & Shared ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'acceso', label: 'Control de Acceso', icon: 'admin_panel_settings' },
  { id: 'roles',  label: 'Roles y Permisos',  icon: 'rule_settings' },
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

// ─── Tab: Control de Acceso ──────────────────────────────────────────────────

function ControlAccesoTab({
  people, search, setSearch, labelClass, inputClass
}: {
  people: UnifiedPerson[]
  search: string
  setSearch: (v: string) => void
  labelClass: string
  inputClass: string
}) {
  const { role } = useAuth()
  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = people.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subtext.toLowerCase().includes(search.toLowerCase())
    )
    if (role === 'operador') list = list.filter(p => p.type !== 'Residente')
    return list
  }, [people, search, role])

  const handleBlock = () => {
    console.log('[ACCESO] Bloqueando acceso para:', confirmBlockId)
    setConfirmBlockId(null)
  }

  const activeCount = filtered.length
  const blockedCount = 0 // placeholder for future status field

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Summary bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <span className="material-symbols-outlined">shield</span>
          </div>
          <div>
            <p className="text-2xl font-headline font-black text-emerald-700">{activeCount}</p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Acceso Activo</p>
          </div>
        </div>
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm">
            <span className="material-symbols-outlined">block</span>
          </div>
          <div>
            <p className="text-2xl font-headline font-black text-rose-700">{blockedCount}</p>
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Bloqueados</p>
          </div>
        </div>
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <p className="text-2xl font-headline font-black text-slate-700">{people.length}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Registrados</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
        <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
        <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
          Gestiona el acceso de cada persona al sistema. Bloquear a un usuario revoca inmediatamente
          sus llaves digitales y detiene sus procesos operativos. Para gestión de perfiles, usa <strong>Usuarios</strong> en el menú principal.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar persona..."
          className={`${inputClass} pl-12 pr-10`}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[18px]">cancel</span>
          </button>
        )}
      </div>

      {/* Access list */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Persona</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border bg-slate-50 border-slate-100`}>
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-lg text-slate-300">
                          {p.type === 'Residente' ? 'person' : p.type === 'Administrador' ? 'verified_user' : 'engineering'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.subtext}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${ROLE_COLOR[p.type]}`}>
                    {p.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Activo</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setConfirmBlockId(p.id)}
                    className="px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl border border-rose-200 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-all"
                  >
                    Bloquear
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-slate-200 text-4xl block mb-2">person_search</span>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sin resultados</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
  const [activeTab, setActiveTab] = useState('acceso')
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

      {activeTab === 'acceso' && (
        <ControlAccesoTab 
          people={unifiedDirectory} 
          search={search} 
          setSearch={setSearch} 
          labelClass={labelClass} 
          inputClass={inputClass}
        />
      )}
      {activeTab === 'roles' && <RolesMatrixTab bc={bc} />}
    </div>
  )
}
