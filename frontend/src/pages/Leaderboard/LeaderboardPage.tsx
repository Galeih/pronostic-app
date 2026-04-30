import { useEffect, useState } from 'react'
import { userService, type LeaderboardEntry } from '../../services/userService'
import Navbar from '../../components/layout/Navbar'

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: 1 | 2 | 3 }) {
  const configs = {
    1: { avatarSize: 'w-20 h-20 text-3xl', medal: '🥇', ring: 'ring-yellow-400', podiumH: 'h-28', podiumBg: 'bg-gradient-to-t from-yellow-900/50 to-yellow-900/10 border-yellow-700/30', pts: 'text-yellow-300' },
    2: { avatarSize: 'w-16 h-16 text-2xl', medal: '🥈', ring: 'ring-gray-400',   podiumH: 'h-20', podiumBg: 'bg-gradient-to-t from-gray-800/60 to-gray-800/10 border-gray-700/30',   pts: 'text-gray-300'   },
    3: { avatarSize: 'w-14 h-14 text-xl',  medal: '🥉', ring: 'ring-orange-500', podiumH: 'h-14', podiumBg: 'bg-gradient-to-t from-orange-900/40 to-orange-900/10 border-orange-800/30', pts: 'text-orange-300' },
  }
  const c = configs[rank]
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-2xl">{c.medal}</span>
      <div className={`${c.avatarSize} rounded-2xl bg-violet-700 flex items-center justify-center font-black text-white ring-2 ${c.ring}${entry.isCurrentUser ? ' ring-offset-2 ring-offset-gray-950' : ''}`}>
        {entry.userName[0].toUpperCase()}
      </div>
      <div className="text-center">
        <p className={`font-bold text-sm truncate max-w-[90px] ${entry.isCurrentUser ? 'text-violet-300' : 'text-white'}`}>
          {entry.isCurrentUser ? 'Moi' : entry.userName}
        </p>
        <p className={`text-xs font-black ${c.pts}`}>{entry.totalPoints.toLocaleString()} pts</p>
        <p className="text-xs text-gray-600">Niv. {entry.level}</p>
      </div>
      <div className={`w-full min-w-[90px] ${c.podiumH} rounded-t-xl border ${c.podiumBg} flex items-center justify-center`}>
        <span className="text-xl font-black text-white/20">#{rank}</span>
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
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-1">Classement</h1>
          <p className="text-gray-500 text-sm">Les meilleurs pronostiqueurs</p>
          {myRank !== undefined && myRank > 3 && (
            <div className="mt-3 inline-block bg-violet-900/30 border border-violet-700/40 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full">
              Ta position : #{myRank}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center h-60">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-gray-400">{error}</p>
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
              </div>
            )}

            {rest.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Joueur</th>
                      <th className="text-right px-4 py-3">Points</th>
                      <th className="text-right px-4 py-3 hidden sm:table-cell">Victoires</th>
                      <th className="text-right px-4 py-3 hidden sm:table-cell">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry, i) => (
                      <tr key={entry.userId} className={`border-b border-gray-800/50 last:border-0 transition ${entry.isCurrentUser ? 'bg-violet-900/20' : 'hover:bg-gray-800/40'}`}>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{i + 4}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-700 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                              {entry.userName[0].toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-semibold ${entry.isCurrentUser ? 'text-violet-300' : 'text-white'}`}>
                                {entry.userName}{entry.isCurrentUser && ' (moi)'}
                              </p>
                              <p className="text-xs text-gray-600">Niv. {entry.level}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-violet-400">{entry.totalPoints.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{entry.predictionsWon}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            entry.winRate >= 60 ? 'text-green-400 bg-green-900/30' :
                            entry.winRate >= 40 ? 'text-yellow-400 bg-yellow-900/30' : 'text-gray-400 bg-gray-800'
                          }`}>{entry.winRate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {entries.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🏆</p>
                <p className="text-gray-400 font-semibold mb-1">Aucun joueur pour l instant</p>
                <p className="text-gray-600 text-sm">Sois le premier !</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
