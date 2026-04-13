export default function ResidentDashboard() {
  return (
    <div className="flex gap-10">
      {/* Central Column */}
      <div className="flex-1 space-y-10">
        {/* Simplified Building Status: Estado del Lote */}
        <section>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 hero-pattern relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="relative z-10 space-y-2">
              <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Estado del Lote</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl font-headline font-extrabold text-slate-900 tracking-tight">98%</span>
                <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Operativo</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                La infraestructura general se encuentra en óptimas condiciones. Todos los servicios esenciales están funcionando correctamente.
              </p>
            </div>
            
            <div className="relative z-10 mt-6 md:mt-0">
              <button className="px-6 py-2.5 bg-slate-900 text-white font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg shadow-slate-200 text-[10px] whitespace-nowrap">
                VER MÁS
                <span className="material-symbols-outlined text-[16px] ml-2">chevron_right</span>
              </button>
            </div>
            
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.02] pointer-events-none">
              <span className="material-symbols-outlined text-[16rem]" style={{ fontVariationSettings: '"FILL" 1' }}>apartment</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Mis Tickets Activos */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Mis Tickets Activos</h3>
              <a className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors tracking-widest uppercase" href="#">
                Ver todos <span className="material-symbols-outlined text-[14px]">trending_flat</span>
              </a>
            </div>
            
            <div className="space-y-4">
              <div className="group p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MANTENIMIENTO</p>
                    <p className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Filtración en Baño</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-100">#2940</span>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="flex items-center text-[11px] text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-[14px] mr-1.5 text-slate-300">schedule</span> Hace 2 horas
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-600 mr-1.5"></span> EN PROCESO
                  </span>
                </div>
              </div>
              
              <div className="group p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">INSTALACIONES</p>
                    <p className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Revisión Aire Acondicionado</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-500 border border-slate-100">#2812</span>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="flex items-center text-[11px] text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-[14px] mr-1.5 text-slate-300">calendar_today</span> Mañana
                  </span>
                  <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mr-1.5"></span> PROGRAMADO
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Personal de Seguridad */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Personal de Seguridad</h3>
              <a className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors tracking-widest uppercase" href="#">
                Ver todos <span className="material-symbols-outlined text-[14px]">trending_flat</span>
              </a>
            </div>
            
            <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm space-y-1">
              <div className="flex items-center space-x-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="relative">
                  <img alt="Security Staff 1" className="w-12 h-12 rounded-full object-cover ring-2 ring-white" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Roberto Mendez</p>
                  <p className="text-[10px] text-slate-500 truncate font-semibold uppercase tracking-widest">Lobby Principal</p>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="relative">
                  <img alt="Security Staff 2" className="w-12 h-12 rounded-full object-cover ring-2 ring-white" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Laura Gutierrez</p>
                  <p className="text-[10px] text-slate-500 truncate font-semibold uppercase tracking-widest">Acceso Vehicular</p>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Administración Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Administración</h3>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 flex-1">
              <div className="relative">
                <img alt="Admin Staff" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-900">Samantha</p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Administrador General</p>
                <div className="flex items-center mt-2 text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">Horario: 9AM a 5PM</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all tracking-widest uppercase">
                <span className="material-symbols-outlined text-lg">groups</span>
                VER TODO EL STAFF
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                <span className="material-symbols-outlined">phone_in_talk</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Quick Status Panel */}
      <aside className="w-80 hidden xl:flex flex-col space-y-10">
        <div className="space-y-6">
          <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Resumen de Cuenta</h3>
          
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Vence en 12d</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estado actual</p>
              <span className="text-slate-900 font-extrabold text-2xl tracking-tight">Al Corriente</span>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-orange-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <a className="text-[9px] font-bold text-orange-700 uppercase tracking-widest bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded transition-colors" href="#">Ver Detalles</a>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paquetes en lobby</p>
              <span className="text-slate-900 font-extrabold text-3xl tracking-tight">03</span>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:border-teal-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Próxima Reserva</p>
              <p className="text-base font-bold text-slate-900">Asador #3</p>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tight mt-1">Mañana • 14:00 - 18:00</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-headline font-extrabold text-slate-900 uppercase tracking-widest text-[11px]">Avisos Recientes</h3>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3 group cursor-pointer">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
              <div>
                <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Corte de Agua - Torre B</h5>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">Mantenimiento preventivo este viernes de 10:00 a 14:00.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-slate-300 flex-shrink-0"></div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Nueva Normativa Basura</h5>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-1">Nuevos horarios de recolección para residuos orgánicos.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 group cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
              <div className="mt-1.5 w-2 h-2 rounded-full bg-slate-300 flex-shrink-0"></div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Asamblea Ordinaria</h5>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-1">Convocatoria oficial para el próximo mes de Julio.</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 py-3 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold rounded-xl uppercase tracking-widest hover:bg-slate-100 transition-colors">
            Ver todo
          </button>
        </div>
      </aside>
    </div>
  )
}
