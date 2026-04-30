import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'

const EXAMPLES = [
  { q: 'Qui va arriver en retard dimanche ?',    symbol: '⏳' },
  { q: 'Combien de temps avant que Lucas dise je lag ?', symbol: '🎮' },
  { q: 'Quel film sera jugé nul ce soir ?',      symbol: '🎬' },
  { q: 'Florian finira-t-il son projet avant minuit ?', symbol: '🌙' },
  { q: 'Qui finira son assiette en premier ?',   symbol: '🍽️' },
]

const BOOSTS = [
  { name: 'Correction',   desc: 'Modifie ton vote avant la fermeture', icon: '↩', glow: '#2a4a8a' },
  { name: 'Double Vote',  desc: 'Joue sur deux réponses à la fois',    icon: 'II', glow: '#6a2a8a' },
  { name: 'Sabotage',     desc: "Réduit les gains d'un adversaire",    icon: '⚔', glow: '#8a2a2a' },
  { name: 'Bouclier',     desc: 'Protège contre les sabotages',        icon: '◈', glow: '#2a6a3a' },
]

// Ornate corner decoration component
function TarotCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ background: '#161209', border: '1px solid #6b5010', borderRadius: '8px' }}
    >
      {/* Corners */}
      <span style={{ position:'absolute', top:6, left:6, color:'#c8880c', fontSize:'10px', lineHeight:1 }}>◆</span>
      <span style={{ position:'absolute', top:6, right:6, color:'#c8880c', fontSize:'10px', lineHeight:1 }}>◆</span>
      <span style={{ position:'absolute', bottom:6, left:6, color:'#c8880c', fontSize:'10px', lineHeight:1 }}>◆</span>
      <span style={{ position:'absolute', bottom:6, right:6, color:'#c8880c', fontSize:'10px', lineHeight:1 }}>◆</span>
      {children}
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  const handleJoin = (e: FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    if (code.length !== 8) {
      setJoinError('Le code doit faire 8 caractères.')
      return
    }
    navigate(`/p/${code}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0e0c08', color: '#f0dfa8' }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Radial gold glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% -10%, #c8880c18 0%, transparent 70%)'
        }} />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-8"
            style={{
              background: '#1e1810',
              border: '1px solid #6b5010',
              color: '#c8880c',
              fontFamily: '"Cinzel", serif',
              letterSpacing: '0.12em'
            }}
          >
            <span style={{ color: '#f5c842' }}>✦</span>
            Jeu de pronostics entre amis
            <span style={{ color: '#f5c842' }}>✦</span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl sm:text-6xl font-black tracking-tight mb-6 leading-tight"
            style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f0dfa8' }}
          >
            Orakl{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f5c842, #c8880c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              a parlé.
            </span>
          </h1>
          <h2 className="text-xl sm:text-2xl mb-6" style={{ color: '#8a7a5a', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Maintenant c'est ton tour de prédire.
          </h2>

          <p style={{ color: '#7a6a4a', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Crée une question, envoie le lien à tes amis sur Discord ou WhatsApp,
            et révèle — solennellement — qui avait raison.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? '/create' : '/register'}
              className="font-bold px-8 py-3.5 rounded transition flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
                color: '#0e0c08',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                border: '1px solid #f5c842',
                boxShadow: '0 0 24px #c8880c40'
              }}
            >
              ✦ Invoquer un pronostic
            </Link>
            <a
              href="#rejoindre"
              className="font-semibold px-8 py-3.5 rounded transition"
              style={{
                background: '#161209',
                border: '1px solid #6b5010',
                color: '#b89a60',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.85rem',
                letterSpacing: '0.06em'
              }}
            >
              Rejoindre par code
            </a>
          </div>
        </div>
      </section>

      {/* Gold divider */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #c8880c55, #c8880c, #c8880c55, transparent)', margin: '0 auto', maxWidth: '600px' }} />

      {/* ── JOIN CODE ─────────────────────────────────────── */}
      <section id="rejoindre" className="max-w-md mx-auto px-4 py-16">
        <TarotCard className="p-6 text-center">
          <div className="py-2">
            <p
              className="text-lg font-bold mb-1"
              style={{ fontFamily: '"Cinzel", serif', color: '#f5c842' }}
            >
              Tu as reçu une invocation ?
            </p>
            <p className="text-sm mb-5" style={{ color: '#6b5010' }}>
              Entre le code de partage ci-dessous.
            </p>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
                placeholder="CODE 8 LETTRES"
                maxLength={8}
                className="flex-1 px-4 py-2.5 text-sm uppercase tracking-widest transition"
                style={{
                  background: '#0e0c08',
                  border: '1px solid #6b5010',
                  color: '#f5c842',
                  borderRadius: '4px',
                  outline: 'none',
                  fontFamily: '"Cinzel", serif',
                  letterSpacing: '0.25em'
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
              />
              <button
                type="submit"
                className="font-bold px-5 py-2.5 rounded transition"
                style={{
                  background: 'linear-gradient(135deg, #a36808, #c8880c)',
                  color: '#0e0c08',
                  fontFamily: '"Cinzel", serif',
                  fontSize: '0.75rem',
                  border: '1px solid #f5c842'
                }}
              >
                Entrer
              </button>
            </form>
            {joinError && (
              <p className="text-xs mt-2" style={{ color: '#c84040' }}>{joinError}</p>
            )}
          </div>
        </TarotCard>
      </section>

      {/* Gold divider */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #c8880c55, #c8880c, #c8880c55, transparent)', margin: '0 auto', maxWidth: '600px' }} />

      {/* ── EXAMPLES ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2
          className="text-2xl font-extrabold text-center mb-3"
          style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}
        >
          Orakl révèle tout
        </h2>
        <p className="text-sm text-center mb-10" style={{ color: '#6b5010' }}>
          Soumets n'importe quelle question au jugement suprême.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXAMPLES.map(ex => (
            <div
              key={ex.q}
              className="px-4 py-4 flex items-start gap-3 transition group"
              style={{
                background: '#161209',
                border: '1px solid #3a2d10',
                borderRadius: '6px',
                cursor: 'default'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6b5010')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a2d10')}
            >
              <span className="text-xl flex-shrink-0">{ex.symbol}</span>
              <p className="text-sm leading-snug" style={{ color: '#9a8a64', fontStyle: 'italic' }}>
                « {ex.q} »
              </p>
            </div>
          ))}

          <Link
            to={isAuthenticated ? '/create' : '/register'}
            className="px-4 py-4 flex items-center justify-center gap-2 text-sm font-semibold transition"
            style={{
              border: '2px dashed #6b5010',
              borderRadius: '6px',
              color: '#c8880c',
              fontFamily: '"Cinzel", serif',
              fontSize: '0.8rem'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c8880c'; (e.currentTarget as HTMLElement).style.color = '#f5c842' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6b5010'; (e.currentTarget as HTMLElement).style.color = '#c8880c' }}
          >
            ✦ Écrire ta prophétie
          </Link>
        </div>
      </section>

      {/* ── BOOSTS ────────────────────────────────────────── */}
      <section style={{ background: '#100e08', borderTop: '1px solid #3a2d10', borderBottom: '1px solid #3a2d10' }} className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2
            className="text-2xl font-extrabold text-center mb-2"
            style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}
          >
            Pouvoirs occultes
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: '#6b5010' }}>
            Des arts interdits pour maximiser tes gains… ou ruiner tes ennemis.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BOOSTS.map(b => (
              <div
                key={b.name}
                className="p-4 rounded text-center"
                style={{
                  background: '#161209',
                  border: '1px solid #6b5010',
                  boxShadow: `0 0 20px ${b.glow}30`
                }}
              >
                <p
                  className="text-3xl font-black mb-2"
                  style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}
                >
                  {b.icon}
                </p>
                <p
                  className="font-bold text-sm mb-1"
                  style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}
                >
                  {b.name}
                </p>
                <p className="text-xs leading-snug" style={{ color: '#6b5010' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2
          className="text-2xl font-extrabold text-center mb-12"
          style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}
        >
          Le Rituel en 3 étapes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { step: 'I',   icon: '✦', title: 'Révèle',  desc: 'Formule une question. Ajoute tes options. Fixe l\'heure du jugement.' },
            { step: 'II',  icon: '◈', title: 'Convoque', desc: 'Envoie le lien de l\'invocation à tes amis. Ils rejoignent en un clic.' },
            { step: 'III', icon: '⚖', title: 'Juge',     desc: "Orakl te juge. Les points tombent. Tes amis t'en voudront peut-être." },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded flex items-center justify-center text-2xl mb-4"
                style={{
                  border: '1px solid #c8880c',
                  background: '#161209',
                  color: '#f5c842',
                  fontFamily: '"Cinzel", serif',
                  boxShadow: '0 0 20px #c8880c30'
                }}
              >
                {s.step}
              </div>
              <p className="font-extrabold text-lg mb-2" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                {s.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#6b5010' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <section className="text-center pb-20 px-4">
        <TarotCard className="max-w-lg mx-auto p-10">
          <p
            className="text-3xl font-black mb-3"
            style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}
          >
            Orakl attend.
          </p>
          <p className="text-sm mb-6" style={{ color: '#6b5010' }}>
            Gratuit. Sans pub. Orakl ne vend rien — il juge.
          </p>
          <Link
            to={isAuthenticated ? '/create' : '/register'}
            className="inline-block font-bold px-10 py-3.5 rounded transition"
            style={{
              background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
              color: '#0e0c08',
              fontFamily: '"Cinzel", serif',
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              border: '1px solid #f5c842',
              boxShadow: '0 0 24px #c8880c40'
            }}
          >
            ✦ {isAuthenticated ? 'Invoquer un pronostic' : 'Rejoindre le Cercle'}
          </Link>
        </TarotCard>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #3a2d10' }} className="py-6 text-center">
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #c8880c44, transparent)', marginBottom: '20px' }} />
        <p className="text-xs" style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif', letterSpacing: '0.1em' }}>
          PLAY-ORAKL — PROPHÉTIES ENTRE AMIS — AUCUN ARGENT RÉEL
        </p>
      </footer>
    </div>
  )
}
