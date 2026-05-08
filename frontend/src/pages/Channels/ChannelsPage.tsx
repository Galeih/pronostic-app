import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useToast } from '../../context/ToastContext'
import { channelService, type Channel } from '../../services/channelService'
import { useAuth } from '../../context/AuthContext'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

// ── Carte channel ─────────────────────────────────────────────────────────────

function ChannelCard({ channel }: { channel: Channel }) {
  const lastMsg = channel.lastMessage
  return (
    <Link
      to={`/channels/${channel.id}`}
      className="block rounded transition"
      style={{ background: '#161209', border: '1px solid #3a2d10', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8880c')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a2d10')}
    >
      <div className="p-4 flex items-center gap-3">
        {/* Avatar cercle */}
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm"
          style={{
            width: 44, height: 44,
            background: 'linear-gradient(135deg, #3a2d10, #c8880c)',
            color: '#0e0c08',
            fontFamily: '"Cinzel", serif',
          }}
        >
          {channel.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold truncate" style={{ color: '#f0dfa8', fontFamily: '"Cinzel", serif', fontSize: '0.85rem' }}>
              {channel.name}
            </p>
            {lastMsg && (
              <p className="text-xs flex-shrink-0" style={{ color: '#3a2d10' }}>
                {timeAgo(lastMsg.createdAt)}
              </p>
            )}
          </div>

          {lastMsg ? (
            <p className="text-xs truncate mt-0.5" style={{ color: '#6b5010' }}>
              {lastMsg.type === 'PredictionShare'
                ? `✦ ${lastMsg.senderName} a partagé un pronostic`
                : `${lastMsg.senderName} : ${lastMsg.content}`}
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: '#3a2d10', fontStyle: 'italic' }}>
              Aucun message pour l'instant
            </p>
          )}
        </div>

        {/* Badge membres */}
        <div className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full"
          style={{ background: '#1a1510', color: '#6b5010', border: '1px solid #2a2218', fontFamily: '"Cinzel", serif' }}>
          {channel.memberCount}
        </div>
      </div>
    </Link>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ChannelsPage() {
  usePageTitle('Cercles')
  const navigate = useNavigate()
  useAuth()
  const { success, error: toastError } = useToast()

  const [channels, setChannels]     = useState<Channel[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [tab, setTab]               = useState<'list' | 'create' | 'join'>('list')

  // Create form
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Join form
  const [joinCode, setJoinCode]     = useState('')
  const [joinLoading, setJoinLoading] = useState(false)

  useEffect(() => {
    channelService.getAll()
      .then(setChannels)
      .catch(() => toastError('Impossible de charger les cercles.'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    setCreateLoading(true)
    try {
      const ch = await channelService.create(createName.trim(), createDesc.trim() || undefined)
      success(`Cercle « ${ch.name} » créé !`)
      navigate(`/channels/${ch.id}`)
    } catch {
      toastError('Impossible de créer le cercle.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoinLoading(true)
    try {
      const ch = await channelService.join(joinCode.trim().toUpperCase())
      success(`Tu as rejoint « ${ch.name} » !`)
      navigate(`/channels/${ch.id}`)
    } catch {
      toastError('Code invalide ou cercle introuvable.')
    } finally {
      setJoinLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: '#0e0c08', border: '1px solid #6b5010',
    borderRadius: '6px', color: '#f0dfa8', padding: '10px 14px',
    fontFamily: '"Lora", serif', fontSize: '0.9rem', outline: 'none',
  } as const

  const btnPrimary = {
    width: '100%', padding: '12px', fontFamily: '"Cinzel", serif',
    fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em',
    background: 'linear-gradient(135deg, #a36808, #c8880c, #e6a817)',
    color: '#0e0c08', border: '1px solid #f5c842',
    borderRadius: '6px', cursor: 'pointer',
    boxShadow: '0 0 20px #c8880c30', transition: 'opacity 0.15s',
  } as const

  return (
    <div style={{ background: '#0e0c08', minHeight: '100vh', color: '#f0dfa8' }}>
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* En-tête */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest mb-1"
            style={{ color: '#3a2d10', fontFamily: '"Cinzel", serif', letterSpacing: '0.3em' }}>
            Orakl
          </p>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: '"Cinzel Decorative", serif', color: '#f5c842' }}>
            Mes Cercles
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b5010', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
            Discutez et partagez vos pronostics avec vos amis.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['list', 'create', 'join'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded text-xs font-bold transition"
              style={{
                fontFamily: '"Cinzel", serif',
                letterSpacing: '0.06em',
                background: tab === t ? 'linear-gradient(135deg, #a36808, #c8880c)' : '#161209',
                color: tab === t ? '#0e0c08' : '#6b5010',
                border: `1px solid ${tab === t ? '#f5c842' : '#3a2d10'}`,
                cursor: 'pointer',
              }}
            >
              {t === 'list' && `◈ Mes cercles (${channels.length})`}
              {t === 'create' && '✦ Créer'}
              {t === 'join' && '⬡ Rejoindre'}
            </button>
          ))}
        </div>

        {/* ── Liste ── */}
        {tab === 'list' && (
          <div>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="orakl-skeleton" style={{ height: 68, borderRadius: '6px' }} />
                ))}
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4" style={{ color: '#3a2d10' }}>◈</p>
                <p className="font-bold mb-2" style={{ fontFamily: '"Cinzel", serif', color: '#6b5010' }}>
                  Aucun cercle
                </p>
                <p className="text-sm mb-6" style={{ color: '#3a2d10', fontStyle: 'italic' }}>
                  Crée un cercle ou rejoins-en un avec un code.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setTab('create')}
                    style={{ ...btnPrimary, width: 'auto', padding: '10px 20px' }}>
                    ✦ Créer
                  </button>
                  <button onClick={() => setTab('join')}
                    className="px-5 py-2.5 rounded text-sm"
                    style={{ background: '#161209', border: '1px solid #6b5010', color: '#c8880c', fontFamily: '"Cinzel", serif', cursor: 'pointer' }}>
                    Rejoindre
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {channels.map(ch => <ChannelCard key={ch.id} channel={ch} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Créer ── */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="p-6 rounded" style={{ background: '#161209', border: '1px solid #6b5010' }}>
              <p className="text-xs uppercase tracking-widest mb-4"
                style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', letterSpacing: '0.25em' }}>
                Nouveau cercle
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                    Nom du cercle *
                  </label>
                  <input
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    placeholder="Les Prophètes du vendredi"
                    maxLength={50}
                    required
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                    Description <span style={{ color: '#3a2d10' }}>(optionnel)</span>
                  </label>
                  <input
                    value={createDesc}
                    onChange={e => setCreateDesc(e.target.value)}
                    placeholder="Notre groupe de pronostics foot"
                    maxLength={200}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                  />
                </div>
              </div>

              <div className="mt-5">
                <button type="submit" style={btnPrimary} disabled={createLoading || !createName.trim()}>
                  {createLoading ? '◈ Création…' : '✦ Créer le cercle'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Rejoindre ── */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="p-6 rounded" style={{ background: '#161209', border: '1px solid #6b5010' }}>
              <p className="text-xs uppercase tracking-widest mb-4"
                style={{ color: '#6b5010', fontFamily: '"Cinzel", serif', letterSpacing: '0.25em' }}>
                Rejoindre par code
              </p>

              <p className="text-sm mb-4" style={{ color: '#3a2d10', fontFamily: '"Lora", serif', fontStyle: 'italic' }}>
                Demande le code d'invitation à l'administrateur du cercle.
              </p>

              <div>
                <label className="text-xs mb-1 block" style={{ color: '#6b5010', fontFamily: '"Cinzel", serif' }}>
                  Code d'invitation
                </label>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="AB12CD"
                  maxLength={8}
                  required
                  style={{ ...inputStyle, fontFamily: '"Cinzel", serif', fontSize: '1.1rem', letterSpacing: '0.3em', textAlign: 'center' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c8880c')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#6b5010')}
                />
              </div>

              <div className="mt-5">
                <button type="submit" style={btnPrimary} disabled={joinLoading || joinCode.length < 4}>
                  {joinLoading ? '◈ Vérification…' : '⬡ Rejoindre le cercle'}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
