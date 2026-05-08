import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useSignalR } from '../../hooks/useSignalR'
import type { SignalRMessage } from '../../hooks/useSignalR'
import { channelService, type Channel, type ChatMessage } from '../../services/channelService'
import { predictionService } from '../../services/predictionService'
import type { Prediction } from '../../types'

// ── Styles / Animations ───────────────────────────────────────────────────────

const CHAT_CSS = `
@keyframes msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.msg-appear { animation: msg-in 0.18s ease-out; }
`

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarGradient(level: number): string {
  if (level >= 20) return 'linear-gradient(135deg, #7b2ff7, #c84fff)'
  if (level >= 12) return 'linear-gradient(135deg, #b8860b, #f5c842)'
  if (level >= 8)  return 'linear-gradient(135deg, #1a6b3a, #3aaa60)'
  if (level >= 5)  return 'linear-gradient(135deg, #1a4a6b, #3a80c8)'
  return 'linear-gradient(135deg, #3a2d10, #6b5010)'
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function signalRToChat(m: SignalRMessage): ChatMessage {
  return {
    id: m.id, senderId: m.senderId, senderName: m.senderName,
    senderLevel: m.senderLevel, content: m.content,
    type: m.type as 'Text' | 'PredictionShare',
    predictionShareCode: m.predictionShareCode,
    createdAt: m.createdAt,
  }
}

// ── Composant bulle message ────────────────────────────────────────────────────

interface BubbleProps {
  msg: ChatMessage
  isMine: boolean
  showAvatar: boolean
}

function MessageBubble({ msg, isMine, showAvatar }: BubbleProps) {
  return (
    <div
      className={`flex items-end gap-2 msg-appear ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ marginBottom: '2px' }}
    >
      {/* Avatar */}
      <div style={{ width: 28, flexShrink: 0, alignSelf: 'flex-end' }}>
        {showAvatar && !isMine ? (
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold"
            style={{
              width: 28, height: 28,
              background: avatarGradient(msg.senderLevel),
              color: '#0e0c08', fontFamily: '"Cinzel", serif',
            }}
          >
            {initials(msg.senderName)}
          </div>
        ) : <div style={{ width: 28 }} />}
      </div>

      {/* Bulle */}
      <div style={{ maxWidth: '72%' }}>
        {showAvatar && !isMine && (
          <p className="text-xs mb-0.5" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', paddingLeft: '4px' }}>
            {msg.senderName}
          </p>
        )}

        {msg.type === 'PredictionShare' ? (
          <PredictionCard shareCode={msg.predictionShareCode!} isMine={isMine} />
        ) : (
          <div
            className="rounded px-3 py-2 text-sm"
            style={{
              background: isMine ? 'linear-gradient(135deg, #a36808, #c8880c)' : '#1a1510',
              color: isMine ? '#0e0c08' : '#f0dfa8',
              border: isMine ? 'none' : '1px solid #2a2218',
              fontFamily: '"Lora", serif',
              lineHeight: 1.5,
              borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              wordBreak: 'break-word',
            }}
          >
            {msg.content}
          </div>
        )}

        <p className={`text-xs mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}
          style={{ color: '#2a2218', paddingLeft: isMine ? 0 : '4px' }}>
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  )
}

// ── Carte pronostic partagé ───────────────────────────────────────────────────

function PredictionCard({ shareCode, isMine }: { shareCode: string; isMine: boolean }) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    predictionService.getByShareCode(shareCode)
      .then(setPrediction)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [shareCode])

  return (
    <Link
      to={`/p/${shareCode}`}
      className="block rounded"
      style={{
        background: '#161209',
        border: `1px solid ${isMine ? '#c8880c' : '#3a2d10'}`,
        padding: '10px 12px',
        textDecoration: 'none',
        maxWidth: 260,
        borderRadius: '10px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = isMine ? '#c8880c' : '#3a2d10')}
    >
      <p className="text-xs mb-1" style={{ color: '#c8880c', fontFamily: '"Cinzel", serif' }}>
        ✦ Pronostic partagé
      </p>
      {loading ? (
        <div className="orakl-skeleton" style={{ height: 14, borderRadius: '3px' }} />
      ) : prediction ? (
        <p className="text-sm" style={{ color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic', lineHeight: 1.4 }}>
          « {prediction.question} »
        </p>
      ) : (
        <p className="text-xs" style={{ color: '#3a2d10' }}>Pronostic introuvable</p>
      )}
      <p className="text-xs mt-1" style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif' }}>
        Cliquer pour voir →
      </p>
    </Link>
  )
}

// ── Séparateur de date ────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #2a2218)' }} />
      <span className="text-xs" style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif', letterSpacing: '0.1em' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #2a2218)' }} />
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ChannelPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { error: toastError, info } = useToast()

  const [channel, setChannel]           = useState<Channel | null>(null)
  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [text, setText]                 = useState('')
  const [isSending, setIsSending]       = useState(false)
  const [showMembers, setShowMembers]   = useState(false)
  const [showSharePicker, setShowSharePicker] = useState(false)
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([])
  const [hasMore, setHasMore]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [copied, setCopied]             = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  usePageTitle(channel ? channel.name : 'Cercle')

  // ── SignalR ────────────────────────────────────────────────────────────────

  const { sendMessage, sharePrediction } = useSignalR({
    groupId: id ?? null,
    onMessage: (msg) => {
      setMessages(prev => [...prev, signalRToChat(msg)])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    },
    onMemberJoined: (m) => info(`${m.userName} a rejoint le cercle`),
  })

  // ── Chargement initial ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    Promise.all([
      channelService.getById(id),
      channelService.getMessages(id),
    ])
      .then(([ch, msgs]) => {
        setChannel(ch)
        setMessages(msgs)
        setHasMore(msgs.length === 50)
      })
      .catch(() => { toastError('Impossible de charger ce cercle.'); navigate('/channels') })
      .finally(() => setIsLoading(false))
  }, [id])

  // Scroll en bas au chargement initial
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 100)
    }
  }, [isLoading])

  // ── Charger plus (scroll vers le haut) ─────────────────────────────────────

  const loadMore = async () => {
    if (!id || loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = messages[0].createdAt
      const older = await channelService.getMessages(id, oldest)
      setMessages(prev => [...older, ...prev])
      setHasMore(older.length === 50)
    } catch { /* ignore */ } finally {
      setLoadingMore(false)
    }
  }

  // ── Envoi message ──────────────────────────────────────────────────────────

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!id || !text.trim() || isSending) return
    const content = text.trim()
    setText('')
    setIsSending(true)
    try {
      await sendMessage(id, content)
    } catch {
      toastError('Envoi échoué.')
      setText(content)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Partage de pronostic ──────────────────────────────────────────────────

  const openSharePicker = async () => {
    setShowSharePicker(true)
    if (myPredictions.length === 0) {
      try {
        const all = await predictionService.getMyPredictions()
        setMyPredictions(all)
      } catch { /* ignore */ }
    }
  }

  const handleSharePrediction = async (shareCode: string) => {
    if (!id) return
    setShowSharePicker(false)
    try {
      await sharePrediction(id, shareCode)
    } catch {
      toastError('Partage échoué.')
    }
  }

  // ── Copier le code d'invitation ───────────────────────────────────────────

  const copyInviteCode = () => {
    navigator.clipboard.writeText(channel?.inviteCode ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Grouper les messages par date ─────────────────────────────────────────

  type MsgGroup = { date: string; items: ChatMessage[] }
  const grouped: MsgGroup[] = []
  messages.forEach(m => {
    const d = new Date(m.createdAt).toDateString()
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== d) grouped.push({ date: d, items: [m] })
    else last.items.push(m)
  })

  if (isLoading) return (
    <div style={{ background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }}>
      <Navbar />
      <div className="flex items-center justify-center h-80">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#c8880c', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )

  return (
    <div style={{ background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8', display: 'flex', flexDirection: 'column' }}>
      <style>{CHAT_CSS}</style>
      <Navbar />

      {/* ── Barre de titre ── */}
      <div style={{
        background: '#161209', borderBottom: '1px solid #2a2218',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        position: 'sticky', top: 64, zIndex: 10,
      }}>
        <button onClick={() => navigate('/channels')}
          style={{ background: 'none', border: 'none', color: '#6b5010', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>
          ←
        </button>

        <div
          className="flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0"
          style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3a2d10, #c8880c)', color: '#0e0c08', fontFamily: '"Cinzel", serif' }}
        >
          {channel?.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ fontFamily: '"Cinzel", serif', color: '#f5c842', fontSize: '0.9rem' }}>
            {channel?.name}
          </p>
          <p className="text-xs" style={{ color: '#3a2d10' }}>
            {channel?.memberCount} membre{(channel?.memberCount ?? 0) > 1 ? 's' : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={copyInviteCode}
            title="Copier le code d'invitation"
            className="text-xs px-3 py-1.5 rounded"
            style={{
              background: '#0e0c08', border: '1px solid #3a2d10',
              color: copied ? '#a0ff70' : '#6b5010', cursor: 'pointer',
              fontFamily: '"Cinzel", serif', transition: 'color 0.2s',
            }}>
            {copied ? '✓ Copié' : `◈ ${channel?.inviteCode}`}
          </button>

          <button
            onClick={() => setShowMembers(!showMembers)}
            title="Membres"
            className="text-xs px-3 py-1.5 rounded"
            style={{
              background: showMembers ? '#1a1510' : '#0e0c08',
              border: `1px solid ${showMembers ? '#c8880c' : '#3a2d10'}`,
              color: showMembers ? '#c8880c' : '#6b5010',
              cursor: 'pointer', fontFamily: '"Cinzel", serif',
            }}>
            ⚖ {channel?.memberCount}
          </button>
        </div>
      </div>

      {/* ── Panneau membres (slide-in) ── */}
      {showMembers && (
        <div style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 240, zIndex: 50,
          background: '#161209', borderLeft: '1px solid #3a2d10',
          padding: '80px 16px 16px', overflowY: 'auto',
        }}>
          <p className="text-xs uppercase tracking-widest mb-4"
            style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', letterSpacing: '0.25em' }}>
            Membres ({channel?.memberCount})
          </p>
          <div className="space-y-2">
            {channel?.members.map(m => (
              <div key={m.userId} className="flex items-center gap-2">
                <div className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                  style={{ width: 28, height: 28, background: avatarGradient(m.level), color: '#0e0c08', fontFamily: '"Cinzel", serif' }}>
                  {initials(m.userName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: m.userId === user?.id ? '#f5c842' : '#f0dfa8', fontFamily: '"Cinzel", serif' }}>
                    {m.userName} {m.userId === user?.id ? '(toi)' : ''}
                  </p>
                  {m.role === 'Admin' && (
                    <p className="text-xs" style={{ color: '#c8880c' }}>Admin</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Zone de messages ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ marginRight: showMembers ? 240 : 0, paddingBottom: 80 }}
      >
        {/* Bouton charger plus */}
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs px-4 py-2 rounded"
              style={{
                background: '#161209', border: '1px solid #3a2d10',
                color: '#6b5010', cursor: 'pointer', fontFamily: '"Cinzel", serif',
              }}>
              {loadingMore ? '◈ Chargement…' : '↑ Charger plus'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3" style={{ color: '#3a2d10' }}>✦</p>
            <p className="text-sm" style={{ color: '#3a2d10', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
              Orakl attend votre première prophétie…
            </p>
          </div>
        )}

        {grouped.map(({ date, items }) => (
          <div key={date}>
            <DateSeparator label={formatDate(items[0].createdAt)} />
            {items.map((msg, i) => {
              const prev = i > 0 ? items[i - 1] : null
              const showAvatar = !prev || prev.senderId !== msg.senderId
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMine={msg.senderId === user?.id}
                  showAvatar={showAvatar}
                />
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Picker de pronostic ── */}
      {showSharePicker && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0e0c08cc', zIndex: 40,
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowSharePicker(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, margin: '0 auto',
              background: '#161209', border: '1px solid #3a2d10',
              borderRadius: '12px 12px 0 0', padding: '16px',
              maxHeight: '60vh', overflowY: 'auto',
            }}>
            <p className="text-xs uppercase tracking-widest mb-3"
              style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', letterSpacing: '0.25em' }}>
              Partager un pronostic
            </p>
            {myPredictions.length === 0 ? (
              <p className="text-sm" style={{ color: '#3a2d10', fontStyle: 'italic' }}>Aucun pronostic trouvé.</p>
            ) : (
              <div className="space-y-2">
                {myPredictions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSharePrediction(p.shareCode)}
                    className="w-full text-left p-3 rounded transition"
                    style={{
                      background: '#0e0c08', border: '1px solid #2a2218',
                      color: '#f0dfa8', fontFamily: '"Lora", serif', fontStyle: 'italic',
                      fontSize: '0.85rem', cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2218')}
                  >
                    ✦ {p.question}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Barre d'envoi ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0,
        right: showMembers ? 240 : 0,
        background: '#161209', borderTop: '1px solid #2a2218',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {/* Bouton partager pronostic */}
        <button
          onClick={openSharePicker}
          title="Partager un pronostic"
          style={{
            background: '#0e0c08', border: '1px solid #3a2d10',
            color: '#6b5010', borderRadius: '8px', width: 38, height: 38,
            cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8880c'; e.currentTarget.style.color = '#c8880c' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2d10'; e.currentTarget.style.color = '#6b5010' }}
        >
          ✦
        </button>

        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message…"
            maxLength={2000}
            autoComplete="off"
            style={{
              flex: 1, background: '#0e0c08', border: '1px solid #3a2d10',
              borderRadius: '20px', color: '#f0dfa8', padding: '9px 16px',
              fontFamily: '"Lora", serif', fontSize: '0.875rem', outline: 'none',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
            onBlur={e => (e.currentTarget.style.borderColor = '#3a2d10')}
          />

          <button
            type="submit"
            disabled={!text.trim() || isSending}
            style={{
              background: text.trim()
                ? 'linear-gradient(135deg, #a36808, #c8880c)'
                : '#1a1510',
              border: 'none', borderRadius: '20px',
              color: text.trim() ? '#0e0c08' : '#3a2d10',
              padding: '9px 18px', cursor: text.trim() ? 'pointer' : 'default',
              fontFamily: '"Cinzel", serif', fontSize: '0.75rem', fontWeight: 700,
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
