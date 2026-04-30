import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-violet-400 font-semibold'
      : 'text-gray-400 hover:text-white'

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        <Link to="/" className="text-xl font-extrabold text-white tracking-tight flex-shrink-0">
          Prono<span className="text-violet-500">App</span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm">
          {isAuthenticated && (
            <>
              <Link to="/create" className={`transition ${isActive('/create')}`}>
                + Creer
              </Link>
              <Link to="/history" className={`transition ${isActive('/history')}`}>
                Historique
              </Link>
              <Link to="/leaderboard" className={`transition ${isActive('/leaderboard')}`}>
                Classement
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full pl-3 pr-2 py-1.5 text-sm text-gray-200 transition"
              >
                <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user?.userName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:block max-w-[100px] truncate">{user?.userName}</span>
                <span className="text-gray-500 text-xs ml-1">{menuOpen ? 'v' : 'v'}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-xs text-gray-500">Connecte en tant que</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.userName}</p>
                    <p className="text-xs text-violet-400 mt-0.5">Niv. {user?.level} · {user?.totalPoints} pts</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
                  >
                    Mon profil
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition sm:hidden"
                  >
                    Historique
                  </Link>
                  <Link
                    to="/create"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition sm:hidden"
                  >
                    Creer un pronostic
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition border-t border-gray-800"
                  >
                    Deconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-white px-3 py-1.5 transition"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-1.5 rounded-lg transition"
              >
                Creer un compte
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  )
}
