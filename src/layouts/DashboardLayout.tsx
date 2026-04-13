import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const mainNavItems = [
  { to: '/dashboard', icon: 'home', label: 'Inicio' },
  { to: '/avisos', icon: 'notifications', label: 'Avisos' },
  { to: '/pagos', icon: 'payments', label: 'Pagos' },
  { to: '/paqueteria', icon: 'package_2', label: 'Paquetería' },
  { to: '/asadores', icon: 'outdoor_grill', label: 'Asadores' },
  { to: '/votaciones', icon: 'how_to_vote', label: 'Votaciones' },
  { to: '/admin', icon: 'confirmation_number', label: 'Tickets' },
]

export default function DashboardLayout() {
  const { user, apartment, role, toggleRole } = useAuth()
  const [showNotif, setShowNotif] = useState(false)

  const homePath = role === 'admin' ? '/admin' : '/dashboard'

  return (
    <div className="bg-[#F8FAFC] text-on-surface flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col border-r border-slate-200 bg-white z-50">
        <Link to={homePath} className="p-8 block hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Lote Alemania</h1>
          <p className="text-[10px] font-bold font-label tracking-widest text-slate-400 mt-1 uppercase">Cosmopol HU LIFESTYLE</p>
        </Link>
        
        <nav className="flex-1 px-4 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.label === 'Inicio' ? homePath : item.to}
              end={item.label === 'Inicio'}
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
            <img 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white" 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{apartment}</p>
            </div>
          </div>
          <div className="space-y-1">
            <a className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium" href="#">
              <span className="material-symbols-outlined text-lg mr-3">settings</span> Configuración
            </a>
            <a className="flex items-center px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium" href="#">
              <span className="material-symbols-outlined text-lg mr-3">help</span> Soporte
            </a>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="ml-64 w-full min-h-screen flex flex-col">
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-10 h-20 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div />
          <div className="flex items-center space-x-3">
            {/* Role Toggle */}
            <button
              onClick={toggleRole}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                role === 'admin'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {role === 'admin' ? 'shield_person' : 'person'}
              </span>
              <span>{role === 'admin' ? 'Administrador' : 'Residente'}</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notificaciones</p>
                  <p className="text-sm text-slate-500 font-medium">No tienes notificaciones</p>
                </div>
              )}
            </div>

            {/* Profile */}
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
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
