import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import './DashboardLayout.css'

const navItems = [
  { to: '/dashboard', icon: 'home', label: 'Inicio' },
  { to: '/admin', icon: 'dashboard', label: 'Admin' },
  { to: '#avisos', icon: 'notifications', label: 'Avisos' },
  { to: '#pagos', icon: 'payments', label: 'Pagos' },
  { to: '#paqueteria', icon: 'package_2', label: 'Paquetería' },
  { to: '#amenidades', icon: 'outdoor_grill', label: 'Asadores' },
  { to: '#votaciones', icon: 'how_to_vote', label: 'Votaciones' },
  { to: '#tickets', icon: 'confirmation_number', label: 'Tickets' },
]

const secondaryItems = [
  { to: '#configuracion', icon: 'settings', label: 'Configuración' },
  { to: '#soporte', icon: 'help', label: 'Soporte' },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand" onClick={() => navigate('/dashboard')}>
            <div className="sidebar__logo">
              <span className="icon" style={{ color: 'var(--on-primary)', fontSize: 20 }}>apartment</span>
            </div>
            {!collapsed && (
              <div className="sidebar__brand-text animate-fade-in">
                <span className="sidebar__brand-name">Lote Alemania</span>
                <span className="sidebar__brand-sub">Cosmopol HU Lifestyle</span>
              </div>
            )}
          </div>
          <button 
            className="btn-icon sidebar__toggle hide-mobile"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            <span className="icon icon-sm">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__nav-group">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => 
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar__footer">
          {secondaryItems.map((item) => (
            <a key={item.to} href={item.to} className="sidebar__link">
              <span className="icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </a>
          ))}
          
          <div className="sidebar__user" onClick={() => navigate('/login')}>
            <div className="avatar avatar-sm">JA</div>
            {!collapsed && (
              <div className="sidebar__user-info animate-fade-in">
                <span className="sidebar__user-name">Juan Antonio</span>
                <span className="sidebar__user-unit">A201</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button 
            className="btn-icon hide-desktop"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span className="icon">menu</span>
          </button>
          <div className="dashboard-header__spacer" />
          <div className="dashboard-header__actions">
            <button className="btn-icon" aria-label="Search">
              <span className="icon">search</span>
            </button>
            <button className="btn-icon" aria-label="Notifications" style={{ position: 'relative' }}>
              <span className="icon">notifications</span>
              <span className="notification-badge">3</span>
            </button>
            <div className="avatar avatar-sm hide-mobile">JA</div>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
