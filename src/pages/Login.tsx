import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../data/store'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated, role } = useAuth()
  const { state } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // If already authenticated, redirect to the correct home
  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    setTimeout(() => {
      setIsLoading(false)

      if (email.includes('admin')) {
        // Admin login
        setAuth('Administrador', 'ADMIN', email, 'admin')
        navigate('/admin')
      } else {
        // Try to match a known resident by email from store
        const matchedResident = state.residents.find(r => r.email === email)
        if (matchedResident) {
          setAuth(matchedResident.name, matchedResident.apartment, matchedResident.email, 'resident')
          navigate('/dashboard')
        } else {
          setError('Credenciales inválidas. Contacte al administrador para registrarse.')
        }
      }
    }, 800)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background font-body">
      {/* Left panel — Hero / Branding */}
      <div className="relative w-full md:w-1/2 lg:w-[45%] bg-primary flex flex-col justify-center p-12 lg:p-20 overflow-hidden">
        {/* Ambient background shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-surface-tint opacity-20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary opacity-10 blur-[120px] animate-pulse [animation-delay:2s]" />
          <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-tertiary-fixed-dim opacity-20 blur-[80px] animate-pulse [animation-delay:4s]" />
        </div>

        <div className="relative z-10 space-y-12">
          <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-12 h-12 bg-on-primary-fixed-variant rounded-2xl flex items-center justify-center text-on-primary shadow-lg shadow-primary-dim/20">
              <span className="material-symbols-outlined text-3xl">apartment</span>
            </div>
            <div>
              <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-primary">
                CantonAlfa
              </h1>
              <p className="text-xs font-label uppercase tracking-widest text-primary-fixed-dim font-bold">
                Management Portal
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl font-headline font-extrabold text-on-primary tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Elevate your <br />
              <span className="text-primary-fixed font-black italic">residential</span> <br />
              Standard.
            </h2>
            <p className="text-lg text-primary-fixed-dim max-w-sm font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              The zero-friction ecosystem for high-end digital estate management.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            {[
              { icon: 'shield', label: 'Secure' },
              { icon: 'speed', label: 'Real-time' },
              { icon: 'devices', label: 'Adaptive' }
            ].map((f) => (
              <div key={f.label} className="flex items-center space-x-2 bg-on-primary-fixed-variant/20 backdrop-blur-md px-4 py-2 rounded-xl border border-on-primary-fixed-variant/10">
                <span className="material-symbols-outlined text-lg text-primary-fixed">{f.icon}</span>
                <span className="text-sm font-bold text-on-primary font-label tracking-wide uppercase">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-12 lg:left-20 text-[10px] font-bold text-primary-fixed-dim/50 uppercase tracking-[0.3em] font-label z-10">
          © 2025 CANTON ALFA INC.
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-surface container-queries">
        <div className="max-w-md w-full mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700">
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-medium">Please enter your credentials to access the estate.</p>
          </div>

          {/* Quick access hint */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest mb-2">Acceso Rápido (Demo)</p>
            <div className="space-y-1 text-[11px] text-indigo-600 font-medium">
              <p><strong>Residente:</strong> sofia@property.com</p>
              <p><strong>Admin:</strong> admin@property.com</p>
              <p className="text-indigo-400 mt-1">Contraseña: cualquier texto</p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3">
              <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                  placeholder="name@property.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-sm font-medium text-slate-600 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary/20 transition-all" 
              />
              <label htmlFor="remember">Keep me signed in</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-[11px]">Sign In to Dashboard</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">trending_flat</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-auto pt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
        </div>
      </div>
    </div>
  )
}
