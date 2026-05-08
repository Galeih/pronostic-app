import { useState, useEffect, type FormEvent } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useToast } from '../../context/ToastContext'

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (pwd.length === 0)  return { score: 0, label: '',       color: '#2a2218' }
  if (pwd.length < 6)    return { score: 1, label: 'Faible', color: '#e05050' }
  let score = 1
  if (pwd.length >= 8)   score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 2) return { score, label: 'Faible', color: '#e05050' }
  if (score <= 3) return { score, label: 'Moyen',  color: '#c8880c' }
  return            { score, label: 'Fort',   color: '#a0ff70' }
}

function PasswordField({
  label, value, onChange, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={{ display:'block', fontSize:'0.75rem', fontFamily:'"Cinzel", serif', color:'#8a7a5a', marginBottom:'6px', letterSpacing:'0.08em' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          required
          style={{
            width:'100%', background:'#0e0c08', borderRadius:'4px', padding:'10px 40px 10px 16px',
            fontSize:'0.875rem', outline:'none', color:'#f0dfa8', transition:'border-color 0.2s',
            border:`1px solid ${error ? '#6b2020' : '#6b5010'}`,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = error ? '#c84040' : '#c8880c')}
          onBlur={e => (e.currentTarget.style.borderColor = error ? '#6b2020' : '#6b5010')}
        />
        <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#3a2d10', background:'none', border:'none', cursor:'pointer', fontFamily:'"Cinzel", serif', lineHeight:1 }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#c8880c')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#3a2d10')}>
          {show ? '◉' : '○'}
        </button>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  usePageTitle('Réinitialisation du mot de passe')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const token = searchParams.get('token') ?? ''

  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const strength        = passwordStrength(newPwd)
  const confirmMismatch = confirmPwd.length > 0 && confirmPwd !== newPwd
  const canSubmit       = !!newPwd && !!confirmPwd && !confirmMismatch && newPwd.length >= 8

  // Token manquant → redirection
  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true })
  }, [token, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsLoading(true)
    try {
      await authService.resetPassword(token, newPwd)
      setDone(true)
      success('Mot de passe réinitialisé ! Tu peux te connecter.')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Lien invalide ou expiré.'
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
          <Link to="/" style={{ fontFamily:'"Cinzel Decorative", serif', fontSize:'1.75rem', color:'#f5c842', letterSpacing:'0.05em' }}>
            Play-Orakl
          </Link>
          <p className="mt-2 text-sm" style={{ color:'#6b5010', fontFamily:'"Lora", serif', fontStyle:'italic' }}>
            Choisis un nouveau secret pour Orakl.
          </p>
        </div>

        <div className="relative p-8 rounded" style={{ background: '#161209', border: '1px solid #6b5010' }}>
          <span style={{ position:'absolute', top:8, left:8,   color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8,  color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, left:8,  color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', bottom:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>

          <h2 className="text-xl font-bold mb-6"
            style={{ fontFamily:'"Cinzel", serif', color:'#f0dfa8', textAlign:'center' }}>
            ✦ Nouveau mot de passe ✦
          </h2>
          <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', marginBottom:'24px' }} />

          {/* ── Succès ─────────────────────────────────────────────────── */}
          {done ? (
            <div className="text-center space-y-4">
              <p className="text-5xl" style={{ color: '#a0ff70' }}>✦</p>
              <p className="font-bold text-lg" style={{ fontFamily:'"Cinzel Decorative", serif', color:'#a0ff70' }}>
                Mot de passe réinitialisé !
              </p>
              <p className="text-sm" style={{ color: '#6b5010' }}>
                Tu peux maintenant te connecter avec ton nouveau mot de passe.
              </p>
              <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'16px 0' }} />
              <Link
                to="/login"
                className="inline-block font-bold py-3 px-8 rounded transition"
                style={{
                  background: 'linear-gradient(135deg, #a36808, #c8880c)',
                  color: '#0e0c08',
                  fontFamily: '"Cinzel", serif',
                  fontSize: '0.8rem',
                  border: '1px solid #f5c842',
                  letterSpacing: '0.08em',
                }}
              >
                ✦ Se connecter
              </Link>
            </div>
          ) : (
            /* ── Formulaire ──────────────────────────────────────────── */
            <>
              {error && (
                <div className="rounded px-4 py-3 text-sm mb-5"
                  style={{ background:'#2a0c0c', border:'1px solid #6b2020', color:'#e05050' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <PasswordField
                  label="Nouveau mot de passe"
                  value={newPwd}
                  onChange={setNewPwd}
                  placeholder="8 caractères minimum"
                />

                {/* Barre de force */}
                {newPwd.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full"
                          style={{ background: i <= Math.min(strength.score - 1, 4) ? strength.color : '#2a2218' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>
                      {strength.label}
                      {strength.score <= 2 && newPwd.length < 8 && ' — ajoute des chiffres ou majuscules'}
                    </p>
                  </div>
                )}

                <PasswordField
                  label="Confirmer le mot de passe"
                  value={confirmPwd}
                  onChange={setConfirmPwd}
                  error={confirmMismatch}
                />
                {confirmMismatch && (
                  <p className="text-xs" style={{ color: '#c84040' }}>Les mots de passe ne correspondent pas.</p>
                )}
                {!confirmMismatch && confirmPwd.length > 0 && confirmPwd === newPwd && (
                  <p className="text-xs" style={{ color: '#5aaa30' }}>✦ Correspond</p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || isLoading}
                  className="w-full font-semibold py-3 rounded transition flex items-center justify-center gap-2"
                  style={{
                    marginTop: '8px',
                    background: canSubmit && !isLoading ? 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)' : '#2a2218',
                    color: canSubmit && !isLoading ? '#0e0c08' : '#3a2d10',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.8rem',
                    letterSpacing: '0.1em',
                    border: `1px solid ${canSubmit ? '#f5c842' : '#2a2218'}`,
                    cursor: canSubmit && !isLoading ? 'pointer' : 'not-allowed',
                    boxShadow: canSubmit ? '0 0 20px #c8880c30' : 'none',
                  }}
                >
                  {isLoading && (
                    <span className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#3a2d10', borderTopColor: 'transparent' }} />
                  )}
                  {isLoading ? 'Orakl scelle le secret…' : '✦ Réinitialiser'}
                </button>
              </form>

              <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'24px 0' }} />
              <p className="text-center text-sm" style={{ color: '#6b5010' }}>
                <Link to="/login"
                  style={{ color:'#c8880c', fontFamily:'"Cinzel", serif', fontSize:'0.75rem' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f5c842')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#c8880c')}>
                  ← Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
