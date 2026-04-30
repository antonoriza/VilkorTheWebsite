import { useState, useMemo, useEffect } from 'react'
import { auditApi } from '../../../lib/api'

export type LogCategory = 'Application Log' | 'Communication Log' | 'Config Log' | 'Script Log' | 'Security Log'
export type LogSourceType = 'System' | 'Super Admin' | 'Operador' | 'Residente'
export type LogSeverity = 'info' | 'warn' | 'error' | 'security'

export interface AuditLogEntry {
  id: string
  timestamp: string
  category: LogCategory
  sourceType: LogSourceType
  sourceName: string
  severity: LogSeverity
  action: string
  description: string
  metadata: string 
}

// Mapeo de rutas de la base de datos a las categorías de la interfaz
const mapResourceToCategory = (resource: string): LogCategory => {
  if (resource.includes('/auth') || resource.includes('/permisos')) return 'Security Log'
  if (resource.includes('/config') || resource.includes('/system')) return 'Config Log'
  if (resource.includes('/avisos') || resource.includes('/comunicacion')) return 'Communication Log'
  return 'Application Log'
}

export function LogsTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<LogCategory[]>([])
  const [selectedSources, setSelectedSources] = useState<LogSourceType[]>([])
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await auditApi.list(100)
        const mapped: AuditLogEntry[] = data.map((item: any) => ({
          id: item.id,
          timestamp: item.createdAt,
          category: mapResourceToCategory(item.resource),
          sourceType: (item.actorRole === 'super_admin' ? 'Super Admin' : 
                      item.actorRole === 'administracion' ? 'Operador' : 
                      'System') as LogSourceType,
          sourceName: `[${item.actorId}]`, // La DB solo guarda el ID en audit_log, idealmente aquí habría un join con users
          severity: 'info',
          action: `${item.action}_OP`,
          description: `Operación ${item.action} en ${item.resource}`,
          metadata: JSON.stringify({
            resource: item.resource,
            status: item.statusCode,
            ip: item.ipAddress || 'unknown',
            userAgent: item.userAgent
          })
        }))
        setLogs(mapped)
      } catch (err) {
        console.error('Error fetching audit logs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  const toggleCategory = (cat: LogCategory) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const toggleSource = (src: LogSourceType) => {
    setSelectedSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src])
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = log.description.toLowerCase().includes(search.toLowerCase()) || log.action.toLowerCase().includes(search.toLowerCase())
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(log.category)
      const matchSource = selectedSources.length === 0 || selectedSources.includes(log.sourceType)
      return matchSearch && matchCategory && matchSource
    })
  }, [logs, search, selectedCategories, selectedSources])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('es-MX', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 h-[600px]">
      
      {/* Left Sidebar: Filters */}
      <div className="w-full md:w-64 shrink-0 space-y-6 overflow-y-auto pr-2">
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Buscar ID, acción..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-slate-900 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Categoría (Stream)</h4>
          <div className="space-y-1">
            {(['Application Log', 'Communication Log', 'Config Log', 'Script Log', 'Security Log'] as LogCategory[]).map(cat => (
              <label key={cat} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-wider">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipo de Origen</h4>
          <div className="space-y-1">
            {(['System', 'Super Admin', 'Operador', 'Residente'] as LogSourceType[]).map(src => (
              <label key={src} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                <input 
                  type="checkbox" 
                  checked={selectedSources.includes(src)}
                  onChange={() => toggleSource(src)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-wider">{src}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Console */}
      <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-sm">terminal</span>
            <h3 className="text-[10px] font-black uppercase tracking-widest">Audit Trail / Secure Stream</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-400">{filteredLogs.length} EVENTOS ENCONTRADOS</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Stream</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Origen</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[10px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-slate-200 hover:bg-white transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatTime(log.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${
                      log.category === 'Security Log' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      log.category === 'Config Log' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      log.category === 'Script Log' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      log.category === 'Communication Log' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {log.category === 'Security Log' ? 'shield' :
                       log.category === 'Config Log' ? 'settings' :
                       log.category === 'Script Log' ? 'code' :
                       log.category === 'Communication Log' ? 'chat' : 'apps'}
                       {log.category.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{log.sourceName}</span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest">{log.sourceType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-sans text-xs">
                    <span className="font-bold text-slate-900 mr-2">[{log.action}]</span>
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="w-6 h-6 inline-flex items-center justify-center rounded bg-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">data_object</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-sans">
                    <span className="material-symbols-outlined text-3xl mb-2">filter_list_off</span>
                    <p className="text-xs font-bold uppercase tracking-widest">No hay eventos para estos filtros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Modal (Simulated) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-sm text-emerald-400">data_object</span>
                <h3 className="text-[11px] font-black uppercase tracking-widest">Payload Inspector</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-4 bg-black/50">
              <div className="mb-4 space-y-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reference ID</p>
                <p className="text-xs font-mono text-emerald-400">{selectedLog.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Data (Scrubbed)</p>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-sky-300 overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedLog.metadata), null, 2)}
                </pre>
              </div>
              <div className="mt-4 p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-start gap-2">
                <span className="material-symbols-outlined text-rose-500 text-sm">privacy_tip</span>
                <p className="text-[9px] text-rose-200/70 font-medium leading-relaxed">
                  Por políticas de seguridad, los tokens de sesión, IPs completas y contraseñas han sido ofuscados o removidos del payload antes de su persistencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
