import { useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'

const HUB_URL = '/hubs/chat'

/** Retourne le token JWT stocké en localStorage (clé utilisée par api.ts). */
function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

interface UseSignalROptions {
  groupId: string | null
  onMessage:      (msg: SignalRMessage) => void
  onMemberJoined?: (member: SignalRMember) => void
  onMemberLeft?:   (member: { userId: string; userName: string }) => void
}

export interface SignalRMessage {
  id: string
  senderId: string
  senderName: string
  senderLevel: number
  content: string
  type: 'Text' | 'PredictionShare'
  predictionShareCode?: string
  createdAt: string
}

export interface SignalRMember {
  userId: string
  userName: string
  level: number
}

interface UseSignalRReturn {
  sendMessage: (groupId: string, content: string) => Promise<void>
  sharePrediction: (groupId: string, shareCode: string) => Promise<void>
  isConnected: boolean
}

export function useSignalR({
  groupId,
  onMessage,
  onMemberJoined,
  onMemberLeft,
}: UseSignalROptions): UseSignalRReturn {
  const connectionRef    = useRef<signalR.HubConnection | null>(null)
  const isConnectedRef   = useRef(false)
  const onMessageRef     = useRef(onMessage)
  const onJoinedRef      = useRef(onMemberJoined)
  const onLeftRef        = useRef(onMemberLeft)

  // Mettre à jour les refs sans re-render
  onMessageRef.current   = onMessage
  onJoinedRef.current    = onMemberJoined
  onLeftRef.current      = onMemberLeft

  useEffect(() => {
    if (!groupId) return

    // Flag pour gérer le double-mount StrictMode React 18 :
    // si le cleanup s'exécute avant que start() finisse (AbortError), on l'ignore silencieusement.
    let stopped = false

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: getToken,
        transport: signalR.HttpTransportType.WebSockets |
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      // LogLevel.Critical supprime les erreurs d'abort du double-mount React StrictMode.
      // En production (sans StrictMode), toutes les vraies erreurs restent visibles.
      .configureLogging(signalR.LogLevel.Critical)
      .build()

    connectionRef.current = connection

    connection.on('MessageReceived', (msg: SignalRMessage) => {
      onMessageRef.current(msg)
    })

    connection.on('MemberJoined', (member: SignalRMember) => {
      onJoinedRef.current?.(member)
    })

    connection.on('MemberLeft', (member: { userId: string; userName: string }) => {
      onLeftRef.current?.(member)
    })

    connection.onreconnecting(() => { isConnectedRef.current = false })
    connection.onreconnected(() => {
      isConnectedRef.current = true
      connection.invoke('JoinChannel', groupId).catch(console.error)
    })
    connection.onclose(() => { isConnectedRef.current = false })

    connection.start()
      .then(() => {
        // Le cleanup a déjà appelé stop() → on ne fait rien
        if (stopped) return
        isConnectedRef.current = true
        return connection.invoke('JoinChannel', groupId)
      })
      .catch(err => {
        // Ignorer silencieusement l'AbortError du double-mount StrictMode
        if (!stopped) console.error('[SignalR] Connexion échouée :', err)
      })

    return () => {
      stopped = true
      isConnectedRef.current = false
      // N'invoquer LeaveChannel que si la connexion est établie
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveChannel', groupId).catch(() => {})
      }
      connection.stop().catch(() => {})
    }
  }, [groupId])

  const sendMessage = useCallback(async (gId: string, content: string) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return
    await connectionRef.current.invoke('SendMessage', gId, content)
  }, [])

  const sharePrediction = useCallback(async (gId: string, shareCode: string) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) return
    await connectionRef.current.invoke('SharePrediction', gId, shareCode)
  }, [])

  return {
    sendMessage,
    sharePrediction,
    isConnected: isConnectedRef.current,
  }
}
