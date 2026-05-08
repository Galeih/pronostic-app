import { useEffect, useRef, useState } from 'react'
import { userService, type LeaderboardEntry } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }

type SortKey = 'points' | 'wins' | 'winRate'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'points',  label: '⚖ Points' },
  { key: 'wins',    label: '✦ Victoires' },
  { key: 'winRate', label: '◈ Win %' },
]

// Couleur d'avatar selon le niveau
function avatarGradient(level: number): string {
  if (level >= 20) return 'linear-gradient(135deg, #8a2be2, #c8880c)'
  if (level >= 10) return 'linear-gradient(135deg, #c8880c, #f5c842)'
  if (level >= 5)  return 'linear-gradient(135deg, #2a6a8a, #5aaa30)'
  return 'linear-gradient(135deg, #3a2d10, #6b5010)'
}

function Avatar({ name, level, size = 32, fontSize = '0.75rem' }: {
  name: string; level: number; size?: number; fontSize?: string
}) {
  return (
    <div className="flex items-center justify-center font-black flex-shrink-0 rounded"
      style={{ width: size, height: size, background: avatarGradient(level), color: '#0e0c08', fontFamily: '"Cinzel Decorative", serif', fontSize }}>
      {name[0].toUpperCase()}
    </div>
  )
}

// ─── Podium ──────────────────────────────────────────────────────────────────

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const configs = {
    1: { size: 80, fontSize: '1.75rem', crown: '◆', crownColor: '#f5c842', podiumH: 112, glow: '#c8880c', crownSize: '1.4rem' },
    2: { size: 64, fontSize: '1.4rem',  crown: '◈', crownColor: '#b0b0c0', podiumH: 80,  glow: '#808090', crownSize: '1.1rem' },
    3: { size: 56, fontSize: '1.2rem',  crown: '◈', crownColor: '#c87840', podiumH: 56,  glow: '#c87840', crownSize: '1rem'   },
  }
  const c = configs[rank]

  return (
    <div className="flex flex-col items-center gap-1">
      <span style={{ fontSize: c.crownSize, color: c.crownColor, fontFamily: '"Cinzel", serif' }}>{c.crown}</span>
      <div style={{
        width: c.size, height: c.size,
        background: avatarGradient(entry.level),
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Cinzel Decorative", serif', fontSize: c.fontSize,
        color: '#0e0c08', fontWeight: 900,
        boxShadow: `0 0 24px ${c.glow}50`,
        border: `2px solid ${c.crownColor}`,
        outline: entry.isCurrentUser ? `2px solid ${c.crownColor}` : 'none',
        outlineOffset: '3px',
      }}>
        {entry.userName[0].toUpperCase()}
      </div>
      <div className="text-center mt-1">
        <p className="font-bold text-sm truncate max-w-[96px]"
          style={{ color: entry.isCurrentUser ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
          {entry.isCurrentUser ? 'Moi' : entry.userName}
        </p>
        <p className="text-xs font-black mt-0.5" style={{ color: c.crownColor, fontFamily: '"Cinzel", serif' }}>
          {entry.totalPoints.toLocaleString()} pts
        </p>
        <p className="text-xs" style={{ color: '#6b5010' }}>
          Niv.&nbsp;{entry.level} · {entry.winRate}%
        </p>
      </div>
      <div className="w-full min-w-[96px] rounded-t flex items-center justify-center"
        style={{ height: c.podiumH, background: '#161209', border: `1px solid ${c.crownColor}33`, borderBottom: 'none' }}>
        <span className="text-2xl font-black" style={{ color: `${c.crownColor}20`, fontFamily: '"Cinzel", serif' }}>
          #{rank}
        </span>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank]     = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [sort, setSort]         = useState<SortKey>('points')

  const myRowRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    userService.getLeaderboard(50)
      .then(res => { setEntries(res.entries); setMyRank(res.myRank) })
      .catch(() => setError('Impossible de charger le classement.'))
      .finally(() => setIsLoading(false))
  }, [])

  // Tri client-side
  const sorted = [...entries].sort((a, b) => {
    if (sort === 'wins')    return b.predictionsWon - a.predictionsWon
    if (sort === 'winRate') return b.winRate - a.winRate
    return b.totalPoints - a.totalPoints
  })

  const [first, second, third] = sort === 'points' ? entries : [] // podium seulement en mode pts
  const tableEntries = sort === 'points' ? sorted.slice(3) : sorted
  const tableStartRank = sort === 'points' ? 4 : 1

  const myEntryInList = entries.find(e => e.isCurrentUser)
  const myTableIdx    = sort === 'points'
    ? tableEntries.findIndex(e => e.isCurrentUser)
    : sorted.findIndex(e => e.isCurrentUser)

  const scrollToMe = () => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 pb-24">

        {/* ── En-tête ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-1"
            style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            L'Ordre d'Orakl
          </h1>
          <p className="text-sm" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Bénis d'Orakl. Maudits de leurs amis.
          </p>
        </div>

        {/* ── Onglets de tri ── */}
        <div className="flex gap-2 justify-center mb-8">
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setSort(opt.key)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition"
              style={{
                background: sort === opt.key ? '#1e1810' : '#0e0c08',
                border: `1px solid ${sort === opt.key ? '#c8880c' : '#3a2d10'}`,
                color: sort === opt.key ? '#f5c842' : '#6b5010',
                fontFamily: '"Cinzel", serif',
                letterSpacing: '0.04em',
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-60">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3" style={{ color: '#c8880c' }}>✦</p>
            <p style={{ color: '#6b5010' }}>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ── Podium (mode points seulement) ── */}
            {sort === 'points' && first && (
              <div className="mb-10">
                <div className="flex items-end justify-center gap-6">
                  {second ? <PodiumCard entry={second} rank={2} /> : <div className="min-w-[96px]" />}
                  <PodiumCard entry={first} rank={1} />
                  {third ? <PodiumCard entry={third} rank={3} /> : <div className="min-w-[96px]" />}
                </div>
                <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)', marginTop: '24px' }} />
              </div>
            )}

            {/* Bouton "Voir ma position" si l'user est dans la liste mais pas visible au scroll */}
            {myEntryInList && myTableIdx >= 0 && (
              <div className="flex justify-center mb-4">
                <button onClick={scrollToMe}
                  className="text-xs px-4 py-1.5 rounded-full transition"
                  style={{ background: '#1e1810', border: '1px solid #c8880c44', color: '#c8880c', fontFamily: '"Cinzel", serif' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#c8880c44')}>
                  ↓ Voir ma position
                </button>
              </div>
            )}

            {/* ── Tableau ── */}
            {tableEntries.length > 0 && (
              <div className="overflow-hidden rounded" style={{ background: '#161209', border: '1px solid #6b5010' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide"
                      style={{ borderColor: '#3a2d10', color: '#6b5010' }}>
                      <th className="text-left px-4 py-3 w-10" style={{ fontFamily: '"Cinzel", serif' }}>#</th>
                      <th className="text-left px-4 py-3" style={{ fontFamily: '"Cinzel", serif' }}>Initié</th>
                      <th className="text-right px-4 py-3" style={{ fontFamily: '"Cinzel", serif', color: sort === 'points'  ? '#c8880c' : '#6b5010' }}>Points</th>
                      <th className="text-right px-4 py-3 hidden sm:table-cell" style={{ fontFamily: '"Cinzel", serif', color: sort === 'wins'    ? '#c8880c' : '#6b5010' }}>Victoires</th>
                      <th className="text-right px-4 py-3 hidden sm:table-cell" style={{ fontFamily: '"Cinzel", serif', color: sort === 'winRate' ? '#c8880c' : '#6b5010' }}>Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableEntries.map((entry, i) => {
                      const displayRank = sort === 'points' ? i + tableStartRank : i + 1
                      const isMe = entry.isCurrentUser
                      return (
                        <tr
                          key={entry.userId}
                          ref={isMe ? myRowRef : undefined}
                          className="border-b last:border-0 transition"
                          style={{
                            borderColor: '#2a2218',
                            background: isMe ? '#1e1810' : 'transparent',
                            borderLeft: isMe ? '3px solid #c8880c' : '3px solid transparent',
                          }}
                          onMouseEnter={e => { if (!isMe) (e.currentTarget as HTMLElement).style.background = '#161209' }}
                          onMouseLeave={e => { if (!isMe) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <td className="px-3 py-3 text-xs font-mono w-10"
                            style={{ color: displayRank <= 10 ? '#6b5010' : '#2a2218' }}>
                            {displayRank}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={entry.userName} level={entry.level} size={32} />
                              <div>
                                <p className="font-semibold"
                                  style={{ color: isMe ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif', fontSize: '0.8rem' }}>
                                  {entry.userName}{isMe && <span style={{ color: '#c8880c' }}> ✦</span>}
                                </p>
                                <p className="text-xs" style={{ color: '#3a2d10' }}>Niv. {entry.level}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-bold"
                            style={{ color: sort === 'points' ? '#c8880c' : '#8a7a5a', fontFamily: '"Cinzel", serif' }}>
                            {entry.totalPoints.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right hidden sm:table-cell"
                            style={{ color: sort === 'wins' ? '#c8880c' : '#6b5010' }}>
                            {entry.predictionsWon}
                          </td>
                          <td className="px-3 py-3 text-right hidden sm:table-cell">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                              background: entry.winRate >= 60 ? '#1a2810' : entry.winRate >= 40 ? '#1a1408' : '#0e0c08',
                              border: `1px solid ${entry.winRate >= 60 ? '#3a8a20' : entry.winRate >= 40 ? '#6b5010' : '#2a2218'}`,
                              color: entry.winRate >= 60 ? '#a0ff70' : entry.winRate >= 40 ? '#c8880c' : '#3a2d10',
                            }}>
                              {entry.winRate}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {entries.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3" style={{ color: '#c8880c' }}>⚖</p>
                <p className="font-semibold mb-1" style={{ fontFamily: '"Cinzel", serif', color: '#f0dfa8' }}>Orakl observe le vide</p>
                <p className="text-sm" style={{ color: '#6b5010' }}>Sois le premier à mériter son regard.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Bandeau "Ma position" fixe en bas (si hors top 50) ── */}
      {!isLoading && myRank !== undefined && !myEntryInList && (
        <div className="fixed bottom-0 left-0 right-0 z-30"
          style={{ background: '#161209', borderTop: '1px solid #c8880c44', boxShadow: '0 -4px 20px #00000060' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#1e1810', border: '1px solid #c8880c', color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
                #{myRank}
              </div>
              <p className="text-sm" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                Ta position dans l'Ordre
              </p>
            </div>
            <p className="text-xs" style={{ color: '#3a2d10' }}>
              Hors top 50 visible
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
