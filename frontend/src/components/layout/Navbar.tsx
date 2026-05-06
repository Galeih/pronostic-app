import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-amber-300 font-semibold'
      : 'text-amber-700 hover:text-amber-300'

  const navLinks = isAuthenticated
    ? [
        { to: '/create',      label: '✦ Créer' },
        { to: '/history',     label: 'Archives' },
        { to: '/leaderboard', label: 'Orakl' },
      ]
    : []

  return (
    <nav className="sticky top-0 z-50" style={{ background: '#0e0c08', borderBottom: '1px solid #6b5010' }}>
      {/* Top gold line */}
      <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #c8880c, #f5c842, #c8880c, transparent)' }} />

      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
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

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-6 text-sm" style={{ fontFamily: '"Cinzel", serif' }}>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className={`transition ${isActive(link.to)}`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: user menu + burger */}
        <div className="flex items-center gap-2">

          {/* Burger button (mobile only) */}
          {isAuthenticated && (
            <button
              className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1"
              onClick={() => setBurgerOpen(o => !o)}
              aria-label="Menu"
            >
              <span
                className="block w-5 h-0.5 transition-all duration-200"
                style={{
                  background: '#c8880c',
                  transform: burgerOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none',
                }}
              />
              <span
                className="block w-5 h-0.5 transition-all duration-200"
                style={{
                  background: '#c8880c',
                  opacity: burgerOpen ? 0 : 1,
                }}
              />
              <span
                className="block w-5 h-0.5 transition-all duration-200"
                style={{
                  background: '#c8880c',
                  transform: burgerOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none',
                }}
              />
            </button>
          )}

          {/* User dropdown (desktop) */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 rounded-full pl-3 pr-2 py-1.5 text-sm transition"
                style={{
                  background: '#1e1810',
                  border: '1px solid #6b5010',
                  color: '#f0dfa8'
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #c8880c, #f5c842)', color: '#0e0c08' }}
                >
                  {user?.userName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="hidden sm:block max-w-[100px] truncate" style={{ fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}>
                  {user?.userName}
                </span>
                <span style={{ color: '#c8880c', fontSize: '0.6rem' }}>▼</span>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-lg shadow-2xl overflow-hidden z-50"
                  style={{ background: '#161209', border: '1px solid #6b5010' }}
                >
                  <div style={{
                    background: 'linear-gradient(135deg, #1e1810, #2a2218)',
                    borderBottom: '1px solid #6b5010',
                    padding: '12px 16px'
                  }}>
                    <p className="text-xs" style={{ color: '#6b5010' }}>Initié des mystères</p>
                    <p className="text-sm font-semibold" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                      {user?.userName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#c8880c' }}>
                      Niv. {user?.level} · {user?.totalPoints} pts
                    </p>
                  </div>

                  {[
                    { to: '/profile', label: '◈ Mon profil' },
                    { to: '/history', label: '◈ Archives' },
                    { to: '/create',  label: '◈ Nouveau pronostic' },
                  ].map(item => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm transition"
                      style={{ color: '#b89a60' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f5c842'; (e.currentTarget as HTMLElement).style.background = '#1e1810' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#b89a60'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm transition"
                    style={{ color: '#9a4040', borderTop: '1px solid #2a1810' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ff6060'; (e.currentTarget as HTMLElement).style.background = '#1a0c0c' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9a4040'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    ✦ Quitter le cercle
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm px-3 py-1.5 transition"
                style={{ color: '#8a7a5a', fontFamily: '"Cinzel", serif', fontSize: '0.75rem' }}
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
                  border: '1px solid #f5c842'
                }}
              >
                Rejoindre
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gold line */}
      <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #6b5010, transparent)' }} />

      {/* Mobile burger menu panel */}
      {burgerOpen && isAuthenticated && (
        <div style={{ background: '#0e0c08', borderBottom: '1px solid #6b5010' }}>
          <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setBurgerOpen(false)}
                className="px-3 py-2.5 text-sm rounded transition"
                style={{
                  fontFamily: '"Cinzel", serif',
                  color: location.pathname === link.to ? '#f5c842' : '#b89a60',
                  background: location.pathname === link.to ? '#1e1810' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/profile"
              onClick={() => setBurgerOpen(false)}
              className="px-3 py-2.5 text-sm rounded transition"
              style={{ fontFamily: '"Cinzel", serif', color: '#b89a60' }}
            >
              ◈ Mon profil
            </Link>
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2.5 text-sm rounded transition"
              style={{ color: '#9a4040', fontFamily: '"Cinzel", serif' }}
            >
              ✦ Quitter le cercle
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for dropdowns */}
      {(menuOpen || burgerOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setMenuOpen(false); setBurgerOpen(false) }}
        />
      )}
    </nav>
  )
}
