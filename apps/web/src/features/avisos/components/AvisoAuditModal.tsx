/**
 * AvisoAuditModal — Assembly attendance audit table with search.
 * Consumed by: AvisosPage.
 */
import { useMemo, useState } from 'react'
import Modal from '../../../core/components/Modal'
import type { Aviso } from '../../../types'

interface AvisoAuditModalProps {
  open: boolean
  onClose: () => void
  aviso: Aviso | null
  totalUnits: number
  towers: string[]
}

export default function AvisoAuditModal({ open, onClose, aviso, totalUnits, towers }: AvisoAuditModalProps) {
  const [search, setSearch] = useState('')

  // Compute audit data
  const { byApartment, confirmedCount } = useMemo(() => {
    if (!aviso || aviso.category !== 'asamblea') return { byApartment: {} as Record<string, typeof events>, confirmedCount: 0 }
    const events = aviso.tracking || []
    const byApt: Record<string, typeof events> = {}
    events.forEach(t => {
      if (!byApt[t.apartment]) byApt[t.apartment] = []
      byApt[t.apartment].push(t)
    })
    let count = 0
    Object.values(byApt).forEach(list => {
      if (list.some(t => t.type === 'confirm')) count++
    })
    return { byApartment: byApt, confirmedCount: count }
  }, [aviso])

  const filteredEntries = useMemo(() => {
    const entries = Object.entries(byApartment)
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(([apt, events]) => {
      if (apt.toLowerCase().includes(q)) return true
      if (apt.charAt(0).toLowerCase() === q) return true
      if (events.some(e => e.resident.toLowerCase().includes(q))) return true
      return false
    })
  }, [byApartment, search])

  if (!aviso || aviso.category !== 'asamblea') return null

  return (
    <Modal open={open} onClose={() => { onClose(); setSearch('') }} title="Auditoría de Asistencia">
      <div className="space-y-5">
        <p className="text-sm font-medium text-slate-600">
          Rastreo completo de interacciones para: <strong className="text-slate-900">{aviso.title}</strong>
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar por nombre, departamento o torre (${towers.join(', ')})...`}
            className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
          />
        </div>
        <div className="max-h-[45vh] overflow-y-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departamento</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actividad</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(([apt, events]) => {
                const isConfirmed = events.some(e => e.type === 'confirm')
                return (
                  <tr key={apt} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{apt}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="space-y-1">
                        {events.map((e, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            {e.type === 'confirm' ? (
                              <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px] text-slate-300">visibility</span>
                            )}
                            <span className={e.type === 'confirm' ? 'font-bold text-slate-900' : 'text-slate-500'}>
                              {e.resident} <span className="opacity-50 text-[10px]">{new Date(e.timestamp).toLocaleString('es-MX')}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isConfirmed ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100">Confirmado</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200">Solo Visto</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400 font-medium text-sm">
                    {search ? 'Sin resultados para la búsqueda.' : 'Nadie ha interactuado aún.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Departamentos Confirmados</p>
            <p className="text-lg font-black text-slate-900">{confirmedCount} Unidades</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Quórum Pendiente</p>
            <p className="text-lg font-black text-slate-900">{totalUnits - confirmedCount} Unidades</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
