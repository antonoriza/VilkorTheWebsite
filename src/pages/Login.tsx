import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulated login
    setTimeout(() => {
      setIsLoading(false)
      if (email.includes('admin')) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }, 800)
  }

  return (
    <div className="login-page">
      {/* Left panel — Hero / Branding */}
      <div className="login-hero">
        <div className="login-hero__content">
          <div className="login-hero__logo animate-fade-in-up">
            <div className="login-hero__logo-icon">
              <span className="icon icon-lg" style={{ color: 'var(--on-primary)' }}>apartment</span>
            </div>
          </div>
          <h1 className="display-md login-hero__title animate-fade-in-up stagger-1">
            CantonAlfa
          </h1>
          <p className="body-lg login-hero__subtitle animate-fade-in-up stagger-2">
            Management Portal
          </p>
          <div className="login-hero__features animate-fade-in-up stagger-3">
            <div className="login-hero__feature">
              <span className="icon icon-sm">shield</span>
              <span>Secure Access</span>
            </div>
            <div className="login-hero__feature">
              <span className="icon icon-sm">speed</span>
              <span>Real-time</span>
            </div>
            <div className="login-hero__feature">
              <span className="icon icon-sm">devices</span>
              <span>Multi-device</span>
            </div>
          </div>
        </div>
        
        {/* Ambient background shapes */}
        <div className="login-hero__bg">
          <div className="login-hero__orb login-hero__orb--1" />
          <div className="login-hero__orb login-hero__orb--2" />
          <div className="login-hero__orb login-hero__orb--3" />
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="login-form-panel">
        <div className="login-form-container animate-fade-in-scale">
          <div className="login-form__header">
            <h2 className="headline-lg">Welcome Back</h2>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>
              Enter your credentials to access your estate dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="login-email" className="input-label">Email</label>
              <div className="input-with-icon">
                <span className="icon icon-sm input-icon">mail</span>
                <input
                  id="login-email"
                  type="email"
                  className="input-field input-field--with-icon"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="login-password" className="input-label">Password</label>
              <div className="input-with-icon">
                <span className="icon icon-sm input-icon">lock</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-field--with-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <span className="icon icon-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="login-form__options">
              <label className="login-checkbox">
                <input type="checkbox" />
                <span className="body-sm">Remember me</span>
              </label>
              <a href="#" className="login-link body-sm">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-lg w-full login-submit ${isLoading ? 'login-submit--loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  Sign In
                  <span className="icon icon-sm">arrow_forward</span>
                </>
              )}
            </button>

            <div className="login-divider">
              <span className="login-divider__line" />
              <span className="body-sm" style={{ color: 'var(--outline)' }}>or continue with</span>
              <span className="login-divider__line" />
            </div>

            <div className="login-social">
              <button type="button" className="btn btn-secondary login-social-btn">
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button type="button" className="btn btn-secondary login-social-btn">
                <span className="icon icon-sm">fingerprint</span>
                Biometric
              </button>
            </div>
          </form>

          <p className="login-register body-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Don't have an account?{' '}
            <a href="#" className="login-link">Request access</a>
          </p>
        </div>

        <footer className="login-footer">
          <a href="#" className="login-footer-link body-sm">Privacy Policy</a>
          <a href="#" className="login-footer-link body-sm">Terms of Service</a>
          <a href="#" className="login-footer-link body-sm">Help Center</a>
        </footer>
      </div>
    </div>
  )
}
