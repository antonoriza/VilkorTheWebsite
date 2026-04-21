/**
 * DashboardLayout — Main application shell with sidebar navigation.
 */
import { Outlet, NavLink, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import { useStore } from '../core/store/store'
import { useState, useMemo } from 'react'

/** Navigation item definition with role-based filtering */
const baseNavItems = [
  { to: '/dashboard', icon: 'home', label: 'Inicio', roles: ['resident'] },
  { to: '/admin', icon: 'dashboard', label: 'Panel Admin', roles: ['admin'] },
  { to: '/avisos', icon: 'notifications', label: 'Avisos', roles: ['resident', 'admin'] },
  { to: '/pagos', icon: 'account_balance', label: 'Finanzas', roles: ['resident', 'admin'] },
  { to: '/paqueteria', icon: 'package_2', label: 'Paquetería', roles: ['resident', 'admin'] },
  { to: '/amenidades', icon: 'outdoor_grill', label: 'Amenidades', roles: ['resident', 'admin'], requiresAmenities: true },
  { to: '/votaciones', icon: 'how_to_vote', label: 'Votaciones', roles: ['resident', 'admin'] },
  { to: '/tickets', icon: 'confirmation_number', label: 'Tickets', roles: ['resident', 'admin'] },
  { to: '/usuarios', icon: 'group', label: 'Usuarios', roles: ['admin'] },
]

/** Hierarchical Settings Navigation Groups */
const settingsGroups = [
  {
    title: 'Entidad e Infraestructura',
    items: [
      { id: 'perfil', label: 'Perfil del Inmueble', icon: 'branding_watermark', desc: 'Identidad legal y Digital Twin' },
    ]
  },
  {
    title: 'Gobernanza Operativa',
    items: [
      { id: 'finanzas', label: 'Contabilidad y Finanzas', icon: 'payments', desc: 'Reglas de cobro y recargos' },
      { id: 'comunicacion', label: 'Avisos/Notificaciones', icon: 'campaign', desc: 'Avisos y votaciones' },
      { id: 'servicios', label: 'Logística', icon: 'confirmation_number', desc: 'SLA y procesos' },
    ]
  },
  {
    title: 'Seguridad y Acceso',
    items: [
      { id: 'permisos', label: 'Directorio y Permisos', icon: 'shield_person', desc: 'Roles y niveles de acceso' },
    ]
  },
  {
    title: 'Gestión de Datos',
    items: [
      { id: 'auditoria', label: 'Auditoría y Trazabilidad', icon: 'history_edu', desc: 'Logs de actividad' },
      { id: 'resiliencia', label: 'Resiliencia del Sistema', icon: 'data_usage', desc: 'Backups y reset' },
    ]
  }
]

export default function DashboardLayout() {
  const { user, apartment, role, isAuthenticated, logout } = useAuth()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const isConfigRoute = location.pathname === '/configuracion'
  const bc = state.buildingConfig
  const hasAmenities = state.amenities.length > 0
  const homePath = role === 'admin' ? '/admin' : '/dashboard'

  const navItems = useMemo(() =>
    baseNavItems.filter(item => {
      if (!item.roles.includes(role)) return false
      if ((item as any).requiresAmenities && !hasAmenities) return false
      return true
    }),
  [role, hasAmenities])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const myNotifs = state.notificaciones.filter(n => 
    role === 'admin' ? n.userId === 'admin' : n.userId === user
  )

  const handleNotifClick = (n: typeof myNotifs[0]) => {
    if (!n.read) dispatch({ type: 'MARK_NOTIFICACION_READ', payload: n.id })
    if (n.actionLink) {
      setShowNotif(false)
      navigate(n.actionLink)
    }
  }

  return (
    <div className="bg-[#F8FAFC] text-on-surface flex min-h-screen font-body">
      {/* ── Sidebar Navigation ── */}
      <aside className="h-screen w-72 fixed left-0 top-0 flex flex-col border-r border-slate-200 bg-white z-50 transition-all duration-300">
        
        {!isConfigRoute ? (
          <Link to={homePath} className="p-8 block hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-headline font-black tracking-tight text-slate-900 leading-tight">{bc.buildingName}</h1>
            <p className="text-[10px] font-bold font-label tracking-widest text-slate-400 mt-1 uppercase">{bc.buildingAddress}</p>
          </Link>
        ) : (
          <div className="p-8 pb-4">
            <button 
              onClick={() => navigate(homePath)} 
              className="group flex items-center gap-2 mb-4 text-emerald-600 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-700 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Volver al Panel
            </button>
            <h1 className="text-xl font-headline font-black tracking-tight text-slate-900">Configuración</h1>
          </div>
        )}
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-6 pt-2">
          {!isConfigRoute ? (
            navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.label === 'Inicio' || item.label === 'Panel Admin'}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'text-emerald-700 font-bold bg-emerald-50 shadow-sm shadow-emerald-100/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-xl">{item.icon}</span>
                <span className="font-label text-sm">{item.label}</span>
              </NavLink>
            ))
          ) : (
            <div className="space-y-1">
              {settingsGroups.flatMap((group) => (
                group.items.map((item) => {
                  const searchParams = new URLSearchParams(location.search)
                  const activeTab = searchParams.get('tab') || 'perfil'
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/configuracion?tab=${item.id}`)}
                      className={`w-full flex items-center px-4 py-3.5 rounded-2xl transition-all text-left group ${
                        isActive 
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                          : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                      }`}
                    >
                      <span className={`material-symbols-outlined mr-3 text-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</span>
                      <p className={`text-[11px] font-bold uppercase tracking-widest leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>{item.label}</p>
                    </button>
                  )
                })
              ))}
            </div>
          )}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
          {!isConfigRoute ? (
            <>
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                  {user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black opacity-60">
                    {role === 'admin' ? 'Administrador' : apartment}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  to={role === 'admin' ? '/configuracion' : '/mi-configuracion'}
                  className="flex items-center px-4 py-2.5 text-slate-500 hover:text-slate-900 text-[13px] font-bold transition-all rounded-xl hover:bg-slate-100/50"
                >
                  <span className="material-symbols-outlined text-lg mr-3">settings</span> Configuración
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2.5 text-slate-500 hover:text-rose-600 text-[13px] font-bold rounded-xl hover:bg-rose-50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg mr-3">logout</span> Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-4 text-slate-400 hover:text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-slate-50/50 rounded-2xl hover:bg-rose-50"
            >
              <span className="material-symbols-outlined text-lg mr-3">logout</span>
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="ml-72 w-full min-h-screen flex flex-col">
        <header className="flex justify-between items-center px-10 h-20 sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
          <div />
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                role === 'admin' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">{role === 'admin' ? 'shield_person' : 'person'}</span>
              <span>{role === 'admin' ? 'Administrador' : 'Residente'}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <span className="material-symbols-outlined">notifications</span>
                {myNotifs.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl shadow-slate-300 border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alertas</p>
                    <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><span className="material-symbols-outlined text-lg">close</span></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                    {myNotifs.length === 0 ? (
                      <p className="text-center text-[11px] text-slate-400 py-6 font-bold uppercase tracking-widest">Sin novedades</p>
                    ) : (
                      myNotifs.map(n => (
                        <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.read ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50/30 border-emerald-100'}`}>
                          <p className="text-[11px] font-black text-slate-900 leading-tight uppercase tracking-tight">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-2 font-medium">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl shadow-slate-300 border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="pb-4 mb-4 border-b border-slate-100">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{user}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">{role}</p>
                  </div>
                  <button onClick={logout} className="flex items-center w-full px-4 py-3 text-[11px] text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest rounded-2xl transition-all">
                    <span className="material-symbols-outlined text-lg mr-3">logout</span>
                    Finalizar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-10 max-w-full mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
