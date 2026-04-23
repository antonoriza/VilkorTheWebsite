/**
 * StaffSection — Operational "Staff en Turno" dashboard widget.
 *
 * Purpose (dashboard-only):
 *   - Show today's expected staff with their real-time status
 *   - Log same-day incidents (no-show, emergency substitute)
 *   - Read planned overrides set in Gestión de Personas
 *
 * NOT responsible for:
 *   - Adding / editing / deleting staff members → UsuariosPage
 *   - Planned vacations / pre-authorized absences → UsuariosPage (Programación tab)
 */
import { useState, useMemo } from 'react'
import Modal from '../../../core/components/Modal'
import ConfirmDialog from '../../../core/components/ConfirmDialog'
import type { StaffMember, ShiftOverride } from '../../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_ICONS: Record<string, string> = {
  Guardia: 'shield_person',
  Jardinero: 'yard',
  Limpieza: 'mop',
  'Administradora General': 'manage_accounts',
}

type IncidentType = 'absence' | 'substitute'

const TODAY = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the active override for a staff member on today's date, if any. */
function getActiveOverride(staffId: string, overrides: ShiftOverride[]): ShiftOverride | undefined {
  return overrides.find(o =>
    o.staffId === staffId &&
    TODAY >= o.startDate &&
    TODAY <= o.endDate
  )
}

/** Returns the substitute name (from staff list or external free-text). */
function resolveSubstituteName(override: ShiftOverride, staff: StaffMember[]): string {
  if (override.substituteStaffId) {
    return staff.find(s => s.id === override.substituteStaffId)?.name ?? '—'
  }
  return override.substituteExternal ?? '—'
}

// ─── Status chip config ───────────────────────────────────────────────────────

function StatusChip({ override, staff }: { override?: ShiftOverride; staff: StaffMember[] }) {
  if (!override) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        En turno
      </span>
    )
  }
  if (override.type === 'vacation') {
    const end = new Date(override.endDate + 'T12:00:00')
    const fmt = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
        <span className="material-symbols-outlined text-[11px]">beach_access</span>
        Vacaciones · vuelve {fmt}
      </span>
    )
  }
  if (override.type === 'pre_authorized') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
        <span className="material-symbols-outlined text-[11px]">event_busy</span>
        Ausencia autorizada
      </span>
    )
  }
  if (override.type === 'absence') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100">
        <span className="material-symbols-outlined text-[11px]">person_off</span>
        Ausente hoy
      </span>
    )
  }
  if (override.type === 'substitute') {
    const subName = resolveSubstituteName(override, staff)
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100">
          <span className="material-symbols-outlined text-[11px]">swap_horiz</span>
          Cubierto por {subName}
        </span>
      </div>
    )
  }
  return null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StaffSectionProps {
  staff: StaffMember[]
  shiftOverrides: ShiftOverride[]
  currentUser: string
  onAddOverride: (override: ShiftOverride) => void
  onRemoveOverride: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffSection({
  staff, shiftOverrides, currentUser, onAddOverride, onRemoveOverride,
}: StaffSectionProps) {

  // ── Incident modal state ──
  const [incidentTarget, setIncidentTarget] = useState<StaffMember | null>(null)
  const [incidentType, setIncidentType] = useState<IncidentType>('absence')
  const [subMode, setSubMode] = useState<'staff' | 'external'>('staff')
  const [subStaffId, setSubStaffId] = useState('')
  const [subExternal, setSubExternal] = useState('')
  const [incidentNote, setIncidentNote] = useState('')

  // ── Remove override confirm ──
  const [removeTarget, setRemoveTarget] = useState<ShiftOverride | null>(null)

  // ── Today's active staff (only those scheduled for today's weekday) ──
  const DAY_MAP: Record<number, string> = { 1: 'L', 2: 'M', 3: 'Mi', 4: 'J', 5: 'V', 6: 'S', 0: 'D' }
  const todayDay = DAY_MAP[new Date().getDay()]

  const todayStaff = useMemo(() =>
    staff.filter(s => (s.workDays || ['L', 'M', 'Mi', 'J', 'V']).includes(todayDay)),
    [staff, todayDay]
  )
  const offDutyStaff = useMemo(() =>
    staff.filter(s => !(s.workDays || ['L', 'M', 'Mi', 'J', 'V']).includes(todayDay)),
    [staff, todayDay]
  )

  // ── Available substitutes (exclude the target) ──
  const availableSubs = incidentTarget
    ? staff.filter(s => s.id !== incidentTarget.id)
    : []

  const resetIncidentForm = () => {
    setIncidentTarget(null)
    setIncidentType('absence')
    setSubMode('staff')
    setSubStaffId('')
    setSubExternal('')
    setIncidentNote('')
  }

  const handleLogIncident = () => {
    if (!incidentTarget) return
    if (incidentType === 'substitute') {
      if (subMode === 'staff' && !subStaffId) return
      if (subMode === 'external' && !subExternal.trim()) return
    }

    const override: ShiftOverride = {
      id: `so-${Date.now()}`,
      staffId: incidentTarget.id,
      type: incidentType,
      startDate: TODAY,
      endDate: TODAY,
      substituteStaffId: incidentType === 'substitute' && subMode === 'staff' ? subStaffId : undefined,
      substituteExternal: incidentType === 'substitute' && subMode === 'external' ? subExternal.trim() : undefined,
      note: incidentNote.trim() || undefined,
      reportedBy: currentUser,
      reportedAt: new Date().toISOString(),
    }
    onAddOverride(override)
    resetIncidentForm()
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const renderCard = (person: StaffMember) => {
    const override = getActiveOverride(person.id, shiftOverrides)
    const hasIncident = !!override && (override.type === 'absence' || override.type === 'substitute')

    return (
      <div
        key={person.id}
        className={`flex items-start gap-4 p-4 bg-white border rounded-2xl shadow-sm transition-all ${
          override ? 'border-slate-200 opacity-90' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
          override ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-400'
        } overflow-hidden`}>
          {person.photo ? (
            <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-xl">{ROLE_ICONS[person.role] || 'person'}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold tracking-tight ${override ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {person.name}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            {person.role} · {person.shiftStart}–{person.shiftEnd}
          </p>
          <div className="mt-2">
            <StatusChip override={override} staff={staff} />
          </div>
          {override?.note && (
            <p className="text-[10px] text-slate-400 font-medium italic mt-1.5">
              "{override.note}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          {!override ? (
            <button
              onClick={() => setIncidentTarget(person)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-amber-600 hover:bg-amber-50 transition-all"
              title="Registrar incidencia de hoy"
            >
              <span className="material-symbols-outlined text-[18px]">report</span>
            </button>
          ) : hasIncident ? (
            <button
              onClick={() => setRemoveTarget(override)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
              title="Anular incidencia"
            >
              <span className="material-symbols-outlined text-[18px]">undo</span>
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ── Dashboard section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">
              Staff en Turno
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {todayStaff.length} programados hoy
            </p>
          </div>
          <a
            href="/usuarios?filter=Staff"
            className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center transition-colors"
          >
            Gestionar <span className="material-symbols-outlined text-[14px] ml-1">trending_flat</span>
          </a>
        </div>

        {/* Today's staff */}
        <div className="grid gap-3">
          {todayStaff.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium bg-white border border-dashed border-slate-200 rounded-2xl">
              <span className="material-symbols-outlined text-3xl mb-2 block">calendar_today</span>
              No hay personal programado para hoy
            </div>
          )}
          {todayStaff.map(renderCard)}
        </div>

        {/* Off-schedule staff (collapsed) */}
        {offDutyStaff.length > 0 && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors list-none select-none">
              <span className="material-symbols-outlined text-sm group-open:rotate-90 transition-transform">chevron_right</span>
              {offDutyStaff.length} sin turno hoy
            </summary>
            <div className="grid gap-3 mt-3">
              {offDutyStaff.map(person => {
                const override = getActiveOverride(person.id, shiftOverrides)
                return (
                  <div key={person.id} className="flex items-center gap-4 p-3 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl opacity-60">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-300 border border-slate-100 overflow-hidden shrink-0">
                      {person.photo
                        ? <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                        : <span className="material-symbols-outlined text-lg">{ROLE_ICONS[person.role] || 'person'}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-400 truncate">{person.name}</p>
                      <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest">{person.role}</p>
                    </div>
                    {override && <StatusChip override={override} staff={staff} />}
                  </div>
                )
              })}
            </div>
          </details>
        )}
      </section>

      {/* ── Incident Modal ── */}
      <Modal
        open={!!incidentTarget}
        onClose={resetIncidentForm}
        title="Registrar Incidencia del Día"
      >
        {incidentTarget && (
          <div className="p-2 space-y-6">

            {/* Who */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 overflow-hidden shrink-0">
                {incidentTarget.photo
                  ? <img src={incidentTarget.photo} alt={incidentTarget.name} className="w-full h-full object-cover" />
                  : <span className="material-symbols-outlined text-xl text-slate-400">{ROLE_ICONS[incidentTarget.role] || 'person'}</span>
                }
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{incidentTarget.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{incidentTarget.role} · Turno hoy</p>
              </div>
            </div>

            {/* Incident type */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de incidencia</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'absence', label: 'Ausente hoy', icon: 'person_off', desc: 'No se presentó a su turno' },
                  { id: 'substitute', label: 'Sustitución', icon: 'swap_horiz', desc: 'Cubre otro trabajador' },
                ] as { id: IncidentType; label: string; icon: string; desc: string }[]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setIncidentType(opt.id)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all ${
                      incidentType === opt.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${incidentType === opt.id ? 'text-white' : 'text-slate-400'}`}>
                      {opt.icon}
                    </span>
                    <p className="text-[11px] font-black uppercase tracking-widest">{opt.label}</p>
                    <p className={`text-[10px] font-medium ${incidentType === opt.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Substitute fields */}
            {incidentType === 'substitute' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Quién cubre?</p>
                <div className="flex gap-2">
                  {(['staff', 'external'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSubMode(mode)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        subMode === mode
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {mode === 'staff' ? 'Del Personal' : 'Externo'}
                    </button>
                  ))}
                </div>
                {subMode === 'staff' ? (
                  <select
                    value={subStaffId}
                    onChange={e => setSubStaffId(e.target.value)}
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                  >
                    <option value="">Seleccionar sustituto...</option>
                    {availableSubs.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subExternal}
                    onChange={e => setSubExternal(e.target.value)}
                    placeholder="Nombre del sustituto externo"
                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                  />
                )}
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nota interna <span className="font-medium normal-case tracking-normal text-slate-300">(opcional)</span>
              </p>
              <textarea
                value={incidentNote}
                onChange={e => setIncidentNote(e.target.value)}
                rows={2}
                placeholder="Ej: No respondió al llamado, cita médica..."
                className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm resize-none"
              />
            </div>

            {/* Logged by */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="material-symbols-outlined text-sm text-slate-400">history_edu</span>
              <p className="text-[10px] text-slate-400 font-medium">
                Registrado por <strong className="text-slate-600">{currentUser}</strong> · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogIncident}
              disabled={incidentType === 'substitute' && subMode === 'staff' && !subStaffId || incidentType === 'substitute' && subMode === 'external' && !subExternal.trim()}
              className="w-full py-3.5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
            >
              Registrar Incidencia
            </button>
          </div>
        )}
      </Modal>

      {/* ── Remove Override Confirm ── */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) onRemoveOverride(removeTarget.id)
          setRemoveTarget(null)
        }}
        title="Anular Incidencia"
        confirmLabel="Anular"
        variant="danger"
      >
        ¿Anular la incidencia registrada para hoy? El empleado volverá a aparecer como en turno.
      </ConfirmDialog>
    </>
  )
}
