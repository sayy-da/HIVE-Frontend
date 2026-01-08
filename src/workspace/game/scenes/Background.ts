import Phaser from 'phaser'

export default class Background extends Phaser.Scene {
  constructor() {
    super('background')
  }

  create() {
    const sceneHeight = this.cameras.main.height
    const sceneWidth = this.cameras.main.width
    this.cameras.main.setBackgroundColor('#c6eefc')
  }
}

