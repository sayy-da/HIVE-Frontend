import { Client, Room } from 'colyseus.js'
import { BACKEND_BASE_URL } from '../../constants'

interface IPlayer {
  name: string
  x: number
  y: number
  anim: string
  texture: string
  onChange?: (changes: Array<{ field: string; value: any }>) => void
}

interface IWorkspaceState {
  players: {
    onAdd?: (player: IPlayer, key: string) => void
    onRemove?: (player: IPlayer, key: string) => void
    get: (key: string) => IPlayer | undefined
    forEach: (callback: (player: IPlayer, key: string) => void) => void
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
      this.mySessionId = this.room.sessionId
      
      console.log('[Network] Joined room successfully:', {
        roomId: this.room.roomId,
        sessionId: this.mySessionId,
        playersCount: this.room.state.players ? Object.keys(this.room.state.players).length : 0
      })
      
      // Wait for room state to be ready
      await this.waitForRoomState()
      
      // Wait a bit more for MapSchema to be fully initialized
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Log all existing players
      if (this.room.state.players) {
        console.log('[Network] Existing players in room:')
        this.room.state.players.forEach((player, key) => {
          console.log(`  - ${key}: ${player.name} (${player.texture})`)
        })
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

    // Check if MapSchema is available (onAdd is a property we assign to, not a method)
    if (!this.room.state.players) {
      console.warn('[Network] players MapSchema not available yet, retrying...')
      // Retry after a short delay
      setTimeout(() => this.setupPlayerListeners(), 100)
      return
    }

    // Count current players
    let playerCount = 0
    this.room.state.players.forEach(() => playerCount++)
    console.log('[Network] Setting up player listeners. Current players:', playerCount)
    
    this.room.state.players.onAdd = (player: IPlayer, key: string) => {
      console.log('[Network] onAdd callback triggered:', {
        key,
        mySessionId: this.mySessionId,
        playerName: player.name,
        playerTexture: player.texture
      })
      
      if (key === this.mySessionId) {
        console.log('[Network] Skipping own player in onAdd')
        return
      }

      player.onChange = (changes: Array<{ field: string; value: any }>) => {
        changes.forEach((change) => {
          const { field, value } = change
          // Emit event for other players
          window.dispatchEvent(
            new CustomEvent('playerUpdated', {
              detail: { field, value, playerId: key },
            })
          )
        })
      }

      // Set up onChange listener for player updates
      player.onChange = (changes: Array<{ field: string; value: any }>) => {
        changes.forEach((change) => {
          const { field, value } = change
          // Emit event for player updates
          window.dispatchEvent(
            new CustomEvent('playerUpdated', {
              detail: { field, value, playerId: key },
            })
          )
        })
      }

      // Emit playerJoined event immediately if player has a name
      // (Unlike SkyOffice, we don't wait for name to be set - we create players immediately)
      if (player.name && player.name !== '') {
        console.log('[Network] Emitting playerJoined event for existing player:', key)
        window.dispatchEvent(
          new CustomEvent('playerJoined', {
            detail: { player, playerId: key },
          })
        )
      }
    }

    // Listen for player removals - assign to onRemove property
    this.room.state.players.onRemove = (_player: IPlayer, key: string) => {
      console.log('[Network] Player removed:', key)
      window.dispatchEvent(
        new CustomEvent('playerLeft', {
          detail: { playerId: key },
        })
      )
    }
    
    console.log('[Network] Player listeners initialized successfully')
  }

  updatePlayer(x: number, y: number, anim: string) {
    this.room?.send('updatePlayer', { x, y, anim })
  }

  updatePlayerName(name: string) {
    this.room?.send('updatePlayerName', { name })
  }

  updatePlayerTexture(texture: string) {
    this.room?.send('updatePlayerTexture', { texture })
  }
}

