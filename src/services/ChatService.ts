import { Client, Room } from 'colyseus.js'
import { BACKEND_BASE_URL } from '../constants'
import { Message, Conversation } from '../API/chat.api'

export type WebRTCSignalType = 'offer' | 'answer' | 'candidate' | 'end' | 'invite' | 'participant_joined' | 'participant_list'

export interface WebRTCSignalPayload {
  conversationId: string
  type: WebRTCSignalType
  sdp?: any
  candidate?: any
  callType?: 'audio' | 'video'
  fromUserId?: string
  targetUserId?: string  // For group calls - specifies which participant the signal is for
  participantId?: string  // For participant_joined/participant_list signals
  participantIds?: string[]  // For participant_list signal - list of all participant IDs
}

export class ChatService {
  private client: Client
  private room: Room | null = null

  constructor() {
    const backendUrl = BACKEND_BASE_URL || 'http://localhost:3000'
    const protocol = backendUrl.startsWith('https') ? 'wss' : 'ws'
    const url = new URL(backendUrl)
    let port = url.port
    if (!port) {
      port = protocol === 'wss' ? '443' : '3000'
    }
    const endpoint = `${protocol}://${url.hostname}:${port}`
    this.client = new Client(endpoint)
  }

  async connect(accessToken: string, userId: string, companyId: string): Promise<void> {
    try {
      // Join chat room with authentication
      this.room = await this.client.joinOrCreate('chat', {
        token: accessToken,
        userId,
        companyId,
      })

      console.log('[ChatService] Connected to chat room:', this.room.sessionId)
    } catch (error) {
      console.error('[ChatService] Failed to connect:', error)
      throw error
    }
  }

  onWebRTCSignal(callback: (signal: WebRTCSignalPayload) => void): void {
    if (!this.room) return

    this.room.onMessage('webrtc_signal', (data: WebRTCSignalPayload) => {
      console.log('[ChatService] Received webrtc_signal:', data)
      callback(data)
    })
  }

  onMessage(callback: (message: Message) => void): void {
    if (!this.room) {
      console.warn('[ChatService] Cannot set up message handler - room not connected')
      return
    }

    console.log('[ChatService] Setting up new_message handler')
    this.room.onMessage('new_message', (message: Message) => {
      console.log('[ChatService] Received new_message:', message)
      callback(message)
    })
  }

  sendWebRTCSignal(payload: WebRTCSignalPayload): void {
    if (!this.room) {
      console.error('[ChatService] ❌ Not connected to room (webrtc_signal)')
      return
    }

    console.log(`[ChatService] 📤 Sending WebRTC signal:`, {
      type: payload.type,
      conversationId: payload.conversationId,
      callType: payload.callType,
      fromUserId: payload.fromUserId,
      targetUserId: payload.targetUserId,
      hasSdp: !!payload.sdp,
      hasCandidate: !!payload.candidate,
      sessionId: this.room.sessionId
    });
    
    try {
      this.room.send('webrtc_signal', payload);
      console.log(`[ChatService] ✅ WebRTC signal sent successfully`);
    } catch (error) {
      console.error(`[ChatService] ❌ Failed to send WebRTC signal:`, error);
    }
  }

  onConversationUpdate(callback: (conversation: Conversation) => void): void {
    if (!this.room) return

    this.room.onMessage('conversation_updated', (conversation: Conversation) => {
      callback(conversation)
    })
  }

  onTyping(callback: (data: { userId: string; conversationId: string; isTyping: boolean }) => void): void {
    if (!this.room) return

    this.room.onMessage('user_typing', (data: { userId: string; conversationId: string; isTyping: boolean }) => {
      callback(data)
    })
  }

  sendMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): void {
    if (!this.room) {
      console.error('[ChatService] Not connected to room - cannot send message')
      throw new Error('Not connected to chat room')
    }

    if (!this.room.connection.isOpen) {
      console.error('[ChatService] WebSocket connection is not open')
      throw new Error('WebSocket connection is not open')
    }

    console.log('[ChatService] Sending message:', { conversationId, content, messageType })
    
    try {
      this.room.send('send_message', {
        conversationId,
        content,
        messageType,
      })
      console.log('[ChatService] Message sent successfully')
    } catch (error) {
      console.error('[ChatService] Error sending message:', error)
      throw error
    }
  }

  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.room) return

    this.room.send('typing', {
      conversationId,
      isTyping,
    })
  }

  disconnect(): void {
    if (this.room) {
      this.room.leave()
      this.room = null
    }
  }

  isConnected(): boolean {
    return this.room !== null && this.room.connection.isOpen
  }
}

