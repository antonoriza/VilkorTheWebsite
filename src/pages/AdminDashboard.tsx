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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            The Control Tower
          </span>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">
            Lote Alemania
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Cosmopol HU Lifestyle — Gestión Operativa Global
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm text-[11px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-lg">campaign</span>
            <span>Broadcast</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-[11px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-lg font-bold">add</span>
            <span>Nuevo Aviso</span>
          </button>
        </div>
      </header>

      {/* Health gauge — Main metrics */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-3xl p-8 hero-pattern relative overflow-hidden shadow-sm flex flex-col justify-center items-center text-center">
          <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100"
              />
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray="314.159"
                strokeDashoffset="18.85"
                strokeLinecap="round"
                className="text-tertiary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-headline font-black text-slate-900 tracking-tighter">94%</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Óptimo</span>
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-headline font-extrabold text-slate-900 mb-2">Salud del Edificio</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[240px]">
              Ecosistema operativo estable. 2 incidentes críticos resueltos hoy.
            </p>
          </div>
        </div>

        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-emerald-200 transition-colors">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recaudación</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">92%</span>
                <span className="text-xs font-bold text-emerald-600">+2.4%</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-amber-200 transition-colors">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tickets Abiertos</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">24</span>
                <span className="text-xs font-bold text-slate-400">Pendientes</span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 hover:border-primary-container transition-colors">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ocupación</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-headline font-black text-slate-900 tracking-tight">98%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">124 de 126 residencias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left column */}
        <div className="space-y-10">
          {/* Staff on duty */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Staff en Turno</h3>
              <button className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center transition-colors">
                Gestionar <span className="material-symbols-outlined text-[14px] ml-1">trending_flat</span>
              </button>
            </div>
            <div className="grid gap-4">
              {staffOnDuty.map((person) => (
                <div key={person.name} className="flex items-center space-x-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 group-hover:bg-primary-container group-hover:text-primary transition-colors">
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{person.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                      {person.role} — {person.location}
                    </p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />
                </div>
              ))}
            </div>
          </section>

          {/* Notices */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Centro de Avisos</h3>
              <button className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center transition-colors">
                Ver todos <span className="material-symbols-outlined text-[14px] ml-1">trending_flat</span>
              </button>
            </div>
            <div className="space-y-4">
              {recentNotices.map((notice) => (
                <div key={notice.title} className="flex items-start space-x-5 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <span className="material-symbols-outlined">{notice.icon}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-[15px] font-bold text-slate-900 leading-tight">{notice.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notice.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{notice.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-10">
          {/* Critical alerts */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[18px]">warning</span>
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Alertas Críticas</h3>
              </div>
            </div>
            <div className="space-y-4">
              {criticalAlerts.map((alert) => (
                <div key={alert.title} className={`p-6 border rounded-3xl shadow-sm flex items-center space-x-5 group transition-all ${
                  alert.severity === 'critical' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <span className="material-symbols-outlined">{alert.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-900">{alert.title}</h4>
                    <p className="text-sm text-slate-600 font-medium mt-1">{alert.body}</p>
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined">trending_flat</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Approval queue */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Cola de Aprobaciones</h3>
              <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black rounded-lg">{pendingApprovals.length}</span>
            </div>
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <div key={item.detail} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center space-x-5 hover:border-slate-300 transition-all">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-primary border border-slate-100">
                    <span className="material-symbols-outlined text-lg font-bold">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">{item.type}</span>
                    <h4 className="text-[14px] font-bold text-slate-900">{item.detail}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined font-bold">check</span>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Assembly info */}
          <section className="bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-slate-200 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-[8rem]">event</span>
            </div>
            <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] block mb-2 font-label">Próxima Asamblea</span>
                <h3 className="text-2xl font-headline font-black tracking-tight">Asamblea Ordinaria</h3>
                <p className="text-white/70 font-medium mt-1 italic">15 de Julio, 2025 • 19:00 hrs</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                  <span>Quórum Confirmado</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-fixed rounded-full shadow-[0_0_12px_rgba(216,227,251,0.5)]" style={{ width: '45%' }}></div>
                </div>
              </div>

              <button className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px] shadow-lg">
                Gestionar Asamblea
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
