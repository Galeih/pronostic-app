import { createContext, useCallback, useContext, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastCtx {
  /** Affiche un toast. Par défaut : type='info', durée=3500 ms. */
  addToast: (message: string, type?: ToastType, duration?: number) => void
  /** Raccourcis */
  success: (message: string, duration?: number) => void
  error:   (message: string, duration?: number) => void
  info:    (message: string, duration?: number) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastCtx | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration = 3500,
  ) => {
    const id = `toast-${++counter.current}`
    setToasts(prev => [...prev, { id, type, message, duration }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const value: ToastCtx = {
    addToast,
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error',   dur),
    info:    (msg, dur) => addToast(msg, 'info',     dur),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider')
  return ctx
}

// ── Styles par type ───────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: '#0a1e0a', border: '#2a6010', color: '#a0ff70', icon: '✦' },
  error:   { bg: '#1e0808', border: '#6b2020', color: '#e05050', icon: '✗' },
  info:    { bg: '#1a1208', border: '#c8880c', color: '#f5c842', icon: '◈' },
}

// ── Container ─────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <>
      {/* Keyframes CSS injectés une seule fois */}
      <style>{`
        @keyframes orakl-toast-in {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        style={{
          position:      'fixed',
          top:           '16px',
          right:         '16px',
          zIndex:        9999,
          display:       'flex',
          flexDirection: 'column',
          gap:           '8px',
          maxWidth:      '360px',
          width:         'calc(100vw - 32px)',
          pointerEvents: 'none',   // clics traversants sauf sur les toasts eux-mêmes
        }}
      >
        {toasts.map(t => (
          <SingleToast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    </>
  )
}

// ── Toast individuel ──────────────────────────────────────────────────────────

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const s = STYLES[toast.type]

  return (
    <div
      style={{
        background:    s.bg,
        border:        `1px solid ${s.border}`,
        borderRadius:  '6px',
        padding:       '12px 14px',
        display:       'flex',
        alignItems:    'flex-start',
        gap:           '10px',
        boxShadow:     `0 4px 24px ${s.border}50`,
        animation:     'orakl-toast-in 0.2s ease-out',
        pointerEvents: 'auto',
      }}
    >
      {/* Icône */}
      <span style={{ color: s.color, fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>
        {s.icon}
      </span>

      {/* Message */}
      <p style={{
        flex:       1,
        fontSize:   '0.8rem',
        color:      '#f0dfa8',
        fontFamily: '"Cinzel", serif',
        lineHeight: 1.5,
        margin:     0,
      }}>
        {toast.message}
      </p>

      {/* Bouton fermer */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          color:      '#3a2d10',
          background: 'none',
          border:     'none',
          cursor:     'pointer',
          fontSize:   '16px',
          flexShrink: 0,
          padding:    0,
          lineHeight: 1,
        }}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}
