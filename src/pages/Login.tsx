import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { seedResidents } from '../data/seed'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)

      if (email.includes('admin')) {
        // Admin login
        setAuth('Administrador', 'ADMIN', email, 'admin')
        navigate('/admin')
      } else {
        // Try to match a known resident by email
        const matchedResident = seedResidents.find(r => r.email === email)
        if (matchedResident) {
          setAuth(matchedResident.name, matchedResident.apartment, matchedResident.email, 'resident')
        } else {
          // Default resident
          setAuth('Juan Antonio', 'A201', email || 'juan@property.com', 'resident')
        }
        navigate('/dashboard')
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
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <a href="#" className="text-[10px] font-bold text-primary hover:text-primary-dim uppercase tracking-widest transition-colors">
                  Forgot?
                </a>
              </div>
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-surface px-4 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center space-x-2 py-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-900 group">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs uppercase tracking-widest">Google</span>
            </button>
            <button className="flex items-center justify-center space-x-2 py-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-900 group">
              <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-primary transition-colors">fingerprint</span>
              <span className="text-xs uppercase tracking-widest">Face ID</span>
            </button>
          </div>
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
