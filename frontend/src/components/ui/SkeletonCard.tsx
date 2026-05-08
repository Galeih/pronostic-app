import type { CSSProperties } from 'react'

// ── Styles et keyframes ────────────────────────────────────────────────────────

const SHIMMER_CSS = `
@keyframes orakl-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.orakl-skeleton {
  background: linear-gradient(
    90deg,
    #1a1510 25%,
    #2a2218 50%,
    #1a1510 75%
  );
  background-size: 800px 100%;
  animation: orakl-shimmer 1.6s ease-in-out infinite;
  border-radius: 4px;
}
`

let styleInjected = false
function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return
  styleInjected = true
  const s = document.createElement('style')
  s.textContent = SHIMMER_CSS
  document.head.appendChild(s)
}

// ── Brique de base ────────────────────────────────────────────────────────────

interface SkeletonLineProps {
  width?: string
  height?: string
  style?: CSSProperties
}

export function SkeletonLine({ width = '100%', height = '14px', style }: SkeletonLineProps) {
  injectStyle()
  return (
    <div
      className="orakl-skeleton"
      style={{ width, height, ...style }}
    />
  )
}

// ── Carte générique ───────────────────────────────────────────────────────────

interface SkeletonCardProps {
  /** Nombre de lignes dans le corps */
  lines?: number
  /** Afficher un badge statut simulé */
  badge?: boolean
  style?: CSSProperties
}

export function SkeletonCard({ lines = 3, badge = true, style }: SkeletonCardProps) {
  injectStyle()
  return (
    <div
      style={{
        background: '#161209',
        border: '1px solid #2a2218',
        borderRadius: '6px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        ...style,
      }}
    >
      {/* En-tête : titre + badge optionnel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <SkeletonLine width="65%" height="16px" />
        {badge && <SkeletonLine width="60px" height="20px" style={{ borderRadius: '9999px', flexShrink: 0 }} />}
      </div>

      {/* Corps */}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? '45%' : `${80 + (i % 3) * 7}%`}
          height="12px"
        />
      ))}
    </div>
  )
}

// ── Variante ligne classement ─────────────────────────────────────────────────

export function SkeletonRankRow() {
  injectStyle()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      background: '#161209',
      border: '1px solid #2a2218',
      borderRadius: '6px',
    }}>
      {/* Rang */}
      <SkeletonLine width="28px" height="28px" style={{ borderRadius: '50%', flexShrink: 0 }} />
      {/* Avatar */}
      <SkeletonLine width="36px" height="36px" style={{ borderRadius: '50%', flexShrink: 0 }} />
      {/* Nom + titre */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SkeletonLine width="50%" height="13px" />
        <SkeletonLine width="35%" height="10px" />
      </div>
      {/* Points */}
      <SkeletonLine width="48px" height="20px" style={{ borderRadius: '9999px', flexShrink: 0 }} />
    </div>
  )
}

// ── Variante stat-card (profil) ───────────────────────────────────────────────

export function SkeletonStatCard() {
  injectStyle()
  return (
    <div style={{
      background: '#161209',
      border: '1px solid #2a2218',
      borderRadius: '6px',
      padding: '16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    }}>
      <SkeletonLine width="40px" height="32px" />
      <SkeletonLine width="70%" height="11px" />
    </div>
  )
}
