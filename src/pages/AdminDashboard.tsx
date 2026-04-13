import './AdminDashboard.css'

const staffOnDuty = [
  { name: 'Carlos Mendoza', role: 'Seguridad', location: 'Puerta Principal', status: 'online' },
  { name: 'Juan Pérez', role: 'Mantenimiento', location: 'Eléctrico', status: 'online' },
  { name: 'María López', role: 'Limpieza', location: 'Torre A', status: 'online' },
]

const recentNotices = [
  { title: 'Mantenimiento de Piscina', body: 'Limpieza profunda programada para el lunes.', time: 'Hace 4h', icon: 'pool' },
  { title: 'Fumigación Áreas Verdes', body: 'Tratamiento trimestral de jardines comunes.', time: 'Hace 1d', icon: 'park' },
]

const criticalAlerts = [
  { title: 'Falla en Bomba Principal', body: 'Presión baja detectada en Torre A y B.', severity: 'critical', icon: 'water_damage' },
  { title: 'Cámara 04 Desconectada', body: 'Acceso perimetral norte sin monitoreo.', severity: 'warning', icon: 'videocam_off' },
]

const pendingApprovals = [
  { type: 'Reserva', detail: 'Salón Eventos — A304', date: '15 Apr', icon: 'event' },
  { type: 'Pago', detail: 'Comprobante — B102', date: '14 Apr', icon: 'receipt_long' },
  { type: 'Acceso', detail: 'Visitante — C201', date: '14 Apr', icon: 'badge' },
]

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      {/* Page header */}
      <section className="ad-header animate-fade-in-up">
        <div className="ad-header__left">
          <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Panel de Administración</span>
          <h1 className="headline-lg">Lote Alemania</h1>
          <p className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Cosmopol HU Lifestyle — Estado Operativo
          </p>
        </div>
        <div className="ad-header__actions">
          <button className="btn btn-secondary">
            <span className="icon icon-sm">campaign</span>
            Broadcast
          </button>
          <button className="btn btn-primary">
            <span className="icon icon-sm">add</span>
            Nuevo Aviso
          </button>
        </div>
      </section>

      {/* Health gauge — Main metrics */}
      <section className="ad-health animate-fade-in-up stagger-1">
        <div className="ad-health__hero card">
          <div className="ad-health__gauge">
            <svg viewBox="0 0 120 120" className="ad-gauge-svg">
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--surface-container-high)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--tertiary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52 * 0.94} ${2 * Math.PI * 52 * 0.06}`}
                transform="rotate(-90 60 60)"
                className="ad-gauge-progress"
              />
            </svg>
            <div className="ad-gauge-value">
              <span className="display-sm">94</span>
              <span className="label-sm">%</span>
            </div>
          </div>
          <div className="ad-health__info">
            <span className="title-lg">Salud del Edificio</span>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
              El ecosistema de la propiedad se mantiene en niveles óptimos. 2 incidentes críticos resueltos en las últimas 24 horas.
            </p>
          </div>
        </div>

        <div className="ad-metrics">
          <div className="ad-metric card">
            <div className="ad-metric__icon" style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }}>
              <span className="icon">payments</span>
            </div>
            <div className="ad-metric__content">
              <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Recaudación</span>
              <span className="headline-md">92%</span>
            </div>
            <div className="ad-metric__bar">
              <div className="ad-metric__bar-fill" style={{ width: '92%', background: 'var(--tertiary)' }} />
            </div>
          </div>
          <div className="ad-metric card">
            <div className="ad-metric__icon" style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}>
              <span className="icon">confirmation_number</span>
            </div>
            <div className="ad-metric__content">
              <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Tickets Pendientes</span>
              <span className="headline-md">24</span>
            </div>
            <div className="ad-metric__bar">
              <div className="ad-metric__bar-fill" style={{ width: '40%', background: 'var(--secondary)' }} />
            </div>
          </div>
          <div className="ad-metric card">
            <div className="ad-metric__icon" style={{ background: 'var(--primary-container)', color: 'var(--on-primary-container)' }}>
              <span className="icon">apartment</span>
            </div>
            <div className="ad-metric__content">
              <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Ocupación</span>
              <span className="headline-md">98%</span>
            </div>
            <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>124 de 126 unidades</span>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <div className="ad-grid">
        {/* Left column */}
        <div className="ad-grid__left">
          {/* Staff on duty */}
          <section className="ad-section animate-fade-in-up stagger-2">
            <div className="ad-section__header">
              <h2 className="title-lg">Staff en Turno</h2>
              <button className="btn btn-ghost btn-sm">
                Gestionar <span className="icon icon-sm">arrow_forward</span>
              </button>
            </div>
            <div className="ad-staff">
              {staffOnDuty.map((person) => (
                <div key={person.name} className="ad-staff-item card">
                  <div className="avatar">{person.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="ad-staff-item__info">
                    <span className="title-sm">{person.name}</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      {person.role} — {person.location}
                    </span>
                  </div>
                  <div className={`status-dot status-${person.status}`} />
                </div>
              ))}
            </div>
          </section>

          {/* Notices */}
          <section className="ad-section animate-fade-in-up stagger-3">
            <div className="ad-section__header">
              <h2 className="title-lg">Centro de Avisos</h2>
              <button className="btn btn-ghost btn-sm">
                Ver todos <span className="icon icon-sm">arrow_forward</span>
              </button>
            </div>
            
            <h3 className="title-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--space-sm)' }}>Avisos Recientes</h3>
            <div className="ad-notices">
              {recentNotices.map((notice) => (
                <div key={notice.title} className="ad-notice card">
                  <div className="ad-notice__icon">
                    <span className="icon">{notice.icon}</span>
                  </div>
                  <div className="ad-notice__content">
                    <span className="title-sm">{notice.title}</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{notice.body}</span>
                  </div>
                  <span className="body-sm" style={{ color: 'var(--outline)', whiteSpace: 'nowrap' }}>{notice.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="ad-grid__right">
          {/* Critical alerts */}
          <section className="ad-section animate-fade-in-up stagger-2">
            <div className="ad-section__header">
              <div className="flex items-center gap-sm">
                <span className="icon" style={{ color: 'var(--error)' }}>warning</span>
                <h2 className="title-lg">Alertas Críticas</h2>
              </div>
            </div>
            <div className="ad-alerts">
              {criticalAlerts.map((alert) => (
                <div key={alert.title} className={`ad-alert card ad-alert--${alert.severity}`}>
                  <div className="ad-alert__icon">
                    <span className="icon">{alert.icon}</span>
                  </div>
                  <div className="ad-alert__content">
                    <span className="title-sm">{alert.title}</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{alert.body}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm">
                    <span className="icon icon-sm">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Approval queue */}
          <section className="ad-section animate-fade-in-up stagger-3">
            <div className="ad-section__header">
              <h2 className="title-lg">Cola de Aprobaciones</h2>
              <div className="chip chip-default">{pendingApprovals.length}</div>
            </div>
            <div className="ad-approvals">
              {pendingApprovals.map((item) => (
                <div key={item.detail} className="ad-approval card">
                  <div className="ad-approval__icon">
                    <span className="icon icon-sm">{item.icon}</span>
                  </div>
                  <div className="ad-approval__content">
                    <span className="label-md" style={{ color: 'var(--primary)' }}>{item.type}</span>
                    <span className="title-sm">{item.detail}</span>
                    <span className="body-sm" style={{ color: 'var(--outline)' }}>{item.date}</span>
                  </div>
                  <div className="ad-approval__actions">
                    <button className="btn btn-tertiary btn-sm">
                      <span className="icon icon-sm">check</span>
                    </button>
                    <button className="btn btn-ghost btn-sm">
                      <span className="icon icon-sm">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Assembly reminder */}
          <section className="ad-section animate-fade-in-up stagger-4">
            <div className="ad-assembly card">
              <div className="ad-assembly__header">
                <span className="icon" style={{ color: 'var(--primary)' }}>event</span>
                <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Próxima Asamblea</span>
              </div>
              <span className="title-lg">Asamblea Ordinaria</span>
              <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                15 de Julio, 2025 • 19:00 hrs
              </span>
              <div className="ad-assembly__quorum">
                <div className="ad-assembly__quorum-bar">
                  <div className="ad-assembly__quorum-fill" style={{ width: '45%' }} />
                </div>
                <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                  45% quórum confirmado
                </span>
              </div>
              <button className="btn btn-secondary w-full">
                <span className="icon icon-sm">edit</span>
                Gestionar Asamblea
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
