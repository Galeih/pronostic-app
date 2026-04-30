import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

const inputStyle = {
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

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontFamily: '"Cinzel", serif',
  color: '#8a7a5a',
  marginBottom: '6px',
  letterSpacing: '0.08em',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await authService.login({ email, password })
      login(res.token, res.user)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Une erreur est survenue.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: '#0e0c08',
        backgroundImage: 'radial-gradient(ellipse 60% 60% at 50% 0%, #c8880c14 0%, transparent 70%)',
      }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link
            to="/"
            style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: '1.75rem', color: '#f5c842', letterSpacing: '0.05em' }}
          >
            Play-Orakl
          </Link>
          <p className="mt-2 text-sm" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Les astres vous attendaient.
          </p>
        </div>

        {/* Card */}
        <div
          className="relative p-8 rounded"
          style={{ background: '#161209', border: '1px solid #6b5010' }}
        >
          {/* Corner ornaments */}
          <span style={{ position:'absolute', top:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>

          <h2
            className="text-xl font-bold mb-6"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8', textAlign: 'center' }}
          >
            ✦ Entrer dans le Cercle ✦
          </h2>

          {/* Gold divider */}
          <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', marginBottom:'24px' }} />

          {error && (
            <div
              className="rounded px-4 py-3 text-sm mb-5"
              style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-semibold py-3 rounded transition flex items-center justify-center gap-2"
              style={{
                background: isLoading
                  ? '#6b5010'
                  : 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
                color: '#0e0c08',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                border: '1px solid #f5c842',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading && (
                <span
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }}
                />
              )}
              {isLoading ? 'Consultation des astres...' : '✦ Se connecter'}
            </button>
          </form>

          <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'24px 0' }} />

          <p className="text-center text-sm" style={{ color: '#6b5010' }}>
            Pas encore initié ?{' '}
            <Link
              to="/register"
              style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f5c842')}
              onMouseLeave={e => (e.currentTarget.style.color = '#c8880c')}
            >
              Rejoindre le Cercle
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
