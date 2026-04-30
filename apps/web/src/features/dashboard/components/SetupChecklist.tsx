/**
 * SetupChecklist — Day-zero onboarding & compact setup progress card.
 * Consumed by: AdminDashboard.
 *
 * Shows:
 *   - Full-page hero + step cards when system is "virgin" (no data yet)
 *   - Compact dark banner when partially configured
 */
import { Link, useNavigate } from 'react-router-dom'

interface SetupStep {
  id: string
  label: string
  description: string
  icon: string
  done: boolean
  optional?: boolean
  skipped?: boolean
  href: string
}

interface SetupChecklistProps {
  /** All setup steps with completion status */
  steps: SetupStep[]
  /** Whether the system has zero data (virgin state) */
  isSystemVirgin: boolean
  /** Whether to show the setup card at all */
  showSetupCard: boolean
  /** Callback to mark amenities as skipped */
  onSkipAmenities: () => void
}

export default function SetupChecklist({
  steps, isSystemVirgin, showSetupCard, onSkipAmenities,
}: SetupChecklistProps) {
  const navigate = useNavigate()
  const completedSteps = steps.filter(s => s.done).length

  // ── Full Virgin Onboarding ──
  if (isSystemVirgin) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Hero welcome */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 md:p-16 text-center shadow-2xl shadow-slate-300/30">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          <div className="relative z-10 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <span className="material-symbols-outlined text-3xl text-white/80">rocket_launch</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight mb-4">
              Bienvenido a Vilkor
            </h1>
            <p className="text-white/60 font-medium leading-relaxed text-base md:text-lg max-w-lg mx-auto">
              Tu plataforma de gestión inmobiliaria está lista. Completa los pasos a continuación para activar todos los módulos del sistema.
            </p>
          </div>
        </section>

        {/* Step cards */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-headline font-extrabold text-slate-900 tracking-tight">Configuración Inicial</h2>
              <p className="text-sm text-slate-400 font-medium mt-0.5">Completa cada paso para habilitar el panel operativo</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-900">{completedSteps}<span className="text-slate-300">/{steps.length}</span></span>
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {steps.map((step, i) => {
              const isLocked = i > 0 && !steps[i - 1].done
              const isActive = !step.done && !isLocked
              const isOptionalPrompt = isActive && !!step.optional

              // Optional step — render as choice prompt
              if (isOptionalPrompt) {
                return (
                  <div key={step.id} className="relative flex flex-col gap-4 p-5 rounded-2xl border-2 bg-white border-primary/20 shadow-md shadow-primary/5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-xl">{step.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                          Paso {i + 1} — Opcional
                        </span>
                        <h3 className="text-sm font-bold mt-1 leading-snug text-slate-900">{step.label}</h3>
                        <p className="text-xs mt-1 leading-relaxed text-slate-400">
                          ¿Tu edificio cuenta con áreas comunes o amenidades?
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={() => navigate(step.href)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all">
                        <span className="material-symbols-outlined text-base">add_circle</span>Configurar ahora
                      </button>
                      <button onClick={onSkipAmenities}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-200">
                        <span className="material-symbols-outlined text-base">do_not_disturb_on</span>No por ahora
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium text-center leading-relaxed">
                      Puedes agregar amenidades en cualquier momento desde{' '}
                      <Link to="/configuracion?tab=perfil" className="underline hover:text-slate-500 transition-colors">Configuración</Link>
                    </p>
                  </div>
                )
              }

              // Normal step
              return (
                <Link
                  key={step.id}
                  to={isLocked ? '#' : step.href}
                  onClick={isLocked ? (e) => e.preventDefault() : undefined}
                  className={`group relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 ${
                    step.done
                      ? step.skipped
                        ? 'bg-slate-50 border-slate-100 cursor-default pointer-events-none opacity-60'
                        : 'bg-emerald-50/50 border-emerald-100 cursor-default pointer-events-none'
                      : isLocked
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    step.done
                      ? step.skipped ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'
                      : isLocked ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'
                  }`}>
                    {step.done
                      ? step.skipped
                        ? <span className="material-symbols-outlined text-xl">skip_next</span>
                        : <span className="material-symbols-outlined text-xl">check_circle</span>
                      : isLocked
                        ? <span className="material-symbols-outlined text-xl">lock</span>
                        : <span className="material-symbols-outlined text-xl">{step.icon}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      step.done
                        ? step.skipped ? 'text-slate-400' : 'text-emerald-500'
                        : isLocked ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      Paso {i + 1}
                      {step.done ? step.skipped ? ' — Omitido' : ' ✓' : isLocked ? ' — Bloqueado' : ''}
                    </span>
                    <h3 className={`text-sm font-bold mt-1 leading-snug ${
                      step.done
                        ? step.skipped ? 'text-slate-400' : 'text-emerald-700 line-through decoration-emerald-300'
                        : isLocked ? 'text-slate-300' : 'text-slate-900'
                    }`}>{step.label}</h3>
                    <p className={`text-xs mt-1 leading-relaxed ${
                      step.done
                        ? step.skipped ? 'text-slate-400' : 'text-emerald-500/70'
                        : isLocked ? 'text-slate-300' : 'text-slate-400'
                    }`}>
                      {step.done && step.skipped
                        ? 'Puedes activarlo cuando quieras desde Configuración'
                        : isLocked ? `Completa el paso ${i} primero` : step.description}
                    </p>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-slate-200 group-hover:text-slate-500 text-lg shrink-0 mt-1 transition-all group-hover:translate-x-0.5">
                      arrow_forward
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  // ── Compact Banner (partially configured) ──
  if (!showSetupCard) return null

  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-base">rocket_launch</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">Configuración pendiente</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-white/50">{completedSteps}/{steps.length}</span>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {steps.filter(s => !s.done).map((step) => {
          const originalIndex = steps.indexOf(step)
          const isLocked = originalIndex > 0 && !steps[originalIndex - 1].done
          return isLocked ? (
            <span key={step.id} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 opacity-40 cursor-not-allowed">
              <span className="material-symbols-outlined text-white/40 text-sm">lock</span>
              <span className="text-[11px] font-bold text-white/40">{step.label}</span>
            </span>
          ) : (
            <Link key={step.id} to={step.href}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all">
              <span className="material-symbols-outlined text-white/60 text-sm">{step.icon}</span>
              <span className="text-[11px] font-bold text-white/80 group-hover:text-white">{step.label}</span>
              <span className="material-symbols-outlined text-white/30 group-hover:text-white/60 text-sm">arrow_forward</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
