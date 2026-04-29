/**
 * ProfilePage — Unified profile management for ALL roles.
 *
 * Sections:
 *   1. Avatar & Identity — pic upload, name (read-only for residents)
 *   2. Contact Information — email, phone (self-editable)
 *   3. Property Assignment — apartment, tower (read-only for residents)
 *   4. Security — change password, active sessions
 *
 * Replaces the old ResidentConfiguracion with a role-aware page
 * that persists to the API (not local store).
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../core/auth/AuthContext'
import { profileApi } from '../../lib/api'

// ─── Types ───────────────────────────────────────────────────────────

interface ProfileData {
  user: { id: string; name: string; email: string; image: string | null; createdAt: number }
  tenant: { role: string; apartment: string | null }
  resident: { name: string; apartment: string; tower: string; email: string; phone?: string } | null
  activeSessions: number
}

interface SessionInfo {
  id: string; isCurrent: boolean; createdAt: number
  lastActive: number; ipAddress: string | null; userAgent: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrador',
  administracion: 'Administración',
  operador: 'Operador',
  residente: 'Residente Verificado',
}

function compressImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = maxSize
        canvas.height = maxSize
        const ctx = canvas.getContext('2d')!
        // Center-crop
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseUA(ua: string | null): string {
  if (!ua) return 'Desconocido'
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Edg')) return 'Edge'
  return 'Navegador'
}

// ─── Styles ──────────────────────────────────────────────────────────

const inputClass = "block w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-slate-900 transition-all font-semibold text-sm placeholder-slate-300 shadow-sm"
const disabledClass = "block w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-bold text-sm cursor-not-allowed opacity-80"
const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3"

// ─── Component ───────────────────────────────────────────────────────

export default function ProfilePage() {
  const { role, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  // Data states
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password states
  const [showPwSection, setShowPwSection] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  // Avatar states
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Sessions
  const [showSessions, setShowSessions] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // ── Load profile ──
  const loadProfile = useCallback(async () => {
    try {
      const data = await profileApi.getMe()
      setProfile(data)
      setFormEmail(data.resident?.email || data.user.email)
      setFormPhone(data.resident?.phone || '')
    } catch (e: any) {
      setError(e.message || 'Error loading profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])

  // ── Save contact info ──
  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await profileApi.updateMe({ email: formEmail, phone: formPhone })
      await refreshProfile()
      await loadProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Avatar upload ──
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5_000_000) {
      setError('Imagen demasiado grande. Máximo 5MB.')
      return
    }
    setAvatarUploading(true)
    try {
      const compressed = await compressImage(file)
      await profileApi.uploadAvatar(compressed)
      await refreshProfile()
      await loadProfile()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true)
    try {
      await profileApi.removeAvatar()
      await refreshProfile()
      await loadProfile()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Password change ──
  const handleChangePassword = async () => {
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Las contraseñas no coinciden'); return }
    if (newPw.length < 8) { setPwError('Mínimo 8 caracteres'); return }
    if (!/[A-Z]/.test(newPw)) { setPwError('Debe incluir al menos una mayúscula'); return }
    if (!/[0-9]/.test(newPw)) { setPwError('Debe incluir al menos un número'); return }

    setPwSaving(true)
    try {
      await profileApi.changePassword(currentPw, newPw)
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(false); setShowPwSection(false) }, 3000)
    } catch (e: any) {
      setPwError(e.message || 'Error al cambiar contraseña')
    } finally {
      setPwSaving(false)
    }
  }

  // ── Sessions ──
  const loadSessions = async () => {
    try {
      const data = await profileApi.getSessions()
      setSessions(data)
    } catch { /* ignore */ }
  }

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id)
    try {
      await profileApi.revokeSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
    setRevokingId(null)
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm font-medium">
        {error || 'No se pudo cargar el perfil'}
      </div>
    )
  }

  const { user, tenant, resident } = profile
  const isAdmin = role === 'super_admin' || role === 'administracion'
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <div className="space-y-10 max-w-3xl animate-in fade-in duration-700">
      {/* Error banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
          <span className="text-sm font-medium text-rose-700 flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Mi Perfil</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Gestione su identidad digital y seguridad de cuenta.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`flex items-center space-x-3 px-8 py-4 font-black rounded-2xl transition-all shadow-xl text-[10px] tracking-[0.2em] uppercase ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-200'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200 active:scale-95 disabled:opacity-50'
          }`}
        >
          <span className="material-symbols-outlined text-lg font-bold">{saved ? 'check_circle' : 'save'}</span>
          <span>{saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* ── Avatar & Identity ── */}
      <section className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 border border-slate-100 z-0" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 mb-10">
          {/* Avatar with upload */}
          <div className="relative">
            <div className={`w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl transition-transform duration-500 ${avatarUploading ? 'animate-pulse' : 'group-hover:scale-105'}`}>
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-500 font-black text-2xl">{initials}</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg"
                title="Cambiar foto"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
              {user.image && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg"
                  title="Eliminar foto"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Identity info */}
          <div className="text-center md:text-left">
            <p className="text-2xl font-headline font-black text-slate-900 tracking-tighter">{user.name}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1.5">
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                isAdmin ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {ROLE_LABELS[tenant.role] || tenant.role}
              </span>
              {tenant.apartment && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {tenant.apartment}{resident?.tower ? ` — Torre ${resident.tower}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Contact Information ── */}
        <div className="relative z-10 space-y-8">
          <div className="flex items-center space-x-4 border-l-4 border-slate-900 pl-4 py-1">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] font-headline">Información de Contacto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>Correo Electrónico</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-5 flex items-center text-slate-300">
                  <span className="material-symbols-outlined text-lg">alternate_email</span>
                </span>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => { setFormEmail(e.target.value); setSaved(false) }}
                  className={`${inputClass} pl-12`}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Teléfono</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-5 flex items-center text-slate-300">
                  <span className="material-symbols-outlined text-lg">phone</span>
                </span>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => { setFormPhone(e.target.value); setSaved(false) }}
                  placeholder="+52 55 1234 5678"
                  className={`${inputClass} pl-12`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Property Assignment (Read-only for residents) ── */}
      {tenant.apartment && (
        <section className="bg-slate-50 border border-slate-200 rounded-3xl p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200">
                <span className="material-symbols-outlined text-lg">home_pin</span>
              </div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] font-headline">Datos de Propiedad</h3>
            </div>
            <div className="px-4 py-2 bg-white/50 border border-white rounded-xl flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Solo Lectura</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className={labelClass}>Unidad Privativa</label>
              <input type="text" value={tenant.apartment} disabled className={disabledClass} />
            </div>
            <div className="space-y-3">
              <label className={labelClass}>Torre / Sección</label>
              <input type="text" value={resident?.tower ? `Torre ${resident.tower}` : 'No asignado'} disabled className={disabledClass} />
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start space-x-4">
            <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5">info</span>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Los datos de propiedad son gestionados por la administración. Contacte al administrador para solicitar cambios.
            </p>
          </div>
        </section>
      )}

      {/* ── Security ── */}
      <section className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm space-y-8">
        <div className="flex items-center space-x-4 border-l-4 border-slate-900 pl-4 py-1">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] font-headline">Seguridad</h3>
        </div>

        {/* Password Change */}
        <div className="space-y-4">
          <button
            onClick={() => { setShowPwSection(!showPwSection); setPwError(''); setPwSuccess(false) }}
            className="flex items-center justify-between w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200 group-hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined text-lg">lock</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Cambiar Contraseña</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mínimo 8 caracteres, 1 mayúscula, 1 número</p>
              </div>
            </div>
            <span className={`material-symbols-outlined text-slate-300 transition-transform ${showPwSection ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {showPwSection && (
            <div className="space-y-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
              {pwSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-sm font-bold">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Contraseña actualizada exitosamente
                </div>
              )}
              {pwError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm font-medium">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {pwError}
                </div>
              )}
              <div className="space-y-1">
                <label className={labelClass}>Contraseña Actual</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className={inputClass} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Nueva Contraseña</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className={inputClass} placeholder="••••••••" />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Confirmar Contraseña</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className={inputClass} placeholder="••••••••" />
                </div>
              </div>
              {/* Password strength indicators */}
              <div className="flex flex-wrap gap-2">
                {[
                  { ok: newPw.length >= 8, label: '8+ caracteres' },
                  { ok: /[A-Z]/.test(newPw), label: '1 mayúscula' },
                  { ok: /[0-9]/.test(newPw), label: '1 número' },
                  { ok: newPw === confirmPw && newPw.length > 0, label: 'Coinciden' },
                ].map(r => (
                  <span key={r.label} className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                    r.ok ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-300 border-slate-200'
                  }`}>
                    <span className="material-symbols-outlined text-[10px] mr-1 align-middle">{r.ok ? 'check' : 'close'}</span>
                    {r.label}
                  </span>
                ))}
              </div>
              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !currentPw || !newPw || newPw !== confirmPw}
                className="w-full py-3.5 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pwSaving ? 'Procesando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="space-y-4">
          <button
            onClick={() => { setShowSessions(!showSessions); if (!showSessions) loadSessions() }}
            className="flex items-center justify-between w-full p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200 group-hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined text-lg">devices</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Sesiones Activas</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {profile.activeSessions} {profile.activeSessions === 1 ? 'sesión activa' : 'sesiones activas'}
                </p>
              </div>
            </div>
            <span className={`material-symbols-outlined text-slate-300 transition-transform ${showSessions ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {showSessions && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              {sessions.map(s => (
                <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl border ${
                  s.isCurrent ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      s.isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-lg">
                        {s.userAgent?.includes('Mobile') ? 'phone_android' : 'laptop'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{parseUA(s.userAgent)}</p>
                        {s.isCurrent && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {s.ipAddress || 'IP desconocida'} · {new Date(s.lastActive * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                    >
                      {revokingId === s.id ? '...' : 'Cerrar'}
                    </button>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-center text-[10px] text-slate-400 py-4 font-bold uppercase tracking-widest">
                  Cargando sesiones...
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
