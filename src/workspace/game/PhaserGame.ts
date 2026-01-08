import Phaser from 'phaser'
import Bootstrap from './scenes/Bootstrap'
import Background from './scenes/Background'
import Game from './scenes/Game'

let phaserGame: Phaser.Game | null = null

export default function getPhaserGame(): Phaser.Game {
  if (!phaserGame) {
    // Verify container exists
    const container = document.getElementById('phaser-container')
    if (!container) {
      console.error('PhaserGame: phaser-container element not found!')
      throw new Error('phaser-container element not found in DOM')
    }
    
    console.log('PhaserGame: Creating new Phaser game instance...')
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      backgroundColor: '#93cbee',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.ScaleModes.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [Bootstrap, Background, Game],
      autoFocus: true,
    }

    phaserGame = new Phaser.Game(config)
    console.log('PhaserGame: Game instance created', phaserGame)
    
    // Store game instance on window for debugging
    ;(window as any).phaserGame = phaserGame
  } else {
    console.log('PhaserGame: Returning existing game instance')
  }
  return phaserGame
}

