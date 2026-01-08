import { Client, Room } from 'colyseus.js'
import { BACKEND_BASE_URL } from '../../constants'

interface IPlayer {
  name: string
  x: number
  y: number
  anim: string
  texture: string
  userId?: string
  onChange?: (changes: Array<{ field: string; value: any }>) => void
}

interface IWorkspaceState {
  players: {
    onAdd?: (player: IPlayer, key: string) => void
    onRemove?: (player: IPlayer, key: string) => void
    get: (key: string) => IPlayer | undefined
    forEach: (callback: (player: IPlayer, key: string) => void) => void
    size: number
    keys: () => string[]
  }
}

export default class Network {
  private client: Client
  room?: Room<IWorkspaceState>
  mySessionId!: string

  constructor() {
    // Get backend URL from constants or use default
    const backendUrl = BACKEND_BASE_URL || 'http://localhost:3000'
    // Convert http:// to ws:// or https:// to wss://
    const protocol = backendUrl.startsWith('https') ? 'wss' : 'ws'
    const url = new URL(backendUrl)
    // Use port from URL, or default based on protocol
    let port = url.port
    if (!port) {
      port = protocol === 'wss' ? '443' : '3000'
    }
    const endpoint = `${protocol}://${url.hostname}:${port}`
    console.log('Connecting to Colyseus server at:', endpoint)
    this.client = new Client(endpoint)
    console.log('[Network] Client created with endpoint:', endpoint)
  }

  async joinWorkspace(userId: string, userName: string, characterTexture: string, companyId?: string) {
    try {
      // For now, use a single 'workspace' room for all employees
      // TODO: Add company filtering later if needed
      console.log('[Network] Joining workspace room:', { userId, userName, companyId, characterTexture })
      
      this.room = await this.client.joinOrCreate('workspace', {
        userId,
        userName,
        characterTexture,
        companyId,
      })
      console.log('[Network] ✅ joinOrCreate succeeded:', {
        roomId: this.room?.roomId,
        sessionId: this.room?.sessionId,
        hasConnection: !!this.room?.connection,
        isOpen: this.room?.connection?.isOpen,
      })
      this.mySessionId = this.room.sessionId
      
      // Log connection status
      if (this.room.connection) {
        console.log('[Network] 🔌 WebSocket connection details:', {
          isOpen: this.room.connection.isOpen,
          url: (this.room.connection as any).url,
        })
      } else {
        console.error('[Network] ❌ Room connection is null!')
      }
      
      console.log('[Network] Joined room successfully:', {
        roomId: this.room.roomId,
        sessionId: this.mySessionId,
        playersCount: this.room.state.players ? Object.keys(this.room.state.players).length : 0
      })
      
      // Wait for room state to be ready
      await this.waitForRoomState()
      
      // Wait a bit more for MapSchema to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Log all existing players with detailed info
      if (this.room.state.players) {
        console.log('[Network] 📋 Existing players in room (before listener setup):')
        this.room.state.players.forEach((player, key) => {
          console.log(`  - ${key}: ${player.name} (${player.texture})`, {
            x: player.x,
            y: player.y,
            anim: player.anim,
            hasOnChange: 'onChange' in player
          })
        })
      }
      
      // Set up room-level state change listener to verify patches are being received
      if (this.room.onStateChange) {
        this.room.onStateChange(() => {
          console.log('[Network] 🔄 Room state changed (patch received)')
        })
      }
      
      // Monitor room connection for patches
      if (this.room.connection) {
        const originalOnMessage = (this.room.connection as any).onmessage
        if (originalOnMessage) {
          console.log('[Network] 🔍 Monitoring WebSocket messages for patches')
        }
      }
      
      this.initialize()
      return this.room
    } catch (error) {
      console.error('[Network] Failed to join workspace:', error)
      throw error
    }
  }

  private async waitForRoomState(maxWait = 5000) {
    const startTime = Date.now()
    while (!this.room?.state?.players && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    if (!this.room?.state?.players) {
      throw new Error('Room state not ready after waiting')
    }
  }

  private initialize() {
    if (!this.room || !this.room.state || !this.room.state.players) {
      console.error('[Network] Room state not ready:', {
        hasRoom: !!this.room,
        hasState: !!this.room?.state,
        hasPlayers: !!this.room?.state?.players
      })
      return
    }

    console.log('[Network] initialize: setting up listeners')
    // Set up listeners - retry if MapSchema methods aren't available yet
    this.setupPlayerListeners()
  }

  private setupPlayerListeners() {
    if (!this.room?.state?.players) {
      console.error('[Network] Cannot setup listeners - room state not ready')
      // Retry after a short delay
      setTimeout(() => this.setupPlayerListeners(), 100)
      return
    }

    console.log('[Network] setupPlayerListeners: attaching onAdd/onRemove')
    
    // Helper function to set up onChange listener for a player
    const setupPlayerChangeListener = (player: IPlayer, key: string) => {
      if (key === this.mySessionId) {
        console.log('[Network] setupPlayerChangeListener: skipping own player', key)
        return
      }

      console.log('[Network] 🔧 Setting up onChange listener for existing player', { 
        key, 
        name: player.name,
        currentX: player.x,
        currentY: player.y,
        currentAnim: player.anim
      })
      
      // Verify player object has onChange property
      console.log('[Network] Player object type:', typeof player)
      console.log('[Network] Player has onChange?', 'onChange' in player)
      
      // Track changes on every child object inside the players MapSchema (SkyOffice pattern)
      player.onChange = (changes: Array<{ field: string; value: any }>) => {
        console.log('[Network] 🔔 onChange fired for player', key, 'changes:', changes)
        changes.forEach((change) => {
          const { field, value } = change
          console.log(`[Network] 📥 Player ${key} field "${field}" changed to:`, value)
          
          // Emit event for player updates - this triggers real-time movement sync
          const event = new CustomEvent('playerUpdated', {
            detail: { field, value, playerId: key },
          })
          console.log('[Network] 📢 Dispatching playerUpdated event:', event.detail)
          window.dispatchEvent(event)

          // When a new player finished setting up player name
          if (field === 'name' && value !== '') {
            console.log('[Network] 👋 Player name set, dispatching playerJoined')
            window.dispatchEvent(
              new CustomEvent('playerJoined', {
                detail: { player, playerId: key },
              })
            )
          }
        })
      }
      
      // Verify onChange was set
      console.log('[Network] ✅ onChange listener attached to player', key, 'onChange type:', typeof player.onChange)
      
      // Also try using listen() method if available (newer Colyseus versions)
      if ((player as any).listen) {
        console.log('[Network] 🎧 Player has listen() method, setting up individual field listeners')
        try {
          ;(player as any).listen('x', (value: number) => {
            console.log(`[Network] 🎧 listen('x') fired for player ${key}:`, value)
            window.dispatchEvent(
              new CustomEvent('playerUpdated', {
                detail: { field: 'x', value, playerId: key },
              })
            )
          })
          ;(player as any).listen('y', (value: number) => {
            console.log(`[Network] 🎧 listen('y') fired for player ${key}:`, value)
            window.dispatchEvent(
              new CustomEvent('playerUpdated', {
                detail: { field: 'y', value, playerId: key },
              })
            )
          })
          ;(player as any).listen('anim', (value: string) => {
            console.log(`[Network] 🎧 listen('anim') fired for player ${key}:`, value)
            window.dispatchEvent(
              new CustomEvent('playerUpdated', {
                detail: { field: 'anim', value, playerId: key },
              })
            )
          })
          console.log('[Network] ✅ listen() methods attached')
        } catch (error) {
          console.warn('[Network] ⚠️ listen() method failed:', error)
        }
      } else {
        console.log('[Network] ℹ️ Player does not have listen() method (using onChange only)')
      }
    }

    // CRITICAL FIX: Manually set up onChange listeners for ALL existing players
    // Colyseus does NOT call onAdd for existing players when a new client joins
    console.log('[Network] 🔍 Setting up listeners for existing players...')
    console.log('[Network] Room state players type:', typeof this.room.state.players)
    console.log('[Network] Room state players forEach available?', typeof this.room.state.players.forEach)
    
    let existingPlayerCount = 0
    this.room.state.players.forEach((player, key) => {
      existingPlayerCount++
      console.log(`[Network] 🔍 Found existing player: ${key} (${player.name})`, {
        x: player.x,
        y: player.y,
        anim: player.anim,
        playerType: typeof player,
        playerConstructor: player.constructor?.name
      })
      setupPlayerChangeListener(player, key)
      
      // Verify the listener was actually set
      if (player.onChange) {
        console.log(`[Network] ✅ Verified onChange listener is set for player ${key}`)
      } else {
        console.error(`[Network] ❌ onChange listener NOT set for player ${key}!`)
      }
    })
    console.log(`[Network] ✅ Set up listeners for ${existingPlayerCount} existing players`)
    
    // Add a test polling mechanism to verify state is updating (for debugging)
    let lastKnownStates = new Map<string, { x: number; y: number; anim: string }>()
    this.room.state.players.forEach((player, key) => {
      if (key !== this.mySessionId) {
        lastKnownStates.set(key, { x: player.x, y: player.y, anim: player.anim })
      }
    })
    
    const stateCheckInterval = setInterval(() => {
      if (!this.room?.state?.players) {
        clearInterval(stateCheckInterval)
        return
      }
      
      this.room.state.players.forEach((player, key) => {
        if (key === this.mySessionId) return
        
        const lastState = lastKnownStates.get(key)
        if (lastState) {
          if (lastState.x !== player.x || lastState.y !== player.y || lastState.anim !== player.anim) {
            console.log(`[Network] 🔍 POLLING DETECTED STATE CHANGE for player ${key}:`, {
              old: lastState,
              new: { x: player.x, y: player.y, anim: player.anim }
            })
            
            // Manually trigger update events if onChange didn't fire
            if (lastState.x !== player.x) {
              console.log(`[Network] 🔧 MANUALLY triggering x update: ${lastState.x} -> ${player.x}`)
              window.dispatchEvent(
                new CustomEvent('playerUpdated', {
                  detail: { field: 'x', value: player.x, playerId: key },
                })
              )
            }
            if (lastState.y !== player.y) {
              console.log(`[Network] 🔧 MANUALLY triggering y update: ${lastState.y} -> ${player.y}`)
              window.dispatchEvent(
                new CustomEvent('playerUpdated', {
                  detail: { field: 'y', value: player.y, playerId: key },
                })
              )
            }
            if (lastState.anim !== player.anim) {
              console.log(`[Network] 🔧 MANUALLY triggering anim update: ${lastState.anim} -> ${player.anim}`)
              window.dispatchEvent(
                new CustomEvent('playerUpdated', {
                  detail: { field: 'anim', value: player.anim, playerId: key },
                })
              )
            }
            
            lastKnownStates.set(key, { x: player.x, y: player.y, anim: player.anim })
          }
        } else {
          lastKnownStates.set(key, { x: player.x, y: player.y, anim: player.anim })
        }
      })
    }, 100) // Check every 100ms
    
    // Store interval for cleanup
    ;(this as any).stateCheckInterval = stateCheckInterval
    console.log('[Network] 🔍 Started polling state checker (backup mechanism)')

    // Set up onAdd callback for NEW players that join AFTER us
    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      console.log('[Network] onAdd callback triggered for new player:', {
        key,
        mySessionId: this.mySessionId,
        playerName: player.name,
        playerTexture: player.texture,
        playerX: player.x,
        playerY: player.y,
        playerAnim: player.anim
      })
      
      // Skip own player
      if (key === this.mySessionId) {
        console.log('[Network] onAdd (self) skipping', key)
        return
      }

      console.log('[Network] onAdd: NEW player added', { key, name: player.name, anim: player.anim })
      
      // Set up onChange listener for the new player
      setupPlayerChangeListener(player, key)

      // CRITICAL: Dispatch playerJoined event so Game scene can create OtherPlayer sprite
      console.log('[Network] 👋 Dispatching playerJoined event for new player:', key)
      window.dispatchEvent(
        new CustomEvent('playerJoined', {
          detail: { player, playerId: key },
        })
      )
    }

    // An instance removed from the players MapSchema
    this.room.state.players.onRemove = (player: IPlayer, key: string) => {
      console.log('[Network] 🚪 onRemove: player removed from room state', {
        key,
        name: player.name,
        mySessionId: this.mySessionId,
        isOwnPlayer: key === this.mySessionId
      })
      
      // Don't dispatch playerLeft for our own player (we handle that separately)
      if (key !== this.mySessionId) {
        console.log('[Network] 📢 Dispatching playerLeft event for:', key)
        window.dispatchEvent(
          new CustomEvent('playerLeft', {
            detail: { playerId: key },
          })
        )
      } else {
        console.log('[Network] ⏭️ Skipping playerLeft dispatch for own player:', key)
      }
    }
    
    console.log('[Network] Player listeners initialized successfully (SkyOffice pattern)')
  }

  // Method to send player updates to Colyseus server (SkyOffice pattern)
  updatePlayer(currentX: number, currentY: number, currentAnim: string) {
    if (!this.room) {
      console.error('[Network] ❌ Cannot send updatePlayer - room is null/undefined!')
      return
    }
    const hasConnection = this.room.connection && this.room.connection.isOpen
    console.log('[Network] 📤 Sending updatePlayer', { 
      currentX, 
      currentY, 
      currentAnim,
      hasRoom: !!this.room,
      hasConnection,
      sessionId: this.mySessionId
    })
    try {
      this.room.send('updatePlayer', { x: currentX, y: currentY, anim: currentAnim })
      console.log('[Network] ✅ updatePlayer sent successfully')
    } catch (error) {
      console.error('[Network] ❌ Error sending updatePlayer:', error)
    }
  }

  updatePlayerName(name: string) {
    this.room?.send('updatePlayerName', { name })
  }

  updatePlayerTexture(texture: string) {
    this.room?.send('updatePlayerTexture', { texture })
  }
}

