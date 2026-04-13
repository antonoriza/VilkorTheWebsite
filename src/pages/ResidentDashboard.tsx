import './ResidentDashboard.css'

const tickets = [
  { id: 1, category: 'Mantenimiento', title: 'Filtración en Baño', status: 'En progreso', date: 'Hace 2 días', icon: 'plumbing' },
  { id: 2, category: 'Instalaciones', title: 'Revisión Aire Acondicionado', status: 'Pendiente', date: 'Hace 5 días', icon: 'ac_unit' },
]

const securityStaff = [
  { name: 'Roberto Mendez', location: 'Lobby Principal', status: 'online' },
  { name: 'Laura Gutierrez', location: 'Acceso Vehicular', status: 'online' },
]

const notices = [
  { title: 'Corte de Agua - Torre B', body: 'Mantenimiento preventivo este viernes de 10:00 a 14:00.', time: 'Hace 3h', icon: 'water_drop', priority: 'warning' },
  { title: 'Nueva Normativa Basura', body: 'Nuevos horarios de recolección para residuos orgánicos.', time: 'Hace 1d', icon: 'delete', priority: 'default' },
  { title: 'Asamblea Ordinaria', body: 'Convocatoria oficial para el próximo mes de Julio.', time: 'Hace 2d', icon: 'groups', priority: 'default' },
]

export default function ResidentDashboard() {
  return (
    <div className="resident-dashboard">
      {/* Hero section */}
      <section className="rd-hero animate-fade-in-up">
        <div className="rd-hero__content">
          <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Estado del Lote</span>
          <h1 className="headline-lg">Lote Alemania</h1>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)', maxWidth: 480 }}>
            La infraestructura general se encuentra en óptimas condiciones. Todos los servicios esenciales están funcionando correctamente.
          </p>
        </div>
        <div className="rd-hero__status-bar">
          <div className="rd-status-pill rd-status-pill--good">
            <span className="icon icon-sm">check_circle</span>
            <span>Operativo</span>
          </div>
          <div className="rd-status-pill">
            <span className="icon icon-sm">thermostat</span>
            <span>23°C</span>
          </div>
          <div className="rd-status-pill">
            <span className="icon icon-sm">air</span>
            <span>Buena calidad</span>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="rd-quick-actions animate-fade-in-up stagger-1">
        <button className="rd-quick-action">
          <div className="rd-quick-action__icon rd-quick-action__icon--report">
            <span className="icon">report_problem</span>
          </div>
          <span className="title-sm">Reportar Problema</span>
          <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Service Desk</span>
        </button>
        <button className="rd-quick-action">
          <div className="rd-quick-action__icon rd-quick-action__icon--guest">
            <span className="icon">qr_code_2</span>
          </div>
          <span className="title-sm">Invitar Visitante</span>
          <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Código QR</span>
        </button>
        <button className="rd-quick-action">
          <div className="rd-quick-action__icon rd-quick-action__icon--pay">
            <span className="icon">payments</span>
          </div>
          <span className="title-sm">Pagar Ahora</span>
          <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Portal de Pagos</span>
        </button>
      </section>

      {/* Content grid */}
      <div className="rd-grid">
        {/* Left column */}
        <div className="rd-grid__left">
          {/* Tickets */}
          <section className="rd-section animate-fade-in-up stagger-2">
            <div className="rd-section__header">
              <h2 className="title-lg">Mis Tickets Activos</h2>
              <button className="btn btn-ghost btn-sm">
                Ver todos <span className="icon icon-sm">trending_flat</span>
              </button>
            </div>
            <div className="rd-tickets">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rd-ticket card">
                  <div className="rd-ticket__icon">
                    <span className="icon">{ticket.icon}</span>
                  </div>
                  <div className="rd-ticket__content">
                    <span className="label-md" style={{ color: 'var(--primary)' }}>{ticket.category}</span>
                    <span className="title-sm">{ticket.title}</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{ticket.date}</span>
                  </div>
                  <div className="chip chip-default">{ticket.status}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Security */}
          <section className="rd-section animate-fade-in-up stagger-3">
            <div className="rd-section__header">
              <h2 className="title-lg">Personal de Seguridad</h2>
              <button className="btn btn-ghost btn-sm">
                Ver todos <span className="icon icon-sm">trending_flat</span>
              </button>
            </div>
            <div className="rd-staff-list">
              {securityStaff.map((person) => (
                <div key={person.name} className="rd-staff-item card">
                  <div className="avatar">{person.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="rd-staff-item__info">
                    <span className="title-sm">{person.name}</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{person.location}</span>
                  </div>
                  <div className={`status-dot status-${person.status}`} />
                </div>
              ))}
            </div>
          </section>

          {/* Admin card */}
          <section className="rd-section animate-fade-in-up stagger-4">
            <h2 className="title-lg">Administración</h2>
            <div className="rd-admin-card card">
              <div className="avatar avatar-lg">S</div>
              <div className="rd-admin-card__info">
                <span className="title-md">Samantha</span>
                <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>Administrador General</span>
              </div>
              <button className="btn btn-secondary btn-sm">
                <span className="icon icon-sm">chat</span>
                Contactar
              </button>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="rd-grid__right">
          {/* Account summary */}
          <section className="rd-section animate-fade-in-up stagger-2">
            <div className="rd-section__header">
              <h2 className="title-lg">Resumen de Cuenta</h2>
              <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Estado actual</span>
            </div>
            <div className="rd-account card">
              <div className="rd-account__balance">
                <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Balance</span>
                <div className="rd-account__amount">
                  <span className="headline-md" style={{ color: 'var(--tertiary)' }}>$0.00</span>
                  <div className="chip chip-success">Al corriente</div>
                </div>
              </div>
              <button className="btn btn-primary w-full">
                Ver Detalles <span className="icon icon-sm">arrow_forward</span>
              </button>
            </div>
          </section>

          {/* Packages */}
          <section className="rd-section animate-fade-in-up stagger-3">
            <div className="rd-widget card">
              <div className="rd-widget__icon rd-widget__icon--packages">
                <span className="icon">package_2</span>
              </div>
              <div className="rd-widget__content">
                <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Paquetes en lobby</span>
                <span className="headline-md">2</span>
              </div>
            </div>
          </section>

          {/* Next reservation */}
          <section className="rd-section animate-fade-in-up stagger-4">
            <div className="rd-reservation card">
              <div className="rd-reservation__header">
                <span className="label-md" style={{ color: 'var(--on-surface-variant)' }}>Próxima Reserva</span>
                <span className="icon" style={{ color: 'var(--tertiary)' }}>outdoor_grill</span>
              </div>
              <span className="title-md">Asador #3</span>
              <span className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
                Mañana • 14:00 - 18:00
              </span>
              <div className="rd-reservation__countdown">
                <div className="rd-countdown-item">
                  <span className="headline-sm">1</span>
                  <span className="label-sm">Día</span>
                </div>
                <div className="rd-countdown-item">
                  <span className="headline-sm">5</span>
                  <span className="label-sm">Hrs</span>
                </div>
                <div className="rd-countdown-item">
                  <span className="headline-sm">32</span>
                  <span className="label-sm">Min</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent notices */}
          <section className="rd-section animate-fade-in-up stagger-5">
            <h2 className="title-lg">Avisos Recientes</h2>
            <div className="rd-notices">
              {notices.map((notice) => (
                <div key={notice.title} className="rd-notice card-flat">
                  <div className={`rd-notice__icon rd-notice__icon--${notice.priority}`}>
                    <span className="icon icon-sm">{notice.icon}</span>
                  </div>
                  <div className="rd-notice__content">
                    <span className="title-sm">{notice.title}</span>
                    <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>{notice.body}</span>
                  </div>
                  <span className="body-sm" style={{ color: 'var(--outline)', whiteSpace: 'nowrap' }}>{notice.time}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
