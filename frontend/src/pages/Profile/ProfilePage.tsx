import { useEffect, useState } from 'react'
import { usePageTitle } from '../../hooks/usePageTitle'
import { Link } from 'react-router-dom'
import { userService, type ProfileData } from '../../services/userService'
import { boostService } from '../../services/boostService'
import type { BoostCatalogItem } from '../../types'
import Navbar from '../../components/layout/Navbar'
import { SkeletonStatCard, SkeletonCard } from '../../components/ui/SkeletonCard'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' }

// ─── Titre de rang selon le niveau ───────────────────────────────────────────

function rankTitle(level: number): string {
  if (level >= 20) return 'Prophète Suprême'
  if (level >= 16) return 'Archiviste'
  if (level >= 12) return 'Grand Oracle'
  if (level >= 8)  return 'Oracle'
  if (level >= 5)  return 'Voyant'
  if (level >= 3)  return 'Initié'
  return 'Novice'
}

// ─── Gradient avatar selon le niveau ─────────────────────────────────────────

function avatarGradient(level: number): string {
  if (level >= 20) return 'linear-gradient(135deg, #8a2be2, #c8880c)'
  if (level >= 10) return 'linear-gradient(135deg, #c8880c, #f5c842)'
  if (level >= 5)  return 'linear-gradient(135deg, #2a6a8a, #5aaa30)'
  return 'linear-gradient(135deg, #3a2d10, #6b5010)'
}

// ─── Styles de rareté ────────────────────────────────────────────────────────

const RARITY_STYLES: Record<string, { border: string; bg: string; color: string; label: string }> = {
  Common:    { border: '#3a2d10', bg: '#0e0c08',   color: '#6b5010',  label: 'Commun'    },
  Rare:      { border: '#2a4a8a', bg: '#0a0e1a',   color: '#6090e0',  label: 'Rare'      },
  Epic:      { border: '#6a2a8a', bg: '#100a1a',   color: '#a060e0',  label: 'Épique'    },
  Legendary: { border: '#8a6010', bg: '#1a1408',   color: '#f5c842',  label: 'Légendaire'},
  Secret:    { border: '#8a2a5a', bg: '#1a0814',   color: '#e060a0',  label: 'Secret'    },
}

const RARITY_ICONS: Record<string, string> = {
  Common:    '◈',
  Rare:      '✦',
  Epic:      '⬡',
  Legendary: '◆',
  Secret:    '✸',
}

const BOOST_ICONS: Record<string, string> = {
  VoteCorrection: '↩',
  SecondVote:     'II',
  Sabotage:       '⚔',
  Shield:         '◈',
}

// ─── Composant badge boost ───────────────────────────────────────────────────

function BoostCard({ b }: { b: BoostCatalogItem }) {
  const rs = RARITY_STYLES[b.rarity] ?? RARITY_STYLES.Common
  const icon = BOOST_ICONS[b.boostType] ?? '⚡'
  return (
    <div className="rounded px-4 py-3 flex items-center gap-3"
      style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
      <span className="text-2xl flex-shrink-0 w-8 text-center" style={{ fontFamily: '"Cinzel", serif', color: rs.color }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: rs.color, fontFamily: '"Cinzel", serif' }}>
          {b.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>{b.description}</p>
        <p className="text-xs mt-1" style={{ color: rs.color, opacity: 0.5 }}>{rs.label}</p>
      </div>
      <span className="flex-shrink-0 text-sm font-black px-2.5 py-1 rounded-full"
        style={{ background: '#0e0c08', color: '#c8880c', border: '1px solid #3a2d10', fontFamily: '"Cinzel", serif' }}>
        ×{b.ownedQuantity}
      </span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  usePageTitle('Mon Profil')
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [catalog, setCatalog]   = useState<BoostCatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showEmptyBoosts, setShowEmptyBoosts] = useState(false)

  useEffect(() => {
    userService.getMyProfile()
      .then(setProfile)
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setIsLoading(false))
    boostService.getCatalog().then(setCatalog).catch(() => {})
  }, [])

  if (isLoading) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Avatar + header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="orakl-skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="orakl-skeleton" style={{ width: '40%', height: '18px', borderRadius: '4px' }} />
            <div className="orakl-skeleton" style={{ width: '25%', height: '12px', borderRadius: '4px' }} />
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
        {/* Cartes */}
        <SkeletonCard lines={2} badge={false} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  )

  if (error || !profile) return (
    <div style={pageStyle}>
      <Navbar />
      <div className="flex items-center justify-center h-80 text-center px-4">
        <div>
          <p className="text-4xl mb-3" style={{ color: '#c8880c' }}>✦</p>
          <p className="font-bold mb-2" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
            Impossible de charger le profil
          </p>
          <p className="text-sm" style={{ color: '#6b5010' }}>{error}</p>
        </div>
      </div>
    </div>
  )

  const xpPercent  = Math.min(100, Math.round((profile.experience / profile.experienceForNextLevel) * 100))
  const defeats    = profile.predictionsPlayed - profile.predictionsWon
  const ownedBoosts  = catalog.filter(b => b.ownedQuantity > 0)
  const emptyBoosts  = catalog.filter(b => b.ownedQuantity === 0)
  const title      = rankTitle(profile.level)

  return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">

        {/* ── Carte héro ── */}
        <div className="relative p-6 rounded overflow-hidden" style={cardStyle}>
          {/* Lueur de fond selon niveau */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 60% 50% at 10% 50%, ${profile.level >= 20 ? '#8a2be220' : profile.level >= 10 ? '#c8880c18' : profile.level >= 5 ? '#2a6a8a15' : '#3a2d1010'} 0%, transparent 70%)`,
          }} />
          <span style={{ position: 'absolute', top: 8, left: 8,  color: '#c8880c', fontSize: '10px' }}>◆</span>
          <span style={{ position: 'absolute', top: 8, right: 8, color: '#c8880c', fontSize: '10px' }}>◆</span>

          <div className="relative flex items-center gap-5 flex-wrap">
            {/* Avatar */}
            <div className="w-20 h-20 rounded flex items-center justify-center text-4xl font-black flex-shrink-0"
              style={{
                background: avatarGradient(profile.level),
                color: '#0e0c08',
                fontFamily: '"Cinzel Decorative", serif',
                boxShadow: `0 0 28px ${profile.level >= 10 ? '#c8880c50' : '#6b501030'}`,
                border: '2px solid #c8880c44',
              }}>
              {profile.userName[0].toUpperCase()}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold truncate"
                  style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
                  {profile.userName}
                </h1>
                <span className="text-xs rounded-full px-2.5 py-0.5 font-semibold flex-shrink-0"
                  style={{ background: '#1e1810', border: '1px solid #c8880c44', color: '#c8880c', fontFamily: '"Cinzel", serif' }}>
                  Niv. {profile.level}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif', fontStyle: 'italic' }}>
                {title}
              </p>
              <p className="text-xs mt-1" style={{ color: '#3a2d10' }}>
                {profile.email} · Initié depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Points */}
            <div className="text-right flex-shrink-0">
              <p className="text-3xl font-black" style={{ color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                {profile.totalPoints.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: '#6b5010' }}>points</p>
            </div>
          </div>
        </div>

        {/* ── Barre XP ── */}
        <div className="p-5 rounded" style={cardStyle}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ fontFamily: '"Cinzel", serif', color: '#c8880c' }}>
              Progression — Niveau {profile.level}
            </p>
            <p className="text-xs" style={{ color: '#6b5010' }}>
              {profile.experience.toLocaleString()} / {profile.experienceForNextLevel.toLocaleString()} XP
              <span className="ml-1.5 font-bold" style={{ color: '#c8880c' }}>({xpPercent}%)</span>
            </p>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#0e0c08', border: '1px solid #2a2218' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%`, background: 'linear-gradient(to right, #a36808, #f5c842)' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs" style={{ color: '#3a2d10' }}>
              Niveau {profile.level} · {title}
            </p>
            <p className="text-xs" style={{ color: '#3a2d10' }}>
              {(profile.experienceForNextLevel - profile.experience).toLocaleString()} XP avant Niveau {profile.level + 1} · {rankTitle(profile.level + 1)}
            </p>
          </div>
        </div>

        {/* ── Statistiques ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Joués',    value: profile.predictionsPlayed,  icon: '⚖', color: '#c8880c' },
            { label: 'Victoires', value: profile.predictionsWon,    icon: '✦', color: '#a0ff70' },
            { label: 'Défaites', value: defeats,                    icon: '✗', color: '#e05050' },
            {
              label: 'Win rate',
              value: `${profile.winRate}%`,
              icon: '◈',
              color: profile.winRate >= 60 ? '#a0ff70' : profile.winRate >= 40 ? '#c8880c' : '#e05050',
            },
          ].map(s => (
            <div key={s.label} className="rounded p-4 text-center" style={cardStyle}>
              <p className="text-xl mb-1" style={{ color: s.color }}>{s.icon}</p>
              <p className="text-2xl font-black" style={{ color: s.color, fontFamily: '"Cinzel", serif' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ligne créés */}
        <div className="rounded px-4 py-3 flex items-center gap-3" style={{ background: '#161209', border: '1px solid #2a2218' }}>
          <span style={{ color: '#6b5010' }}>◈</span>
          <p className="text-sm flex-1" style={{ color: '#6b5010' }}>
            Prophéties créées
          </p>
          <p className="font-bold text-sm" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>
            {profile.predictionsCreated}
          </p>
        </div>

        {/* ── Boosts ── */}
        <div className="relative p-6 rounded" style={cardStyle}>
          <span style={{ position: 'absolute', top: 8, left: 8,  color: '#c8880c', fontSize: '10px' }}>◆</span>
          <span style={{ position: 'absolute', top: 8, right: 8, color: '#c8880c', fontSize: '10px' }}>◆</span>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
              ⚡ Pouvoirs
            </h2>
            <span className="text-xs rounded-full px-3 py-1"
              style={{ background: '#0e0c08', border: '1px solid #2a2218', color: '#6b5010' }}>
              {ownedBoosts.length} disponible{ownedBoosts.length > 1 ? 's' : ''}
            </span>
          </div>

          {catalog.length === 0 ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
            </div>
          ) : ownedBoosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2" style={{ color: '#3a2d10' }}>⚡</p>
              <p className="text-sm" style={{ color: '#3a2d10' }}>Aucun pouvoir en réserve.</p>
              <p className="text-xs mt-1" style={{ color: '#2a2218' }}>Gagne des points et monte de niveau pour en obtenir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ownedBoosts.map(b => <BoostCard key={b.id} b={b} />)}
            </div>
          )}

          {/* Boosts épuisés — repliables */}
          {emptyBoosts.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowEmptyBoosts(v => !v)}
                className="text-xs transition flex items-center gap-1"
                style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6b5010')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3a2d10')}>
                {showEmptyBoosts ? '▲' : '▼'} Réserves vides ({emptyBoosts.length})
              </button>
              {showEmptyBoosts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {emptyBoosts.map(b => {
                    const rs = RARITY_STYLES[b.rarity] ?? RARITY_STYLES.Common
                    const icon = BOOST_ICONS[b.boostType] ?? '⚡'
                    return (
                      <div key={b.id} className="rounded px-4 py-2.5 flex items-center gap-3"
                        style={{ background: '#0a0908', border: '1px solid #1a1510', opacity: 0.5 }}>
                        <span className="text-lg w-6 text-center flex-shrink-0"
                          style={{ fontFamily: '"Cinzel", serif', color: '#2a2218' }}>{icon}</span>
                        <p className="text-xs truncate flex-1"
                          style={{ color: '#2a2218', fontFamily: '"Cinzel", serif' }}>{b.name}</p>
                        <span className="text-xs" style={{ color: '#1a1510', fontFamily: '"Cinzel", serif' }}>×0</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Badges / Reliques ── */}
        <div className="relative p-6 rounded" style={cardStyle}>
          <span style={{ position: 'absolute', top: 8, left: 8,  color: '#c8880c', fontSize: '10px' }}>◆</span>
          <span style={{ position: 'absolute', top: 8, right: 8, color: '#c8880c', fontSize: '10px' }}>◆</span>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>
              Reliques
            </h2>
            <span className="text-xs rounded-full px-3 py-1"
              style={{ background: '#0e0c08', border: '1px solid #2a2218', color: '#6b5010' }}>
              {profile.badges.length} débloquée{profile.badges.length > 1 ? 's' : ''}
            </span>
          </div>

          {profile.badges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2" style={{ color: '#3a2d10' }}>◈</p>
              <p className="text-sm mb-1" style={{ color: '#3a2d10' }}>Aucune relique pour l'instant.</p>
              <p className="text-xs" style={{ color: '#2a2218' }}>Participe à des pronostics pour en débloquer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.badges.map(b => {
                const rs   = RARITY_STYLES[b.rarity] ?? RARITY_STYLES.Common
                const icon = b.iconUrl && b.iconUrl.length <= 4 ? b.iconUrl : (RARITY_ICONS[b.rarity] ?? '◈')
                return (
                  <div key={b.badgeId} className="rounded px-4 py-3 flex items-start gap-3"
                    style={{ background: rs.bg, border: `1px solid ${rs.border}` }}>
                    <span className="text-2xl flex-shrink-0 mt-0.5" style={{ color: rs.color }}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm" style={{ color: rs.color, fontFamily: '"Cinzel", serif' }}>
                          {b.name}
                        </p>
                        <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ background: '#0e0c08', color: rs.color, border: `1px solid ${rs.border}`, opacity: 0.7, fontSize: '0.6rem', fontFamily: '"Cinzel", serif' }}>
                          {rs.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>{b.description}</p>
                      <p className="text-xs mt-1" style={{ color: '#2a2218' }}>
                        {new Date(b.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Actions rapides ── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Link to="/create"
            className="text-center font-semibold py-3 rounded text-sm transition"
            style={{ background: 'linear-gradient(135deg, #a36808, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif', border: '1px solid #f5c842', letterSpacing: '0.04em' }}>
            ✦ Invoquer
          </Link>
          <Link to="/settings"
            className="text-center font-semibold py-3 rounded text-sm transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: '#c8880c', fontFamily: '"Cinzel", serif', letterSpacing: '0.04em' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#6b5010')}>
            ◈ Paramètres
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/history"
            className="text-center font-semibold py-3 rounded text-sm transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: '#c8880c', fontFamily: '"Cinzel", serif', letterSpacing: '0.04em' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#6b5010')}>
            Archives
          </Link>
          <Link to="/leaderboard"
            className="text-center font-semibold py-3 rounded text-sm transition"
            style={{ background: '#161209', border: '1px solid #6b5010', color: '#c8880c', fontFamily: '"Cinzel", serif', letterSpacing: '0.04em' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#6b5010')}>
            Classement
          </Link>
        </div>
      </div>
    </div>
  )
}
