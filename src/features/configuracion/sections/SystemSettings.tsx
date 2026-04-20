import React from 'react'

interface Props {
  handleReset: () => void
}

export default function SystemSettings({ handleReset }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-white border border-rose-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-rose-100 pb-4">
          <span className="material-symbols-outlined text-rose-600 text-xl">warning</span>
          <h3 className="text-[11px] font-bold text-rose-600 uppercase tracking-widest font-headline">Zona de Peligro</h3>
        </div>
        
        <div className="flex items-center justify-between p-6 bg-rose-50/30 border border-rose-100 rounded-3xl">
          <div className="max-w-md">
            <p className="text-sm font-bold text-slate-900">Restablecer Sistema (Fábrica)</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
              Esta acción eliminará todos los registros históricos de pagos, residentes, tickets y configuraciones personalizadas. La aplicación volverá a su estado de semillas (demo) inicial.
            </p>
          </div>
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-2xl hover:bg-rose-600 hover:text-white transition-all text-[11px] tracking-widest uppercase shrink-0 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Restablecer</span>
          </button>
        </div>

        <div className="p-6 border border-slate-200 rounded-3xl opacity-50 grayscale">
          <div className="flex items-center justify-between">
             <div className="max-w-md">
                <p className="text-sm font-bold text-slate-900 italic">Exportar Auditoría (SQL/CSV)</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                  Genera un respaldo completo de la base de datos local para fines legales o administrativos.
                </p>
             </div>
             <div className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">
                PRO FEATURE
             </div>
          </div>
        </div>
      </section>
    </div>
  )
}
