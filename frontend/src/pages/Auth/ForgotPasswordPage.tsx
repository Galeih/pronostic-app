import { useState, type FormEvent } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

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

export default function ForgotPasswordPage() {
  usePageTitle('Mot de passe oublié')
  const { error: toastError } = useToast()

  const [email, setEmail]           = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [resetLink, setResetLink]   = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const res = await authService.forgotPassword(email)
      if (res.resetToken) {
        setResetToken(res.resetToken)
        const link = `${window.location.origin}/reset-password?token=${res.resetToken}`
        setResetLink(link)
      } else {
        // Email inexistant — on affiche le même message (sécurité)
        setResetToken('__none__')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Une erreur est survenue.'
      setError(msg)
      toastError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = () => {
    if (!resetLink) return
    navigator.clipboard.writeText(resetLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
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
            Orakl peut redonner accès aux égarés.
          </p>
        </div>

        <div className="relative p-8 rounded" style={{ background: '#161209', border: '1px solid #6b5010' }}>
          <span style={{ position:'absolute', top:8, left:8,   color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8,  color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, left:8,  color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>

          <h2 className="text-xl font-bold mb-1"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8', textAlign: 'center' }}>
            ✦ Mot de passe oublié ✦
          </h2>
          <p className="text-xs text-center mb-6" style={{ color: '#6b5010' }}>
            Saisis ton email pour obtenir un lien de réinitialisation.
          </p>

          <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', marginBottom:'24px' }} />

          {/* ── État : lien généré ──────────────────────────────────────── */}
          {resetToken && (
            <div className="text-center space-y-4">
              {resetToken === '__none__' ? (
                <>
                  <p className="text-4xl mb-2" style={{ color: '#c8880c' }}>✦</p>
                  <p className="text-sm font-semibold" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                    Si cet email existe dans le Cercle,
                  </p>
                  <p className="text-sm" style={{ color: '#6b5010' }}>
                    un lien de réinitialisation a été généré. Contacte un administrateur pour l'obtenir.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl mb-2" style={{ color: '#a0ff70' }}>✦</p>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                    Lien de réinitialisation généré !
                  </p>
                  <p className="text-xs mb-4" style={{ color: '#6b5010' }}>
                    Copie ce lien et partage-le manuellement avec l'utilisateur. Il expire dans 1 heure.
                  </p>

                  {/* Lien */}
                  <div className="rounded px-3 py-2.5 text-left mb-3"
                    style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
                    <p className="text-xs break-all" style={{ color: '#6b5010', fontFamily: 'monospace' }}>
                      {resetLink}
                    </p>
                  </div>

                  <button
                    onClick={copyLink}
                    className="w-full font-bold py-3 rounded transition"
                    style={{
                      background: copied ? '#1a2810' : 'linear-gradient(135deg, #a36808, #c8880c)',
                      color: copied ? '#a0ff70' : '#0e0c08',
                      fontFamily: '"Cinzel", serif',
                      fontSize: '0.8rem',
                      border: `1px solid ${copied ? '#3a8a20' : '#f5c842'}`,
                      cursor: 'pointer',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {copied ? '✓ Lien copié !' : '◈ Copier le lien'}
                  </button>

                  <p className="text-xs mt-3" style={{ color: '#3a2d10' }}>
                    Token brut : <span style={{ fontFamily: 'monospace', color: '#2a2218', wordBreak: 'break-all' }}>{resetToken}</span>
                  </p>
                </>
              )}

              <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'16px 0' }} />
              <Link to="/login"
                style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f5c842')}
                onMouseLeave={e => (e.currentTarget.style.color = '#c8880c')}>
                ← Retour à la connexion
              </Link>
            </div>
          )}

          {/* ── État : formulaire ───────────────────────────────────────── */}
          {!resetToken && (
            <>
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

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full font-semibold py-3 rounded transition flex items-center justify-center gap-2"
                  style={{
                    background: (!isLoading && email) ? 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)' : '#2a2218',
                    color: (!isLoading && email) ? '#0e0c08' : '#3a2d10',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    border: `1px solid ${email ? '#f5c842' : '#2a2218'}`,
                    cursor: (!isLoading && email) ? 'pointer' : 'not-allowed',
                    boxShadow: email ? '0 0 20px #c8880c30' : 'none',
                  }}
                >
                  {isLoading && (
                    <span className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#3a2d10', borderTopColor: 'transparent' }} />
                  )}
                  {isLoading ? 'Orakl cherche ton âme…' : '✦ Générer un lien'}
                </button>
              </form>

              <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'24px 0' }} />

              <p className="text-center text-sm" style={{ color: '#6b5010' }}>
                Tu te souviens ?{' '}
                <Link to="/login"
                  style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f5c842')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c8880c')}>
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
