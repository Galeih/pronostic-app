import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useAuth } from '../../context/AuthContext'
import { usePageTitle } from '../../hooks/usePageTitle'

function FloatingGlyph({ glyph, style }: { glyph: string; style: React.CSSProperties }) {
  return (
    <span className="absolute select-none pointer-events-none" style={{ ...style, fontFamily: '"Cinzel", serif' }}>
      {glyph}
    </span>
  )
}

export default function NotFoundPage() {
  usePageTitle('Page introuvable')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  // Compte à rebours → redirection automatique
  useEffect(() => {
    if (countdown <= 0) { navigate('/', { replace: true }); return }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown, navigate])

  return (
    <div style={{ background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8', position: 'relative', overflow: 'hidden' }}>
      <Navbar />

      {/* Glyphes flottants décoratifs */}
      <style>{`
        @keyframes drift-1 { 0%,100% { transform: translateY(0px) rotate(0deg);   opacity:0.06; } 50% { transform: translateY(-18px) rotate(8deg);  opacity:0.12; } }
        @keyframes drift-2 { 0%,100% { transform: translateY(0px) rotate(0deg);   opacity:0.04; } 50% { transform: translateY(12px) rotate(-6deg); opacity:0.10; } }
        @keyframes drift-3 { 0%,100% { transform: translateY(0px) rotate(0deg);   opacity:0.05; } 50% { transform: translateY(-10px) rotate(5deg); opacity:0.09; } }
        @keyframes fade-in  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow-pulse { 0%,100% { text-shadow:0 0 20px #c8880c40; } 50% { text-shadow:0 0 60px #f5c84280, 0 0 100px #c8880c40; } }
        .anim-fade-in { animation: fade-in 0.7s ease-out both; }
        .glow-title   { animation: glow-pulse 3s ease-in-out infinite; }
      `}</style>

      <FloatingGlyph glyph="✦" style={{ top:'12%',  left:'8%',  fontSize:'4rem', color:'#c8880c', animation:'drift-1 6s ease-in-out infinite' }} />
      <FloatingGlyph glyph="◈" style={{ top:'25%',  right:'6%', fontSize:'3rem', color:'#6b5010', animation:'drift-2 8s ease-in-out infinite' }} />
      <FloatingGlyph glyph="◆" style={{ bottom:'20%', left:'5%',  fontSize:'2.5rem', color:'#3a2d10', animation:'drift-3 7s ease-in-out infinite' }} />
      <FloatingGlyph glyph="✧" style={{ top:'60%',  right:'10%', fontSize:'2rem', color:'#6b5010', animation:'drift-1 9s ease-in-out infinite 1s' }} />
      <FloatingGlyph glyph="⬡" style={{ bottom:'35%', right:'4%', fontSize:'3.5rem', color:'#2a2218', animation:'drift-2 10s ease-in-out infinite 2s' }} />
      <FloatingGlyph glyph="◉" style={{ top:'45%',  left:'4%',   fontSize:'2rem', color:'#2a2218', animation:'drift-3 8s ease-in-out infinite 0.5s' }} />

      {/* Gradient radial */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, #c8880c08 0%, transparent 70%)',
      }} />

      <div className="relative flex flex-col items-center justify-center px-4 text-center"
        style={{ minHeight: 'calc(100vh - 64px)', paddingTop: '2rem', paddingBottom: '4rem' }}>

        {/* Grand symbole */}
        <div className="anim-fade-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-8xl mb-6 glow-title" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>
            ✦
          </p>
        </div>

        {/* Titre */}
        <div className="anim-fade-in" style={{ animationDelay: '0.25s' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif', letterSpacing: '0.3em' }}>
            Erreur 404
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842', lineHeight: 1.2 }}>
            Orakl ne voit rien ici
          </h1>
          <p className="text-base max-w-sm mx-auto" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic', lineHeight: 1.7 }}>
            Cette page n'existe pas dans les archives du Cercle.
            Peut-être un lien brisé, peut-être la volonté d'Orakl.
          </p>
        </div>

        {/* Séparateur */}
        <div className="anim-fade-in w-full max-w-xs my-8" style={{ animationDelay: '0.4s' }}>
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)' }} />
        </div>

        {/* CTAs */}
        <div className="anim-fade-in flex flex-col sm:flex-row gap-3 w-full max-w-sm" style={{ animationDelay: '0.5s' }}>
          <Link
            to="/"
            className="flex-1 text-center font-bold py-3 rounded transition"
            style={{
              background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
              color: '#0e0c08',
              fontFamily: '"Cinzel", serif',
              fontSize: '0.8rem',
              border: '1px solid #f5c842',
              letterSpacing: '0.08em',
              boxShadow: '0 0 20px #c8880c30',
            }}
          >
            ✦ Retour à l'accueil
          </Link>
          {isAuthenticated && (
            <Link
              to="/create"
              className="flex-1 text-center font-semibold py-3 rounded transition"
              style={{
                background: '#161209',
                border: '1px solid #6b5010',
                color: '#c8880c',
                fontFamily: '"Cinzel", serif',
                fontSize: '0.8rem',
                letterSpacing: '0.06em',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#6b5010')}
            >
              Invoquer un pronostic
            </Link>
          )}
        </div>

        {/* Compte à rebours */}
        <div className="anim-fade-in mt-8" style={{ animationDelay: '0.65s' }}>
          <p className="text-xs" style={{ color: '#2a2218', fontFamily: '"Cinzel", serif' }}>
            Retour automatique dans{' '}
            <span style={{ color: '#3a2d10', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
            {' '}s
          </p>
          {/* Barre de progression */}
          <div className="mt-2 mx-auto rounded-full overflow-hidden" style={{ width: 120, height: 2, background: '#1a1510' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(countdown / 10) * 100}%`,
                background: 'linear-gradient(to right, #3a2d10, #c8880c)',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
