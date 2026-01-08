export interface Keyboard {
  W?: Phaser.Input.Keyboard.Key
  S?: Phaser.Input.Keyboard.Key
  A?: Phaser.Input.Keyboard.Key
  D?: Phaser.Input.Keyboard.Key
}

export interface NavKeys extends Phaser.Types.Input.Keyboard.CursorKeys, Keyboard {}

