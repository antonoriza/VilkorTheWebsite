import React from 'react'

export default function ModuleSettings() {
  const modules = [
    { id: 'avisos', name: 'Avisos y Comunicados', icon: 'campaign', description: 'Reglas de visibilidad y firma de recepción.' },
    { id: 'tickets', name: 'Tickets de Soporte', icon: 'confirmation_number', description: 'Categorías de servicio y tiempos de SLA.' },
    { id: 'paqueteria', name: 'Paquetería', icon: 'package_2', description: 'Tiempos de almacenaje y alertas de retiro.' },
    { id: 'votaciones', name: 'Votaciones Globales', icon: 'how_to_vote', description: 'Reglas de quórum y anonimato de votos.' }
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <span className="material-symbols-outlined text-primary text-xl">extension</span>
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Configuración de Módulos Operativos</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map(mod => (
            <div key={mod.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/20 hover:border-slate-200 transition-all group">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">{mod.icon}</span>
                </div>
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{mod.name}</h4>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                {mod.description}
              </p>
              <div className="bg-amber-50 border border-amber-100/50 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[14px]">lock</span>
                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Próximamente en Canton Alfa</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
