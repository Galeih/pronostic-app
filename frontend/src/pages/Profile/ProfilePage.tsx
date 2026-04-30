import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userService, type ProfileData } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

const RARITY_COLORS: Record<string, string> = {
  Common:    'border-gray-600 bg-gray-800/50 text-gray-300',
  Rare:      'border-blue-600 bg-blue-900/20 text-blue-300',
  Epic:      'border-violet-500 bg-violet-900/20 text-violet-300',
  Legendary: 'border-yellow-500 bg-yellow-900/20 text-yellow-300',
  Secret:    'border-pink-500 bg-pink-900/20 text-pink-300',
}

export default function ProfilePage() {
  const [profile, setProfile]   = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    userService.getMyProfile()
      .then(setProfile)
      .catch(() => setError('Impossible de charger le profil.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-80">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-80 text-center px-4">
          <div>
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-white font-bold mb-2">Impossible de charger le profil</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const xpPercent = Math.min(
    100,
    Math.round((profile.experience / profile.experienceForNextLevel) * 100)
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-violet-700 flex items-center justify-center text-4xl font-black text-white flex-shrink-0">
            {profile.userName[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold truncate">{profile.userName}</h1>
            <p className="text-gray-500 text-sm">{profile.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs bg-violet-900/40 border border-violet-700/50 text-violet-300 rounded-full px-3 py-0.5 font-semibold">
                Niv. {profile.level}
              </span>
              <span className="text-xs text-gray-500">
                Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-black text-violet-400">{profile.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-gray-500">points</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-300">Progression — Niveau {profile.level}</p>
            <p className="text-xs text-gray-500">
              {profile.experience.toLocaleString()} / {profile.experienceForNextLevel.toLocaleString()} XP
            </p>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5 text-right">
            {profile.experienceForNextLevel - profile.experience} XP avant le niveau {profile.level + 1}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pronostics joues',  value: profile.predictionsPlayed,  icon: '🗳️' },
            { label: 'Victoires',          value: profile.predictionsWon,     icon: '🏆' },
            { label: 'Crees',              value: profile.predictionsCreated, icon: '✏️' },
            { label: 'Taux de victoire',   value: `${profile.winRate}%`,      icon: '🎯' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Badges</h2>
            <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-3 py-1">
              {profile.badges.length} debloque{profile.badges.length > 1 ? 's' : ''}
            </span>
          </div>

          {profile.badges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🏅</p>
              <p className="text-gray-500 text-sm">
                Participe a des pronostics pour debloquer des badges !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.badges.map(b => (
                <div
                  key={b.badgeId}
                  className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${RARITY_COLORS[b.rarity] ?? RARITY_COLORS.Common}`}
                >
                  <span className="text-2xl flex-shrink-0">{b.iconUrl ?? '🏅'}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{b.name}</p>
                    <p className="text-xs opacity-70 mt-0.5">{b.description}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {new Date(b.unlockedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="ml-auto text-xs opacity-60 flex-shrink-0 hidden sm:block">
                    {b.rarity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            to="/create"
            className="flex-1 text-center bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            Creer un pronostic
          </Link>
          <Link
            to="/history"
            className="flex-1 text-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold py-3 rounded-xl text-sm transition"
          >
            Mon historique
          </Link>
        </div>
      </div>
    </div>
  )
}
