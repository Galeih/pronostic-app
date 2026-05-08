import { useState, type FormEvent } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { userService } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

// ─── Helpers partagés ─────────────────────────────────────────────────────────

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0e0c08',
  border: '1px solid #6b5010',
  color: '#f0dfa8',
  borderRadius: '4px',
  padding: '10px 16px',
  fontSize: '0.875rem',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontFamily: '"Cinzel", serif',
  color: '#8a7a5a',
  marginBottom: '6px',
  letterSpacing: '0.08em',
}

const cardStyle: React.CSSProperties = {
  background: '#161209',
  border: '1px solid #6b5010',
  borderRadius: '6px',
  padding: '24px',
  marginBottom: '20px',
  position: 'relative',
}

// ─── Champ mot de passe avec toggle ──────────────────────────────────────────

function PasswordField({
  label, value, onChange, placeholder, error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          style={{ ...inputStyle, paddingRight: '40px', borderColor: error ? '#6b2020' : '#6b5010' }}
          onFocus={e => (e.currentTarget.style.borderColor = error ? '#c84040' : '#c8880c')}
          onBlur={e => (e.currentTarget.style.borderColor = error ? '#6b2020' : '#6b5010')}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          tabIndex={-1}
          style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#3a2d10', background:'none', border:'none', cursor:'pointer', fontFamily:'"Cinzel", serif', lineHeight:1 }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#c8880c')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#3a2d10')}
        >
          {show ? '◉' : '○'}
        </button>
      </div>
    </div>
  )
}

// ─── Page paramètres ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  usePageTitle('Paramètres')
  const { user, refreshUser } = useAuth()
  const { success, error: toastError } = useToast()

  // ── Section pseudo ────────────────────────────────────────────────────────
  const [userName, setUserName]     = useState(user?.userName ?? '')
  const [isSavingName, setIsSavingName] = useState(false)
  const [nameError, setNameError]   = useState<string | null>(null)
  const [nameSuccess, setNameSuccess] = useState(false)

  // ── Section mot de passe ──────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [isSavingPwd, setIsSavingPwd] = useState(false)
  const [pwdError, setPwdError]     = useState<string | null>(null)

  const strength       = passwordStrength(newPwd)
  const confirmMismatch = confirmPwd.length > 0 && confirmPwd !== newPwd
  const nameInvalid    = userName.length > 0 && userName.length < 3

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault()
    if (userName.trim() === user?.userName) return
    setNameError(null); setNameSuccess(false)
    setIsSavingName(true)
    try {
      await userService.updateProfile(userName.trim())
      await refreshUser()
      setNameSuccess(true)
      success('Pseudonyme mis à jour !')
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erreur lors de la mise à jour.'
      setNameError(msg)
      toastError(msg)
    } finally { setIsSavingName(false) }
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwdError(null)
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 8) { setPwdError('Le nouveau mot de passe doit faire au moins 8 caractères.'); return }
    setIsSavingPwd(true)
    try {
      await userService.changePassword(currentPwd, newPwd)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      success('Mot de passe modifié avec succès !')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erreur lors du changement de mot de passe.'
      setPwdError(msg)
      toastError(msg)
    } finally { setIsSavingPwd(false) }
  }

  return (
    <div style={{ background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }}>
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-10">

        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link to="/profile" className="text-sm transition"
              style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
              ← Profil
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold"
            style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            ✦ Paramètres
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Modifie ton identité au sein du Cercle.
          </p>
        </div>

        {/* ── Section pseudo ─────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <span style={{ position:'absolute', top:8, left:8,   color:'#c8880c', fontSize:'8px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8,  color:'#c8880c', fontSize:'8px' }}>◆</span>

          <h2 className="text-base font-bold mb-5"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
            Pseudonyme
          </h2>

          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label style={labelStyle}>Ton pseudonyme</label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                minLength={3} maxLength={30}
                required
                style={{ ...inputStyle, borderColor: nameInvalid ? '#6b2020' : '#6b5010' }}
                onFocus={e => (e.currentTarget.style.borderColor = nameInvalid ? '#c84040' : '#c8880c')}
                onBlur={e => (e.currentTarget.style.borderColor = nameInvalid ? '#6b2020' : '#6b5010')}
              />
              {nameInvalid && (
                <p className="text-xs mt-1" style={{ color: '#c84040' }}>Au moins 3 caractères requis.</p>
              )}
              {nameSuccess && (
                <p className="text-xs mt-1" style={{ color: '#a0ff70' }}>✦ Pseudonyme mis à jour !</p>
              )}
            </div>

            {nameError && (
              <div className="rounded px-4 py-3 text-sm"
                style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
                {nameError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingName || nameInvalid || userName.trim() === user?.userName}
              className="font-bold py-2.5 px-6 rounded transition flex items-center gap-2"
              style={{
                background: (!isSavingName && !nameInvalid && userName.trim() !== user?.userName)
                  ? 'linear-gradient(135deg, #a36808, #c8880c)'
                  : '#2a2218',
                color: (!isSavingName && !nameInvalid && userName.trim() !== user?.userName)
                  ? '#0e0c08' : '#3a2d10',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.75rem',
                border: '1px solid #6b5010',
                cursor: (!isSavingName && !nameInvalid && userName.trim() !== user?.userName) ? 'pointer' : 'not-allowed',
                letterSpacing: '0.06em',
              }}
            >
              {isSavingName && (
                <span className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />
              )}
              {isSavingName ? 'Enregistrement…' : '✦ Enregistrer'}
            </button>
          </form>
        </div>

        {/* Séparateur */}
        <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', margin:'4px 0 20px' }} />

        {/* ── Section mot de passe ───────────────────────────────────────── */}
        <div style={cardStyle}>
          <span style={{ position:'absolute', top:8, left:8,   color:'#c8880c', fontSize:'8px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8,  color:'#c8880c', fontSize:'8px' }}>◆</span>

          <h2 className="text-base font-bold mb-5"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
            Mot de passe
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordField
              label="Mot de passe actuel"
              value={currentPwd}
              onChange={setCurrentPwd}
              placeholder="Ton mot de passe actuel"
            />

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
                <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}

            <PasswordField
              label="Confirmer le nouveau mot de passe"
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

            {pwdError && (
              <div className="rounded px-4 py-3 text-sm"
                style={{ background: '#2a0c0c', border: '1px solid #6b2020', color: '#e05050' }}>
                {pwdError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingPwd || !currentPwd || !newPwd || confirmMismatch}
              className="font-bold py-2.5 px-6 rounded transition flex items-center gap-2"
              style={{
                background: (!isSavingPwd && currentPwd && newPwd && !confirmMismatch)
                  ? 'linear-gradient(135deg, #a36808, #c8880c)'
                  : '#2a2218',
                color: (!isSavingPwd && currentPwd && newPwd && !confirmMismatch) ? '#0e0c08' : '#3a2d10',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.75rem',
                border: '1px solid #6b5010',
                cursor: (!isSavingPwd && currentPwd && newPwd && !confirmMismatch) ? 'pointer' : 'not-allowed',
                letterSpacing: '0.06em',
              }}
            >
              {isSavingPwd && (
                <span className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#0e0c08', borderTopColor: 'transparent' }} />
              )}
              {isSavingPwd ? 'Enregistrement…' : '✦ Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* Lien mot de passe oublié */}
        <p className="text-center text-xs mt-2" style={{ color: '#3a2d10' }}>
          Mot de passe perdu ?{' '}
          <Link to="/forgot-password"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b5010')}>
            Réinitialiser
          </Link>
        </p>

      </div>
    </div>
  )
}
