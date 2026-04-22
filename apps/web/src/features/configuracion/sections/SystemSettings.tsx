
interface Props {
  handleReset: () => void
  isDemoMode?: boolean
}

export default function SystemSettings({ handleReset, isDemoMode = false }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className={`bg-white border rounded-3xl p-8 shadow-sm space-y-6 ${isDemoMode ? 'border-amber-200' : 'border-rose-200'}`}>
        <div className="flex items-center space-x-3">
          <span className={`material-symbols-outlined text-xl ${isDemoMode ? 'text-amber-500' : 'text-rose-600'}`}>
            {isDemoMode ? 'science' : 'warning'}
          </span>
          <h3 className={`text-[11px] font-bold uppercase tracking-widest font-headline ${isDemoMode ? 'text-amber-600' : 'text-rose-600'}`}>
            {isDemoMode ? 'Zona de Demo' : 'Zona de Peligro'}
          </h3>
        </div>
        
        <div className={`flex items-center justify-between p-6 border rounded-3xl ${isDemoMode ? 'bg-amber-50/30 border-amber-100' : 'bg-rose-50/30 border-rose-100'}`}>
          <div className="max-w-md">
            <p className="text-sm font-bold text-slate-900">Restablecer Sistema</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
              {isDemoMode
                ? 'Restaura los datos de demostración a su estado inicial, o realiza un reset de fábrica real para simular el Día 1 de un cliente.'
                : 'Esta acción eliminará todos los registros históricos de pagos, residentes, tickets, staff y configuraciones personalizadas. La aplicación volverá a su estado de fábrica con solo el administrador base.'}
            </p>
          </div>
          <button 
            onClick={handleReset}
            className={`flex items-center space-x-2 px-6 py-3 font-bold rounded-2xl transition-all text-[11px] tracking-widest uppercase shrink-0 shadow-sm ${
              isDemoMode
                ? 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white'
            }`}
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
