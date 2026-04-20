/**
 * DashboardLayout — Main application shell with sidebar navigation.
 *
 * Provides the persistent UI frame (sidebar + top bar) for all
 * authenticated pages. Uses React Router's <Outlet> to render
 * child routes inside the main content area.
 *
 * Features:
 *   - Dynamic sidebar navigation filtered by user role
 *   - Conditional "Amenidades" nav item (hidden when no amenities exist)
 *   - Notification dropdown with deep-link navigation
 *   - Profile menu with logout
 *   - Dynamic building name/address from store
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

/** Settings-specific navigation items */
const settingsNavItems = [
  { id: 'general', label: 'General', icon: 'settings', description: 'Perfil y edificio' },
  { id: 'architecture', label: 'Arquitectura', icon: 'domain', description: 'Torres y secciones' },
  { id: 'finance', label: 'Reglas de Pago', icon: 'payments', description: 'Conceptos y egresos' },
  { id: 'amenities', label: 'Amenidades', icon: 'outdoor_grill', description: 'Espacios comunes' },
  { id: 'modules', label: 'Módulos', icon: 'extension', description: 'Apps integradas' },
  { id: 'system', label: 'Sistema', icon: 'data_usage', description: 'Reset y seguridad' },
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

  // Filter nav items by role and amenity availability
  const navItems = useMemo(() =>
    baseNavItems.filter(item => {
      if (!item.roles.includes(role)) return false
      if ((item as any).requiresAmenities && !hasAmenities) return false
      return true
    }),
  [role, hasAmenities])

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Filter notifications for the current user
  const myNotifs = state.notificaciones.filter(n => 
    role === 'admin' ? n.userId === 'admin' : n.userId === user
  )

  /** Marks a notification as read and navigates to its deep-link target */
  const handleNotifClick = (n: typeof myNotifs[0]) => {
    if (!n.read) {
      dispatch({ type: 'MARK_NOTIFICACION_READ', payload: n.id })
    }
    if (n.actionLink) {
      setShowNotif(false)
      navigate(n.actionLink)
    }
  }

  return (
    <div className="bg-[#F8FAFC] text-on-surface flex min-h-screen">
      {/* ── Sidebar Navigation ── */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col border-r border-slate-200 bg-white z-50 transition-all duration-300">
        
        {/* Dynamic Header: Building info or "Configuración" title */}
        {!isConfigRoute ? (
          <Link to={homePath} className="p-8 block hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{bc.buildingName}</h1>
            <p className="text-[10px] font-bold font-label tracking-widest text-slate-400 mt-1 uppercase">{bc.buildingAddress}</p>
          </Link>
        ) : (
          <div className="p-8">
            <button 
              onClick={() => navigate(homePath)} 
              className="group flex items-center gap-2 mb-4 text-emerald-600 font-bold text-[10px] uppercase tracking-widest hover:text-emerald-700 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Volver al Panel
            </button>
            <h1 className="text-xl font-headline font-black tracking-tight text-slate-900">Preferencias</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración del Edificio</p>
          </div>
        )}
        
        {/* Navigation links: App Modules or Settings Categories */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {!isConfigRoute ? (
            // STANDARD MODULE NAVIGATION
            navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.label === 'Inicio' || item.label === 'Panel Admin'}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 group ${
                    isActive 
                      ? 'text-emerald-700 font-semibold bg-emerald-50 border-l-4 border-emerald-600' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`
                }
              >
                <span className="material-symbols-outlined mr-3 text-xl">{item.icon}</span>
                <span className="font-label text-sm font-medium">{item.label}</span>
              </NavLink>
            ))
          ) : (
            // SETTINGS / CONFIGURATION NAVIGATION
            <div className="space-y-1 mt-2">
              {settingsNavItems.map((item) => {
                const searchParams = new URLSearchParams(location.search)
                const activeTab = searchParams.get('tab') || 'general'
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/configuracion?tab=${item.id}`)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-left group ${
                      isActive 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                        : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'
                    }`}
                  >
                    <span className={`material-symbols-outlined mr-3 text-xl ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>{item.label}</p>
                      <p className={`text-[9px] font-bold mt-1 uppercase tracking-tighter truncate ${isActive ? 'text-white/60' : 'text-slate-400'}`}>{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </nav>

        {/* Bottom utility links */}
        <div className="mt-auto p-4 border-t border-slate-100">
          {!isConfigRoute ? (
            <>
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 mb-4 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm ring-2 ring-white">
                  {user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                    {role === 'admin' ? 'Administrador' : apartment}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  to={role === 'admin' ? '/configuracion' : '/mi-configuracion'}
                  className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-lg mr-3">settings</span> Configuración
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2 text-slate-500 hover:text-rose-600 text-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-lg mr-3">logout</span> Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-rose-600 font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              <span className="material-symbols-outlined text-lg mr-3">logout</span>
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="ml-64 w-full min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="flex justify-between items-center px-10 h-20 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div />
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest ${
                role === 'admin'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {role === 'admin' ? 'shield_person' : 'person'}
              </span>
              <span>{role === 'admin' ? 'Administrador' : 'Residente'}</span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
                {myNotifs.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notificaciones</p>
                    <button onClick={() => setShowNotif(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {myNotifs.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-4 font-medium">Sin novedades</p>
                    ) : (
                      myNotifs.map(n => (
                        <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-4 rounded-xl border transition-all cursor-pointer ${n.read ? 'bg-slate-50 border-slate-100' : 'bg-emerald-50 border-emerald-200'}`}>
                          <p className="text-xs font-bold text-slate-900 leading-tight">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-2 pb-3 mb-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{user}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{role}</p>
                  </div>
                  <button onClick={logout} className="flex items-center w-full px-2 py-2 text-sm text-slate-500 hover:text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-all">
                    <span className="material-symbols-outlined text-lg mr-2">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Routed page content */}
        <div className="p-10 max-w-full mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
