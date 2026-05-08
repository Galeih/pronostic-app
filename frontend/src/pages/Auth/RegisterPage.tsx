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

// ─── Force du mot de passe ────────────────────────────────────────────────────

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0)  return { score: 0, label: '',       color: '#2a2218' }
  if (pwd.length < 6)    return { score: 1, label: 'Faible', color: '#e05050' }
  let score = 1
  if (pwd.length >= 8)   score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 2) return { score, label: 'Faible',  color: '#e05050' }
  if (score <= 3) return { score, label: 'Moyen',   color: '#c8880c' }
  return            { score, label: 'Fort',    color: '#a0ff70' }
}

// ─── Champ mot de passe avec toggle ──────────────────────────────────────────

function PasswordField({
  value, onChange, placeholder, label, error, hint, autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label: string
  error?: boolean
  hint?: React.ReactNode
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
          style={{
            ...inputStyle,
            paddingRight: '40px',
            borderColor: error ? '#6b2020' : '#6b5010',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = error ? '#c84040' : '#c8880c')}
          onBlur={e => (e.currentTarget.style.borderColor = error ? '#6b2020' : '#6b5010')}
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
      {hint}
    </div>
  )
}

// ─── Page inscription ─────────────────────────────────────────────────────────

export default function RegisterPage() {
  usePageTitle('Inscription')
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()
  const { error: toastError } = useToast()

  const returnTo = (location.state as { from?: string } | null)?.from ?? '/'

  const [userName, setUserName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const userNameRef = useRef<HTMLInputElement>(null)
  useEffect(() => { userNameRef.current?.focus() }, [])

  const strength       = passwordStrength(password)
  const confirmMismatch = confirm.length > 0 && confirm !== password
  const userNameInvalid = userName.length > 0 && userName.length < 3

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm)  { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8)   { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    if (userName.length < 3)   { setError('Le pseudonyme doit faire au moins 3 caractères.'); return }
    setIsLoading(true)
    try {
      const res = await authService.register({ userName, email, password })
      login(res.token, res.user)
      navigate(returnTo, { replace: true })
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : data?.message
      const msg = firstError ?? 'Une erreur est survenue.'
      setError(msg)
      toastError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
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
            Orakl a déjà tout prévu.
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
            ✦ Orakl vous accepte ✦
          </h2>
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)', marginBottom: '24px' }} />

          {error && (
            <div className="rounded px-4 py-3 text-sm mb-5"
              style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Pseudo */}
            <div>
              <label style={labelStyle}>Pseudonyme</label>
              <input
                ref={userNameRef}
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="L'Élu des Étoiles"
                required minLength={3} maxLength={30}
                style={{ ...inputStyle, borderColor: userNameInvalid ? '#6b2020' : '#6b5010' }}
                onFocus={e => (e.currentTarget.style.borderColor = userNameInvalid ? '#c84040' : '#c8880c')}
                onBlur={e => (e.currentTarget.style.borderColor = userNameInvalid ? '#6b2020' : '#6b5010')}
              />
              {userNameInvalid && (
                <p className="text-xs mt-1" style={{ color: '#c84040' }}>
                  Au moins 3 caractères requis.
                </p>
              )}
              {userName.length >= 3 && (
                <p className="text-xs mt-1" style={{ color: '#5aaa30' }}>
                  ✦ {userName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
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

            {/* Mot de passe + force */}
            <PasswordField
              label="Mot de passe"
              value={password}
              onChange={setPassword}
              placeholder="8 caractères minimum"
              hint={
                password.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {/* Barre de force */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: i <= Math.min(strength.score - 1, 4) ? strength.color : '#2a2218' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>
                      {strength.label}
                      {strength.score <= 2 && password.length < 8 && ' — ajoute des chiffres ou majuscules'}
                    </p>
                  </div>
                ) : null
              }
            />

            {/* Confirmation */}
            <PasswordField
              label="Confirmer le mot de passe"
              value={confirm}
              onChange={setConfirm}
              error={confirmMismatch}
              hint={
                confirmMismatch ? (
                  <p className="text-xs mt-1" style={{ color: '#c84040' }}>
                    Les mots de passe ne correspondent pas.
                  </p>
                ) : confirm.length > 0 && confirm === password ? (
                  <p className="text-xs mt-1" style={{ color: '#5aaa30' }}>✦ Correspond</p>
                ) : null
              }
            />

            <button
              type="submit"
              disabled={isLoading || confirmMismatch || userNameInvalid}
              className="w-full font-semibold py-3 rounded transition flex items-center justify-center gap-2"
              style={{
                background: (isLoading || confirmMismatch || userNameInvalid) ? '#2a2218' : 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
                color: (isLoading || confirmMismatch || userNameInvalid) ? '#3a2d10' : '#0e0c08',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                border: `1px solid ${(confirmMismatch || userNameInvalid) ? '#3a2d10' : '#f5c842'}`,
                cursor: (isLoading || confirmMismatch || userNameInvalid) ? 'not-allowed' : 'pointer',
                boxShadow: (!isLoading && !confirmMismatch && !userNameInvalid) ? '0 0 20px #c8880c30' : 'none',
                marginTop: '8px',
              }}>
              {isLoading && (
                <span className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#3a2d10', borderTopColor: 'transparent' }} />
              )}
              {isLoading ? 'Orakl inscrit ton nom…' : '✦ Rejoindre le Cercle'}
            </button>
          </form>

          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)', margin: '24px 0' }} />

          <p className="text-center text-sm" style={{ color: '#6b5010' }}>
            Déjà initié ?{' '}
            <Link to="/login" state={{ from: returnTo }}
              style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f5c842')}
              onMouseLeave={e => (e.currentTarget.style.color = '#c8880c')}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
