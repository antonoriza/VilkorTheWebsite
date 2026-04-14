import { Outlet, NavLink, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'
import { useState } from 'react'

// Sidebar items with role visibility
const allNavItems = [
  { to: '/dashboard', icon: 'home', label: 'Inicio', roles: ['resident'] },
  { to: '/admin', icon: 'dashboard', label: 'Panel Admin', roles: ['admin'] },
  { to: '/avisos', icon: 'notifications', label: 'Avisos', roles: ['resident', 'admin'] },
  { to: '/pagos', icon: 'payments', label: 'Pagos', roles: ['resident', 'admin'] },
  { to: '/paqueteria', icon: 'package_2', label: 'Paquetería', roles: ['resident', 'admin'] },
  { to: '/asadores', icon: 'outdoor_grill', label: 'Asadores', roles: ['resident', 'admin'] },
  { to: '/votaciones', icon: 'how_to_vote', label: 'Votaciones', roles: ['resident', 'admin'] },
]

export default function DashboardLayout() {
  const { user, apartment, role, isAuthenticated, logout } = useAuth()
  const { state, dispatch } = useStore()
  const [showNotif, setShowNotif] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const homePath = role === 'admin' ? '/admin' : '/dashboard'
  const navItems = allNavItems.filter(item => item.roles.includes(role))

  // Filter notifications for this user
  const myNotifs = state.notificaciones.filter(n => 
    role === 'admin' ? n.userId === 'admin' : n.userId === user
  )

  return (
    <div className="bg-[#F8FAFC] text-on-surface flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col border-r border-slate-200 bg-white z-50">
        <Link to={homePath} className="p-8 block hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Lote Alemania</h1>
          <p className="text-[10px] font-bold font-label tracking-widest text-slate-400 mt-1 uppercase">Cosmopol HU LIFESTYLE</p>
        </Link>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
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
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-slate-100">
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
            <a className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium" href="#">
              <span className="material-symbols-outlined text-lg mr-3">settings</span> Configuración
            </a>
            <a className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium" href="#">
              <span className="material-symbols-outlined text-lg mr-3">help</span> Soporte
            </a>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-slate-500 hover:text-rose-600 text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-lg mr-3">logout</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="ml-64 w-full min-h-screen flex flex-col">
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-10 h-20 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div />
          <div className="flex items-center space-x-3">
            {/* Role badge (read-only indicator) */}
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

            {/* Notifications */}
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
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                    {myNotifs.length === 0 ? (
                      <p className="text-sm text-slate-500 font-medium text-center py-4">No tienes notificaciones</p>
                    ) : (
                      myNotifs.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl border ${n.read ? 'bg-slate-50 border-slate-100' : 'bg-primary-container/20 border-primary-dim'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-900">{n.title}</span>
                            {!n.read && (
                              <button onClick={() => dispatch({ type: 'MARK_NOTIFICACION_READ', payload: n.id })} className="text-[10px] text-primary font-bold uppercase hover:underline">
                                Marcar
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight mb-2">{n.message}</p>
                          <span className="text-[9px] font-bold text-slate-400">{n.date}</span>
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
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                      {role === 'admin' ? 'Administrador' : `Depto. ${apartment}`}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-2 py-2 text-sm text-slate-500 hover:text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg mr-2">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-10 max-w-full mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
