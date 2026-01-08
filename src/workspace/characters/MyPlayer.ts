import Phaser from 'phaser'
import Player from './Player'
import PlayerSelector from './PlayerSelector'
import Network from '../services/Network'
import { NavKeys } from '../../types/KeyboardState'
import { PlayerBehavior } from '../../types/PlayerBehavior'
import { sittingShiftData } from './Player'
import Chair from '../items/Chair'
import { ItemType } from '../../types/Items'

export default class MyPlayer extends Player {
  private playContainerBody: Phaser.Physics.Arcade.Body
  private chairOnSit?: Chair
  playerBehavior = PlayerBehavior.IDLE

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
  }

  setPlayerName(name: string) {
    this.playerName.setText(name)
  }

  setPlayerTexture(texture: string) {
    this.playerTexture = texture
    this.anims.play(`${this.playerTexture}_idle_down`, true)
  }

  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)
    // Sync player container position with player position
    this.playerContainer.x = this.x
    this.playerContainer.y = this.y - 30
    // Update depth based on y position for proper layering
    this.setDepth(this.y)
  }

  update(
    playerSelector: PlayerSelector,
    cursors: NavKeys,
    keyE: Phaser.Input.Keyboard.Key,
    network: Network
  ) {
    if (!cursors) return

    // Check if modal is open or user is typing in an input field - disable WASD controls
    const isModalOpen = (window as any).modalOpen === true
    const activeElement = document.activeElement
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement instanceof HTMLElement && activeElement.isContentEditable)
    )
    
    if (isModalOpen || isTyping) {
      // Stop movement if modal is open or user is typing
      this.setVelocity(0, 0)
      this.playContainerBody.setVelocity(0, 0)
      return
    }

    const item = playerSelector.selectedItem

    switch (this.playerBehavior) {
      case PlayerBehavior.IDLE:
        // Sit on chair
        if (Phaser.Input.Keyboard.JustDown(keyE) && item?.itemType === ItemType.CHAIR) {
          console.log('[MyPlayer] Sit on chair triggered')
          const chairItem = item as Chair
          this.scene.time.addEvent({
            delay: 10,
            callback: () => {
              this.setVelocity(0, 0)
              if (chairItem.itemDirection) {
                const shift = sittingShiftData[chairItem.itemDirection as keyof typeof sittingShiftData]
                this.setPosition(
                  chairItem.x + shift[0],
                  chairItem.y + shift[1]
                ).setDepth(chairItem.depth + shift[2])
                this.playContainerBody.setVelocity(0, 0)
                this.playerContainer.setPosition(
                  chairItem.x + shift[0],
                  chairItem.y + shift[1] - 30
                )
              }
              console.log('[MyPlayer] Playing sit animation', this.anims.currentAnim?.key)
              this.play(`${this.playerTexture}_sit_${chairItem.itemDirection}`, true)
              playerSelector.selectedItem = undefined
              if (this.anims.currentAnim) {
                network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
              }
            },
          })
          this.chairOnSit = chairItem
          this.playerBehavior = PlayerBehavior.SITTING
          return
        }

        // Movement
        const speed = 200
        let vx = 0
        let vy = 0

        if (cursors.left?.isDown || cursors.A?.isDown) vx -= speed
        if (cursors.right?.isDown || cursors.D?.isDown) vx += speed
        if (cursors.up?.isDown || cursors.W?.isDown) {
          vy -= speed
          this.setDepth(this.y)
        }
        if (cursors.down?.isDown || cursors.S?.isDown) {
          vy += speed
          this.setDepth(this.y)
        }

        // Update character velocity
        this.setVelocity(vx, vy)
        if (this.body) {
          this.body.velocity.setLength(speed)
        }
        // Also update playerNameContainer velocity
        this.playContainerBody.setVelocity(vx, vy)
        this.playContainerBody.velocity.setLength(speed)

        // Update animation according to velocity and send new location and anim to server (SkyOffice pattern)
        // Send update every frame when moving (no throttling)
        if (vx !== 0 || vy !== 0) {
          if (this.anims.currentAnim) {
            console.log('[MyPlayer] Movement update', { x: this.x, y: this.y, anim: this.anims.currentAnim.key })
            network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
          }
        }
        
        if (vx > 0) {
          this.play(`${this.playerTexture}_run_right`, true)
        } else if (vx < 0) {
          this.play(`${this.playerTexture}_run_left`, true)
        } else if (vy > 0) {
          this.play(`${this.playerTexture}_run_down`, true)
        } else if (vy < 0) {
          this.play(`${this.playerTexture}_run_up`, true)
        } else {
          if (this.anims.currentAnim) {
            const parts = this.anims.currentAnim.key.split('_')
            parts[1] = 'idle'
            const newAnim = parts.join('_')
            // This prevents idle animation keeps getting called
            if (this.anims.currentAnim.key !== newAnim) {
              this.play(newAnim, true)
              // Send new location and anim to server when animation changes to idle
              if (this.anims.currentAnim) {
                console.log('[MyPlayer] Idle animation update', { x: this.x, y: this.y, anim: this.anims.currentAnim.key })
                network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
              }
            }
          }
        }
        break

      case PlayerBehavior.SITTING:
        // Stand up
        if (Phaser.Input.Keyboard.JustDown(keyE)) {
          if (this.anims.currentAnim) {
            const parts = this.anims.currentAnim.key.split('_')
            parts[1] = 'idle'
            this.play(parts.join('_'), true)
            this.playerBehavior = PlayerBehavior.IDLE
            this.chairOnSit?.clearDialogBox()
            playerSelector.setPosition(this.x, this.y)
            if (this.anims.currentAnim) {
              console.log('[MyPlayer] Stand up', { x: this.x, y: this.y, anim: this.anims.currentAnim.key })
              network.updatePlayer(this.x, this.y, this.anims.currentAnim.key)
            }
          }
        }
        break
    }
  }
}

// Register as Phaser factory method
declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      myPlayer(x: number, y: number, texture: string, id: string, frame?: string | number): MyPlayer
    }
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'myPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    frame?: string | number
  ) {
    const sprite = new MyPlayer(this.scene, x, y, texture, id, frame)
    this.displayList.add(sprite)
    this.updateList.add(sprite)
    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)
    const collisionScale = [0.5, 0.2]
    if (sprite.body) {
      sprite.body
        .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
        .setOffset(
          sprite.width * (1 - collisionScale[0]) * 0.5,
          sprite.height * (1 - collisionScale[1])
        )
    }
    return sprite
  }
)

