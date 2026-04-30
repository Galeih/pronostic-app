import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/layout/Navbar'

const EXAMPLES = [
  { q: 'Qui va arriver en retard dimanche ?',    emoji: '⏰' },
  { q: 'Combien de temps avant que Lucas dise je lag ?', emoji: '🎮' },
  { q: 'Quel film va gagner ce soir ?',          emoji: '🎬' },
  { q: 'Est-ce que Florian va finir son projet avant dimanche ?', emoji: '💻' },
  { q: 'Qui va finir son assiette en premier ?', emoji: '🍽️' },
]

const BOOSTS = [
  { name: 'Correction',   desc: 'Modifie ton vote avant la fermeture', color: 'from-blue-600 to-blue-800',   icon: '↩️' },
  { name: 'Double Vote',  desc: 'Joue sur deux reponses a la fois',    color: 'from-violet-600 to-violet-800', icon: '2️⃣' },
  { name: 'Sabotage',     desc: "Reduit les gains d'un adversaire",   color: 'from-red-600 to-red-800',     icon: '⚔️' },
  { name: 'Bouclier',     desc: 'Protege contre les sabotages',        color: 'from-green-600 to-green-800', icon: '🛡️' },
]

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
      setJoinError('Le code doit faire 8 caracteres.')
      return
    }
    navigate(`/p/${code}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-block bg-violet-900/30 border border-violet-700/40 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            Le jeu de pronostics sociaux entre amis
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
            Pose une question.<br />
            <span className="text-violet-400">Fais voter tes amis.</span><br />
            Revele les gagnants.
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Cree un pronostic en 30 secondes, partage le lien sur Discord, WhatsApp
            ou en message, et decouvre qui avait raison.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isAuthenticated ? '/create' : '/register'}
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition shadow-lg shadow-violet-900/40"
            >
              Creer un pronostic
            </Link>
            <a
              href="#rejoindre"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold px-8 py-3.5 rounded-xl text-base transition"
            >
              Rejoindre par code
            </a>
          </div>
        </div>
      </section>

      <section id="rejoindre" className="max-w-md mx-auto px-4 pb-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl text-center">
          <p className="text-lg font-bold mb-1">Tu as recu un lien ?</p>
          <p className="text-gray-400 text-sm mb-5">Colle le code de partage ci-dessous.</p>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              placeholder="Code a 8 lettres"
              maxLength={8}
              className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase tracking-widest transition"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition"
            >
              Rejoindre
            </button>
          </form>
          {joinError && (
            <p className="text-red-400 text-xs mt-2">{joinError}</p>
          )}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-extrabold text-center mb-3">Des pronostics sur tout</h2>
        <p className="text-gray-500 text-sm text-center mb-8">N'importe quelle question devient un jeu collectif.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXAMPLES.map(ex => (
            <div
              key={ex.q}
              className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4 flex items-start gap-3 hover:border-violet-700/50 transition group"
            >
              <span className="text-2xl flex-shrink-0">{ex.emoji}</span>
              <p className="text-sm text-gray-300 group-hover:text-white transition leading-snug">
                "{ex.q}"
              </p>
            </div>
          ))}

          <Link
            to={isAuthenticated ? '/create' : '/register'}
            className="bg-violet-900/20 border-2 border-dashed border-violet-700/50 hover:border-violet-500 rounded-xl px-4 py-4 flex items-center justify-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-semibold transition"
          >
            Cree le tien
          </Link>
        </div>
      </section>

      <section className="bg-gray-900 border-y border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-center mb-2">Des boosts pour pimenter le jeu</h2>
          <p className="text-gray-500 text-sm text-center mb-10">
            Utilise des boosts strategiques pour maximiser tes gains... ou saboter tes adversaires.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BOOSTS.map(b => (
              <div
                key={b.name}
                className={`bg-gradient-to-br ${b.color} rounded-2xl p-4 text-white`}
              >
                <p className="text-3xl mb-2">{b.icon}</p>
                <p className="font-bold text-sm mb-1">{b.name}</p>
                <p className="text-xs opacity-75 leading-snug">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-extrabold text-center mb-12">Comment ca marche ?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { step: '1', icon: '✏️', title: 'Cree',    desc: 'Redige une question, ajoute des choix, fixe une date limite.' },
            { step: '2', icon: '🔗', title: 'Partage', desc: 'Envoie le lien sur Discord, WhatsApp ou en SMS. Tes amis rejoignent en un clic.' },
            { step: '3', icon: '🏆', title: 'Revele',  desc: 'Choisis la bonne reponse. Les points tombent, les debats commencent.' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-900/40 border border-violet-700/50 flex items-center justify-center text-3xl mb-4">
                {s.icon}
              </div>
              <p className="font-extrabold text-lg mb-2">{s.title}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center pb-20 px-4">
        <div className="max-w-lg mx-auto bg-gradient-to-br from-violet-900/40 to-gray-900 border border-violet-700/30 rounded-2xl p-10">
          <p className="text-3xl font-black mb-3">Pret a jouer ?</p>
          <p className="text-gray-400 text-sm mb-6">
            C'est gratuit, sans publicite, sans argent reel.
          </p>
          <Link
            to={isAuthenticated ? '/create' : '/register'}
            className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-3.5 rounded-xl text-base transition"
          >
            {isAuthenticated ? 'Creer un pronostic' : 'Creer un compte gratuit'}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 text-center">
        <p className="text-xs text-gray-600">
          PronosticApp — Jeu de pronostics sociaux entre amis. Aucun argent reel.
        </p>
      </footer>
    </div>
  )
}
