import Phaser from 'phaser'
import Network from '../../services/Network'
import { createCharacterAnims } from '../../anims/CharacterAnims'
import '../../characters/MyPlayer'
import '../../characters/OtherPlayer'
import MyPlayer from '../../characters/MyPlayer'
import OtherPlayer from '../../characters/OtherPlayer'
import PlayerSelector from '../../characters/PlayerSelector'
import Chair from '../../items/Chair'
import Computer from '../../items/Computer'
import { NavKeys } from '../../../types/KeyboardState'
import { PlayerBehavior } from '../../../types/PlayerBehavior'

export default class Game extends Phaser.Scene {
  network!: Network
  private cursors!: NavKeys
  private keyE!: Phaser.Input.Keyboard.Key
  private map!: Phaser.Tilemaps.Tilemap
  myPlayer!: MyPlayer
  private playerSelector!: PlayerSelector
  private otherPlayers!: Phaser.Physics.Arcade.Group
  private otherPlayerMap = new Map<string, OtherPlayer>()

  constructor() {
    super('game')
  }

  create(data: { network: Network }) {
    console.log('Game: create() called', data)
    if (!data.network) {
      console.error('Game: Network instance missing!')
      throw new Error('Network instance missing')
    }
    this.network = data.network
    console.log('Game: Network set, proceeding with initialization...')

    // Create animations
    createCharacterAnims(this.anims)

    // Load map
    console.log('Game: Loading tilemap...')
    this.map = this.make.tilemap({ key: 'tilemap' })
    if (!this.map) {
      console.error('Game: Failed to load tilemap - check if Bootstrap scene loaded assets')
      return
    }
    console.log('Game: Tilemap loaded successfully')
    
    // Add all tilesets used by the map
    const FloorAndGround = this.map.addTilesetImage('FloorAndGround', 'tiles_wall')
    if (!FloorAndGround) {
      console.error('Failed to add FloorAndGround tileset')
      return
    }
    
    const ModernOffice = this.map.addTilesetImage('Modern_Office_Black_Shadow', 'office')
    if (!ModernOffice) {
      console.warn('Failed to add Modern_Office_Black_Shadow tileset - some objects may not render')
    }
    
    // Add Generic tileset (some objects may use it)
    const Generic = this.map.addTilesetImage('Generic', 'generic')
    if (!Generic) {
      console.warn('Failed to add Generic tileset - some objects may not render')
    }
    
    // Add Basement tileset (if used in map)
    const Basement = this.map.addTilesetImage('Basement', 'basement')
    if (!Basement) {
      console.warn('Failed to add Basement tileset - some objects may not render')
    }
    
    // Create ground layer with FloorAndGround tileset
    const groundLayer = this.map.createLayer('Ground', [FloorAndGround])
    if (!groundLayer) {
      console.error('Failed to create Ground layer')
      return
    }
    
    // Ensure ground layer is visible and renders all tiles
    groundLayer.setVisible(true)
    groundLayer.setDepth(0) // Set to bottom layer
    groundLayer.setCollisionByProperty({ collides: true })
    
    // Set camera bounds to match map size so entire map is visible
    const mapWidth = this.map.widthInPixels
    const mapHeight = this.map.heightInPixels
    console.log(`Map size: ${mapWidth}x${mapHeight} pixels`)
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight)
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight)

    // Get user data from network room state or window
    const userData = window.workspaceUserData || {
      userName: 'User',
      characterTexture: 'adam',
    }
    // Wait for network room to be ready
    if (!this.network.room || !this.network.mySessionId) {
      console.error('Network room not ready')
      return
    }

    const player = this.network.room.state.players.get(this.network.mySessionId)
    const userTexture = player?.texture || userData.characterTexture
    const userName = player?.name || userData.userName

    // Check if factory method is registered
    if (typeof this.add.myPlayer !== 'function') {
      console.error('myPlayer factory method not registered. Make sure MyPlayer.ts is imported.')
      return
    }

    // Create myPlayer at starting position
    const startX = player?.x || 705
    const startY = player?.y || 500
    console.log('[Game] Creating myPlayer:', {
      x: startX,
      y: startY,
      texture: userTexture,
      name: userName,
      sessionId: this.network.mySessionId
    })
    
    this.myPlayer = this.add.myPlayer(startX, startY, userTexture, this.network.mySessionId)
    this.myPlayer.setPlayerName(userName)
    
    // Make sure player is visible
    this.myPlayer.setVisible(true)
    this.myPlayer.setActive(true)
    
    // Ensure player is on top of map layers
    this.myPlayer.setDepth(startY)
    
    // Check if texture is loaded
    const textureKey = this.textures.exists(userTexture)
    console.log('[Game] MyPlayer created:', {
      visible: this.myPlayer.visible,
      active: this.myPlayer.active,
      x: this.myPlayer.x,
      y: this.myPlayer.y,
      depth: this.myPlayer.depth,
      texture: userTexture,
      textureExists: textureKey,
      hasAnimation: this.anims.exists(`${userTexture}_idle_down`),
      containerX: this.myPlayer.playerContainer.x,
      containerY: this.myPlayer.playerContainer.y,
      containerVisible: this.myPlayer.playerContainer.visible
    })
    
    // Force render update
    this.myPlayer.setAlpha(1)
    this.myPlayer.playerContainer.setAlpha(1)
    
    if (!player?.name) {
      this.network.updatePlayerName(userName)
    }
    if (!player?.texture) {
      this.network.updatePlayerTexture(userTexture)
    }
    if (!player?.x || !player?.y) {
      // Update initial position to server
      this.network.updatePlayer(startX, startY, `${userTexture}_idle_down`)
    }

    // Create player selector
    this.playerSelector = new PlayerSelector(this, 0, 0, 16, 16)

    // Load chairs from map
    const chairs = this.physics.add.staticGroup({ classType: Chair })
    const chairLayer = this.map.getObjectLayer('Chair')
    if (chairLayer) {
      const chairTileset = this.map.getTileset('chair')
      if (!chairTileset) {
        console.warn('Chair tileset not found in map')
      } else {
        chairLayer.objects.forEach((chairObj) => {
          if (chairObj.gid) {
            const item = chairs.get(
              chairObj.x! + chairObj.width! * 0.5,
              chairObj.y! - chairObj.height! * 0.5,
              'chairs',
              chairObj.gid - chairTileset.firstgid
            )
            if (item) {
              item.setDepth(chairObj.y!)

              if (chairObj.properties && chairObj.properties.length > 0) {
                item.itemDirection = chairObj.properties[0]?.value || 'down'
              } else {
                item.itemDirection = 'down'
              }
            }
          }
        })
      }
    }

    // Load computers from map (following SkyOffice approach)
    const computers = this.physics.add.staticGroup({ classType: Computer })
    const computerLayer = this.map.getObjectLayer('Computer')
    if (computerLayer) {
      const computerTileset = this.map.getTileset('computer')
      if (!computerTileset) {
        console.warn('Computer tileset not found in map')
      } else {
        computerLayer.objects.forEach((obj) => {
          if (obj.gid) {
            const item = computers.get(
              obj.x! + obj.width! * 0.5,
              obj.y! - obj.height! * 0.5,
              'computers',
              obj.gid - computerTileset.firstgid
            ) as Computer
            if (item) {
              // Set depth like SkyOffice: y + height * 0.27
              item.setDepth(item.y + item.height * 0.27)
            }
          }
        })
      }
    }

    // Load other map layers - following SkyOffice's approach
    // Wall layer uses FloorAndGround tileset
    this.addGroupFromTiled('Wall', 'tiles_wall', 'FloorAndGround', false)
    
    // Objects layers - Modern_Office_Black_Shadow tileset (tables, furniture, etc.)
    if (ModernOffice) {
      this.addGroupFromTiled('Objects', 'office', 'Modern_Office_Black_Shadow', false)
      this.addGroupFromTiled('ObjectsOnCollide', 'office', 'Modern_Office_Black_Shadow', true)
    } else {
      console.warn('Objects layers skipped - Modern_Office_Black_Shadow tileset not available')
    }
    
    // Generic objects layers
    if (Generic) {
      this.addGroupFromTiled('GenericObjects', 'generic', 'Generic', false)
      this.addGroupFromTiled('GenericObjectsOnCollide', 'generic', 'Generic', true)
    }
    
    // Basement layer (if exists)
    if (Basement) {
      this.addGroupFromTiled('Basement', 'basement', 'Basement', true)
    }

    // Create group for other players
    this.otherPlayers = this.physics.add.group({ classType: OtherPlayer })

    // Setup camera - must be done after myPlayer is created
    this.cameras.main.zoom = 1.5
    this.cameras.main.startFollow(this.myPlayer, true)
    this.cameras.main.setFollowOffset(0, 0)
    
    // Ensure camera can show entire map (bounds already set above)
    // Set deadzone to prevent camera from going outside map bounds
    this.cameras.main.setDeadzone(0, 0)
    
    // Make sure camera is visible and rendering
    this.cameras.main.setVisible(true)
    
    console.log('[Game] Camera setup complete:', {
      zoom: this.cameras.main.zoom,
      bounds: this.cameras.main.getBounds(),
      playerPosition: { x: this.myPlayer.x, y: this.myPlayer.y }
    })

    // Collisions
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], groundLayer)
    this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], computers)
    
    // Overlap detection for item selection
    this.physics.add.overlap(
      this.playerSelector,
      [chairs, computers],
      this.handleItemSelectorOverlap,
      undefined,
      this
    )

    // Register keyboard
    this.registerKeys()

    // Listen for network events
    console.log('[Game] 📡 Registering event listeners for playerUpdated, playerLeft, playerJoined')
    window.addEventListener('playerUpdated', this.handlePlayerUpdated.bind(this) as EventListener)
    window.addEventListener('playerLeft', this.handlePlayerLeft.bind(this) as EventListener)
    window.addEventListener('playerJoined', this.handlePlayerJoined.bind(this) as EventListener)
    console.log('[Game] ✅ Event listeners registered')
    
    // Set up periodic cleanup to remove duplicates and orphaned players
    // This runs every 2 seconds to catch any missed cleanup
    const cleanupInterval = setInterval(() => {
      this.cleanupDuplicateAndOrphanedPlayers()
    }, 2000)
    
    // Store interval for cleanup on scene destroy
    ;(this as any).cleanupInterval = cleanupInterval

    // Create OtherPlayer instances for existing players
    // IMPORTANT: Only create OtherPlayers, NOT MyPlayer duplicates
    // Use setTimeout to ensure Network listeners are set up first
    const createOtherPlayersForExisting = () => {
      if (this.network.room && this.network.room.state.players) {
        // Count players manually since TypeScript doesn't know about size property
        let playerCount = 0
        const playerIds: string[] = []
        this.network.room.state.players.forEach((_player, playerId) => {
          playerCount++
          playerIds.push(playerId)
        })
        
        console.log('[Game] 🎮 Creating OtherPlayers for existing players. Total players:', playerCount)
        console.log('[Game] My session ID:', this.network.mySessionId)
        console.log('[Game] All player IDs in room:', playerIds)
        
        // CRITICAL: Clean up any OtherPlayers that are no longer in the room state
        // Also check for duplicates by userId (same user with different sessionId)
        const playersToRemove: string[] = []
        const userIdToSessionMap = new Map<string, string>() // Track userId -> sessionId mapping
        
        if (this.network.room && this.network.room.state && this.network.room.state.players) {
          // First, build a map of userId -> sessionId from current room state
          this.network.room.state.players.forEach((player, playerId) => {
            if (player.userId && player.userId !== '') {
              const existingSessionId = userIdToSessionMap.get(player.userId)
              if (existingSessionId) {
                // Duplicate userId found - keep the newer one (current playerId)
                console.log(`[Game] 🔍 Found duplicate userId ${player.userId}: existing=${existingSessionId}, new=${playerId}`)
                // Remove the older session
                if (this.otherPlayerMap.has(existingSessionId)) {
                  console.log(`[Game] 🧹 Marking old session for removal (duplicate userId): ${existingSessionId}`)
                  playersToRemove.push(existingSessionId)
                }
              }
              userIdToSessionMap.set(player.userId, playerId)
            }
          })
          
          // Check for orphaned players (not in room state anymore)
          this.otherPlayerMap.forEach((_otherPlayer, mapPlayerId) => {
            // Check if this playerId still exists in the room state
            const stillExists = this.network.room?.state?.players?.get(mapPlayerId)
            if (!stillExists) {
              console.log(`[Game] 🧹 Found orphaned OtherPlayer (not in room state): ${mapPlayerId}`)
              playersToRemove.push(mapPlayerId)
            }
          })
        }
        
        // Remove orphaned OtherPlayers
        playersToRemove.forEach(playerId => {
          const otherPlayer = this.otherPlayerMap.get(playerId)
          if (otherPlayer) {
            console.log(`[Game] 🗑️ Removing orphaned OtherPlayer: ${playerId}`)
            
            // Destroy the playerContainer (which contains the name text) before removing the sprite
            if (otherPlayer.playerContainer) {
              console.log(`[Game] 🗑️ Destroying orphaned playerContainer (name label) for: ${playerId}`)
              otherPlayer.playerContainer.destroy(true)
            }
            
            // Remove and destroy the sprite
            this.otherPlayers.remove(otherPlayer, true, true)
            this.otherPlayerMap.delete(playerId)
          }
        })
        
        if (playersToRemove.length > 0) {
          console.log(`[Game] ✅ Cleaned up ${playersToRemove.length} orphaned OtherPlayers`)
        }
        
        let createdCount = 0
        let skippedCount = 0
        
        this.network.room.state.players.forEach((player, playerId) => {
          console.log(`[Game] 🔍 Processing player: ${playerId} (${player.name || 'unnamed'})`)
          
          // Skip creating a sprite for our own player - we already created myPlayer above
          if (playerId === this.network.mySessionId) {
            console.log('[Game] ⏭️ Skipping own player:', playerId)
            skippedCount++
            return
          }
          
          // Check if we already created this other player (prevent duplicates)
          if (this.otherPlayerMap.has(playerId)) {
            console.log('[Game] ✅ Player already exists in map:', playerId)
            skippedCount++
            return
          }
          
          console.log('[Game] 🎨 Creating OtherPlayer for existing player:', {
            playerId,
            name: player.name,
            texture: player.texture,
            x: player.x,
            y: player.y,
            anim: player.anim
          })
          
          // Create player even if name is empty - it will be updated later
          const otherPlayer = this.add.otherPlayer(
            player.x || 0,
            player.y || 0,
            player.texture || 'adam',
            playerId,
            player.name || 'Player'
          )
          if (otherPlayer) {
            this.otherPlayers.add(otherPlayer)
            this.otherPlayerMap.set(playerId, otherPlayer)
            createdCount++
            console.log(`[Game] ✅ OtherPlayer created successfully for ${playerId}. Total other players: ${this.otherPlayerMap.size}`)
            
            // Set initial animation if available
            if (player.anim) {
              otherPlayer.anims.play(player.anim, true)
            }
          } else {
            console.error(`[Game] ❌ Failed to create OtherPlayer for: ${playerId}`)
          }
        })
        
        console.log(`[Game] 📊 OtherPlayer creation summary: Created=${createdCount}, Skipped=${skippedCount}, Total in map=${this.otherPlayerMap.size}`)
        console.log(`[Game] 📋 Final otherPlayerMap keys:`, Array.from(this.otherPlayerMap.keys()))
        console.log(`[Game] 👤 MyPlayer session ID: ${this.network.mySessionId}`)
        console.log(`[Game] 📊 Total visible players: 1 (myPlayer) + ${this.otherPlayerMap.size} (otherPlayers) = ${1 + this.otherPlayerMap.size}`)
      } else {
        console.warn('[Game] ⚠️ Room or players state not available yet')
      }
    }
    
    // Initial creation after delay
    setTimeout(createOtherPlayersForExisting, 200)
    
    // Also re-check after a longer delay to catch any players that joined after initial creation
    setTimeout(createOtherPlayersForExisting, 1000)
  }

  registerKeys() {
    if (!this.input.keyboard) {
      console.error('Keyboard input not available')
      return
    }
    const cursorKeys = this.input.keyboard.createCursorKeys()
    const wasdKeys = this.input.keyboard.addKeys('W,S,A,D') as NavKeys
    if (cursorKeys && wasdKeys) {
      this.cursors = {
        ...cursorKeys,
        ...wasdKeys,
      }
    }
    const keyE = this.input.keyboard.addKey('E')
    if (keyE) {
      this.keyE = keyE
    }
  }

  private handleItemSelectorOverlap(playerSelector: any, selectionItem: any) {
    const currentItem = playerSelector.selectedItem
    if (currentItem) {
      if (currentItem === selectionItem || (currentItem.depth && selectionItem.depth && currentItem.depth >= selectionItem.depth)) {
        return
      }
      if (this.myPlayer && this.myPlayer.playerBehavior !== PlayerBehavior.SITTING) {
        if (currentItem.clearDialogBox) {
          currentItem.clearDialogBox()
        }
      }
    }
    playerSelector.selectedItem = selectionItem
    if (selectionItem && selectionItem.onOverlapDialog) {
      selectionItem.onOverlapDialog()
    }
  }

  private addGroupFromTiled(
    objectLayerName: string,
    key: string,
    tilesetName: string,
    collidable: boolean
  ) {
    const group = this.physics.add.staticGroup()
    const objectLayer = this.map.getObjectLayer(objectLayerName)
    if (!objectLayer) {
      // Layer doesn't exist, just return (SkyOffice doesn't warn)
      return
    }

    const tileset = this.map.getTileset(tilesetName)
    if (!tileset) {
      console.warn(`Tileset "${tilesetName}" not found - cannot render ${objectLayerName} layer`)
      return
    }

    // SkyOffice's simple approach: render all objects in the layer
    // They don't filter by tileset - they just try to render everything
    objectLayer.objects.forEach((object) => {
      if (!object.gid) return

      // Calculate frame index
      const frameIndex = object.gid - tileset.firstgid
      
      // Only render if this object belongs to this tileset
      if (frameIndex >= 0) {
        const actualX = object.x! + (object.width || 32) * 0.5
        const actualY = object.y! - (object.height || 32) * 0.5
        
        // Create sprite - exactly like SkyOffice
        const sprite = group.get(actualX, actualY, key, frameIndex)
        if (sprite) {
          sprite.setDepth(actualY)
        }
      }
    })

    if (this.myPlayer && collidable) {
      this.physics.add.collider([this.myPlayer, this.myPlayer.playerContainer], group)
    }
  }

  private handlePlayerUpdated(event: Event) {
    const customEvent = event as CustomEvent
    const { field, value, playerId } = customEvent.detail
    console.log('[Game] 🎮 handlePlayerUpdated event received:', { field, value, playerId })
    
    let otherPlayer = this.otherPlayerMap.get(playerId)
    
    // If OtherPlayer doesn't exist, try to create it from room state
    if (!otherPlayer) {
      console.warn(`[Game] ⚠️ OtherPlayer not found in map for playerId: ${playerId}`)
      console.log('[Game] Current otherPlayerMap keys:', Array.from(this.otherPlayerMap.keys()))
      
      // CRITICAL: Before creating a new player, check if this userId already has a player
      // This handles the case where Tab 1 refreshed and Tab 2 still has the old sessionId
      if (this.network.room && this.network.room.state.players) {
        const newPlayer = this.network.room.state.players.get(playerId)
        if (newPlayer && newPlayer.userId && newPlayer.userId !== '') {
          // Check for existing player with same userId but different sessionId
          let duplicateFound = false
          this.otherPlayerMap.forEach((existingPlayer, existingPlayerId) => {
            const existingPlayerData = this.network.room?.state?.players?.get(existingPlayerId)
            if (existingPlayerData?.userId === newPlayer.userId && existingPlayerId !== playerId) {
              console.log(`[Game] 🔍 Found duplicate userId ${newPlayer.userId} in handlePlayerUpdated: removing old session ${existingPlayerId}, keeping new ${playerId}`)
              // Remove the old player
              if (existingPlayer.playerContainer) {
                console.log(`[Game] 🗑️ Destroying duplicate playerContainer for: ${existingPlayerId}`)
                existingPlayer.playerContainer.destroy(true)
              }
              this.otherPlayers.remove(existingPlayer, true, true)
              this.otherPlayerMap.delete(existingPlayerId)
              duplicateFound = true
            }
          })
          
          if (duplicateFound) {
            console.log(`[Game] ✅ Cleaned up duplicate player before creating new one`)
          }
        }
      }
      
      // Try to create the missing OtherPlayer from room state
      if (this.network.room && this.network.room.state.players) {
        const player = this.network.room.state.players.get(playerId)
        if (player && playerId !== this.network.mySessionId) {
          console.log(`[Game] 🔧 Creating missing OtherPlayer for ${playerId} from room state`)
          otherPlayer = this.add.otherPlayer(
            player.x || 0,
            player.y || 0,
            player.texture || 'adam',
            playerId,
            player.name || 'Player'
          )
          if (otherPlayer) {
            this.otherPlayers.add(otherPlayer)
            this.otherPlayerMap.set(playerId, otherPlayer)
            console.log(`[Game] ✅ Created missing OtherPlayer for ${playerId}`)
          } else {
            console.error(`[Game] ❌ Failed to create missing OtherPlayer for ${playerId}`)
            return
          }
        } else {
          console.error(`[Game] ❌ Player ${playerId} not found in room state or is own player`)
          return
        }
      } else {
        console.error(`[Game] ❌ Room or players state not available`)
        return
      }
    }
    
    if (otherPlayer) {
      console.log('[Game] ✅ Found OtherPlayer, calling updateOtherPlayer')
      otherPlayer.updateOtherPlayer(field, value)
    }
  }

  private handlePlayerJoined(event: Event) {
    const customEvent = event as CustomEvent
    const { player, playerId } = customEvent.detail
    
    console.log('[Game] handlePlayerJoined:', {
      playerId,
      name: player.name,
      texture: player.texture,
      userId: player.userId,
      mySessionId: this.network.mySessionId
    })
    
    // Prevent duplicates: check if player already exists by sessionId
    if (this.otherPlayerMap.has(playerId)) {
      console.warn(`[Game] Player ${playerId} already exists, skipping duplicate`)
      return
    }
    
    // Don't create a sprite for our own player
    if (playerId === this.network.mySessionId) {
      console.warn(`[Game] Attempted to create OtherPlayer for own session ${playerId}, skipping`)
      return
    }
    
    // CRITICAL: Check for duplicates by userId (same user with different sessionId)
    // This handles the case where a player refreshed and we have their old sessionId still
    if (player.userId && player.userId !== '') {
      let duplicateFound = false
      this.otherPlayerMap.forEach((existingPlayer, existingPlayerId) => {
        // Get the userId from room state for the existing player
        const existingPlayerData = this.network.room?.state?.players?.get(existingPlayerId)
        if (existingPlayerData?.userId === player.userId && existingPlayerId !== playerId) {
          console.log(`[Game] 🔍 Found duplicate userId ${player.userId}: removing old session ${existingPlayerId}, keeping new ${playerId}`)
          // Remove the old player
          if (existingPlayer.playerContainer) {
            console.log(`[Game] 🗑️ Destroying duplicate playerContainer for: ${existingPlayerId}`)
            existingPlayer.playerContainer.destroy(true)
          }
          this.otherPlayers.remove(existingPlayer, true, true)
          this.otherPlayerMap.delete(existingPlayerId)
          duplicateFound = true
        }
      })
      
      if (duplicateFound) {
        console.log(`[Game] ✅ Cleaned up duplicate player before creating new one`)
      }
    }

    console.log('[Game] Creating OtherPlayer for new player:', {
      playerId,
      name: player.name,
      texture: player.texture,
      x: player.x,
      y: player.y
    })

    const otherPlayer = this.add.otherPlayer(
      player.x,
      player.y,
      player.texture || 'adam',
      playerId,
      player.name || 'Player'
    )
    if (otherPlayer) {
      this.otherPlayers.add(otherPlayer)
      this.otherPlayerMap.set(playerId, otherPlayer)
      console.log('[Game] OtherPlayer created. Total other players:', this.otherPlayerMap.size)
    } else {
      console.error('[Game] Failed to create OtherPlayer for:', playerId)
    }
  }

  private handlePlayerLeft(event: Event) {
    const customEvent = event as CustomEvent
    const { playerId } = customEvent.detail
    console.log('[Game] 🚪 handlePlayerLeft: player removed', {
      playerId,
      mySessionId: this.network.mySessionId,
      isOwnPlayer: playerId === this.network.mySessionId,
      existsInMap: this.otherPlayerMap.has(playerId)
    })
    
    // Don't remove our own player sprite (it's myPlayer, not otherPlayer)
    if (playerId === this.network.mySessionId) {
      console.log('[Game] ⏭️ Skipping removal of own player sprite')
      return
    }
    
    if (this.otherPlayerMap.has(playerId)) {
      const otherPlayer = this.otherPlayerMap.get(playerId)
      if (otherPlayer) {
        console.log('[Game] 🗑️ Removing OtherPlayer sprite for:', playerId)
        
        // Destroy the playerContainer (which contains the name text) before removing the sprite
        if (otherPlayer.playerContainer) {
          console.log('[Game] 🗑️ Destroying playerContainer (name label) for:', playerId)
          otherPlayer.playerContainer.destroy(true)
        }
        
        // Remove and destroy the sprite
        this.otherPlayers.remove(otherPlayer, true, true)
        this.otherPlayerMap.delete(playerId)
        console.log(`[Game] ✅ OtherPlayer removed. Remaining players: ${this.otherPlayerMap.size}`)
      }
    } else {
      console.log(`[Game] ⚠️ OtherPlayer ${playerId} not found in map (may have already been removed)`)
    }
  }

  private cleanupDuplicateAndOrphanedPlayers() {
    if (!this.network.room || !this.network.room.state || !this.network.room.state.players) {
      return
    }
    
    const playersToRemove: string[] = []
    const userIdToSessionMap = new Map<string, string>()
    
    // Build map of userId -> sessionId from current room state
    this.network.room.state.players.forEach((player, playerId) => {
      if (player.userId && player.userId !== '') {
        const existingSessionId = userIdToSessionMap.get(player.userId)
        if (existingSessionId) {
          // Duplicate userId found - keep the newer one (current playerId)
          console.log(`[Game] 🔍 [Periodic Cleanup] Found duplicate userId ${player.userId}: existing=${existingSessionId}, new=${playerId}`)
          // Remove the older session
          if (this.otherPlayerMap.has(existingSessionId)) {
            console.log(`[Game] 🧹 [Periodic Cleanup] Marking old session for removal: ${existingSessionId}`)
            playersToRemove.push(existingSessionId)
          }
        }
        userIdToSessionMap.set(player.userId, playerId)
      }
    })
    
    // Check for orphaned players (not in room state anymore)
    this.otherPlayerMap.forEach((_otherPlayer, mapPlayerId) => {
      const stillExists = this.network.room?.state?.players?.get(mapPlayerId)
      if (!stillExists) {
        console.log(`[Game] 🧹 [Periodic Cleanup] Found orphaned OtherPlayer: ${mapPlayerId}`)
        playersToRemove.push(mapPlayerId)
      }
    })
    
    // Remove duplicates and orphaned players
    if (playersToRemove.length > 0) {
      console.log(`[Game] 🧹 [Periodic Cleanup] Removing ${playersToRemove.length} duplicate/orphaned players`)
      playersToRemove.forEach(playerId => {
        const otherPlayer = this.otherPlayerMap.get(playerId)
        if (otherPlayer) {
          if (otherPlayer.playerContainer) {
            otherPlayer.playerContainer.destroy(true)
          }
          this.otherPlayers.remove(otherPlayer, true, true)
          this.otherPlayerMap.delete(playerId)
        }
      })
      console.log(`[Game] ✅ [Periodic Cleanup] Cleaned up ${playersToRemove.length} players. Remaining: ${this.otherPlayerMap.size}`)
    }
  }

  update() {
    // Disable Phaser keyboard input when user is typing in input fields
    const activeElement = document.activeElement
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement instanceof HTMLElement && activeElement.isContentEditable)
    )
    
    if (this.input.keyboard) {
      if (isTyping) {
        // Temporarily disable keyboard input to allow typing
        this.input.keyboard.enabled = false
      } else {
        // Re-enable keyboard input when not typing
        this.input.keyboard.enabled = true
      }
    }

    if (this.myPlayer && this.network) {
      this.playerSelector.update(this.myPlayer, this.cursors)
      this.myPlayer.update(this.playerSelector, this.cursors, this.keyE, this.network)
    }
  }
  
  shutdown() {
    // Clean up interval when scene is shut down
    if ((this as any).cleanupInterval) {
      clearInterval((this as any).cleanupInterval)
    }
  }
}

