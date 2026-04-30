import { useEffect, useState } from 'react'
import { userService, type LeaderboardEntry } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

const pageStyle = { background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }
const cardStyle = { background: '#161209', border: '1px solid #6b5010', borderRadius: '6px' }

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const configs = {
    1: { avatarSize: 'w-20 h-20', avatarFont: '2rem', crown: '◆', crownColor: '#f5c842', podiumH: 112, glowColor: '#c8880c' },
    2: { avatarSize: 'w-16 h-16', avatarFont: '1.5rem', crown: '◈', crownColor: '#a0a0b0', podiumH: 80, glowColor: '#808090' },
    3: { avatarSize: 'w-14 h-14', avatarFont: '1.25rem', crown: '◈', crownColor: '#c87840', podiumH: 56, glowColor: '#c87840' },
  }
  const c = configs[rank]
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span style={{ fontSize: '1.25rem', color: c.crownColor, fontFamily: '"Cinzel", serif' }}>{c.crown}</span>
      <div
        className={`${c.avatarSize} rounded flex items-center justify-center font-black`}
        style={{
          background: `linear-gradient(135deg, ${c.glowColor}aa, ${c.glowColor})`,
          color: '#0e0c08',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: c.avatarFont,
          boxShadow: `0 0 20px ${c.glowColor}40`,
          border: `2px solid ${c.crownColor}`,
          outline: entry.isCurrentUser ? `2px solid ${c.crownColor}` : 'none',
          outlineOffset: '3px',
        }}
      >
        {entry.userName[0].toUpperCase()}
      </div>
      <div className="text-center">
        <p className="font-bold text-sm truncate max-w-[90px]" style={{ color: entry.isCurrentUser ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
          {entry.isCurrentUser ? 'Moi' : entry.userName}
        </p>
        <p className="text-xs font-black" style={{ color: c.crownColor, fontFamily: '"Cinzel", serif' }}>{entry.totalPoints.toLocaleString()} pts</p>
        <p className="text-xs" style={{ color: '#3a2d10' }}>Niv. {entry.level}</p>
      </div>
      <div
        className="w-full min-w-[90px] rounded-t flex items-center justify-center"
        style={{ height: `${c.podiumH}px`, background: '#161209', border: `1px solid ${c.crownColor}44`, borderBottom: 'none' }}
      >
        <span className="text-xl font-black" style={{ color: `${c.crownColor}30`, fontFamily: '"Cinzel", serif' }}>#{rank}</span>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank]   = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    userService.getLeaderboard(50)
      .then(res => { setEntries(res.entries); setMyRank(res.myRank) })
      .catch(() => setError('Impossible de charger le classement.'))
      .finally(() => setIsLoading(false))
  }, [])

  const [first, second, third] = entries
  const rest = entries.slice(3)

  return (
    <div style={pageStyle}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-1" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            L'Ordre d'Orakl
          </h1>
          <p className="text-sm" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Bénis d'Orakl. Maudits de leurs amis.
          </p>
          {myRank !== undefined && myRank > 3 && (
            <div className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ background: '#1e1810', border: '1px solid #c8880c', color: '#f5c842', fontFamily: '"Cinzel", serif' }}>
              Ta position : #{myRank}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-60">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
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
            {first && (
              <div className="mb-10">
                <div className="flex items-end justify-center gap-6">
                  {second ? <PodiumCard entry={second} rank={2} /> : <div className="min-w-[90px]" />}
                  <PodiumCard entry={first} rank={1} />
                  {third ? <PodiumCard entry={third} rank={3} /> : <div className="min-w-[90px]" />}
                </div>
                <div style={{ height:'1px', background:'linear-gradient(to right, transparent, #6b5010, transparent)', marginTop:'24px' }} />
              </div>
            )}

            {rest.length > 0 && (
              <div className="overflow-hidden rounded" style={cardStyle}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: '#3a2d10', color: '#6b5010' }}>
                      <th className="text-left px-4 py-3 w-10" style={{ fontFamily: '"Cinzel", serif' }}>#</th>
                      <th className="text-left px-4 py-3" style={{ fontFamily: '"Cinzel", serif' }}>Initié</th>
                      <th className="text-right px-4 py-3" style={{ fontFamily: '"Cinzel", serif' }}>Points</th>
                      <th className="text-right px-4 py-3 hidden sm:table-cell" style={{ fontFamily: '"Cinzel", serif' }}>Victoires</th>
                      <th className="text-right px-4 py-3 hidden sm:table-cell" style={{ fontFamily: '"Cinzel", serif' }}>Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry, i) => (
                      <tr
                        key={entry.userId}
                        className="border-b last:border-0 transition"
                        style={{
                          borderColor: '#2a2218',
                          background: entry.isCurrentUser ? '#1e1810' : 'transparent',
                        }}
                        onMouseEnter={e => { if (!entry.isCurrentUser) (e.currentTarget as HTMLElement).style.background = '#161209' }}
                        onMouseLeave={e => { if (!entry.isCurrentUser) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: '#3a2d10' }}>{i + 4}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg, #6b5010, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif' }}>
                              {entry.userName[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: entry.isCurrentUser ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif', fontSize: '0.8rem' }}>
                                {entry.userName}{entry.isCurrentUser && ' (moi)'}
                              </p>
                              <p className="text-xs" style={{ color: '#3a2d10' }}>Niv. {entry.level}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>{entry.totalPoints.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: '#6b5010' }}>{entry.predictionsWon}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                            background: entry.winRate >= 60 ? '#1a2810' : entry.winRate >= 40 ? '#1a1408' : '#0e0c08',
                            border: `1px solid ${entry.winRate >= 60 ? '#3a8a20' : entry.winRate >= 40 ? '#6b5010' : '#2a2218'}`,
                            color: entry.winRate >= 60 ? '#a0ff70' : entry.winRate >= 40 ? '#c8880c' : '#3a2d10',
                          }}>{entry.winRate}%</span>
                        </td>
                      </tr>
                    ))}
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
    </div>
  )
}
