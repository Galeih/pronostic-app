import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userService, type ProfileData } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' }

const RARITY_STYLES: Record<string, { border: string; bg: string; color: string }> = {
  Common:    { border: '#3a2d10', bg: '#0e0c08',   color: '#6b5010' },
  Rare:      { border: '#2a4a8a', bg: '#0a0e1a',   color: '#6090e0' },
  Epic:      { border: '#6a2a8a', bg: '#100a1a',   color: '#a060e0' },
  Legendary: { border: '#8a6010', bg: '#1a1408',   color: '#f5c842' },
  Secret:    { border: '#8a2a5a', bg: '#1a0814',   color: '#e060a0' },
}

export default function ProfilePage() {
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    userService.getMyProfile().then(setProfile).catch(() => setError('Impossible de charger le profil.')).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return (
    <div style={pageStyle}><Navbar />
      <div className="flex items-center justify-center h-80">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  if (error || !profile) return (
    <div style={pageStyle}><Navbar />
      <div className="flex items-center justify-center h-80 text-center px-4">
        <div>
          <p className="text-4xl mb-3" style={{ color: '#c8880c' }}>✦</p>
          <p className="font-bold mb-2" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Impossible de charger le profil</p>
          <p className="text-sm" style={{ color: '#6b5010' }}>{error}</p>
        </div>
      </div>
    </div>
  )

  const xpPercent = Math.min(100, Math.round((profile.experience / profile.experienceForNextLevel) * 100))

  return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Hero card */}
        <div className="relative p-6 rounded mb-6 flex items-center gap-5" style={cardStyle}>
          <span style={{ position:'absolute', top:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>

          <div className="w-20 h-20 rounded flex items-center justify-center text-4xl font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6b5010, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel Decorative", serif', boxShadow: '0 0 24px #c8880c40' }}>
            {profile.userName[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold truncate" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
              {profile.userName}
            </h1>
            <p className="text-sm" style={{ color: '#6b5010' }}>{profile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs rounded-full px-3 py-0.5 font-semibold"
                style={{ background: '#1e1810', border: '1px solid #c8880c', color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                Niv. {profile.level}
              </span>
              <span className="text-xs" style={{ color: '#3a2d10' }}>
                Initié depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>{profile.totalPoints.toLocaleString()}</p>
            <p className="text-xs" style={{ color: '#6b5010' }}>points</p>
          </div>
        </div>

        {/* XP bar */}
        <div className="relative p-5 rounded mb-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ fontFamily: '"Cinzel", serif', color: '#c8880c' }}>
              Progression — Niveau {profile.level}
            </p>
            <p className="text-xs" style={{ color: '#6b5010' }}>
              {profile.experience.toLocaleString()} / {profile.experienceForNextLevel.toLocaleString()} XP
            </p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%`, background: 'linear-gradient(to right, #a36808, #f5c842)' }}
            />
          </div>
          <p className="text-xs mt-1.5 text-right" style={{ color: '#3a2d10' }}>
            {profile.experienceForNextLevel - profile.experience} XP avant le niveau {profile.level + 1}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pronostics joués', value: profile.predictionsPlayed,  icon: '⚖' },
            { label: 'Victoires',         value: profile.predictionsWon,     icon: '✦' },
            { label: 'Créés',             value: profile.predictionsCreated, icon: '◈' },
            { label: 'Taux de victoire',  value: `${profile.winRate}%`,      icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="rounded p-4 text-center" style={cardStyle}>
              <p className="text-2xl mb-1" style={{ color: '#c8880c' }}>{s.icon}</p>
              <p className="text-2xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="relative p-6 rounded mb-6" style={cardStyle}>
          <span style={{ position:'absolute', top:8, left:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <span style={{ position:'absolute', top:8, right:8, color:'#c8880c', fontSize:'10px' }}>◆</span>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Reliques</h2>
            <span className="text-xs rounded-full px-3 py-1" style={{ background: '#0e0c08', border: '1px solid #2a2218', color: '#6b5010' }}>
              {profile.badges.length} débloquée{profile.badges.length > 1 ? 's' : ''}
            </span>
          </div>

          {profile.badges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2" style={{ color: '#3a2d10' }}>◈</p>
              <p className="text-sm" style={{ color: '#3a2d10' }}>Participe à des pronostics pour débloquer des reliques !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.badges.map(b => {
                const rs = RARITY_STYLES[b.rarity] ?? RARITY_STYLES.Common
                return (
                  <div key={b.badgeId} className="rounded px-4 py-3 flex items-center gap-3"
                    style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
                    <span className="text-2xl flex-shrink-0">{b.iconUrl ?? '◈'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: rs.color, fontFamily: '"Cinzel", serif' }}>{b.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>{b.description}</p>
                      <p className="text-xs mt-1" style={{ color: '#2a2218' }}>{new Date(b.unlockedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="ml-auto text-xs flex-shrink-0 hidden sm:block" style={{ color: rs.color, opacity: 0.6 }}>{b.rarity}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/create" className="flex-1 text-center font-semibold py-3 rounded text-sm transition"
            style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842', letterSpacing: '0.06em' }}>
            ✦ Invoquer
          </Link>
          <Link to="/history" className="flex-1 text-center font-semibold py-3 rounded text-sm transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: '#c8880c', fontFamily: '"Cinzel", serif', letterSpacing: '0.06em' }}>
            Archives
          </Link>
        </div>
      </div>
    </div>
  )
}
