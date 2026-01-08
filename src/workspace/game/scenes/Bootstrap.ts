import Phaser from 'phaser'
import Network from '../../services/Network'

// Store user data globally for Bootstrap to access
declare global {
  interface Window {
    workspaceUserData?: {
      userId: string
      userName: string
      characterTexture: string
      companyId?: string
    }
  }
}

export default class Bootstrap extends Phaser.Scene {
  network!: Network

  constructor() {
    super('bootstrap')
    console.log('Bootstrap: Scene constructor called')
  }

  preload() {
    console.log('Bootstrap: Starting preload...')
    
    // Load map
    this.load.tilemapTiledJSON('tilemap', '/assets/map/map.json')
    this.load.spritesheet('tiles_wall', '/assets/map/FloorAndGround.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    // Load characters
    this.load.spritesheet('adam', '/assets/character/adam.png', {
      frameWidth: 32,
      frameHeight: 48,
    })
    this.load.spritesheet('ash', '/assets/character/ash.png', {
      frameWidth: 32,
      frameHeight: 48,
    })
    this.load.spritesheet('lucy', '/assets/character/lucy.png', {
      frameWidth: 32,
      frameHeight: 48,
    })
    this.load.spritesheet('nancy', '/assets/character/nancy.png', {
      frameWidth: 32,
      frameHeight: 48,
    })

    // Load items
    this.load.spritesheet('chairs', '/assets/items/chair.png', {
      frameWidth: 32,
      frameHeight: 64,
    })
    this.load.spritesheet('computers', '/assets/items/computer.png', {
      frameWidth: 96,
      frameHeight: 64,
    })

    // Load tilesets
    this.load.spritesheet('office', '/assets/tileset/Modern_Office_Black_Shadow.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('generic', '/assets/tileset/Generic.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.spritesheet('basement', '/assets/tileset/Basement.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    // Add error handlers
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error('Bootstrap: Failed to load file:', file.key, file.url)
    })

    this.load.on('complete', () => {
      console.log('Bootstrap: All assets loaded, initializing...')
      this.initializeGame()
    })
  }

  async initializeGame() {
    console.log('Bootstrap: init() called')
    this.network = new Network()
    
    // Get user data from window (set by Workspace component)
    const userData = window.workspaceUserData || {
      userId: 'guest',
      userName: 'Guest',
      characterTexture: 'adam',
      companyId: undefined,
    }

    console.log('Bootstrap: User data:', userData)

    // Join workspace
    try {
      await this.network.joinWorkspace(
        userData.userId, 
        userData.userName, 
        userData.characterTexture,
        userData.companyId
      )
      console.log('Bootstrap: Joined workspace successfully')
      
      // Wait a bit for room state to sync
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Launch game scenes after successful connection
      console.log('Bootstrap: Launching game scenes...')
      this.scene.launch('background')
      this.scene.launch('game', { network: this.network })
      console.log('Bootstrap: Game scenes launched')
    } catch (error) {
      console.error('Bootstrap: Failed to join workspace:', error)
      // Still launch game scenes even if connection fails (for offline testing)
      console.log('Bootstrap: Launching game scenes anyway (offline mode)')
      this.scene.launch('background')
      this.scene.launch('game', { network: this.network })
    }
  }
}

