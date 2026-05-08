import { useState, useRef, useEffect, type FormEvent } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { authService } from '../../services/authService'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0e0c08',
  border: '1px solid #6b5010',
  color: '#f0dfa8',
  borderRadius: '4px',
  padding: '10px 16px',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontFamily: '"Cinzel", serif',
  color: '#8a7a5a',
  marginBottom: '6px',
  letterSpacing: '0.08em',
}

function PasswordField({
  value, onChange, placeholder, label, autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label: string
  autoFocus?: boolean
}) {
  const [show, setShow] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (autoFocus) ref.current?.focus() }, [autoFocus])

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          required
          style={{ ...inputStyle, paddingRight: '40px' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
          onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition"
          style={{ color: '#3a2d10', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Cinzel", serif', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a2d10')}
          tabIndex={-1}
        >
          {show ? '◉' : '○'}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  usePageTitle('Connexion')
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()
  const { error: toastError } = useToast()

  const returnTo = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => { emailRef.current?.focus() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password })
      login(res.token, res.user)
      navigate(returnTo, { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Email ou mot de passe incorrect.'
      setError(msg)
      toastError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0e0c08', backgroundImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, #c8880c14 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/"
            style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: '1.75rem', color: '#f5c842', letterSpacing: '0.05em' }}>
            Play-Orakl
          </Link>
          <p className="mt-2 text-sm" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Orakl vous attendait.
          </p>
        </div>

        {/* Carte */}
        <div className="relative p-8 rounded" style={{ background: '#161209', border: '1px solid #6b5010' }}>
          <span style={{ position: 'absolute', top: 8, left: 8,   color: '#c8880c', fontSize: '10px' }}>◆</span>
          <span style={{ position: 'absolute', top: 8, right: 8,  color: '#c8880c', fontSize: '10px' }}>◆</span>
          <span style={{ position: 'absolute', bottom: 8, left: 8,  color: '#c8880c', fontSize: '10px' }}>◆</span>
          <span style={{ position: 'absolute', bottom: 8, right: 8, color: '#c8880c', fontSize: '10px' }}>◆</span>

          <h2 className="text-xl font-bold mb-6"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8', textAlign: 'center' }}>
            ✦ Orakl vous reconnaît ✦
          </h2>
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)', marginBottom: '24px' }} />

          {error && (
            <div className="rounded px-4 py-3 text-sm mb-5"
              style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label style={labelStyle}>Email</label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
              />
            </div>

            <PasswordField
              label="Mot de passe"
              value={password}
              onChange={setPassword}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold py-3 rounded transition flex items-center justify-center gap-2"
              style={{
                background: isLoading ? '#6b5010' : 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
                color: '#0e0c08',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                border: '1px solid #f5c842',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading ? 'none' : '0 0 20px #c8880c30',
              }}>
              {isLoading && (
                <span className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />
              )}
              {isLoading ? 'Orakl vérifie…' : '✦ Se connecter'}
            </button>
          </form>

          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)', margin: '24px 0' }} />

          <p className="text-center text-sm" style={{ color: '#6b5010' }}>
            Pas encore initié ?{' '}
            <Link to="/register" state={{ from: returnTo }}
              style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f5c842')}
              onMouseLeave={e => (e.currentTarget.style.color = '#c8880c')}>
              Rejoindre le Cercle
            </Link>
          </p>
          <p className="text-center text-xs mt-3" style={{ color: '#3a2d10' }}>
            <Link to="/forgot-password"
              style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6b5010')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3a2d10')}>
              Mot de passe oublié ?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
