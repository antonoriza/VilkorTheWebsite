/**
 * DashboardLayout — Main application shell with sidebar navigation.
 */
import { Outlet, NavLink, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import { useStore } from '../core/store/store'
import { useState, useMemo } from 'react'
import DemoBanner from '../core/components/DemoBanner'
import { useDemoMode } from '../core/hooks/useDemoMode'

import { hasPermission } from '../core/store/store'

/** Navigation item definition with role-based filtering */
const baseNavItems = [
  { to: '/dashboard', icon: 'home', label: 'Inicio', groups: ['residente'] },
  { to: '/admin', icon: 'dashboard', label: 'Panel de Administración', groups: ['super_admin', 'administracion', 'operador'] },
  { to: '/avisos', icon: 'notifications', label: 'Avisos', resource: 'comunicacion', action: 'ver' },
  { to: '/pagos', icon: 'account_balance', label: 'Finanzas', resource: 'finanzas', action: 'ver' },
  { to: '/paqueteria', icon: 'package_2', label: 'Paquetería', resource: 'comunicacion', action: 'ver' },
  { to: '/amenidades', icon: 'outdoor_grill', label: 'Amenidades', resource: 'gobernanza', action: 'ver', requiresAmenities: true },
  { to: '/votaciones', icon: 'how_to_vote', label: 'Votaciones', resource: 'comunicacion', action: 'ver' },
  { to: '/tickets', icon: 'confirmation_number', label: 'Tickets', resource: 'logistica', action: 'ver' },
  { to: '/usuarios', icon: 'group', label: 'Usuarios', resource: 'directorio', action: 'ver' },
]

/** Flat Settings Navigation Items with Permission Mapping */
const settingsItems = [
  { id: 'perfil', label: 'Perfil del Inmueble', icon: 'branding_watermark', desc: 'Identidad legal y Digital Twin', resource: 'configuracion' },
  { id: 'finanzas', label: 'Contabilidad y Finanzas', icon: 'payments', desc: 'Reglas de cobro y recargos', resource: 'finanzas' },
  { id: 'comunicacion', label: 'Avisos/Notificaciones', icon: 'campaign', desc: 'Avisos y votaciones', resource: 'comunicacion' },
  { id: 'servicios', label: 'Logística e Inventario', icon: 'confirmation_number', desc: 'SLA y procesos', resource: 'logistica' },
  { id: 'permisos', label: 'Directorio y Permisos', icon: 'shield_person', desc: 'Roles y niveles de acceso', resource: 'directorio' },
  { id: 'auditoria', label: 'Auditoría y Trazabilidad', icon: 'history_edu', desc: 'Logs de actividad', resource: 'auditoria' },
  { id: 'resiliencia', label: 'Resiliencia del Sistema', icon: 'data_usage', desc: 'Backups y reset', resource: 'configuracion' },
]

export default function DashboardLayout() {
  const { user, apartment, role, isAuthenticated, logout } = useAuth()
  const isDemo = useDemoMode()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const isConfigRoute = location.pathname === '/configuracion'
  const bc = state.buildingConfig
  const hasAmenities = state.amenities.length > 0
  const homePath = (role === 'super_admin' || role === 'administracion' || role === 'operador') ? '/admin' : '/dashboard'

  // Dynamic nav filtering based on Permissions Matrix
  const navItems = useMemo(() =>
    baseNavItems.filter(item => {
      // 1. Basic role grouping (for Home/Admin split)
      if (item.groups && !item.groups.includes(role)) return false
      
      // 2. Resource-based permissions
      if (item.resource) {
        if (!hasPermission(state, item.resource as any, item.action || 'ver', role as any)) return false
      }
      
      // 3. Conditional features
      if (item.requiresAmenities && !hasAmenities) return false
      
      return true
    }),
  [role, hasAmenities, state])

  // Filter settings tabs based on permissions
  const filteredSettings = useMemo(() => 
    settingsItems.filter(item => {
      // Perfil is visible to anyone in config if they can "ver" configuracion
      if (item.id === 'perfil') return hasPermission(state, 'configuracion', 'ver', role as any)
      
      // Resource based filtering
      return hasPermission(state, item.resource as any, 'ver', role as any)
    }),
  [role, state])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const myNotifs = state.notificaciones.filter(n => 
    (role === 'super_admin' || role === 'administracion') ? n.userId === 'admin' : n.userId === user
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
      {/* ── Demo Environment Banner ── */}
      <DemoBanner />

      {/* ── Sidebar Navigation ── */}
      <aside
        className="h-screen w-72 fixed left-0 flex flex-col border-r border-slate-200 bg-white z-50 transition-all duration-300"
        style={{ top: isDemo ? '2rem' : '0' }}
      >
        
        {!isConfigRoute ? (
          <div>
            <Link to={homePath} className="px-8 pt-8 pb-3 block hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-headline font-black tracking-tight text-slate-900 leading-tight">{bc.buildingName}</h1>
              <p className="text-[10px] font-bold font-label tracking-widest text-slate-400 mt-1 uppercase">{bc.buildingAddress}</p>
            </Link>
            {/* Demo sidebar badge */}
            {isDemo && (
              <div className="px-8 pb-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-black uppercase tracking-[0.2em] rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Demo
                </span>
              </div>
            )}
          </div>
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
                end={item.label === 'Inicio' || item.label === 'Panel de Administración'}
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
              {filteredSettings.map((item) => {
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
              })}
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
                    {(role === 'super_admin' || role === 'administracion' || role === 'operador') ? role.replace('_', ' ').toUpperCase() : apartment}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  to={(role === 'super_admin' || role === 'administracion') ? '/configuracion' : '/mi-configuracion'}
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
      <main
        className="ml-72 w-full min-h-screen flex flex-col"
        style={{ paddingTop: isDemo ? '2rem' : '0' }}
      >
        <header className="flex justify-between items-center px-6 h-14 sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
          <div />
          <div className="flex items-center space-x-2">
            {/* Subtle Role Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                (role === 'super_admin' || role === 'administracion' || role === 'operador') 
                  ? 'bg-rose-50/50 border-rose-100 text-rose-600' 
                  : 'bg-emerald-50/50 border-emerald-100 text-emerald-600'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${(role === 'super_admin' || role === 'administracion' || role === 'operador') ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span>{(role === 'super_admin' || role === 'administracion' || role === 'operador') ? role.replace('_', ' ') : 'Residente'}</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1" />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {myNotifs.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white animate-pulse"></span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notificaciones</p>
                    <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><span className="material-symbols-outlined text-base">close</span></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                    {myNotifs.length === 0 ? (
                      <p className="text-center text-[10px] text-slate-400 py-6 font-bold uppercase tracking-widest">Sin novedades</p>
                    ) : (
                      myNotifs.map(n => (
                        <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-3.5 rounded-xl border transition-all cursor-pointer ${n.read ? 'bg-slate-50/50 border-slate-100' : 'bg-emerald-50/20 border-emerald-100'}`}>
                          <p className="text-[10px] font-black text-slate-900 leading-tight uppercase tracking-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1.5 font-medium leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden border border-slate-100 hover:border-slate-200 bg-white transition-all group"
              >
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black tracking-tight group-hover:scale-110 transition-transform">
                  {user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="pb-3 mb-3 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate">{user}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5 opacity-60">{role.replace('_', ' ')}</p>
                  </div>
                  <button onClick={logout} className="flex items-center w-full px-3 py-2.5 text-[9px] text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest rounded-xl transition-all">
                    <span className="material-symbols-outlined text-base mr-2.5">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-10 pt-6 pb-10 max-w-full mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
