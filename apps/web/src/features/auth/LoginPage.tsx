/**
 * LoginPage — Authenticates users via Better Auth API.
 *
 * Calls POST /api/auth/sign-in/email with real credentials.
 * Shows demo credentials only when API reports APP_MODE=demo.
 *
 * Roles (from backend):
 *   - super_admin / administracion / operador → /admin
 *   - residente → /dashboard
 */
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../core/auth/AuthContext'
import { useDemoMode } from '../../core/hooks/useDemoMode'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface DemoAccount {
  label: string
  role: string
  email: string
  password: string
}

export default function LoginPage() {
  const { login, isAuthenticated, role, isLoading: authLoading } = useAuth()
  const isDemoMode = useDemoMode()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])

  // Fetch the actual account list for the dropdown (separate from isDemoMode)
  useEffect(() => {
    if (!isDemoMode) return
    fetch(`${API_URL}/api/demo/accounts`)
      .then(r => r.json())
      .then(d => setDemoAccounts(d.accounts ?? []))
      .catch(() => {})
  }, [isDemoMode])

  // Redirect if already logged in
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    const home = (role === 'super_admin' || role === 'administracion' || role === 'operador') ? '/admin' : '/dashboard'
    return <Navigate to={home} replace />
  }

  /**
   * Handles the login submission via Better Auth API.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(email, password)

    if (result.ok) {
      // Auth state updated — trigger re-render which will redirect via <Navigate>
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } else {
      setError(result.error || 'Credenciales inválidas')
      setIsLoading(false)
    }
  }

  /** Quick-fill a demo credential */
  const fillCredentials = (e: string, p: string) => {
    setEmail(e)
    setPassword(p)
    setError('')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Left Image/Brand Section ── */}
      <div className="relative w-full md:w-1/2 lg:w-[45%] bg-slate-900 flex flex-col justify-center p-12 lg:p-20 overflow-hidden">
        {/* Decorative architectural background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        </div>

        <div className="relative z-10 space-y-16">
          <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl">
              <span className="material-symbols-outlined text-3xl font-bold">apartment</span>
            </div>
            <div>
              <h1 className="text-3xl font-headline font-extrabold tracking-tight text-white leading-none">
                CantonAlfa
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-emerald-400 mt-2">
                Digital Estate
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-5xl lg:text-6xl font-headline font-extrabold text-white tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
              The Art of <br />
              <span className="text-emerald-400">Living</span> <br />
              Refined.
            </h2>
            <p className="text-xl text-slate-400 max-w-sm font-medium leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
              Transforming physical residency into a seamless, unified digital ecosystem.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            {['Secure', 'Real-time', 'Elite'].map((tag) => (
              <div key={tag} className="px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                {tag}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-12 left-12 lg:left-20 text-[9px] font-black text-white/20 uppercase tracking-[0.5em] z-10">
          PropTech by CantonAlfa © 2025
        </div>
      </div>

      {/* ── Right Form Section ── */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white relative">
        <div className="max-w-md w-full mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-3">
            <h2 className="text-4xl font-headline font-extrabold text-slate-900 tracking-tight">Access Gate</h2>
            <p className="text-slate-500 font-medium text-lg">Experience the next generation of property management.</p>
          </div>

          {/* Demo account selector — only shown when APP_MODE=demo */}
          {isDemoMode && (
            <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-2xl relative overflow-hidden">
              {/* Demo badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 text-amber-900 text-[9px] font-black uppercase tracking-widest rounded-full">
                  <span className="material-symbols-outlined text-[11px]">science</span>
                  Demo Mode
                </span>
                <p className="text-[10px] font-semibold text-amber-700">
                  Select an account to log in instantly
                </p>
              </div>

              {/* Dropdown */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-500 pointer-events-none">
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                </span>
                <select
                  id="demo-account-select"
                  defaultValue=""
                  onChange={(e) => {
                    const acct = DEMO_ACCOUNTS.find(a => a.email === e.target.value)
                    if (acct) {
                      fillCredentials(acct.email, acct.password)
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-amber-200 rounded-xl text-[12px] font-semibold text-slate-800 appearance-none cursor-pointer outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                >
                  <option value="" disabled>— Choose a demo account —</option>
                  {demoAccounts.map((acct) => (
                    <option key={acct.email} value={acct.email}>
                      {acct.label} · {acct.email}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-400 pointer-events-none">
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-700 animate-in shake-x duration-500">
              <span className="material-symbols-outlined text-lg">error_outline</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                E-mail Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <span className="material-symbols-outlined text-xl">person</span>
                </span>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-14 pr-4 py-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-slate-900 transition-all font-semibold"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <a href="#" className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">Forgot?</a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-14 pr-14 py-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:bg-white focus:border-slate-900 transition-all font-semibold"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 py-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-2xl shadow-slate-200 transition-all group overflow-hidden relative"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-[11px] relative z-10">Initialize Portal</span>
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform relative z-10">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-auto pt-10 flex justify-center space-x-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-slate-900 transition-colors">Legal</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Get Assistance</a>
        </div>
      </div>
    </div>
  )
}
