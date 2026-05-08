import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ─── Helpers visuels ─────────────────────────────────────────────────────────

function avatarGradient(level: number): string {
  if (level >= 20) return 'linear-gradient(135deg, #7b2ff7, #c84fff)'
  if (level >= 12) return 'linear-gradient(135deg, #b8860b, #f5c842)'
  if (level >= 8)  return 'linear-gradient(135deg, #1a6b3a, #3aaa60)'
  if (level >= 5)  return 'linear-gradient(135deg, #1a4a6b, #3a80c8)'
  return 'linear-gradient(135deg, #3a2d10, #6b5010)'
}

function rankTitle(level: number): string {
  if (level >= 20) return 'Prophète Suprême'
  if (level >= 16) return 'Archiviste'
  if (level >= 12) return 'Grand Oracle'
  if (level >= 8)  return 'Oracle'
  if (level >= 5)  return 'Voyant'
  if (level >= 3)  return 'Initié'
  return 'Novice'
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [burgerOpen, setBurgerOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
    setBurgerOpen(false)
  }

  const navLinks = isAuthenticated
    ? [
        { to: '/create',      label: '✦ Créer' },
        { to: '/channels',    label: 'Cercles' },
        { to: '/history',     label: 'Archives' },
        { to: '/leaderboard', label: 'Classement' },
      ]
    : []

  const isActive = (path: string) => location.pathname === path

  const level = user?.level ?? 1

  return (
    <>
      {/* Animation slide-down burger */}
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .burger-panel { animation: slide-down 0.18s ease-out; }
      `}</style>

      <nav className="sticky top-0 z-50" style={{ background: '#0e0c08', borderBottom: '1px solid #6b5010' }}>
        {/* Ligne dorée supérieure */}
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #c8880c, #f5c842, #c8880c, transparent)' }} />

        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link
            to="/"
            onClick={() => setBurgerOpen(false)}
            style={{ fontFamily: '"Cinzel Decorative", serif', letterSpacing: '0.05em' }}
            className="text-lg font-bold flex-shrink-0 flex items-center gap-1.5"
          >
            <span style={{ color: '#f5c842' }}>✦</span>
            <span style={{ color: '#f0dfa8' }}>Play</span>
            <span style={{ color: '#c8880c' }}>-</span>
            <span style={{ color: '#f5c842' }}>Orakl</span>
            <span style={{ color: '#f5c842' }}>✦</span>
          </Link>

          {/* ── Liens desktop ─────────────────────────────────────────── */}
          <div className="hidden sm:flex items-center gap-1" style={{ fontFamily: '"Cinzel", serif' }}>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="relative px-3 py-1 text-sm transition"
                style={{ color: isActive(link.to) ? '#f5c842' : '#8a7a5a' }}
                onMouseEnter={e => { if (!isActive(link.to)) (e.currentTarget as HTMLElement).style.color = '#f0dfa8' }}
                onMouseLeave={e => { if (!isActive(link.to)) (e.currentTarget as HTMLElement).style.color = '#8a7a5a' }}
              >
                {link.label}
                {/* Underline actif */}
                {isActive(link.to) && (
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: '70%', height: '2px', background: 'linear-gradient(to right, #c8880c, #f5c842)', display: 'block' }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* ── Droite : avatar + burger ───────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Burger (mobile) */}
            {isAuthenticated && (
              <button
                className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1"
                onClick={() => setBurgerOpen(o => !o)}
                aria-label="Menu"
              >
                <span className="block w-5 h-0.5 transition-all duration-200" style={{
                  background: '#c8880c',
                  transform: burgerOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none',
                }} />
                <span className="block w-5 h-0.5 transition-all duration-200" style={{
                  background: '#c8880c',
                  opacity: burgerOpen ? 0 : 1,
                }} />
                <span className="block w-5 h-0.5 transition-all duration-200" style={{
                  background: '#c8880c',
                  transform: burgerOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none',
                }} />
              </button>
            )}

            {/* Avatar + dropdown (connecté) */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full pl-2 pr-2 py-1 transition"
                  style={{
                    background: '#1e1810',
                    border: `1px solid ${menuOpen ? '#c8880c' : '#6b5010'}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: avatarGradient(level), color: '#0e0c08', fontFamily: '"Cinzel", serif' }}
                  >
                    {user?.userName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  {/* Nom (desktop) */}
                  <span className="hidden sm:block max-w-[100px] truncate" style={{ fontFamily: '"Cinzel", serif', fontSize: '0.7rem', color: '#f0dfa8' }}>
                    {user?.userName}
                  </span>
                  {/* Chevron */}
                  <span className="text-xs transition-transform duration-200"
                    style={{ color: '#c8880c', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-2xl overflow-hidden z-50"
                    style={{ background: '#161209', border: '1px solid #6b5010' }}
                  >
                    {/* En-tête */}
                    <div style={{ background: 'linear-gradient(135deg, #1e1810, #2a2218)', borderBottom: '1px solid #6b5010', padding: '12px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: avatarGradient(level), color: '#0e0c08', fontFamily: '"Cinzel", serif' }}>
                          {user?.userName?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                            {user?.userName}
                          </p>
                          <p className="text-xs" style={{ color: '#c8880c' }}>
                            Niv. {level} · {rankTitle(level)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#6b5010' }}>
                            {user?.totalPoints?.toLocaleString()} pts
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Liens */}
                    {[
                      { to: '/profile',     label: '◈ Mon profil' },
                      { to: '/settings',    label: '◈ Paramètres' },
                      { to: '/channels',    label: '◈ Cercles' },
                      { to: '/history',     label: '◈ Archives' },
                      { to: '/leaderboard', label: '◈ Classement' },
                      { to: '/create',      label: '◈ Nouveau pronostic' },
                    ].map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm transition"
                        style={{
                          color: isActive(item.to) ? '#f5c842' : '#b89a60',
                          background: isActive(item.to) ? '#1e1810' : 'transparent',
                          fontFamily: '"Cinzel", serif',
                          fontSize: '0.75rem',
                        }}
                        onMouseEnter={e => {
                          if (!isActive(item.to)) {
                            (e.currentTarget as HTMLElement).style.color = '#f5c842'
                            ;(e.currentTarget as HTMLElement).style.background = '#1e1810'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive(item.to)) {
                            (e.currentTarget as HTMLElement).style.color = '#b89a60'
                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    ))}

                    {/* Déconnexion */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2.5 text-sm transition"
                      style={{ color: '#9a4040', borderTop: '1px solid #2a1810', fontFamily: '"Cinzel", serif', fontSize: '0.75rem', cursor: 'pointer' }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.color = '#ff6060'
                        ;(e.currentTarget as HTMLElement).style.background = '#1a0c0c'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.color = '#9a4040'
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      ✦ Quitter le cercle
                    </button>
                  </div>
                )}
              </div>

            ) : (
              /* Non connecté */
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm px-3 py-1.5 transition"
                  style={{ color: '#8a7a5a', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f0dfa8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#8a7a5a')}
                >
                  Entrer
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold px-4 py-1.5 rounded transition"
                  style={{
                    background: 'linear-gradient(135deg, #a36808, #c8880c)',
                    color: '#0e0c08',
                    fontFamily: '"Cinzel", serif',
                    fontSize: '0.75rem',
                    border: '1px solid #f5c842',
                  }}
                >
                  Rejoindre
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ligne dorée inférieure */}
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)' }} />

        {/* ── Menu burger mobile ─────────────────────────────────────────── */}
        {burgerOpen && isAuthenticated && (
          <div className="burger-panel sm:hidden" style={{ background: '#0e0c08', borderBottom: '1px solid #6b5010' }}>
            {/* En-tête utilisateur */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #2a2218' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                style={{ background: avatarGradient(level), color: '#0e0c08', fontFamily: '"Cinzel", serif' }}>
                {user?.userName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                  {user?.userName}
                </p>
                <p className="text-xs" style={{ color: '#c8880c' }}>
                  Niv. {level} · {rankTitle(level)} · {user?.totalPoints?.toLocaleString()} pts
                </p>
              </div>
            </div>

            {/* Liens */}
            <div className="flex flex-col px-3 py-2 gap-0.5">
              {[
                { to: '/create',      label: '✦ Créer un pronostic' },
                { to: '/channels',    label: '◈ Cercles' },
                { to: '/history',     label: '◈ Archives' },
                { to: '/leaderboard', label: '◈ Classement' },
                { to: '/profile',     label: '◈ Mon profil' },
                { to: '/settings',    label: '◈ Paramètres' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setBurgerOpen(false)}
                  className="px-3 py-2.5 text-sm rounded transition"
                  style={{
                    fontFamily: '"Cinzel", serif',
                    color: isActive(link.to) ? '#f5c842' : '#b89a60',
                    background: isActive(link.to) ? '#1e1810' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="text-left px-3 py-2.5 text-sm rounded transition mt-1"
                style={{ color: '#9a4040', fontFamily: '"Cinzel", serif', borderTop: '1px solid #2a1810', cursor: 'pointer' }}
              >
                ✦ Quitter le cercle
              </button>
            </div>
          </div>
        )}

        {/* Backdrop pour fermer les menus */}
        {(menuOpen || burgerOpen) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setMenuOpen(false); setBurgerOpen(false) }}
          />
        )}
      </nav>
    </>
  )
}
