/**
 * StaffModal — Staff management modal + inline "Staff on Duty" card list.
 * Consumed by: AdminDashboard.
 *
 * Owns:
 *   - Form state (name, role, shift, photo, workDays)
 *   - CRUD handlers (add / edit / delete)
 *   - Modal with form + existing staff list
 *   - ConfirmDialog for deletion
 *   - Inline card list rendered on the dashboard
 */
import { useState } from 'react'
import Modal from '../../../core/components/Modal'
import ConfirmDialog from '../../../core/components/ConfirmDialog'
import type { StaffMember, StaffRole } from '../../../types'

const DAYS_OF_WEEK = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D']
const STAFF_ROLES: StaffRole[] = ['Guardia', 'Jardinero', 'Limpieza', 'Administradora General']
const ROLE_ICONS: Record<StaffRole, string> = {
  Guardia: 'shield_person',
  Jardinero: 'yard',
  Limpieza: 'mop',
  'Administradora General': 'manage_accounts',
}

interface StaffModalProps {
  /** Current staff list from store */
  staff: StaffMember[]
  /** Dispatch actions for staff CRUD */
  onAddStaff: (payload: StaffMember) => void
  onUpdateStaff: (payload: StaffMember) => void
  onDeleteStaff: (id: string) => void
}

/**
 * Renders the inline "Staff on Duty" section for the dashboard
 * AND manages the Staff CRUD modal + confirmation dialog internally.
 */
export default function StaffSection({ staff, onAddStaff, onUpdateStaff, onDeleteStaff }: StaffModalProps) {
  // Modal visibility
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState<StaffRole>('Guardia')
  const [shiftStart, setShiftStart] = useState('08:00')
  const [shiftEnd, setShiftEnd] = useState('17:00')
  const [photo, setPhoto] = useState('')
  const [workDays, setWorkDays] = useState<string[]>(['L', 'M', 'Mi', 'J', 'V'])

  // Confirm dialog
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setRole('Guardia')
    setShiftStart('08:00')
    setShiftEnd('17:00')
    setPhoto('')
    setWorkDays(['L', 'M', 'Mi', 'J', 'V'])
    setShowModal(false)
  }

  const openEdit = (s: StaffMember) => {
    setEditingId(s.id)
    setName(s.name)
    setRole(s.role)
    setShiftStart(s.shiftStart)
    setShiftEnd(s.shiftEnd)
    setPhoto(s.photo || '')
    setWorkDays(s.workDays || ['L', 'M', 'Mi', 'J', 'V'])
    setShowModal(true)
  }

  const handleSave = () => {
    if (!name.trim()) return
    const payload: StaffMember = {
      id: editingId || `staff-${Date.now()}`,
      name, role, shiftStart, shiftEnd, photo, workDays,
    }
    if (editingId) {
      onUpdateStaff(payload)
    } else {
      onAddStaff(payload)
    }
    resetForm()
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setPhoto(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  const toggleDay = (day: string) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  return (
    <>
      {/* ── Inline "Staff on Duty" cards ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest font-headline">Staff en Turno</h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest flex items-center transition-colors"
          >
            Gestionar <span className="material-symbols-outlined text-[14px] ml-1">trending_flat</span>
          </button>
        </div>
        <div className="grid gap-4">
          {staff.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-medium bg-white border border-slate-200 rounded-2xl">
              <span className="material-symbols-outlined text-3xl mb-2 block">person_off</span>
              No hay personal registrado
            </div>
          )}
          {staff.map((person) => (
            <div key={person.id} className="flex items-center space-x-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all group cursor-pointer" onClick={() => openEdit(person)}>
              {person.photo ? (
                <img src={person.photo} alt={person.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
              ) : (
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm border border-slate-100 group-hover:bg-primary-container group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">{ROLE_ICONS[person.role] || 'person'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{person.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">{person.role}</p>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  {person.shiftStart} – {person.shiftEnd} • {(person.workDays || ['L','M','Mi','J','V']).join(' ')}
                </p>
              </div>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Staff CRUD Modal ── */}
      <Modal open={showModal} onClose={resetForm} title={editingId ? 'Editar Personal' : 'Agregar Personal'}>
        <div className="space-y-6">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingId ? 'Datos del empleado' : 'Nuevo Empleado'}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Categoría</label>
                <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                >
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Fotografía (Sugerido 200x200 1:1)</label>
                <input type="file" accept="image/jpeg, image/png" onChange={handlePhotoUpload}
                  className="block w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Días Laborales</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs border transition-all ${
                        workDays.includes(day)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entrada</label>
                <input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
              </div>
              <div className="col-span-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Salida</label>
                <input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-sm"
                />
              </div>
            </div>
            <button onClick={handleSave}
              className="w-full py-3 mt-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]"
            >
              {editingId ? 'Guardar Cambios' : 'Agregar al Staff'}
            </button>
          </div>

          {!editingId && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Activo ({staff.length})</p>
              {staff.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No hay personal registrado</p>
              )}
              {staff.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all">
                  <div className="flex items-center space-x-3">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 border border-slate-100">
                        <span className="material-symbols-outlined text-lg">{ROLE_ICONS[s.role] || 'person'}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                        {s.role} • {s.shiftStart}–{s.shiftEnd} • {(s.workDays || []).join(' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-container/30 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => setConfirmDeleteId(s.id)}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) onDeleteStaff(confirmDeleteId)
          setConfirmDeleteId(null)
        }}
        title="Eliminar Miembro del Staff"
        confirmLabel="Eliminar"
        variant="danger"
      >
        ¿Seguro que desea eliminar a este miembro del staff? Esta acción no se puede deshacer.
      </ConfirmDialog>
    </>
  )
}
